import supabase from '../config/supabase.js';

/**
 * Define core badges if they don't exist
 * (Ideally these are populated by DB seed, but we can ensure they exist)
 */
const CORE_BADGES = [
    { key: 'first_exchange', name: 'First Exchange', description: 'Completed your first service exchange', icon: 'StarIcon' },
    { key: 'helping_hand', name: 'Helping Hand', description: 'Given over 10 hours of service', icon: 'HeartHandshakeIcon' },
    { key: 'community_star', name: 'Community Star', description: 'Maintained a 4.5+ rating over 5 exchanges', icon: 'SparklesIcon' },
    { key: 'reliable', name: 'Reliable', description: '95%+ completion rate over 10 exchanges', icon: 'ShieldCheckIcon' },
    { key: 'verified', name: 'Verified Member', description: 'Passed trust threshold and activity checks', icon: 'BadgeCheckIcon' }
];

export async function ensureBadgesExist() {
    if (!supabase) return;
    try {
        for (const badge of CORE_BADGES) {
            await supabase.from('badges').upsert(badge, { onConflict: 'key' });
        }
    } catch (err) {
        console.error('[Gamification] Error ensuring badges:', err.message);
    }
}

/**
 * Evaluate if a user has earned new badges
 */
export async function evaluateBadges(userId) {
    if (!supabase) return;

    try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (!profile) return;

        const { data: userBadges } = await supabase.from('user_badges').select('badges(key)').eq('user_id', userId);
        const earnedKeys = (userBadges || []).map(b => b.badges.key);
        
        const newEarned = [];

        // 1. First Exchange
        if (!earnedKeys.includes('first_exchange') && profile.total_exchanges >= 1) {
            newEarned.push('first_exchange');
        }

        // 2. Helping Hand
        if (!earnedKeys.includes('helping_hand') && profile.hours_given >= 10) {
            newEarned.push('helping_hand');
        }

        // 3. Community Star
        if (!earnedKeys.includes('community_star') && profile.total_exchanges >= 5 && profile.rating >= 4.5) {
            newEarned.push('community_star');
        }

        // 4. Reliable
        if (!earnedKeys.includes('reliable') && profile.total_exchanges >= 10) {
            // Need actual completion rate, but we can use total_cancellations
            const completionRate = profile.total_exchanges / (profile.total_exchanges + (profile.total_cancellations || 0));
            if (completionRate >= 0.95) newEarned.push('reliable');
        }

        // 5. Verified
        if (!earnedKeys.includes('verified') && profile.is_verified) {
            newEarned.push('verified');
        }

        if (newEarned.length > 0) {
            // Fetch badge IDs
            const { data: allBadges } = await supabase.from('badges').select('id, key').in('key', newEarned);
            
            const insertData = allBadges.map(b => ({
                user_id: userId,
                badge_id: b.id
            }));

            await supabase.from('user_badges').insert(insertData);

            // Also update the fast-access array on profile
            const currentBadgeKeys = profile.badges || [];
            await supabase.from('profiles').update({ badges: [...currentBadgeKeys, ...newEarned] }).eq('id', userId);

            // Notify user
            const notifications = newEarned.map(key => ({
                user_id: userId,
                type: 'badge_earned',
                title: 'New Badge Unlocked!',
                body: `You earned the ${CORE_BADGES.find(b => b.key === key)?.name} badge.`
            }));
            await supabase.from('notifications').insert(notifications);
        }

    } catch (err) {
        console.error('[Gamification] evaluateBadges failed:', err.message);
    }
}
