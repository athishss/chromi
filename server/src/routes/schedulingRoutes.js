import { Router } from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { checkConflicts } from '../services/schedulingService.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/schedule - Get user's upcoming scheduled exchanges
 */
router.get('/', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { data, error } = await supabase
            .from('exchanges')
            .select('*, service_listings(title, category), provider:profiles!exchanges_provider_id_fkey(full_name), requester:profiles!exchanges_requester_id_fkey(full_name)')
            .or(`provider_id.eq.${req.userId},requester_id.eq.${req.userId}`)
            .not('scheduled_at', 'is', null)
            .gte('scheduled_at', new Date().toISOString())
            .in('status', ['accepted', 'in_progress'])
            .order('scheduled_at', { ascending: true });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('[GET /schedule]', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/schedule/:exchangeId - Schedule an exchange
 */
router.post('/:exchangeId', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        
        const { start_time, end_time } = req.body;
        if (!start_time || !end_time) return res.status(400).json({ error: 'start_time and end_time required' });

        // Check conflicts
        const conflictCheck = await checkConflicts(req.userId, start_time, end_time);
        if (conflictCheck.hasConflict) {
            return res.status(409).json({ error: 'Schedule conflict detected', conflicts: conflictCheck.conflicts });
        }

        const { data, error } = await supabase
            .from('exchanges')
            .update({
                scheduled_at: start_time,
                scheduled_end_at: end_time
            })
            .eq('id', req.params.exchangeId)
            .or(`provider_id.eq.${req.userId},requester_id.eq.${req.userId}`)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[POST /schedule/:exchangeId]', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
