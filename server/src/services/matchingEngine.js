/**
 * Chromi Matching Engine (Advanced)
 * 
 * Generates intelligent match suggestions based on:
 * - Skill-to-need alignment
 * - Trust-weighted scoring
 * - Dynamic credit multipliers
 * - Multi-hop path detection
 * - Reverse matching
 * - Priority urgency
 */

import { getScarcityMultiplier } from './creditService.js';

export async function generateMatches(profile, myListings, allListings) {
    if (!allListings || allListings.length === 0) return [];

    const myOffers = myListings.filter(l => l.type === 'offer').map(l => l.category);
    const myRequests = myListings.filter(l => l.type === 'request').map(l => l.category);
    const mySkills = profile?.skills || [];

    // Pre-fetch all multipliers
    const multipliers = {};
    for (const l of allListings) {
        if (!multipliers[l.category]) {
            multipliers[l.category] = await getScarcityMultiplier(l.category);
        }
    }

    const scored = allListings.map(listing => {
        let score = 50; 
        let reason = '';
        const multiplier = multipliers[listing.category];

        // 1. Category Alignment
        if (listing.type === 'request' && myOffers.includes(listing.category)) {
            score += 25;
            reason = 'Matches your offered skills';
        } else if (listing.type === 'offer' && myRequests.includes(listing.category)) {
            score += 25;
            reason = 'Matches what you need';
        }

        // 2. Skill Keyword Alignment
        if (mySkills.some(s => listing.title.toLowerCase().includes(s.toLowerCase()) ||
            listing.description.toLowerCase().includes(s.toLowerCase()))) {
            score += 15;
            reason = reason || 'Related to your skills';
        }

        // 3. Trust Score Weighting
        const trustScore = listing.profiles?.trust_score || 100;
        if (trustScore >= 95) score += 15;
        else if (trustScore >= 80) score += 10;
        else if (trustScore < 50) score -= 20;

        // 4. Community/Campus Proximity
        const listingCampus = listing.profiles?.campus || '';
        if (profile?.campus && listingCampus && profile.campus.toLowerCase() === listingCampus.toLowerCase()) {
            score += 15;
            reason = reason || 'In your campus/community';
        }

        // 5. Urgency Boost
        if (listing.priority === 'urgent') {
            score += 20;
            reason = 'Urgent request';
        }

        // 6. Partial Fulfillment check (if they need more hours than typical, or it's a request)
        let isPartialCandidate = false;
        if (listing.type === 'request' && listing.estimated_hours > 5) {
            isPartialCandidate = true;
        }

        score = Math.min(score, 99);
        if (!reason) reason = 'Available in your area';

        return {
            listing: {
                ...listing,
                user_name: listing.profiles?.full_name || '',
                user_rating: listing.profiles?.rating || 0,
                trust_score: listing.profiles?.trust_score || 100,
                is_verified: listing.profiles?.is_verified || false,
                profiles: undefined
            },
            match_score: score,
            match_reason: reason,
            credit_multiplier: multiplier,
            is_multi_hop: false,
            hop_path: null,
            is_partial_candidate: isPartialCandidate
        };
    });

    // Detect Multi-Hop (Simulated 2-hop)
    // A -> B -> C -> A
    if (myOffers.length > 0 && myRequests.length > 0) {
        const potentialIntermediaries = scored.filter(s =>
            s.listing.type === 'offer' &&
            !myRequests.includes(s.listing.category) &&
            !myOffers.includes(s.listing.category)
        );
        potentialIntermediaries.slice(0, 2).forEach(s => {
            s.is_multi_hop = true;
            s.match_score = Math.min(s.match_score + 10, 99);
            s.match_reason = 'Multi-hop exchange path found';
            s.hop_path = ['You', s.listing.user_name || 'Member', 'Third Party'];
        });
    }

    return scored.sort((a, b) => b.match_score - a.match_score).slice(0, 20);
}

/**
 * Generate reverse matches: people who need what you offer
 */
export async function generateReverseMatches(profile, myListings, allListings) {
    if (!allListings || allListings.length === 0) return [];
    
    const myOffers = myListings.filter(l => l.type === 'offer').map(l => l.category);
    if (myOffers.length === 0) return [];

    // Filter to requests that match my offers
    const matchingRequests = allListings.filter(l => l.type === 'request' && myOffers.includes(l.category));

    return matchingRequests.map(listing => {
        return {
            listing: {
                ...listing,
                user_name: listing.profiles?.full_name || '',
                user_rating: listing.profiles?.rating || 0,
                trust_score: listing.profiles?.trust_score || 100,
                is_verified: listing.profiles?.is_verified || false,
                profiles: undefined
            },
            match_score: 90,
            match_reason: 'Needs your offered skill',
            credit_multiplier: 1.0,
            is_multi_hop: false,
            hop_path: null
        };
    });
}

/**
 * Category adjacency map for intelligent fallback suggestions.
 * When no direct match exists, suggest providers in related categories.
 */
const CATEGORY_ADJACENCY = {
    tutoring: ['language', 'writing', 'tech'],
    repair: ['tech', 'gardening'],
    design: ['photography', 'writing', 'tech'],
    cooking: ['gardening', 'fitness'],
    music: ['tutoring', 'language'],
    tech: ['design', 'tutoring', 'repair'],
    fitness: ['cooking', 'gardening'],
    language: ['tutoring', 'writing', 'music'],
    photography: ['design', 'tech'],
    writing: ['tutoring', 'language', 'design'],
    gardening: ['repair', 'fitness', 'cooking'],
    other: []
};

/**
 * Generate fallback match suggestions when no direct matches are found.
 * Looks at adjacent/related categories and suggests providers with transferable skills.
 */
export async function generateFallbackMatches(profile, myListings, allListings) {
    if (!allListings || allListings.length === 0) return [];

    const myRequests = myListings.filter(l => l.type === 'request').map(l => l.category);
    if (myRequests.length === 0) return [];

    // Find adjacent categories for what the user needs
    const adjacentCategories = new Set();
    for (const req of myRequests) {
        const adjacent = CATEGORY_ADJACENCY[req] || [];
        adjacent.forEach(cat => adjacentCategories.add(cat));
    }

    // Remove categories the user already has direct matches for
    myRequests.forEach(cat => adjacentCategories.delete(cat));

    if (adjacentCategories.size === 0) return [];

    // Find offers in adjacent categories
    const fallbacks = allListings
        .filter(l => l.type === 'offer' && adjacentCategories.has(l.category))
        .map(listing => {
            // Find which of the user's requests this is adjacent to
            const relatedTo = myRequests.find(req =>
                (CATEGORY_ADJACENCY[req] || []).includes(listing.category)
            );

            const trustScore = listing.profiles?.trust_score || 100;
            let score = 40; // Base fallback score (lower than direct matches)
            if (trustScore >= 90) score += 10;
            if (profile?.campus && listing.profiles?.campus === profile.campus) score += 10;

            return {
                listing: {
                    ...listing,
                    user_name: listing.profiles?.full_name || '',
                    user_rating: listing.profiles?.rating || 0,
                    trust_score: trustScore,
                    is_verified: listing.profiles?.is_verified || false,
                    profiles: undefined
                },
                match_score: Math.min(score, 65),
                match_reason: `Alternative: ${listing.category} skills may help with your ${relatedTo} needs`,
                credit_multiplier: 1.0,
                is_multi_hop: false,
                hop_path: null,
                is_fallback: true
            };
        });

    return fallbacks.sort((a, b) => b.match_score - a.match_score).slice(0, 6);
}
