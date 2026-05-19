import { Router } from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { logTransaction } from '../services/creditService.js';

const router = Router();
router.use(authMiddleware);

// Define terms and yields
const TERMS = {
    '1_week': {
        durationMs: 7 * 24 * 60 * 60 * 1000,
        yieldRate: 0.07 // 7% per week
    },
    '1_month': {
        durationMs: 30 * 24 * 60 * 60 * 1000,
        yieldRate: 0.15 // 15% per month
    }
};

/**
 * GET /api/staking — get user's active and past stakes
 */
router.get('/', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { data, error } = await supabase
            .from('staked_deposits')
            .select('*')
            .eq('user_id', req.userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('[GET /staking]', err);
        res.status(500).json({ error: err.message || 'Failed to fetch stakes' });
    }
});

/**
 * POST /api/staking/deposit — stake credits
 */
router.post('/deposit', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        const { amount, lock_period, auto_compound = false } = req.body;

        if (!amount || amount < 1) return res.status(400).json({ error: 'Minimum stake amount is 1 credit' });
        if (!TERMS[lock_period]) return res.status(400).json({ error: 'Invalid lock period' });

        // 1. Check user balance
        const { data: profile } = await supabase.from('profiles').select('time_balance').eq('id', req.userId).single();
        if (!profile || profile.time_balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance to stake' });
        }

        // 2. Calculate dates and yields
        const term = TERMS[lock_period];
        const unlocksAt = new Date(Date.now() + term.durationMs).toISOString();
        const expectedYield = amount * term.yieldRate;

        // 3. Deduct from balance
        await logTransaction(req.userId, -amount, 'escrow_lock', `Staked ${amount} credits for ${lock_period}`);

        // 4. Create stake record
        const { data, error } = await supabase
            .from('staked_deposits')
            .insert({
                user_id: req.userId,
                amount,
                lock_period,
                expected_yield: expectedYield,
                status: 'active',
                auto_compound,
                unlocks_at: unlocksAt
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        console.error('[POST /staking/deposit]', err);
        res.status(500).json({ error: err.message || 'Failed to create deposit' });
    }
});

/**
 * POST /api/staking/withdraw/:id — withdraw or emergency unstake
 */
router.post('/withdraw/:id', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        // 1. Fetch stake
        const { data: stake, error: fetchErr } = await supabase
            .from('staked_deposits')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.userId)
            .single();

        if (fetchErr || !stake) return res.status(404).json({ error: 'Stake not found' });
        if (stake.status !== 'active') return res.status(400).json({ error: `Stake is already ${stake.status}` });

        const now = new Date();
        const unlocksAt = new Date(stake.unlocks_at);
        const isEarly = now < unlocksAt;

        if (isEarly) {
            // EMERGENCY WITHDRAWAL (SLASHING)
            // Lose all interest, 10% penalty on principal
            const penalty = stake.amount * 0.10;
            const returnAmount = stake.amount - penalty;

            await logTransaction(req.userId, returnAmount, 'penalty', `Emergency unstaked early. 10% penalty applied.`);
            
            // Mark as slashed
            const { data: updated, error: updateErr } = await supabase
                .from('staked_deposits')
                .update({ status: 'slashed' })
                .eq('id', stake.id)
                .select().single();
            if (updateErr) throw updateErr;

            return res.json({ message: 'Emergency withdrawal successful. 10% penalty applied.', stake: updated });
        } else {
            // NORMAL MATURITY WITHDRAWAL
            // Return principal + interest
            const totalReturn = stake.amount + stake.expected_yield;

            // Check auto-compound logic here (normally handled by cron, but can be evaluated here if they click withdraw after maturity)
            if (stake.auto_compound) {
                // If they specifically click withdraw, it cancels the auto-compound cycle and returns funds.
                // In a true system, a cron job would have already compounded it. We'll just return it.
            }

            await logTransaction(req.userId, totalReturn, 'earn', `Stake matured. Received principal + ${stake.expected_yield} yield.`);
            
            const { data: updated, error: updateErr } = await supabase
                .from('staked_deposits')
                .update({ status: 'completed' })
                .eq('id', stake.id)
                .select().single();
            if (updateErr) throw updateErr;

            return res.json({ message: 'Withdrawal successful. Yield applied.', stake: updated });
        }

    } catch (err) {
        console.error('[POST /staking/withdraw]', err);
        res.status(500).json({ error: err.message || 'Failed to withdraw stake' });
    }
});

export default router;
