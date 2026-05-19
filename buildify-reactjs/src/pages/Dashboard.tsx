import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AnimatedContent from '../components/animated-content';
import SectionTitle from '../components/section-title';
import type { IServiceListing, IExchange } from '../../types';
import { CATEGORY_LABELS, EXCHANGE_STATUS_LABELS } from '../../types';
import {
    PlusIcon, ClockIcon, Trash2Icon, ArrowRightIcon, SearchIcon,
    LayoutDashboardIcon, TrendingUpIcon, TrendingDownIcon, StarIcon,
    CheckCircle2Icon, ListPlusIcon, HandshakeIcon, SparklesIcon,
    ListIcon, XIcon, LightbulbIcon
} from 'lucide-react';

export default function Dashboard() {
    const [listings, setListings] = useState<IServiceListing[]>([]);
    const [exchanges, setExchanges] = useState<IExchange[]>([]);
    const [timeBalance, setTimeBalance] = useState(2.0);
    const [stats, setStats] = useState({ given: 0, received: 0, completion: 100, rating: 0 });
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [waitlist, setWaitlist] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { getAccessToken } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { loadDashboard(); }, []);

    async function loadDashboard() {
        try {
            const results = await Promise.allSettled([
                api.getMyListings(getAccessToken),
                api.getMyExchanges(getAccessToken),
                api.getProfile(getAccessToken),
                api.getRecommendations(getAccessToken),
                api.getWaitlist(getAccessToken)
            ]);

            const [listingsRes, exchangesRes, profileRes, recsRes, waitlistRes] = results;

            if (listingsRes.status === 'fulfilled') setListings(listingsRes.value || []);
            if (exchangesRes.status === 'fulfilled') setExchanges(exchangesRes.value || []);
            if (recsRes.status === 'fulfilled') setRecommendations(recsRes.value?.recommendations || []);
            if (waitlistRes.status === 'fulfilled') setWaitlist(waitlistRes.value || []);
            if (profileRes.status === 'fulfilled' && profileRes.value) {
                setTimeBalance(profileRes.value.time_balance ?? 2.0);
                setStats({
                    given: profileRes.value.hours_given ?? 0,
                    received: profileRes.value.hours_received ?? 0,
                    completion: profileRes.value.completion_score ?? 100,
                    rating: profileRes.value.rating ?? 0
                });
            }

            // Show error only if all critical calls failed
            const criticalFailed = [listingsRes, exchangesRes, profileRes].filter(r => r.status === 'rejected');
            if (criticalFailed.length === 3) {
                const reason = (criticalFailed[0] as PromiseRejectedResult).reason;
                setError(reason instanceof Error ? reason.message : 'Failed to load dashboard. Is the server running?');
            }
        }
        catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load dashboard'); }
        finally { setLoading(false); }
    }

    async function handleDeleteListing(id: string) {
        if (!confirm('Delete this listing?')) return;
        try { await api.deleteListing(id, getAccessToken); setListings(prev => prev.filter(l => l.id !== id)); }
        catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to delete'); }
    }

    async function handleLeaveWaitlist(id: string) {
        try { await api.leaveWaitlist(id, getAccessToken); setWaitlist(prev => prev.filter(w => w.id !== id)); }
        catch { /* ignore */ }
    }

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen pt-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent)]" /></div>;
    }

    const pendingExchanges = exchanges.filter(e => ['pending', 'accepted', 'in_progress'].includes(e.status));

    return (
        <section className="px-4 md:px-16 lg:px-24 xl:px-32 pt-24 pb-16">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <SectionTitle dir="left" icon={LayoutDashboardIcon} title="Dashboard" subtitle="Manage your services, exchanges, and time credits." />
                    <div className="flex gap-3">
                        <Link to="/offer" className="py-2.5 px-6 bg-[var(--accent)] text-[var(--accent-text)] rounded-full flex items-center gap-2 text-sm hover:opacity-90 transition-opacity shrink-0" id="new-listing-btn">
                            <PlusIcon size={16} /> Offer Service
                        </Link>
                        <Link to="/browse" className="py-2.5 px-6 border border-[var(--border)] text-[var(--text-secondary)] rounded-full flex items-center gap-2 text-sm hover:border-[var(--border-strong)] transition-colors shrink-0" id="browse-btn">
                            <SearchIcon size={16} /> Browse
                        </Link>
                    </div>
                </div>

                {error && <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-xl p-3 mb-6 text-[var(--error-text)] text-sm flex items-center justify-between gap-3">
                    <span>{error}</span>
                    <button onClick={() => { setError(''); setLoading(true); loadDashboard(); }} className="shrink-0 px-4 py-1.5 bg-[var(--error-text)] text-white rounded-full text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer">Retry</button>
                </div>}

                {/* Time Balance Hero Card */}
                <AnimatedContent className="bg-[var(--accent)] rounded-2xl p-8 md:p-10 mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <p className="text-xs uppercase tracking-widest text-[var(--accent-text)]/60 font-semibold mb-1">Your Time Balance</p>
                            <h2 className="font-urbanist text-5xl md:text-6xl font-bold text-[var(--accent-text)]" id="time-balance">
                                {timeBalance.toFixed(1)} <span className="text-2xl font-medium">hrs</span>
                            </h2>
                            <p className="text-[var(--accent-text)]/60 mt-1 text-sm">Available to spend on services</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { icon: TrendingUpIcon, label: 'Given', value: `${stats.given}h` },
                                { icon: TrendingDownIcon, label: 'Received', value: `${stats.received}h` },
                                { icon: CheckCircle2Icon, label: 'Completion', value: `${stats.completion}%` },
                                { icon: StarIcon, label: 'Rating', value: stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A' },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-[var(--accent-text)]/10 backdrop-blur rounded-xl p-3 text-center min-w-[80px]">
                                    <stat.icon size={16} className="text-[var(--accent-text)]/70 mx-auto mb-1" />
                                    <p className="font-urbanist text-lg font-bold text-[var(--accent-text)]">{stat.value}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-[var(--accent-text)]/50">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </AnimatedContent>

                {/* Smart Insights Panel */}
                {(recommendations.length > 0 || waitlist.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {/* AI Recommendations */}
                        {recommendations.length > 0 && (
                            <AnimatedContent className="p-5 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5">
                                <div className="flex items-center gap-2 mb-3">
                                    <LightbulbIcon size={16} className="text-amber-400" />
                                    <h3 className="font-urbanist text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">AI Insights</h3>
                                </div>
                                <div className="space-y-2">
                                    {recommendations.map((rec, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                                            <SparklesIcon size={12} className="text-[var(--accent)] mt-1 shrink-0" />
                                            <span>{rec}</span>
                                        </div>
                                    ))}
                                </div>
                            </AnimatedContent>
                        )}

                        {/* Active Waitlist */}
                        {waitlist.length > 0 && (
                            <AnimatedContent delay={0.06} className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <ListIcon size={16} className="text-violet-400" />
                                    <h3 className="font-urbanist text-sm font-semibold uppercase tracking-wider text-violet-400">Your Waitlist</h3>
                                </div>
                                <div className="space-y-2">
                                    {waitlist.map((w: any) => (
                                        <div key={w.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)]">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {w.service_listings?.title || CATEGORY_LABELS[w.category as keyof typeof CATEGORY_LABELS] || w.category}
                                                </p>
                                                <p className="text-[10px] text-[var(--text-muted)]">
                                                    {w.notified_at ? '✅ Match found!' : '⏳ Waiting for a match...'}
                                                </p>
                                            </div>
                                            <button onClick={() => handleLeaveWaitlist(w.id)}
                                                className="p-1.5 rounded-lg hover:bg-[var(--error-bg)] hover:text-[var(--error-text)] transition-colors cursor-pointer" title="Leave waitlist">
                                                <XIcon size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </AnimatedContent>
                        )}
                    </div>
                )}

                {/* Pending Exchanges */}
                {pendingExchanges.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <HandshakeIcon size={18} />
                            <h2 className="font-urbanist text-xl font-semibold">Active Exchanges</h2>
                            <span className="bg-[var(--accent)] text-[var(--accent-text)] text-xs font-bold px-2 py-0.5 rounded-full">{pendingExchanges.length}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingExchanges.map((exchange, i) => (
                                <AnimatedContent key={exchange.id} delay={i * 0.06} className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--card-shadow)] hover:shadow-[var(--card-hover-shadow)] transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                            exchange.status === 'pending' ? 'bg-amber-900/30 text-amber-400' :
                                            exchange.status === 'accepted' ? 'bg-blue-900/30 text-blue-400' :
                                            'bg-[var(--success-bg)] text-[var(--success-text)]'
                                        }`}>
                                            {EXCHANGE_STATUS_LABELS[exchange.status]}
                                        </span>
                                        <span className="text-xs text-[var(--text-muted)]">{exchange.hours_exchanged}h</span>
                                    </div>
                                    <p className="font-medium text-sm mb-1">{exchange.listing?.title || 'Service Exchange'}</p>
                                    <p className="text-xs text-[var(--text-secondary)] mb-3">
                                        with {exchange.provider_name || exchange.requester_name || 'Community Member'}
                                    </p>
                                    <button onClick={() => navigate(`/exchange/${exchange.id}`)} className="w-full py-2 px-4 bg-[var(--bg-muted)] border border-[var(--border)] rounded-full text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-[var(--accent)] hover:text-[var(--accent-text)] transition-all cursor-pointer">
                                        <ArrowRightIcon size={14} /> View Details
                                    </button>
                                </AnimatedContent>
                            ))}
                        </div>
                    </div>
                )}

                {/* My Listings */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <ListPlusIcon size={18} />
                        <h2 className="font-urbanist text-xl font-semibold">My Listings</h2>
                    </div>
                    {listings.length === 0 ? (
                        <AnimatedContent className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="bg-[var(--bg-muted)] p-5 rounded-full mb-6"><ClockIcon size={36} className="text-[var(--text-muted)]" /></div>
                            <h2 className="font-urbanist text-2xl font-semibold mb-2">No listings yet</h2>
                            <p className="text-[var(--text-secondary)] max-w-sm mb-6">Offer your skills to the community and start earning time credits. Every hour you give earns you an hour back.</p>
                            <Link to="/offer" className="py-2.5 px-6 bg-[var(--accent)] text-[var(--accent-text)] rounded-full flex items-center gap-2" id="empty-new-listing-btn">
                                <PlusIcon size={16} /> Create Your First Listing
                            </Link>
                        </AnimatedContent>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {listings.map((listing, index) => (
                                <AnimatedContent key={listing.id} delay={index * 0.08} className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--card-shadow)] hover:shadow-[var(--card-hover-shadow)] transition-shadow group">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                            listing.type === 'offer' ? 'bg-[var(--success-bg)] text-[var(--success-text)]' : 'bg-blue-900/30 text-blue-400'
                                        }`}>
                                            {listing.type === 'offer' ? '🤝 Offering' : '🙋 Requesting'}
                                        </span>
                                        <span className="text-xs text-[var(--text-muted)]">{listing.estimated_hours}h</span>
                                    </div>
                                    <h3 className="font-medium text-base mb-1">{listing.title}</h3>
                                    <p className="text-xs text-[var(--text-secondary)] mb-3">{CATEGORY_LABELS[listing.category]}</p>
                                    <p className="text-sm text-[var(--text-secondary)] mb-4">{listing.description}</p>
                                    {listing.availability && <p className="text-xs text-[var(--text-muted)] mb-4">📅 {listing.availability}</p>}
                                    <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
                                        <button onClick={() => navigate('/browse')} className="flex-1 py-2 px-4 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-sm font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer">
                                            <SearchIcon size={14} /> Find Matches
                                        </button>
                                        <button onClick={() => handleDeleteListing(listing.id)} className="p-2 border border-[var(--border)] rounded-lg hover:bg-[var(--error-bg)] hover:border-[var(--error-border)] hover:text-[var(--error-text)] transition-all cursor-pointer" title="Delete">
                                            <Trash2Icon size={16} />
                                        </button>
                                    </div>
                                </AnimatedContent>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
