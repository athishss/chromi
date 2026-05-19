import supabase from '../config/supabase.js';

/**
 * Recalculate and update the trust score for a user.
 * Trust score is 0-100.
 */
export async function calculateTrustScore(userId) {
    if (!supabase) return 100;

    try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (!profile) return 100;

        // Weights
        // 40% completion rate, 25% rating, 15% punctuality, 10% endorsements, 10% activity/age
        
        let completionRateScore = 100;
        if (profile.total_exchanges > 0) {
            // Need to calculate completed vs cancelled
            const { count: completedCount } = await supabase.from('exchanges').select('*', { count: 'exact', head: true }).eq('provider_id', userId).eq('status', 'completed');
            const total = profile.total_exchanges + (profile.total_cancellations || 0);
            if (total > 0) {
                completionRateScore = (completedCount / total) * 100;
            }
        } else if (profile.total_cancellations > 0) {
            completionRateScore = 0;
        }

        let ratingScore = (profile.rating / 5) * 100;
        let punctualityScore = profile.punctuality_score || 100;
        
        let endorsementScore = Math.min((profile.endorsements_count || 0) * 10, 100); // 10 pts per endorsement max 100

        // Calculate
        let rawScore = (completionRateScore * 0.4) + (ratingScore * 0.25) + (punctualityScore * 0.15) + (endorsementScore * 0.1) + 10; // +10 base activity points

        // Penalty for fraud flags (-20 pts each)
        let finalScore = Math.max(0, Math.min(100, rawScore - ((profile.fraud_flags || 0) * 20)));

        await supabase.from('profiles').update({ trust_score: finalScore }).eq('id', userId);
        
        // Auto verify check
        if (finalScore > 80 && profile.total_exchanges >= 10 && (profile.fraud_flags || 0) === 0 && !profile.is_verified) {
            await supabase.from('profiles').update({ is_verified: true }).eq('id', userId);
        }

        return finalScore;
    } catch (err) {
        console.error('[TrustService] calculateTrustScore failed:', err.message);
        return 100;
    }
}

/**
 * Detect potential fraud in a new exchange request
 */
export async function detectFraudPatterns(requesterId, providerId) {
    if (!supabase) return false;

    try {
        // 1. Same-user pair frequency
        // Have they exchanged more than 3 times in the last 7 days?
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabase.from('exchanges')
            .select('*', { count: 'exact', head: true })
            .eq('requester_id', requesterId)
            .eq('provider_id', providerId)
            .gte('created_at', sevenDaysAgo);

        if (count >= 3) {
            // Flag provider
            await flagUser(providerId);
            return true; // Indicates fraud pattern detected
        }
        return false;
    } catch (err) {
        console.error('[TrustService] fraud detection failed:', err.message);
        return false;
    }
}

/**
 * Add a fraud flag to a user
 */
export async function flagUser(userId) {
    if (!supabase) return;
    try {
        const { data: profile } = await supabase.from('profiles').select('fraud_flags').eq('id', userId).single();
        await supabase.from('profiles').update({ fraud_flags: (profile.fraud_flags || 0) + 1 }).eq('id', userId);
        await calculateTrustScore(userId); // Recalculate immediately
        console.log(`[TrustService] Flagged user ${userId}`);
    } catch (err) {
        console.error('[TrustService] flagUser failed:', err.message);
    }
}
