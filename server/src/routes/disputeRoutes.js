import { Router } from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * POST /api/disputes - File a new dispute
 */
router.post('/', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { exchange_id, against_user_id, reason } = req.body;

        if (!exchange_id || !against_user_id || !reason) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify exchange belongs to user
        const { data: exchange, error: exErr } = await supabase
            .from('exchanges')
            .select('*')
            .eq('id', exchange_id)
            .single();

        if (exErr || !exchange) return res.status(404).json({ error: 'Exchange not found' });
        if (exchange.requester_id !== req.userId && exchange.provider_id !== req.userId) {
            return res.status(403).json({ error: 'Not authorized for this exchange' });
        }

        // Create dispute
        const { data, error } = await supabase
            .from('disputes')
            .insert({
                exchange_id,
                filed_by: req.userId,
                against: against_user_id,
                reason,
                status: 'open'
            })
            .select()
            .single();

        if (error) throw error;

        // Update exchange status to disputed
        await supabase.from('exchanges').update({ status: 'disputed' }).eq('id', exchange_id);

        res.status(201).json(data);
    } catch (err) {
        console.error('[POST /disputes]', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/disputes - Get user's disputes
 */
router.get('/', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { data, error } = await supabase
            .from('disputes')
            .select('*, exchanges(*)')
            .or(`filed_by.eq.${req.userId},against.eq.${req.userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[GET /disputes]', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
