import { Router } from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = Router();
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/stats — platform-wide statistics
 */
router.get('/stats', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const [
            { count: totalUsers },
            { count: totalExchanges },
            { count: activeListings },
            { count: completedExchanges }
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('exchanges').select('*', { count: 'exact', head: true }),
            supabase.from('service_listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('exchanges').select('*', { count: 'exact', head: true }).eq('status', 'completed')
        ]);

        // Sum of all user balances
        const { data: balances } = await supabase.from('profiles').select('time_balance');
        const totalCredits = (balances || []).reduce((sum, p) => sum + (parseFloat(p.time_balance) || 0), 0);

        res.json({
            total_users: totalUsers || 0,
            total_exchanges: totalExchanges || 0,
            completed_exchanges: completedExchanges || 0,
            active_listings: activeListings || 0,
            credits_in_circulation: totalCredits.toFixed(2)
        });
    } catch (err) {
        console.error('[GET /admin/stats]', err);
        res.status(500).json({ error: err.message || 'Failed to fetch stats' });
    }
});

/**
 * GET /api/admin/users — list all users (with optional search)
 */
router.get('/users', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const search = req.query.search || '';

        let query = supabase
            .from('profiles')
            .select('id, full_name, bio, skills, time_balance, rating, trust_score, total_exchanges, is_verified, is_banned, created_at, community')
            .order('created_at', { ascending: false });

        if (search) {
            query = query.ilike('full_name', `%${search}%`);
        }

        const { data, error } = await query.limit(100);
        if (error) throw error;

        // Fetch emails from Supabase Auth for each user
        const usersWithEmail = await Promise.all((data || []).map(async (profile) => {
            try {
                const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
                return { ...profile, email: user?.email || 'N/A' };
            } catch {
                return { ...profile, email: 'N/A' };
            }
        }));

        res.json(usersWithEmail);
    } catch (err) {
        console.error('[GET /admin/users]', err);
        res.status(500).json({ error: err.message || 'Failed to fetch users' });
    }
});

/**
 * PATCH /api/admin/users/:id/credits — add or remove credits from a user
 */
router.patch('/users/:id/credits', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const userId = req.params.id;
        const { amount, reason } = req.body;
        if (amount === undefined || amount === 0) return res.status(400).json({ error: 'Amount is required and must not be zero' });

        // Get current balance
        const { data: profile, error: pErr } = await supabase.from('profiles').select('time_balance, full_name').eq('id', userId).single();
        if (pErr || !profile) return res.status(404).json({ error: 'User not found' });

        const newBalance = parseFloat(profile.time_balance) + parseFloat(amount);

        // Update balance
        const { error: updateErr } = await supabase.from('profiles').update({ time_balance: newBalance }).eq('id', userId);
        if (updateErr) throw updateErr;

        // Log the transaction
        await supabase.from('credit_transactions').insert({
            user_id: userId,
            amount: parseFloat(amount),
            type: amount > 0 ? 'bonus' : 'penalty',
            description: reason || `Admin adjustment: ${amount > 0 ? '+' : ''}${amount} credits`,
            balance_after: newBalance
        });

        res.json({ success: true, new_balance: newBalance, user: profile.full_name });
    } catch (err) {
        console.error('[PATCH /admin/users/:id/credits]', err);
        res.status(500).json({ error: err.message || 'Failed to update credits' });
    }
});

/**
 * PATCH /api/admin/users/:id/ban — ban a user
 */
router.patch('/users/:id/ban', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { error } = await supabase.from('profiles').update({ is_banned: true }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true, action: 'banned' });
    } catch (err) {
        console.error('[PATCH /admin/users/:id/ban]', err);
        res.status(500).json({ error: err.message || 'Failed to ban user' });
    }
});

/**
 * PATCH /api/admin/users/:id/unban — unban a user
 */
router.patch('/users/:id/unban', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { error } = await supabase.from('profiles').update({ is_banned: false }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true, action: 'unbanned' });
    } catch (err) {
        console.error('[PATCH /admin/users/:id/unban]', err);
        res.status(500).json({ error: err.message || 'Failed to unban user' });
    }
});

/**
 * GET /api/admin/exchanges — list all exchanges platform-wide
 */
router.get('/exchanges', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { data, error } = await supabase
            .from('exchanges')
            .select('*, service_listings(title, category), provider:profiles!exchanges_provider_id_fkey(full_name), requester:profiles!exchanges_requester_id_fkey(full_name)')
            .order('created_at', { ascending: false })
            .limit(200);

        if (error) throw error;

        const formatted = (data || []).map(e => ({
            id: e.id,
            status: e.status,
            hours_exchanged: e.hours_exchanged,
            listing_title: e.service_listings?.title || 'N/A',
            category: e.service_listings?.category || 'N/A',
            provider_name: e.provider?.full_name || 'Unknown',
            requester_name: e.requester?.full_name || 'Unknown',
            created_at: e.created_at,
            completed_at: e.completed_at
        }));

        res.json(formatted);
    } catch (err) {
        console.error('[GET /admin/exchanges]', err);
        res.status(500).json({ error: err.message || 'Failed to fetch exchanges' });
    }
});

export default router;
