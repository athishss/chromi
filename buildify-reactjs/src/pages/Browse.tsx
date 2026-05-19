import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AnimatedContent from '../components/animated-content';
import SectionTitle from '../components/section-title';
import ResourceCalendarModal from '../components/ResourceCalendarModal';
import RequestExchangeModal from '../components/RequestExchangeModal';
import type { IServiceListing, IMatchSuggestion, ServiceCategory } from '../../types';
import { CATEGORY_LABELS, CATEGORY_KEYS } from '../../types';
import { SearchIcon, ClockIcon, StarIcon, ArrowRightIcon, SparkleIcon, FilterIcon, BrainCircuitIcon, TrendingUpIcon, CalendarIcon, ShuffleIcon, UsersIcon, CrownIcon, ZapIcon } from 'lucide-react';
import MarketRatesSidebar from '../components/MarketRatesSidebar';
import GoLiveModal from '../components/GoLiveModal';

export default function Browse() {
    const [listings, setListings] = useState<IServiceListing[]>([]);
    const [matches, setMatches] = useState<IMatchSuggestion[]>([]);
    const [fallbacks, setFallbacks] = useState<IMatchSuggestion[]>([]);
    const [multipliers, setMultipliers] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'offer' | 'request'>('all');
    const [calendarModal, setCalendarModal] = useState<{isOpen: boolean, listingId: string, title: string}>({ isOpen: false, listingId: '', title: '' });
    const [requestModal, setRequestModal] = useState<{isOpen: boolean, listing: IServiceListing | null}>({ isOpen: false, listing: null });
    const [liveUsers, setLiveUsers] = useState<any[]>([]);
    const [goLiveModal, setGoLiveModal] = useState(false);
    const [goingLive, setGoingLive] = useState(false);
    const { getAccessToken, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const [listingsData, matchData, multipliersData, liveData] = await Promise.all([
                api.getListings(getAccessToken),
                api.getMatchSuggestions(getAccessToken),
                api.getMultipliers(getAccessToken),
                api.getLiveUsers(getAccessToken).catch(() => [])
            ]);
            setListings(listingsData);
            setMultipliers(multipliersData || {});
            setLiveUsers(liveData || []);
            // Handle both old (array) and new ({ matches, fallbacks }) response shapes
            if (Array.isArray(matchData)) {
                setMatches(matchData);
            } else {
                setMatches(matchData?.matches || []);
                setFallbacks(matchData?.fallbacks || []);
            }
        } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load'); }
        finally { setLoading(false); }
    }

    function handleRequestExchangeClick(listing: IServiceListing) {
        // Open modal for resources, group sessions, or premium-enabled listings
        if (listing.is_resource || (listing.max_participants && listing.max_participants > 1) || listing.premium_rate_allowed) {
            setRequestModal({ isOpen: true, listing });
        } else {
            executeExchangeRequest(listing.id, {});
        }
    }

    async function executeExchangeRequest(listingId: string, data: { collateral_item?: string; collateral_photo_url?: string; is_private?: boolean }) {
        try {
            const exchange = await api.requestExchange({ listing_id: listingId, ...data }, getAccessToken);
            navigate(`/exchange/${exchange.id}`);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to request exchange'); }
    }

    const filtered = listings.filter(l => {
        if (l.user_id === user?.id) return false;
        if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
        if (typeFilter !== 'all' && l.type !== typeFilter) return false;
        if (search && !l.title.toLowerCase().includes(search.toLowerCase()) && !l.description.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen pt-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent)]" /></div>;
    }

    return (
        <section className="px-4 md:px-16 lg:px-24 xl:px-32 pt-24 pb-16">
            <div className="max-w-7xl mx-auto">
                <SectionTitle dir="left" icon={SearchIcon} title="Browse Services" subtitle="Discover skills and services available in your community." />

                {error && <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-xl p-3 mt-4 mb-6 text-[var(--error-text)] text-sm">{error}</div>}

                {/* Live Available Now Section */}
                <div className="mt-8 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <h2 className="font-urbanist text-lg font-semibold">Available Now</h2>
                            {liveUsers.length > 0 && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                    {liveUsers.length} live
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => setGoLiveModal(true)}
                            className="py-2 px-5 bg-emerald-500 text-white rounded-full text-sm font-medium flex items-center gap-2 hover:bg-emerald-600 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
                        >
                            <ZapIcon size={14} /> Go Live
                        </button>
                    </div>

                    {liveUsers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {liveUsers.map((u, i) => {
                                const timeLeft = u.live_until ? Math.max(0, Math.round((new Date(u.live_until).getTime() - Date.now()) / 60000)) : 0;
                                const hoursLeft = Math.floor(timeLeft / 60);
                                const minsLeft = timeLeft % 60;
                                // Only show a listing if it matches the live category — don't show unrelated ones
                                const matchingListing = listings.find(l => l.user_id === u.id && l.category === u.live_category);
                                return (
                                    <AnimatedContent key={u.id} delay={i * 0.06}
                                        className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 shadow-[var(--card-shadow)]">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                                                {u.full_name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <button
                                                    onClick={() => navigate(`/profile/${u.id}`)}
                                                    className="font-medium text-sm truncate hover:text-emerald-400 hover:underline transition-colors cursor-pointer block"
                                                >
                                                    {u.full_name || 'Anonymous'}
                                                </button>
                                                <p className="text-xs text-emerald-400">{CATEGORY_LABELS[u.live_category as ServiceCategory] || u.live_category}</p>
                                            </div>
                                            <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                                                <ClockIcon size={10} className="inline mr-1" />{hoursLeft > 0 ? `${hoursLeft}h ` : ''}{minsLeft}m left
                                            </span>
                                        </div>
                                        {u.live_description && (
                                            <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">{u.live_description}</p>
                                        )}
                                        {Number(u.rating) > 0 && (
                                            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 mb-3">
                                                <StarIcon size={11} className="text-amber-400" />{Number(u.rating).toFixed(1)}
                                            </span>
                                        )}
                                        {matchingListing && (
                                            <div className="mb-2 p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                                                <p className="text-xs font-medium truncate">{matchingListing.title}</p>
                                                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{matchingListing.estimated_hours}h • {CATEGORY_LABELS[matchingListing.category]}</p>
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            {matchingListing ? (
                                                <button
                                                    onClick={() => handleRequestExchangeClick(matchingListing)}
                                                    className="flex-1 py-2 bg-emerald-500 text-white rounded-full text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-emerald-600 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
                                                >
                                                    <ArrowRightIcon size={12} /> Request Exchange
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => navigate(`/profile/${u.id}`)}
                                                    className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium hover:bg-emerald-500/30 transition-colors cursor-pointer"
                                                >
                                                    View Profile
                                                </button>
                                            )}
                                        </div>
                                    </AnimatedContent>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)]">
                            <p className="text-sm text-[var(--text-muted)]">No one is live right now. Be the first!</p>
                        </div>
                    )}
                </div>

                {/* Recommended Matches */}
                {matches.length > 0 && (
                    <div className="mt-8 mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <BrainCircuitIcon size={18} className="text-[var(--accent)]" />
                            <h2 className="font-urbanist text-lg font-semibold">Recommended for You</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {matches.slice(0, 3).map((match, i) => (
                                <AnimatedContent key={match.listing.id} delay={i * 0.08}
                                    className="p-5 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 shadow-[var(--card-shadow)]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
                                            <SparkleIcon size={10} className="inline mr-1" />{Math.round(match.match_score)}% match
                                        </span>
                                        {match.credit_multiplier > 1 && (
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400">
                                                <TrendingUpIcon size={10} className="inline mr-0.5" />{match.credit_multiplier}x
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-medium text-sm mt-2">{match.listing.title}</h3>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">{CATEGORY_LABELS[match.listing.category]}</p>
                                    <p className="text-xs text-[var(--text-muted)] mt-1 italic">{match.match_reason}</p>
                                    {match.is_multi_hop && (
                                        <p className="text-[10px] text-[var(--accent)] mt-2 font-semibold uppercase tracking-wider">🔗 Multi-hop exchange path available</p>
                                    )}
                                    <button onClick={() => handleRequestExchangeClick(match.listing)}
                                        className="w-full mt-3 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-sm font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer">
                                        <ArrowRightIcon size={14} /> Request Exchange
                                    </button>
                                </AnimatedContent>
                            ))}
                        </div>
                    </div>
                )}

                {/* Fallback Suggestions (Alternative Matches) */}
                {fallbacks.length > 0 && (
                    <div className="mt-8 mb-4">
                        <div className="flex items-center gap-2 mb-4">
                            <ShuffleIcon size={18} className="text-violet-400" />
                            <h2 className="font-urbanist text-lg font-semibold">Alternative Suggestions</h2>
                            <span className="text-xs text-[var(--text-muted)]">(related skills that might help)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {fallbacks.slice(0, 3).map((match, i) => (
                                <AnimatedContent key={match.listing.id} delay={i * 0.08}
                                    className="p-5 rounded-xl border border-violet-500/20 bg-violet-500/5 shadow-[var(--card-shadow)]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-400">
                                            <ShuffleIcon size={10} className="inline mr-1" />{Math.round(match.match_score)}% related
                                        </span>
                                    </div>
                                    <h3 className="font-medium text-sm mt-2">{match.listing.title}</h3>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">{CATEGORY_LABELS[match.listing.category]}</p>
                                    <p className="text-xs text-[var(--text-muted)] mt-1 italic">{match.match_reason}</p>
                                    <button onClick={() => handleRequestExchangeClick(match.listing)}
                                        className="w-full mt-3 py-2 bg-violet-600 text-white rounded-full text-sm font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer">
                                        <ArrowRightIcon size={14} /> Request Exchange
                                    </button>
                                </AnimatedContent>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search & Filters */}
                <div className="mt-8 flex flex-col md:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services..."
                            className="w-full pl-10 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all" />
                    </div>
                    <div className="flex gap-3">
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as ServiceCategory | 'all')}
                            className="px-4 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-sm cursor-pointer appearance-none">
                            <option value="all">All Categories</option>
                            {CATEGORY_KEYS.map(key => (<option key={key} value={key}>{CATEGORY_LABELS[key]}</option>))}
                        </select>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | 'offer' | 'request')}
                            className="px-4 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-sm cursor-pointer appearance-none">
                            <option value="all">All Types</option>
                            <option value="offer">🤝 Offers</option>
                            <option value="request">🙋 Requests</option>
                        </select>
                    </div>
                </div>

                {/* Listings Grid */}
                {filtered.length === 0 ? (
                    <AnimatedContent className="flex flex-col items-center justify-center py-20 text-center">
                        <FilterIcon size={36} className="text-[var(--text-muted)] mb-4" />
                        <h2 className="font-urbanist text-xl font-semibold mb-2">No listings found</h2>
                        <p className="text-[var(--text-secondary)] text-sm">Try adjusting your filters or search terms.</p>
                    </AnimatedContent>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map((listing, i) => (
                            <AnimatedContent key={listing.id} delay={i * 0.06}
                                className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--card-shadow)] hover:shadow-[var(--card-hover-shadow)] transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${listing.type === 'offer' ? 'bg-[var(--success-bg)] text-[var(--success-text)]' : 'bg-blue-900/30 text-blue-400'}`}>
                                            {listing.type === 'offer' ? 'Offering' : 'Requesting'}
                                        </span>
                                        {listing.max_participants && listing.max_participants > 1 && (
                                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-900/20 text-blue-400 flex items-center gap-1">
                                                <UsersIcon size={10} /> Group
                                            </span>
                                        )}
                                        {listing.premium_rate_allowed && (
                                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-900/20 text-amber-400 flex items-center gap-1">
                                                <CrownIcon size={10} /> Private
                                            </span>
                                        )}
                                    </div>
                                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                        <ClockIcon size={12} />{listing.estimated_hours}h
                                    </span>
                                </div>
                                <h3 className="font-medium text-base mb-1">{listing.title}</h3>
                                <p className="text-xs text-[var(--text-secondary)] mb-2">{CATEGORY_LABELS[listing.category]}</p>
                                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">{listing.description}</p>
                                <div className="flex items-center gap-2 mb-4 text-xs text-[var(--text-muted)]">
                                    {listing.user_name && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${listing.user_id}`); }}
                                            className="hover:text-[var(--accent)] hover:underline transition-colors cursor-pointer"
                                        >
                                            {listing.user_name}
                                        </button>
                                    )}
                                    {listing.user_rating !== undefined && listing.user_rating > 0 && (
                                        <span className="flex items-center gap-0.5"><StarIcon size={11} className="text-amber-400" />{listing.user_rating.toFixed(1)}</span>
                                    )}
                                </div>
                                
                                {listing.is_resource && (
                                    <button onClick={() => setCalendarModal({ isOpen: true, listingId: listing.id, title: listing.title })}
                                        className="w-full mb-2 py-1.5 px-4 bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] rounded-full text-xs font-medium flex items-center justify-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer">
                                        <CalendarIcon size={14} /> View Availability
                                    </button>
                                )}

                                <button onClick={() => handleRequestExchangeClick(listing)}
                                    className="w-full py-2 px-4 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-sm font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer">
                                    <ArrowRightIcon size={14} /> Request Exchange
                                </button>
                            </AnimatedContent>
                        ))}
                    </div>
                )}
            </div>

            <ResourceCalendarModal 
                isOpen={calendarModal.isOpen} 
                listingId={calendarModal.listingId} 
                listingTitle={calendarModal.title} 
                onClose={() => setCalendarModal({ ...calendarModal, isOpen: false })} 
            />
            {requestModal.listing && (
                <RequestExchangeModal
                    isOpen={requestModal.isOpen}
                    onClose={() => setRequestModal({ isOpen: false, listing: null })}
                    onSubmit={(data) => {
                        setRequestModal({ isOpen: false, listing: null });
                        executeExchangeRequest(requestModal.listing!.id, data);
                    }}
                    listingTitle={requestModal.listing.title}
                    resourceDeposit={requestModal.listing.resource_deposit || 0}
                    maxParticipants={requestModal.listing.max_participants || 1}
                    premiumRateAllowed={requestModal.listing.premium_rate_allowed || false}
                    estimatedHours={requestModal.listing.estimated_hours}
                />
            )}
            <MarketRatesSidebar multipliers={multipliers} />
            <GoLiveModal
                isOpen={goLiveModal}
                onClose={() => setGoLiveModal(false)}
                loading={goingLive}
                onGoLive={async (data) => {
                    setGoingLive(true);
                    try {
                        await api.goLive(data, getAccessToken);
                        setGoLiveModal(false);
                        // Refresh live users
                        const liveData = await api.getLiveUsers(getAccessToken).catch(() => []);
                        setLiveUsers(liveData || []);
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : 'Failed to go live');
                    } finally {
                        setGoingLive(false);
                    }
                }}
            />
        </section>
    );
}
