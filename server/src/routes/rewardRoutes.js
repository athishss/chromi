import express from 'express';
import supabase from '../config/supabase.js';
import { logTransaction } from '../services/creditService.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

const MILESTONES = [
    { id: 'first_listing', title: 'Open for Business', description: 'Post your first listing', reward: 1.0 },
    { id: 'first_exchange', title: 'First Swap', description: 'Complete an exchange successfully', reward: 2.0 },
    { id: 'help_5_people', title: 'Community Pillar', description: 'Help 5 people as a provider', reward: 5.0 },
];

function getDailyKey(dateObj) {
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getUTCDate()).padStart(2, '0');
    return `daily_${y}_${m}_${d}`;
}

router.get('/status', authMiddleware, async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        // 1. Get claimed rewards
        const { data: claimedData, error: claimedErr } = await supabase
            .from('claimed_rewards')
            .select('reward_key')
            .eq('user_id', req.userId);
            
        if (claimedErr) throw claimedErr;
        const claimedKeys = new Set(claimedData.map(c => c.reward_key));

        // 2. Daily Rewards (Current Week Mon-Sun)
        const now = new Date();
        const currentDayOfWeek = now.getUTCDay(); // 0 = Sun, 1 = Mon ...
        const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
        
        const monday = new Date(now);
        monday.setUTCDate(now.getUTCDate() + diffToMonday);
        
        const week = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setUTCDate(monday.getUTCDate() + i);
            const key = getDailyKey(d);
            const dateStr = d.toISOString().split('T')[0];
            const isToday = key === getDailyKey(now);
            const isPast = d < now && !isToday;
            
            let status = 'locked'; // future
            if (claimedKeys.has(key)) status = 'claimed';
            else if (isToday) status = 'available';
            else if (isPast) status = 'missed';
            
            week.push({ date: dateStr, day: d.toLocaleDateString('en-US', {weekday: 'short', timeZone: 'UTC'}), status, key });
        }

        // 3. Evaluate Milestones dynamically
        const { count: listingCount } = await supabase.from('service_listings').select('*', { count: 'exact', head: true }).eq('user_id', req.userId);
        const { count: completedAsProvider } = await supabase.from('exchanges').select('*', { count: 'exact', head: true }).eq('provider_id', req.userId).eq('status', 'completed');
        const { count: completedAny } = await supabase.from('exchanges').select('*', { count: 'exact', head: true }).or(`provider_id.eq.${req.userId},requester_id.eq.${req.userId}`).eq('status', 'completed');

        const milestones = MILESTONES.map(m => {
            let isComplete = false;
            let progress = 0;
            let max = 1;
            
            if (m.id === 'first_listing') { isComplete = listingCount > 0; progress = listingCount; max = 1; }
            if (m.id === 'first_exchange') { isComplete = completedAny > 0; progress = completedAny; max = 1; }
            if (m.id === 'help_5_people') { isComplete = completedAsProvider >= 5; progress = completedAsProvider; max = 5; }
            
            if (progress > max) progress = max;

            return {
                ...m,
                progress,
                max,
                status: claimedKeys.has(m.id) ? 'claimed' : (isComplete ? 'available' : 'locked')
            };
        });

        res.json({ week, milestones });
    } catch (err) {
        console.error('[GET /rewards/status]', err);
        res.status(500).json({ error: 'Failed to load rewards status' });
    }
});

router.post('/claim', authMiddleware, async (req, res) => {
    try {
        const { reward_key } = req.body;
        if (!reward_key) return res.status(400).json({ error: 'reward_key is required' });

        let rewardAmount = 0;
        let description = '';

        // 1. Is it a daily claim?
        if (reward_key.startsWith('daily_')) {
            const todayKey = getDailyKey(new Date());
            if (reward_key !== todayKey) {
                return res.status(400).json({ error: 'Can only claim today\'s reward.' });
            }
            rewardAmount = 0.1;
            description = 'Daily Sign-In Reward';
        } else {
            // Milestone check
            const milestone = MILESTONES.find(m => m.id === reward_key);
            if (!milestone) return res.status(400).json({ error: 'Invalid reward' });
            
            // Re-verify server-side
            let isComplete = false;
            if (milestone.id === 'first_listing') {
                const { count } = await supabase.from('service_listings').select('*', { count: 'exact', head: true }).eq('user_id', req.userId);
                isComplete = count > 0;
            } else if (milestone.id === 'first_exchange') {
                const { count } = await supabase.from('exchanges').select('*', { count: 'exact', head: true }).or(`provider_id.eq.${req.userId},requester_id.eq.${req.userId}`).eq('status', 'completed');
                isComplete = count > 0;
            } else if (milestone.id === 'help_5_people') {
                const { count } = await supabase.from('exchanges').select('*', { count: 'exact', head: true }).eq('provider_id', req.userId).eq('status', 'completed');
                isComplete = count >= 5;
            }

            if (!isComplete) return res.status(400).json({ error: 'Requirements not met for this reward' });
            
            rewardAmount = milestone.reward;
            description = `Milestone Reward: ${milestone.title}`;
        }

        // 2. Insert claim (UNIQUE constraint prevents double claim)
        const { error: insertErr } = await supabase
            .from('claimed_rewards')
            .insert({ user_id: req.userId, reward_key: reward_key });
            
        if (insertErr) {
            if (insertErr.code === '23505') { // Postgres unique violation code
                return res.status(400).json({ error: 'Reward already claimed' });
            }
            throw insertErr;
        }

        // 3. Award credits
        await logTransaction(req.userId, rewardAmount, 'reward', description);

        res.json({ success: true, reward_key, amount: rewardAmount });
    } catch (err) {
        console.error('[POST /rewards/claim]', err);
        res.status(500).json({ error: 'Failed to claim reward' });
    }
});

export default router;
