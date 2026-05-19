import { Router } from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { getAIRecommendations } from '../services/recommendationService.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/profile — current user's profile
 */
router.get('/', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        let { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.userId)
            .single();

        // Auto-create profile if it doesn't exist
        if (error || !data) {
            const { data: newProfile, error: insertErr } = await supabase
                .from('profiles')
                .insert({ id: req.userId, full_name: '', time_balance: 2.0 })
                .select()
                .single();
            if (insertErr) throw insertErr;
            data = newProfile;
        }

        res.json(data);
    } catch (err) {
        console.error('[GET /profile]', err);
        res.status(500).json({ error: err.message || 'Failed to fetch profile' });
    }
});

/**
 * PUT /api/profile — update current user's profile
 */
router.put('/', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        const { full_name, bio, skills, community, timetable_url } = req.body;

        const updateData = { updated_at: new Date().toISOString() };
        if (full_name !== undefined) updateData.full_name = full_name;
        if (bio !== undefined) updateData.bio = bio;
        if (skills !== undefined) updateData.skills = skills;
        if (community !== undefined) updateData.community = community;
        if (timetable_url !== undefined) updateData.timetable_url = timetable_url;

        const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', req.userId)
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[PUT /profile]', err);
        res.status(500).json({ error: err.message || 'Failed to update profile' });
    }
});

/**
 * GET /api/profile/recommendations — AI smart suggestions
 */
router.get('/recommendations', async (req, res) => {
    try {
        const result = await getAIRecommendations(req.userId);
        res.json(result);
    } catch (err) {
        console.error('[GET /profile/recommendations]', err);
        res.status(500).json({ error: err.message || 'Failed to get recommendations' });
    }
});

/**
 * POST /api/profile/go-live — set yourself as available now
 */
router.post('/go-live', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        const { category, description = '', duration_hours = 2 } = req.body;
        if (!category) return res.status(400).json({ error: 'category is required' });

        // Auto-create a listing of type 'offer' if it doesn't exist so other users can request it
        const { data: existingListings } = await supabase
            .from('service_listings')
            .select('id')
            .eq('user_id', req.userId)
            .eq('category', category)
            .eq('type', 'offer')
            .eq('status', 'active');
            
        if (!existingListings || existingListings.length === 0) {
            const friendlyNames = {
                tutoring: 'Tutoring & Academic Help',
                repair: 'Home & Gadget Repair',
                design: 'Graphic Design & Creative',
                cooking: 'Cooking & Meal Prep',
                music: 'Music Lessons',
                tech: 'Tech Support & Coding',
                fitness: 'Fitness & Workout Coaching',
                language: 'Language Exchange',
                photography: 'Photography & Editing',
                writing: 'Writing & Editing',
                gardening: 'Gardening & Plant Care',
                other: 'General Help & Services'
            };
            const title = friendlyNames[category] || `Live Barter: ${category}`;
            const desc = description.trim() || `Available right now for help with ${category}. Request an exchange!`;
            
            const { error: insertErr } = await supabase.from('service_listings').insert({
                user_id: req.userId,
                title,
                category,
                description: desc,
                type: 'offer',
                status: 'active',
                estimated_hours: 1.0
            });
            if (insertErr) console.error('[go-live] failed to auto-create service listing:', insertErr);
        }

        const liveUntil = new Date(Date.now() + duration_hours * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('profiles')
            .update({
                is_live: true,
                live_until: liveUntil,
                live_category: category,
                live_description: description.trim(),
                updated_at: new Date().toISOString()
            })
            .eq('id', req.userId)
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[POST /profile/go-live]', err);
        res.status(500).json({ error: err.message || 'Failed to go live' });
    }
});

/**
 * POST /api/profile/go-offline — stop being live
 */
router.post('/go-offline', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { data, error } = await supabase
            .from('profiles')
            .update({
                is_live: false,
                live_until: null,
                live_category: null,
                live_description: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.userId)
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[POST /profile/go-offline]', err);
        res.status(500).json({ error: err.message || 'Failed to go offline' });
    }
});

/**
 * GET /api/profile/live — get all currently live users
 */
router.get('/live', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, rating, trust_score, is_verified, skills, live_category, live_description, live_until, campus')
            .eq('is_live', true)
            .gt('live_until', new Date().toISOString())
            .neq('id', req.userId);
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('[GET /profile/live]', err);
        res.status(500).json({ error: err.message || 'Failed to fetch live users' });
    }
});

/**
 * GET /api/profile/:userId — public profile for any user
 */
router.get('/:userId', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const { userId } = req.params;

        // Get profile (public fields only)
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, full_name, bio, skills, rating, completion_score, total_exchanges, hours_given, hours_received, community, campus, trust_score, punctuality_score, endorsements_count, is_verified, badges, timetable_url, created_at')
            .eq('id', userId)
            .single();

        if (error || !profile) return res.status(404).json({ error: 'User not found' });

        // Get their active listings
        const { data: listings } = await supabase
            .from('service_listings')
            .select('id, title, category, description, estimated_hours, type, status, is_resource, max_participants, created_at')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        // Get their endorsements
        const { data: endorsements } = await supabase
            .from('endorsements')
            .select('*, endorser:profiles!endorser_id(full_name, trust_score)')
            .eq('endorsed_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        // Get their reviews (as reviewee)
        const { data: reviews } = await supabase
            .from('reviews')
            .select('*, reviewer:profiles!reviewer_id(full_name)')
            .eq('reviewee_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        res.json({
            profile,
            listings: listings || [],
            endorsements: endorsements || [],
            reviews: reviews || []
        });
    } catch (err) {
        console.error('[GET /profile/:userId]', err);
        res.status(500).json({ error: err.message || 'Failed to fetch public profile' });
    }
});

export default router;
