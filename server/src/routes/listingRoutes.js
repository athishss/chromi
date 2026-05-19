import { Router } from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { notifyWaitlist, notifyMatchingProviders } from '../services/waitlistService.js';

const router = Router();

const VALID_CATEGORIES = ['tutoring','repair','design','cooking','music','tech','fitness','language','photography','writing','gardening','other'];
const VALID_TYPES = ['offer', 'request'];

/**
 * GET /api/listings — all active listings (public-ish, but needs auth)
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        const { data, error } = await supabase
            .from('service_listings')
            .select('*, profiles!service_listings_user_id_fkey(full_name, rating)')
            .eq('status', 'active')
            .order('created_at', { ascending: false });
        if (error) throw error;
        const listings = (data || []).map(l => ({
            ...l,
            user_name: l.profiles?.full_name || '',
            user_rating: l.profiles?.rating || 0,
            profiles: undefined
        }));
        res.json(listings);
    } catch (err) {
        console.error('[GET /listings]', err);
        res.status(500).json({ error: err.message || 'Failed to fetch listings' });
    }
});

/**
 * GET /api/listings/mine — current user's listings
 */
router.get('/mine', authMiddleware, async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        const { data, error } = await supabase
            .from('service_listings')
            .select('*')
            .eq('user_id', req.userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('[GET /listings/mine]', err);
        res.status(500).json({ error: err.message || 'Failed to fetch listings' });
    }
});

/**
 * POST /api/listings — create a new listing
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        const { title, category, description, estimated_hours = 1, type = 'offer', availability = '', priority = 'normal', is_resource = false, resource_deposit = 0, resource_condition = '', tags = [], max_participants = 1, premium_rate_allowed = false } = req.body;
        const errors = [];
        if (!title?.trim()) errors.push('title is required');
        if (!description?.trim()) errors.push('description is required');
        if (!VALID_CATEGORIES.includes(category)) errors.push('invalid category');
        if (!VALID_TYPES.includes(type)) errors.push('type must be offer or request');
        if (estimated_hours <= 0 || estimated_hours > 100) errors.push('estimated_hours must be 0.5–100');
        if (errors.length) return res.status(400).json({ errors });

        const insertData = {
                user_id: req.userId, title: title.trim(), category, description: description.trim(),
                estimated_hours, type, availability: availability.trim(),
                priority, is_resource, resource_deposit, resource_condition, tags
            };

        // Only offers can have group/premium settings
        if (type === 'offer') {
            insertData.max_participants = Math.max(1, Math.min(max_participants, 20));
            insertData.premium_rate_allowed = premium_rate_allowed;
        }

        const { data, error } = await supabase
            .from('service_listings')
            .insert(insertData)
            .select()
            .single();
        if (error) throw error;

        // Smart alerts: notify relevant users about this new listing
        if (data) {
            if (data.type === 'request') {
                // Alert providers whose skills match this request
                notifyMatchingProviders(data.category, data.id, req.userId).catch(() => {});
            }
            // Alert waitlisted users for this category
            notifyWaitlist(data.category, data.id).catch(() => {});
        }

        res.status(201).json(data);
    } catch (err) {
        console.error('[POST /listings]', err);
        res.status(500).json({ error: err.message || 'Failed to create listing' });
    }
});

/**
 * PATCH /api/listings/:id — update a listing
 */
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        const { title, category, description, estimated_hours, type, availability, priority, is_resource, resource_deposit, resource_condition, tags, status } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (category !== undefined) updateData.category = category;
        if (description !== undefined) updateData.description = description.trim();
        if (estimated_hours !== undefined) updateData.estimated_hours = estimated_hours;
        if (type !== undefined) updateData.type = type;
        if (availability !== undefined) updateData.availability = availability.trim();
        if (priority !== undefined) updateData.priority = priority;
        if (is_resource !== undefined) updateData.is_resource = is_resource;
        if (resource_deposit !== undefined) updateData.resource_deposit = resource_deposit;
        if (resource_condition !== undefined) updateData.resource_condition = resource_condition;
        if (tags !== undefined) updateData.tags = tags;
        if (status !== undefined) updateData.status = status;

        const { data, error } = await supabase
            .from('service_listings')
            .update(updateData)
            .eq('id', req.params.id)
            .eq('user_id', req.userId)
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[PATCH /listings/:id]', err);
        res.status(500).json({ error: err.message || 'Failed to update listing' });
    }
});

/**
 * DELETE /api/listings/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        const { error } = await supabase
            .from('service_listings')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.userId);
        if (error) throw error;
        res.status(204).end();
    } catch (err) {
        console.error('[DELETE /listings/:id]', err);
        res.status(500).json({ error: err.message || 'Failed to delete listing' });
    }
});

export default router;
