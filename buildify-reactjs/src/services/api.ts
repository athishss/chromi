import supabase from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

type TokenGetter = () => Promise<string | null>;

async function request(path: string, options: RequestInit = {}, getAccessToken: TokenGetter, _isRetry = false): Promise<any> {
    const token = await getAccessToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
    };

    let response: Response;
    try {
        response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch (networkErr) {
        // Network error (server not running, no internet, DNS failure, etc.)
        if (!_isRetry) {
            // Wait briefly and retry once for transient network blips
            await new Promise(r => setTimeout(r, 1500));
            return request(path, options, getAccessToken, true);
        }
        throw new Error('Server unavailable — please make sure the backend is running on port 3001.');
    }

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));

        // On 401, try refreshing the token and retry once
        if (response.status === 401 && !_isRetry) {
            const { data: { session }, error: refreshErr } = await supabase.auth.refreshSession();
            if (!refreshErr && session) {
                return request(path, options, getAccessToken, true);
            }
        }

        throw new Error(body.error || body.errors?.join(', ') || `Request failed: ${response.status}`);
    }
    if (response.status === 204) return null;
    return response.json();
}

export const api = {
    // ── Listings ───────────────────────────────────
    getListings(t: TokenGetter) { return request('/listings', {}, t); },
    getMyListings(t: TokenGetter) { return request('/listings/mine', {}, t); },
    createListing(data: unknown, t: TokenGetter) { return request('/listings', { method: 'POST', body: JSON.stringify(data) }, t); },
    deleteListing(id: string, t: TokenGetter) { return request(`/listings/${id}`, { method: 'DELETE' }, t); },

    // ── Exchanges ─────────────────────────────────
    requestExchange(data: { listing_id: string; collateral_item?: string; collateral_photo_url?: string }, t: TokenGetter) { return request('/exchanges', { method: 'POST', body: JSON.stringify(data) }, t); },
    getMyExchanges(t: TokenGetter) { return request('/exchanges', {}, t); },
    getExchangeDetail(id: string, t: TokenGetter) { return request(`/exchanges/${id}`, {}, t); },
    updateExchangeStatus(id: string, status: string, t: TokenGetter) { return request(`/exchanges/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, t); },
    submitReview(id: string, data: { rating: number; comment: string }, t: TokenGetter) { return request(`/exchanges/${id}/review`, { method: 'POST', body: JSON.stringify(data) }, t); },

    // ── Profile ───────────────────────────────────
    getProfile(t: TokenGetter) { return request('/profile', {}, t); },
    updateProfile(data: unknown, t: TokenGetter) { return request('/profile', { method: 'PUT', body: JSON.stringify(data) }, t); },
    getRecommendations(t: TokenGetter) { return request('/profile/recommendations', {}, t); },
    getPublicProfile(userId: string, t: TokenGetter) { return request(`/profile/${userId}`, {}, t); },
    goLive(data: { category: string; description?: string; duration_hours?: number }, t: TokenGetter) { return request('/profile/go-live', { method: 'POST', body: JSON.stringify(data) }, t); },
    goOffline(t: TokenGetter) { return request('/profile/go-offline', { method: 'POST' }, t); },
    getLiveUsers(t: TokenGetter) { return request('/profile/live', {}, t); },

    // ── Rewards ───────────────────────────────────
    getRewards(t: TokenGetter) { return request('/rewards/status', {}, t); },
    claimReward(rewardKey: string, t: TokenGetter) { return request('/rewards/claim', { method: 'POST', body: JSON.stringify({ reward_key: rewardKey }) }, t); },

    // ── Matching ──────────────────────────────────
    getMatchSuggestions(t: TokenGetter) { return request('/match', {}, t); },
    getReverseMatches(t: TokenGetter) { return request('/match/reverse', {}, t); },

    // ── Credits ───────────────────────────────────
    getCredits(t: TokenGetter) { return request('/credits', {}, t); },
    getMultipliers(t: TokenGetter) { return request('/credits/multipliers', {}, t); },
    borrowCredits(amount: number, t: TokenGetter) { return request('/credits/borrow', { method: 'POST', body: JSON.stringify({ amount }) }, t); },

    // ── Staking & DeFi ────────────────────────────
    getStakes(t: TokenGetter) { return request('/staking', {}, t); },
    stakeCredits(data: { amount: number; lock_period: string; auto_compound: boolean }, t: TokenGetter) { return request('/staking/deposit', { method: 'POST', body: JSON.stringify(data) }, t); },
    withdrawStake(id: string, t: TokenGetter) { return request(`/staking/withdraw/${id}`, { method: 'POST' }, t); },

    // ── Notifications ─────────────────────────────
    getNotifications(t: TokenGetter) { return request('/notifications', {}, t); },
    getUnreadCount(t: TokenGetter) { return request('/notifications/unread-count', {}, t); },
    markNotificationRead(id: string, t: TokenGetter) { return request(`/notifications/${id}/read`, { method: 'PATCH' }, t); },
    markAllNotificationsRead(t: TokenGetter) { return request('/notifications/read-all', { method: 'PATCH' }, t); },

    // ── Disputes ──────────────────────────────────
    getDisputes(t: TokenGetter) { return request('/disputes', {}, t); },
    fileDispute(data: { exchange_id: string; against_user_id: string; reason: string }, t: TokenGetter) { return request('/disputes', { method: 'POST', body: JSON.stringify(data) }, t); },

    // ── Endorsements ──────────────────────────────
    getEndorsements(userId: string, t: TokenGetter) { return request(`/endorsements/${userId}`, {}, t); },
    endorseUser(data: { endorsed_id: string; skill: string; comment?: string }, t: TokenGetter) { return request('/endorsements', { method: 'POST', body: JSON.stringify(data) }, t); },

    // ── Schedule ──────────────────────────────────
    getSchedule(t: TokenGetter) { return request('/schedule', {}, t); },
    scheduleExchange(exchangeId: string, data: { start_time: string; end_time: string }, t: TokenGetter) { return request(`/schedule/${exchangeId}`, { method: 'POST', body: JSON.stringify(data) }, t); },

    // ── Waitlist ──────────────────────────────────
    getWaitlist(t: TokenGetter) { return request('/waitlist', {}, t); },
    joinWaitlist(data: { category?: string; listing_id?: string }, t: TokenGetter) { return request('/waitlist', { method: 'POST', body: JSON.stringify(data) }, t); },
    leaveWaitlist(id: string, t: TokenGetter) { return request(`/waitlist/${id}`, { method: 'DELETE' }, t); },

    // ── Resources ─────────────────────────────────
    getResources(t: TokenGetter) { return request('/resources', {}, t); },
    getResourceCalendar(id: string, t: TokenGetter) { return request(`/resources/${id}/calendar`, {}, t); },

    // ── Community ─────────────────────────────────
    getCommunities(t: TokenGetter) { return request('/communities', {}, t); },
    createCommunity(data: { name: string; campus?: string; description?: string }, t: TokenGetter) { return request('/communities', { method: 'POST', body: JSON.stringify(data) }, t); },
    joinCommunity(id: string, t: TokenGetter) { return request(`/communities/${id}/join`, { method: 'POST' }, t); },
    getLeaderboard(t: TokenGetter) { return request('/communities/leaderboard', {}, t); },

    // ── Analytics ─────────────────────────────────
    getDemandHeatmap(t: TokenGetter) { return request('/analytics/demand', {}, t); },
    getSupplyHeatmap(t: TokenGetter) { return request('/analytics/supply', {}, t); },
    getSystemMetrics(t: TokenGetter) { return request('/analytics/system', {}, t); },

    // ── Chatbot ───────────────────────────────────
    sendChatMessage(message: string, history: any[], t: TokenGetter) { return request('/chat', { method: 'POST', body: JSON.stringify({ message, history }) }, t); },

    // ── Exchange Messages ─────────────────────────
    getMessages(exchangeId: string, t: TokenGetter) { return request(`/messages/${exchangeId}`, {}, t); },
    sendMessage(exchangeId: string, content: string, t: TokenGetter) { return request(`/messages/${exchangeId}`, { method: 'POST', body: JSON.stringify({ content }) }, t); },

    // ── Admin ─────────────────────────────────────
    adminGetStats(t: TokenGetter) { return request('/admin/stats', {}, t); },
    adminGetUsers(search: string, t: TokenGetter) { return request(`/admin/users?search=${encodeURIComponent(search)}`, {}, t); },
    adminUpdateCredits(userId: string, amount: number, reason: string, t: TokenGetter) { return request(`/admin/users/${userId}/credits`, { method: 'PATCH', body: JSON.stringify({ amount, reason }) }, t); },
    adminBanUser(userId: string, t: TokenGetter) { return request(`/admin/users/${userId}/ban`, { method: 'PATCH' }, t); },
    adminUnbanUser(userId: string, t: TokenGetter) { return request(`/admin/users/${userId}/unban`, { method: 'PATCH' }, t); },
    adminGetExchanges(t: TokenGetter) { return request('/admin/exchanges', {}, t); },
};
