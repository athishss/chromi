import supabase from '../config/supabase.js';

/**
 * Notify providers whose skills or offer listings match a newly posted REQUEST.
 * This is the "someone nearby needs your skill" smart alert.
 */
export async function notifyMatchingProviders(category, listingId, requesterId) {
    if (!supabase) return;

    try {
        // 1. Find users who have active OFFER listings in this category (excluding the requester)
        const { data: offerListings } = await supabase
            .from('service_listings')
            .select('user_id')
            .eq('category', category)
            .eq('type', 'offer')
            .eq('status', 'active')
            .neq('user_id', requesterId);

        // 2. Find users whose skills array contains a keyword matching this category
        const { data: skilledUsers } = await supabase
            .from('profiles')
            .select('id')
            .contains('skills', [category])
            .neq('id', requesterId);

        // Merge unique user IDs
        const providerIds = new Set();
        if (offerListings) offerListings.forEach(l => providerIds.add(l.user_id));
        if (skilledUsers) skilledUsers.forEach(u => providerIds.add(u.id));

        if (providerIds.size === 0) return;

        // 3. Get listing title for the notification body
        const { data: listing } = await supabase
            .from('service_listings')
            .select('title')
            .eq('id', listingId)
            .single();

        const title = listing?.title || category;

        // 4. Send notifications to all matching providers
        const notifications = Array.from(providerIds).map(uid => ({
            user_id: uid,
            type: 'skill_demand',
            title: '🔔 Someone needs your skill!',
            body: `A new request was just posted: "${title}". Your ${category} skills are in demand — check it out!`,
            metadata: { listing_id: listingId, category }
        }));

        await supabase.from('notifications').insert(notifications);
        console.log(`[WaitlistService] Notified ${providerIds.size} providers for ${category} request`);

    } catch (err) {
        console.error('[WaitlistService] notifyMatchingProviders failed:', err.message);
    }
}

/**
 * Notify waitlisted users when a new listing matches their waitlist category
 */
export async function notifyWaitlist(category, listingId) {
    if (!supabase) return;

    try {
        const { data: waitlisters, error } = await supabase
            .from('waitlist')
            .select('id, user_id')
            .eq('category', category)
            .is('notified_at', null);

        if (error || !waitlisters || waitlisters.length === 0) return;

        // In a real app we would create a notification record for each user.
        // For now, we will mark them as notified.
        const ids = waitlisters.map(w => w.id);
        const userIds = waitlisters.map(w => w.user_id);

        await supabase
            .from('waitlist')
            .update({ notified_at: new Date().toISOString() })
            .in('id', ids);

        // We will insert notifications into the new notifications table
        const notifications = userIds.map(uid => ({
            user_id: uid,
            type: 'waitlist_match',
            title: 'New Match Available',
            body: `A new listing in the ${category} category is now available!`,
            metadata: { listing_id: listingId }
        }));

        await supabase.from('notifications').insert(notifications);

    } catch (err) {
        console.error('[WaitlistService] Notify failed:', err.message);
    }
}
