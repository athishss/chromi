/**
 * Chromi Credit Service
 * 
 * Manages the time credit economy including:
 * - Escrow-based credit locking and release
 * - Dynamic credit valuation (scarcity multiplier)
 * - Credit borrowing mechanism
 * - Transaction ledger history
 * - Penalty and bonus mechanisms
 */

import supabase from '../config/supabase.js';

// Base demand multipliers as fallback if DB query fails
const BASE_MULTIPLIERS = {
    tech: 1.3, design: 1.2, tutoring: 1.1, repair: 1.15,
    cooking: 1.0, music: 1.05, fitness: 1.1, language: 1.2,
    photography: 1.1, writing: 1.05, gardening: 0.95, other: 1.0
};

/**
 * Log a transaction in the ledger
 */
export async function logTransaction(userId, amount, type, description, referenceId = null) {
    // 1. Get current balance
    const { data: profile } = await supabase.from('profiles').select('time_balance').eq('id', userId).single();
    if (!profile) return;

    let balanceAfter = Number(profile.time_balance) + amount;
    
    // For spending/penalties/escrow lock, amount is negative, so balance decreases.
    // For earning/borrowing/escrow release, amount is positive, so balance increases.

    const { error: txErr } = await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: amount,
        type: type,
        reference_id: referenceId,
        description: description,
        balance_after: balanceAfter
    });

    if (txErr) {
        console.error('[CreditService] Failed to log transaction:', txErr);
        // We don't throw to avoid breaking the main flow, but it should be logged.
    }

    // Update profile time_balance
    await supabase.from('profiles').update({ time_balance: balanceAfter, updated_at: new Date().toISOString() }).eq('id', userId);
}

/**
 * Calculates current scarcity multiplier for a category
 * Real-world this would look at last 30 days of exchanges vs active listings
 */
export async function getScarcityMultiplier(category) {
    if (!supabase) return BASE_MULTIPLIERS[category] || 1.0;

    try {
        const { count: supplyCount } = await supabase.from('service_listings').select('*', { count: 'exact', head: true }).eq('category', category).eq('type', 'offer').eq('status', 'active');
        const { count: demandCount } = await supabase.from('service_listings').select('*', { count: 'exact', head: true }).eq('category', category).eq('type', 'request').eq('status', 'active');
        
        // Prevent div by zero
        if (supplyCount === 0 && demandCount > 0) return 1.5; // Max scarcity
        if (supplyCount === 0 && demandCount === 0) return BASE_MULTIPLIERS[category] || 1.0;
        
        let ratio = demandCount / supplyCount;
        let multiplier = 1.0;

        // Determine multiplier based on demand/supply ratio
        if (ratio > 3) multiplier = 1.5;
        else if (ratio > 2) multiplier = 1.3;
        else if (ratio > 1.2) multiplier = 1.1;
        else if (ratio < 0.5) multiplier = 0.9; // Oversupply

        // Return max between algorithmic multiplier and base multiplier
        return Math.max(multiplier, BASE_MULTIPLIERS[category] || 1.0);
    } catch (err) {
        console.error('[CreditService] Multiplier error:', err);
        return BASE_MULTIPLIERS[category] || 1.0;
    }
}

/**
 * Calculates current scarcity multipliers for an array of categories in a single query
 */
export async function getAllMultipliers(categories) {
    if (!supabase) {
        return categories.reduce((acc, cat) => ({ ...acc, [cat]: BASE_MULTIPLIERS[cat] || 1.0 }), {});
    }

    try {
        // Fetch all active listings in one query
        const { data: listings } = await supabase
            .from('service_listings')
            .select('category, type')
            .eq('status', 'active');

        const supply = {};
        const demand = {};
        categories.forEach(cat => { supply[cat] = 0; demand[cat] = 0; });

        if (listings) {
            listings.forEach(l => {
                if (l.type === 'offer' && supply[l.category] !== undefined) supply[l.category]++;
                if (l.type === 'request' && demand[l.category] !== undefined) demand[l.category]++;
            });
        }

        const multipliers = {};
        categories.forEach(category => {
            const supplyCount = supply[category];
            const demandCount = demand[category];
            
            if (supplyCount === 0 && demandCount > 0) {
                multipliers[category] = 1.5;
                return;
            }
            if (supplyCount === 0 && demandCount === 0) {
                multipliers[category] = BASE_MULTIPLIERS[category] || 1.0;
                return;
            }
            
            let ratio = demandCount / supplyCount;
            let multiplier = 1.0;

            if (ratio > 3) multiplier = 1.5;
            else if (ratio > 2) multiplier = 1.3;
            else if (ratio > 1.2) multiplier = 1.1;
            else if (ratio < 0.5) multiplier = 0.9;

            multipliers[category] = Math.max(multiplier, BASE_MULTIPLIERS[category] || 1.0);
        });

        return multipliers;
    } catch (err) {
        console.error('[CreditService] getAllMultipliers error:', err);
        return categories.reduce((acc, cat) => ({ ...acc, [cat]: BASE_MULTIPLIERS[cat] || 1.0 }), {});
    }
}

