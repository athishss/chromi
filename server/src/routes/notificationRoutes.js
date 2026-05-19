import { Router } from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/notifications - Get user's notifications
 */
router.get('/', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', req.userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('[GET /notifications]', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/notifications/unread-count - Get unread count
 */
router.get('/unread-count', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', req.userId)
            .eq('is_read', false);

        if (error) throw error;
        res.json({ count: count || 0 });
    } catch (err) {
        console.error('[GET /notifications/unread-count]', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * PATCH /api/notifications/:id/read - Mark a notification as read
 */
router.patch('/:id/read', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', req.params.id)
            .eq('user_id', req.userId);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('[PATCH /notifications/:id/read]', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * PATCH /api/notifications/read-all - Mark all as read
 */
router.patch('/read-all', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', req.userId)
            .eq('is_read', false);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('[PATCH /notifications/read-all]', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
