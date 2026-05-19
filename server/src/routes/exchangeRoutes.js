import { Router } from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { transferCredits, lockEscrow, releaseEscrow, applyPenalty } from '../services/creditService.js';
import { detectFraudPatterns, calculateTrustScore } from '../services/trustService.js';
import { evaluateBadges } from '../services/gamificationService.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/exchanges — list current user's exchanges
 */
router.get('/', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        const { data, error } = await supabase
            .from('exchanges')
            .select('*, service_listings(*), provider:profiles!exchanges_provider_id_fkey(full_name), requester:profiles!exchanges_requester_id_fkey(full_name)')
            .or(`provider_id.eq.${req.userId},requester_id.eq.${req.userId}`)
            .order('created_at', { ascending: false });
        if (error) throw error;
        const exchanges = (data || []).map(e => ({
            ...e,
            listing: e.service_listings || null,
            provider_name: e.provider?.full_name || '',
            requester_name: e.requester?.full_name || '',
            service_listings: undefined, provider: undefined, requester: undefined
        }));
        res.json(exchanges);
    } catch (err) {
        console.error('[GET /exchanges]', err);
        res.status(500).json({ error: err.message || 'Failed to fetch exchanges' });
    }
});

/**
 * GET /api/exchanges/:id — exchange detail
 */
router.get('/:id', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        const { data, error } = await supabase
            .from('exchanges')
            .select('*, service_listings(*), provider:profiles!exchanges_provider_id_fkey(full_name), requester:profiles!exchanges_requester_id_fkey(full_name)')
            .eq('id', req.params.id)
            .or(`provider_id.eq.${req.userId},requester_id.eq.${req.userId}`)
            .single();
        if (error || !data) return res.status(404).json({ error: 'Exchange not found' });
        res.json({
            ...data,
            listing: data.service_listings || null,
            provider_name: data.provider?.full_name || '',
            requester_name: data.requester?.full_name || '',
            service_listings: undefined, provider: undefined, requester: undefined
        });
    } catch (err) {
        console.error('[GET /exchanges/:id]', err);
        res.status(500).json({ error: err.message || 'Failed to fetch exchange' });
    }
});

/**
 * POST /api/exchanges — request an exchange
 */
router.post('/', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        const { listing_id, collateral_item, collateral_photo_url, is_private = false } = req.body;
        if (!listing_id) return res.status(400).json({ error: 'listing_id is required' });

        // Fetch the listing
        const { data: listing, error: listErr } = await supabase
            .from('service_listings').select('*').eq('id', listing_id).single();
        if (listErr || !listing) return res.status(404).json({ error: 'Listing not found' });
        if (listing.user_id === req.userId) return res.status(400).json({ error: 'Cannot exchange with yourself' });

        // Group capacity check: count existing active exchanges for this listing
        const maxParticipants = listing.max_participants || 1;
        const { count: activeCount } = await supabase
            .from('exchanges')
            .select('*', { count: 'exact', head: true })
            .eq('listing_id', listing_id)
            .in('status', ['pending', 'accepted', 'in_progress']);

        if (activeCount >= maxParticipants) {
            return res.status(400).json({ error: `This session is full (${maxParticipants}/${maxParticipants} spots taken).` });
        }

        // Determine provider/requester
        const provider_id = listing.type === 'offer' ? listing.user_id : req.userId;
        const requester_id = listing.type === 'offer' ? req.userId : listing.user_id;

        // Fraud check
        const isFraud = await detectFraudPatterns(requester_id, provider_id);
        if (isFraud) {
            console.warn(`[Fraud] Flagged exchange attempt between ${requester_id} and ${provider_id}`);
        }

        // Calculate hours — private sessions cost 2x
        let hours = listing.estimated_hours;
        const isPrivateSession = is_private && listing.premium_rate_allowed;
        if (isPrivateSession) {
            hours = listing.estimated_hours * 2;
        }

        // ── Credit balance check: block request if requester can't afford it ──
        const { data: requesterProfile } = await supabase
            .from('profiles')
            .select('time_balance, negative_balance_allowed, max_negative')
            .eq('id', requester_id)
            .single();
        if (requesterProfile) {
            const available = Number(requesterProfile.time_balance);
            const minAllowed = requesterProfile.negative_balance_allowed ? Number(requesterProfile.max_negative) : 0;
            if (available - hours < minAllowed) {
                return res.status(400).json({ error: `Insufficient credits. You have ${available}h, need ${hours}h.` });
            }
        }

        const insertData = { listing_id, provider_id, requester_id, hours_exchanged: hours, status: 'pending', is_private: isPrivateSession };
        if (collateral_item) insertData.collateral_item = collateral_item;
        if (collateral_photo_url) insertData.collateral_photo_url = collateral_photo_url;

        const { data, error } = await supabase
            .from('exchanges')
            .insert(insertData)
            .select()
            .single();
        if (error) throw error;

        // ── Notify the provider about the new exchange request ──
        try {
            const { data: requesterNameData } = await supabase
                .from('profiles').select('full_name').eq('id', requester_id).single();
            const requesterName = requesterNameData?.full_name || 'Someone';
            await supabase.from('notifications').insert({
                user_id: provider_id,
                type: 'exchange_request',
                title: '📬 New Exchange Request',
                body: `${requesterName} has requested your service: ${listing.title}${isPrivateSession ? ' (Private Session)' : ''}.`,
                metadata: { exchange_id: data.id, listing_id, requester_id }
            });
        } catch (notifErr) {
            console.error('[POST /exchanges] Failed to send notification:', notifErr);
            // Don't fail the request if notification fails
        }

        res.status(201).json(data);
    } catch (err) {
        console.error('[POST /exchanges]', err);
        res.status(500).json({ error: err.message || 'Failed to create exchange' });
    }
});