/**
 * Lock credits in escrow when an exchange is accepted
 */
export async function lockEscrow(exchangeId, requesterId, hours) {
    if (!supabase) return;

    try {
        // Check requester balance
        const { data: profile } = await supabase.from('profiles').select('time_balance, negative_balance_allowed, max_negative').eq('id', requesterId).single();
        if (!profile) return;

        let available = Number(profile.time_balance);
        let minAllowed = profile.negative_balance_allowed ? Number(profile.max_negative) : 0;

        if (available - hours < minAllowed) {
            throw new Error(`Insufficient credits. You have ${available}h, need ${hours}h.`);
        }

        // Lock escrow on exchange record
        await supabase.from('exchanges').update({ escrow_locked: true, escrow_amount: hours }).eq('id', exchangeId);

        // Deduct from user
        await logTransaction(requesterId, -hours, 'escrow_lock', `Escrow locked for exchange`, exchangeId);
        
        console.log(`[CreditService] Locked ${hours}h in escrow for user ${requesterId.slice(0,8)}...`);
    } catch (err) {
        console.error('[CreditService] Escrow Lock failed:', err.message);
        throw err;
    }
}

/**
 * Release escrowed credits back to requester (e.g. on cancellation)
 */
export async function releaseEscrow(exchangeId) {
    if (!supabase) return;

    try {
        const { data: exchange } = await supabase.from('exchanges').select('*').eq('id', exchangeId).single();
        if (!exchange || !exchange.escrow_locked) return;

        await supabase.from('exchanges').update({ escrow_locked: false }).eq('id', exchangeId);
        
        // Return credits
        await logTransaction(exchange.requester_id, Number(exchange.escrow_amount), 'escrow_release', `Escrow released for cancelled exchange`, exchangeId);
        
        console.log(`[CreditService] Released ${exchange.escrow_amount}h escrow back to ${exchange.requester_id.slice(0,8)}...`);
    } catch (err) {
        console.error('[CreditService] Escrow Release failed:', err.message);
    }
}

/**
 * Apply penalty to a user (e.g. late cancellation)
 */
export async function applyPenalty(userId, exchangeId, hours, reason) {
    if (!supabase) return;
    try {
        // Log penalty transaction
        await logTransaction(userId, -hours, 'penalty', reason, exchangeId);
        
        // Update total cancellations
        const { data: profile } = await supabase.from('profiles').select('total_cancellations').eq('id', userId).single();
        await supabase.from('profiles').update({ total_cancellations: (profile.total_cancellations || 0) + 1 }).eq('id', userId);
        
        console.log(`[CreditService] Applied ${hours}h penalty to user ${userId.slice(0,8)}...`);
    } catch (err) {
        console.error('[CreditService] Penalty failed:', err.message);
    }
}

/**
 * Apply bonus credits to a user
 */
export async function applyBonus(userId, hours, reason, referenceId = null) {
    if (!supabase) return;
    try {
        await logTransaction(userId, hours, 'bonus', reason, referenceId);
        console.log(`[CreditService] Awarded ${hours}h bonus to user ${userId.slice(0,8)}...`);
    } catch (err) {
        console.error('[CreditService] Bonus failed:', err.message);
    }
}

/**
 * Allow a user to borrow credits (go negative)
 */
