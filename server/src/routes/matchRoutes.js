import { Router } from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { generateMatches, generateReverseMatches, generateFallbackMatches } from '../services/matchingEngine.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/match — get intelligent match suggestions for current user
 */
router.get('/', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        // Get user profile
        const { data: profile } = await supabase
            .from('profiles').select('*').eq('id', req.userId).single();

        // Get user's own listings to understand their skills/needs
        const { data: myListings } = await supabase
            .from('service_listings').select('*').eq('user_id', req.userId).eq('status', 'active');

        // Get all other active listings
        const { data: allListings } = await supabase
            .from('service_listings')
            .select('*, profiles!service_listings_user_id_fkey(full_name, rating, community, trust_score, campus, is_verified)')
            .eq('status', 'active')
            .neq('user_id', req.userId);

        const matches = await generateMatches(profile, myListings || [], allListings || []);

        // If primary matches are sparse, supplement with fallback suggestions
        let fallbacks = [];
        if (matches.length < 3) {
            fallbacks = await generateFallbackMatches(profile, myListings || [], allListings || []);
        }

        res.json({ matches, fallbacks });
    } catch (err) {
        console.error('[GET /match]', err);
        res.status(500).json({ error: err.message || 'Failed to generate matches' });
    }
});

/**
 * GET /api/match/reverse — who needs your skills
 */
router.get('/reverse', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const [{ data: profile }, { data: myListings }, { data: allListings }] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', req.userId).single(),
            supabase.from('service_listings').select('*').eq('user_id', req.userId),
            supabase.from('service_listings').select('*, profiles(full_name, rating, trust_score, campus, is_verified)').neq('user_id', req.userId).eq('status', 'active')
        ]);

        const matches = await generateReverseMatches(profile, myListings || [], allListings || []);
        res.json(matches);
    } catch (err) {
        console.error('[GET /match/reverse]', err);
        res.status(500).json({ error: err.message || 'Failed to generate reverse matches' });
    }
});

export default router;