/**
 * PATCH /api/exchanges/:id/status — update exchange status
 */
router.patch('/:id/status', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        const { status } = req.body;
        const validStatuses = ['accepted', 'in_progress', 'completed', 'cancelled', 'disputed'];
        if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

        // Prevent double updates (e.g. both users clicking 'Mark Completed')
        const { data: currentEx } = await supabase.from('exchanges').select('status, requester_id, hours_exchanged').eq('id', req.params.id).single();
        if (!currentEx) return res.status(404).json({ error: 'Exchange not found' });
        if (currentEx.status === status) return res.status(400).json({ error: `Exchange is already ${status}` });
        if (currentEx.status === 'completed' || currentEx.status === 'cancelled') {
             return res.status(400).json({ error: `Cannot change status of a ${currentEx.status} exchange` });
        }

        const updateData = { status };
        if (status === 'completed') updateData.completed_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('exchanges')
            .update(updateData)
            .eq('id', req.params.id)
            .or(`provider_id.eq.${req.userId},requester_id.eq.${req.userId}`)
            .select('*, service_listings(*), provider:profiles!exchanges_provider_id_fkey(full_name), requester:profiles!exchanges_requester_id_fkey(full_name)')
            .single();
        if (error) throw error;

        // Handle status-specific logic
        if (status === 'accepted') {
            // Escrow was already validated; lock it now (status is already updated).
            // If this fails, we revert the status back to 'pending'.
            try {
                await lockEscrow(req.params.id, currentEx.requester_id, currentEx.hours_exchanged);
            } catch (escrowErr) {
                // Revert the exchange status back to pending since escrow failed
                await supabase.from('exchanges').update({ status: 'pending' }).eq('id', req.params.id);
                return res.status(400).json({ error: escrowErr.message || 'Failed to lock credits in escrow' });
            }
        } else if (status === 'completed' && data) {
            await transferCredits(req.params.id);
            await calculateTrustScore(data.provider_id);
            await calculateTrustScore(data.requester_id);
            await evaluateBadges(data.provider_id);
            await evaluateBadges(data.requester_id);
        } else if (status === 'cancelled' || status === 'disputed') {
            await releaseEscrow(req.params.id);
            if (status === 'cancelled') {
                // Check for late cancellation (< 24h before scheduled time)
                if (data.scheduled_at) {
                    const scheduledTime = new Date(data.scheduled_at).getTime();
                    const now = Date.now();
                    const hoursUntilScheduled = (scheduledTime - now) / (1000 * 60 * 60);

                    if (hoursUntilScheduled < 24 && hoursUntilScheduled > -1) {
                        // Late cancellation penalty: 0.5h deducted from the person who cancelled
                        await applyPenalty(req.userId, req.params.id, 0.5, 'Late cancellation penalty (< 24h before scheduled time)');
                        console.log(`[Exchange] Late cancellation penalty applied to ${req.userId.slice(0,8)}...`);

                        // Notify the other party about the cancellation
                        const otherUserId = req.userId === data.provider_id ? data.requester_id : data.provider_id;
                        if (supabase) {
                            await supabase.from('notifications').insert({
                                user_id: otherUserId,
                                type: 'late_cancellation',
                                title: '⚠️ Exchange Cancelled Late',
                                body: `An exchange was cancelled less than 24 hours before the scheduled time. The other party has been penalized.`,
                                metadata: { exchange_id: req.params.id }
                            });
                        }
                    }
                }
                await calculateTrustScore(req.userId);
            }
        }

        res.json({
            ...data,
            listing: data.service_listings || null,
            provider_name: data.provider?.full_name || '',
            requester_name: data.requester?.full_name || '',
            service_listings: undefined, provider: undefined, requester: undefined
        });
    } catch (err) {
        console.error('[PATCH /exchanges/:id/status]', err);
        res.status(500).json({ error: err.message || 'Failed to update exchange' });
    }
});

/**
 * POST /api/exchanges/:id/review — submit a review
 */
router.post('/:id/review', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });
        const { rating, comment = '' } = req.body;
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

        // Get exchange to determine reviewee
        const { data: exchange } = await supabase
            .from('exchanges').select('*').eq('id', req.params.id).single();
        if (!exchange) return res.status(404).json({ error: 'Exchange not found' });
        if (exchange.status !== 'completed') return res.status(400).json({ error: 'Can only review completed exchanges' });

        const reviewee_id = exchange.provider_id === req.userId ? exchange.requester_id : exchange.provider_id;

        const { data, error } = await supabase
            .from('reviews')
            .insert({ exchange_id: req.params.id, reviewer_id: req.userId, reviewee_id, rating, comment })
            .select()
            .single();
        if (error) throw error;

        // Update reviewee's average rating
        const { data: allReviews } = await supabase
            .from('reviews').select('rating').eq('reviewee_id', reviewee_id);
        if (allReviews && allReviews.length > 0) {
            const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
            await supabase.from('profiles').update({ rating: Math.round(avg * 100) / 100 }).eq('id', reviewee_id);
            await calculateTrustScore(reviewee_id); // Recalculate trust with new rating
        }

        res.status(201).json(data);
    } catch (err) {
        console.error('[POST /exchanges/:id/review]', err);
        res.status(500).json({ error: err.message || 'Failed to submit review' });
    }
});

export default router;
