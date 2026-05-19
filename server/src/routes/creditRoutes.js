import { Router } from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { getScarcityMultiplier, getAllMultipliers, borrowCredits } from '../services/creditService.js';

const router = Router();
router.use(authMiddleware);

const CATEGORIES = ['tutoring','repair','design','cooking','music','tech','fitness','language','photography','writing','gardening','other'];

/**
 * GET /api/credits — get user's balance and transaction history
 */
router.get('/', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        // Get profile balance & escrow info
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('time_balance, negative_balance_allowed, max_negative, successful_referrals')
            .eq('id', req.userId)
            .single();
            
        if (profileErr) throw profileErr;

        // Get active escrows
        const { data: escrows } = await supabase
            .from('exchanges')
            .select('escrow_amount')
            .eq('requester_id', req.userId)
            .eq('escrow_locked', true);
            
        const totalEscrow = escrows ? escrows.reduce((sum, e) => sum + Number(e.escrow_amount), 0) : 0;

        // Get transactions
        const { data: transactions, error: transErr } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_id', req.userId)
            .order('created_at', { ascending: false })
            .limit(50);
            
        if (transErr) throw transErr;

        res.json({
            balance: Number(profile.time_balance),
            locked_in_escrow: totalEscrow,
            available_to_spend: Number(profile.time_balance) + (profile.negative_balance_allowed ? Math.abs(Number(profile.max_negative)) : 0),
            negative_allowed: profile.negative_balance_allowed,
            max_negative: profile.max_negative,
            successful_referrals: profile.successful_referrals || 0,
            transactions: transactions || []
        });
    } catch (err) {
        console.error('[GET /credits]', err);
        res.status(500).json({ error: err.message || 'Failed to fetch credit data' });
    }
});

/**
 * GET /api/credits/multipliers — get current scarcity multipliers
 */
router.get('/multipliers', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        
        const multipliers = await getAllMultipliers(CATEGORIES);
        res.json(multipliers);
    } catch (err) {
        console.error('[GET /credits/multipliers]', err);
        res.status(500).json({ error: err.message || 'Failed to fetch multipliers' });
    }
});

/**
 * POST /api/credits/borrow — borrow credits
 */
router.post('/borrow', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        const { amount } = req.body;
        
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

        const result = await borrowCredits(req.userId, amount);
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.json({ success: true, new_balance: result.balance });
    } catch (err) {
        console.error('[POST /credits/borrow]', err);
        res.status(500).json({ error: err.message || 'Failed to borrow credits' });
    }
});

export default router;
