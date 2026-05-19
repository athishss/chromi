import { Router } from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * POST /api/waitlist - Join waitlist for a category or listing
 */
router.post('/', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        
        const { category, listing_id } = req.body;
        if (!category && !listing_id) return res.status(400).json({ error: 'category or listing_id required' });

        const { data, error } = await supabase
            .from('waitlist')
            .insert({ user_id: req.userId, category, listing_id })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        console.error('[POST /waitlist]', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/waitlist - Get user's waitlist
 */
router.get('/', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { data, error } = await supabase
            .from('waitlist')
            .select('*, service_listings(title)')
            .eq('user_id', req.userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('[GET /waitlist]', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/waitlist/:id - Leave waitlist
 */
router.delete('/:id', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { error } = await supabase
            .from('waitlist')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.userId);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('[DELETE /waitlist/:id]', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
