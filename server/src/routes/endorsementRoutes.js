import { Router } from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { calculateTrustScore } from '../services/trustService.js';

const router = Router();
router.use(authMiddleware);

/**
 * POST /api/endorsements - Endorse a user for a skill
 */
router.post('/', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        
        const { endorsed_id, skill, comment } = req.body;
        
        if (!endorsed_id || !skill) {
            return res.status(400).json({ error: 'Missing endorsed_id or skill' });
        }
        
        if (endorsed_id === req.userId) {
            return res.status(400).json({ error: 'Cannot endorse yourself' });
        }

        // Insert endorsement
        const { data, error } = await supabase
            .from('endorsements')
            .insert({
                endorser_id: req.userId,
                endorsed_id,
                skill,
                comment
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({ error: 'You have already endorsed this user for this skill' });
            }
            throw error;
        }

        // Increment count and recalc trust
        const { data: profile } = await supabase.from('profiles').select('endorsements_count').eq('id', endorsed_id).single();
        await supabase.from('profiles').update({ endorsements_count: (profile.endorsements_count || 0) + 1 }).eq('id', endorsed_id);
        await calculateTrustScore(endorsed_id);

        res.status(201).json(data);
    } catch (err) {
        console.error('[POST /endorsements]', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/endorsements/:userId - Get endorsements for a user
 */
router.get('/:userId', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { data, error } = await supabase
            .from('endorsements')
            .select('*, endorser:profiles!endorser_id(full_name, trust_score)')
            .eq('endorsed_id', req.params.userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[GET /endorsements/:userId]', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
