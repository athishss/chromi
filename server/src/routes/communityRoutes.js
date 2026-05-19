import { Router } from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/communities - List all community groups
 */
router.get('/', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { data, error } = await supabase
            .from('community_groups')
            .select('*')
            .order('member_count', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('[GET /communities]', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/communities - Create a community
 */
router.post('/', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        
        const { name, campus, description } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        // 1. Create group
        const { data: group, error: groupErr } = await supabase
            .from('community_groups')
            .insert({ name, campus, description, created_by: req.userId })
            .select()
            .single();

        if (groupErr) throw groupErr;

        // 2. Add creator as member/admin
        await supabase
            .from('group_members')
            .insert({ group_id: group.id, user_id: req.userId, role: 'admin' });

        res.status(201).json(group);
    } catch (err) {
        console.error('[POST /communities]', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/communities/:id/join - Join a group
 */
router.post('/:id/join', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { error } = await supabase
            .from('group_members')
            .insert({ group_id: req.params.id, user_id: req.userId });

        if (error) {
            if (error.code === '23505') return res.status(400).json({ error: 'Already a member' });
            throw error;
        }

        // Increment member count
        const { data: group } = await supabase.from('community_groups').select('member_count').eq('id', req.params.id).single();
        await supabase.from('community_groups').update({ member_count: (group.member_count || 0) + 1 }).eq('id', req.params.id);

        res.json({ success: true });
    } catch (err) {
        console.error('[POST /communities/:id/join]', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/leaderboard - Top users
 */
router.get('/leaderboard', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, campus, hours_given, trust_score, badges')
            .order('hours_given', { ascending: false })
            .limit(10);

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('[GET /leaderboard]', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