export async function borrowCredits(userId, amount) {
    if (!supabase) return { success: false, error: 'Database not configured' };
    
    try {
        const { data: profile } = await supabase.from('profiles').select('time_balance, trust_score, negative_balance_allowed, max_negative').eq('id', userId).single();
        
        if (!profile.negative_balance_allowed) {
            // Check if they qualify based on trust score
            if (profile.trust_score < 80) {
                return { success: false, error: 'Trust score too low to borrow credits. Build reputation by completing exchanges first.' };
            }
            // Auto-enable borrowing for trusted users
            await supabase.from('profiles').update({ negative_balance_allowed: true }).eq('id', userId);
            profile.negative_balance_allowed = true;
            profile.max_negative = -5.00;
        }

        let newBalance = Number(profile.time_balance) + amount;
        
        // Can't borrow if it puts you past max negative
        if (newBalance < Number(profile.max_negative)) {
            return { success: false, error: `Borrowing limit reached. You can only borrow up to ${Math.abs(profile.max_negative)} hours.` };
        }

        await logTransaction(userId, amount, 'borrow', 'Borrowed time credits against future earnings');
        return { success: true, balance: newBalance };
        
    } catch (err) {
        console.error('[CreditService] Borrowing failed:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Transfer time credits from requester (via escrow) to provider on exchange completion.
 * Provider gains credits (potentially multiplied), requester already had credits locked in escrow.
 */
export async function transferCredits(exchangeId) {
    if (!supabase) return;

    try {
        const { data: exchange } = await supabase.from('exchanges').select('*, service_listings(category)').eq('id', exchangeId).single();
        if (!exchange) return;

        const providerId = exchange.provider_id;
        const requesterId = exchange.requester_id;
        const baseHours = Number(exchange.hours_exchanged);
        const category = exchange.service_listings?.category || 'other';

        // Get multiplier
        const multiplier = await getScarcityMultiplier(category);
        const earnedHours = Number((baseHours * multiplier).toFixed(2));

        // 1. If escrow was locked, we finalize the spend for the requester.
        // We don't deduct their balance again, we just log the 'spend' and unlock escrow status.
        if (exchange.escrow_locked) {
            await supabase.from('exchanges').update({ escrow_locked: false }).eq('id', exchangeId);
            
            // We log a 'spend' transaction with 0 amount just for the ledger record, 
            // since the actual balance deduction happened during 'escrow_lock'.
            // Or we can just log nothing, the lock is already there. 
            // Let's add a record showing the purpose.
            await supabase.from('credit_transactions').insert({
                user_id: requesterId,
                amount: 0,
                type: 'spend',
                reference_id: exchangeId,
                description: `Finalized spend for completed exchange.`,
                balance_after: 0 // Will be ignored by our logger since we use raw insert here
            });
        } else {
            // If it wasn't locked (e.g. old exchanges or partial), deduct now
            await logTransaction(requesterId, -baseHours, 'spend', `Spent on service exchange`, exchangeId);
        }

        // 2. Give provider the earned hours
        await logTransaction(providerId, earnedHours, 'earn', `Earned from service exchange (${multiplier}x scarcity multiplier)`, exchangeId);

        // 3. Auto-bonus for filling scarce skill demand (multiplier >= 1.3x)
        if (multiplier >= 1.3) {
            const bonusAmount = 0.25;
            await logTransaction(providerId, bonusAmount, 'bonus', `🎁 Scarce skill bonus! ${category} is in high demand (${multiplier}x)`, exchangeId);
            
            // Notify the provider about their bonus
            if (supabase) {
                await supabase.from('notifications').insert({
                    user_id: providerId,
                    type: 'scarcity_bonus',
                    title: '🎁 Scarce Skill Bonus!',
                    body: `You earned a bonus +${bonusAmount}h for completing a ${category} exchange. This skill is in high demand (${multiplier}x)!`,
                    metadata: { exchange_id: exchangeId, category, multiplier }
                });
            }
            console.log(`[CreditService] Scarce skill bonus: +${bonusAmount}h to ${providerId.slice(0,8)}... for ${category} (${multiplier}x)`);
        }

        // 4. Update profile stats and handle referrals
        const { data: provider } = await supabase.from('profiles').select('hours_given, total_exchanges, referred_by, referral_processed').eq('id', providerId).single();
        const { data: requester } = await supabase.from('profiles').select('hours_received, total_exchanges, referred_by, referral_processed').eq('id', requesterId).single();

        await supabase.from('profiles').update({
            hours_given: (provider.hours_given || 0) + baseHours,
            total_exchanges: (provider.total_exchanges || 0) + 1
        }).eq('id', providerId);

        await supabase.from('profiles').update({
            hours_received: (requester.hours_received || 0) + baseHours,
            total_exchanges: (requester.total_exchanges || 0) + 1
        }).eq('id', requesterId);

        console.log(`[CreditService] Transferred ${baseHours}h (earned ${earnedHours}h) from ${requesterId.slice(0,8)}... to ${providerId.slice(0,8)}...`);

        // 5. Process Referrals (Invite-to-Earn: 1 credit per 5 successful referrals)
        async function processReferral(userId, profile) {
            if (!profile.referred_by || profile.referral_processed) return;
            
            // Mark as processed immediately to prevent race conditions
            await supabase.from('profiles').update({ referral_processed: true }).eq('id', userId);
            
            // Get the referrer's profile
            const { data: referrer } = await supabase.from('profiles').select('successful_referrals, total_exchanges').eq('id', profile.referred_by).single();
            if (!referrer) return;

            const newCount = (referrer.successful_referrals || 0) + 1;
            
            // Update referrer count
            await supabase.from('profiles').update({ successful_referrals: newCount }).eq('id', profile.referred_by);
            
            // If it's a multiple of 5 AND they have done at least 1 exchange themselves
            if (newCount % 5 === 0 && (referrer.total_exchanges || 0) >= 1) {
                await applyBonus(profile.referred_by, 1.0, `Invite-to-Earn Reward (${newCount} successful referrals!)`, userId);
                if (supabase) {
                    await supabase.from('notifications').insert({
                        user_id: profile.referred_by,
                        type: 'referral_bonus',
                        title: '🎉 Invite-to-Earn Reward!',
                        body: `You just earned 1.0h for inviting 5 active members. You have ${newCount} total successful referrals!`
                    });
                }
            }
        }

        await processReferral(providerId, provider);
        await processReferral(requesterId, requester);

    } catch (err) {
        console.error('[CreditService] Transfer failed:', err.message);
    }
}
