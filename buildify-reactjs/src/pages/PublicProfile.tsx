import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AnimatedContent from '../components/animated-content';
import type { IUserProfile, IServiceListing, IEndorsement, IReview } from '../../types';
import { CATEGORY_LABELS, type ServiceCategory } from '../../types';
import {
    ArrowLeftIcon, ClockIcon, StarIcon, CheckCircle2Icon,
    ShieldCheckIcon, TagIcon, TrendingUpIcon, TrendingDownIcon,
    AwardIcon, ThumbsUpIcon, MessageSquareIcon, ArrowRightIcon,
    BadgeCheckIcon, SparklesIcon, CalendarIcon
} from 'lucide-react';

export default function PublicProfile() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { getAccessToken, user } = useAuth();

    const [profile, setProfile] = useState<IUserProfile | null>(null);
    const [listings, setListings] = useState<IServiceListing[]>([]);
    const [endorsements, setEndorsements] = useState<IEndorsement[]>([]);
    const [reviews, setReviews] = useState<IReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Endorsement form
    const [endorseSkill, setEndorseSkill] = useState('');
    const [endorseComment, setEndorseComment] = useState('');
    const [endorsing, setEndorsing] = useState(false);
    const [endorseSuccess, setEndorseSuccess] = useState('');

    useEffect(() => {
        if (userId) loadProfile();
    }, [userId]);

    // If user navigates to their own public profile, redirect to /profile
    useEffect(() => {
        if (user && userId === user.id) {
            navigate('/profile', { replace: true });
        }
    }, [user, userId]);

    async function loadProfile() {
        try {
            const data = await api.getPublicProfile(userId!, getAccessToken);
            setProfile(data.profile);
            setListings(data.listings || []);
            setEndorsements(data.endorsements || []);
            setReviews(data.reviews || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    }

    async function handleEndorse() {
        if (!endorseSkill.trim()) return;
        setEndorsing(true);
        setEndorseSuccess('');
        try {
            await api.endorseUser({
                endorsed_id: userId!,
                skill: endorseSkill.trim(),
                comment: endorseComment.trim() || undefined
            }, getAccessToken);
            setEndorseSuccess('Endorsement submitted!');
            setEndorseSkill('');
            setEndorseComment('');
            // Refresh endorsements
            const data = await api.getPublicProfile(userId!, getAccessToken);
            setEndorsements(data.endorsements || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to endorse');
        } finally {
            setEndorsing(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen pt-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent)]" />
            </div>
        );
    }

    if (error && !profile) {
        return (
            <section className="px-4 md:px-16 lg:px-24 xl:px-32 pt-24 pb-16">
                <div className="max-w-2xl mx-auto text-center">
                    <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                        <ArrowLeftIcon size={16} /> Go Back
                    </button>
                    <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-xl p-6 text-[var(--error-text)]">
                        <p className="font-medium">User not found</p>
                        <p className="text-sm mt-1 opacity-70">{error}</p>
                    </div>
                </div>
            </section>
        );
    }

    if (!profile) return null;

    const joinedDate = profile.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        : 'N/A';

    return (
        <section className="px-4 md:px-16 lg:px-24 xl:px-32 pt-24 pb-16">
            <div className="max-w-3xl mx-auto">
                <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                    <ArrowLeftIcon size={16} /> Go Back
                </button>

                {error && <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-xl p-3 mb-4 text-[var(--error-text)] text-sm">{error}</div>}
                {endorseSuccess && <div className="bg-[var(--success-bg)] border border-[var(--success-border)] rounded-xl p-3 mb-4 text-[var(--success-text)] text-sm">{endorseSuccess}</div>}

                {/* Profile Header */}
                <AnimatedContent className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-[var(--card-shadow)] overflow-hidden">
                    {/* Hero Banner */}
                    <div className="h-28 bg-gradient-to-r from-[var(--accent)] via-[var(--accent)]/80 to-violet-600 relative">
                        <div className="absolute -bottom-10 left-6">
                            <div className="w-20 h-20 rounded-2xl bg-[var(--bg-card)] border-4 border-[var(--bg-card)] flex items-center justify-center text-3xl font-bold font-urbanist text-[var(--accent)] shadow-lg">
                                {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>

                    <div className="pt-14 pb-6 px-6">
                        <div className="flex items-start justify-between flex-wrap gap-3">
                            <div>
                                <h1 className="font-urbanist text-2xl font-bold flex items-center gap-2">
                                    {profile.full_name || 'Anonymous'}
                                    {profile.is_verified && (
                                        <BadgeCheckIcon size={20} className="text-blue-400" />
                                    )}
                                </h1>
                                {profile.community && (
                                    <p className="text-sm text-[var(--text-secondary)] mt-1 flex items-center gap-1.5">
                                        <ShieldCheckIcon size={14} /> {profile.community}
                                        {profile.campus && <span className="text-[var(--text-muted)]">• {profile.campus}</span>}
                                    </p>
                                )}
                                <p className="text-xs text-[var(--text-muted)] mt-1">Member since {joinedDate}</p>
                            </div>
                            {profile.trust_score !== undefined && (
                                <div className="bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl px-4 py-2 text-center">
                                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Trust Score</p>
                                    <p className={`font-urbanist text-2xl font-bold ${
                                        (profile.trust_score ?? 0) >= 80 ? 'text-[var(--success-text)]' :
                                        (profile.trust_score ?? 0) >= 50 ? 'text-amber-400' :
                                        'text-[var(--error-text)]'
                                    }`}>
                                        {Number(profile.trust_score).toFixed(0)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {profile.bio && (
                            <p className="text-sm text-[var(--text-secondary)] mt-4 leading-relaxed">{profile.bio}</p>
                        )}

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
                            {[
                                { icon: ClockIcon, label: 'Exchanges', value: profile.total_exchanges ?? 0 },
                                { icon: StarIcon, label: 'Rating', value: profile.rating && Number(profile.rating) > 0 ? Number(profile.rating).toFixed(1) : 'N/A', color: 'text-amber-400' },
                                { icon: CheckCircle2Icon, label: 'Completion', value: `${profile.completion_score ?? 100}%` },
                                { icon: TrendingUpIcon, label: 'Given', value: `${profile.hours_given ?? 0}h` },
                                { icon: TrendingDownIcon, label: 'Received', value: `${profile.hours_received ?? 0}h` },
                            ].map(stat => (
                                <div key={stat.label} className="p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-center">
                                    <stat.icon size={14} className={`mx-auto mb-1 ${stat.color || 'text-[var(--text-muted)]'}`} />
                                    <p className="text-sm font-semibold">{stat.value}</p>
                                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Skills */}
                        {profile.skills && profile.skills.length > 0 && (
                            <div className="mt-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <TagIcon size={14} className="text-[var(--text-muted)]" />
                                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Skills</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map(skill => (
                                        <span key={skill} className="text-xs px-3 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] font-medium">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Badges */}
                        {profile.badges && profile.badges.length > 0 && (
                            <div className="mt-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <AwardIcon size={14} className="text-amber-400" />
                                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Badges</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {profile.badges.map(badge => (
                                        <span key={badge} className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                                            🏅 {badge}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Timetable */}
                        {profile.timetable_url && (
                            <div className="mt-8 pt-6 border-t border-[var(--border)]">
                                <div className="flex items-center gap-2 mb-4">
                                    <CalendarIcon size={18} className="text-[var(--accent)]" />
                                    <h2 className="font-urbanist text-lg font-semibold">Availability Timetable</h2>
                                </div>
                                <div className="bg-[var(--bg-muted)] p-2 rounded-xl border border-[var(--border)] inline-block max-w-full">
                                    <img src={profile.timetable_url} alt={`${profile.full_name}'s Timetable`} className="max-w-full h-auto rounded-lg" />
                                </div>
                            </div>
                        )}
                    </div>
                </AnimatedContent>

                {/* Active Listings */}
                {listings.length > 0 && (
                    <div className="mt-8">
                        <h2 className="font-urbanist text-lg font-semibold mb-4 flex items-center gap-2">
                            <SparklesIcon size={18} className="text-[var(--accent)]" /> Active Listings
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {listings.map((listing, i) => (
                                <AnimatedContent key={listing.id} delay={i * 0.06}
                                    className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--card-shadow)] hover:shadow-[var(--card-hover-shadow)] transition-shadow">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                            listing.type === 'offer' ? 'bg-[var(--success-bg)] text-[var(--success-text)]' : 'bg-blue-900/30 text-blue-400'
                                        }`}>
                                            {listing.type === 'offer' ? '🤝 Offering' : '🙋 Requesting'}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                            <ClockIcon size={12} />{listing.estimated_hours}h
                                        </span>
                                    </div>
                                    <h3 className="font-medium text-sm">{listing.title}</h3>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">{CATEGORY_LABELS[listing.category as ServiceCategory]}</p>
                                    <p className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-2">{listing.description}</p>
                                    <button
                                        onClick={() => navigate('/browse')}
                                        className="w-full mt-3 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-xs font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                                    >
                                        <ArrowRightIcon size={12} /> Request Exchange
                                    </button>
                                </AnimatedContent>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reviews */}
                {reviews.length > 0 && (
                    <div className="mt-8">
                        <h2 className="font-urbanist text-lg font-semibold mb-4 flex items-center gap-2">
                            <MessageSquareIcon size={18} className="text-amber-400" /> Reviews
                        </h2>
                        <div className="space-y-3">
                            {reviews.map((review: any, i: number) => (
                                <AnimatedContent key={review.id} delay={i * 0.05}
                                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">{review.reviewer?.full_name || 'Anonymous'}</span>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 5 }).map((_, j) => (
                                                <StarIcon key={j} size={12} className={j < review.rating ? 'text-amber-400 fill-amber-400' : 'text-[var(--border)]'} />
                                            ))}
                                        </div>
                                    </div>
                                    {review.comment && <p className="text-sm text-[var(--text-secondary)]">{review.comment}</p>}
                                    <p className="text-[10px] text-[var(--text-muted)] mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
                                </AnimatedContent>
                            ))}
                        </div>
                    </div>
                )}

                {/* Endorsements */}
                <div className="mt-8">
                    <h2 className="font-urbanist text-lg font-semibold mb-4 flex items-center gap-2">
                        <ThumbsUpIcon size={18} className="text-emerald-400" /> Endorsements
                        {endorsements.length > 0 && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">{endorsements.length}</span>
                        )}
                    </h2>

                    {/* Endorsement Form */}
                    {user && user.id !== userId && (
                        <AnimatedContent className="p-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] mb-4">
                            <p className="text-sm font-medium mb-3">Endorse {profile.full_name?.split(' ')[0] || 'this user'} for a skill</p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    value={endorseSkill}
                                    onChange={e => setEndorseSkill(e.target.value)}
                                    placeholder="Skill (e.g., Python, Guitar)"
                                    className="flex-1 px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all"
                                />
                                <input
                                    type="text"
                                    value={endorseComment}
                                    onChange={e => setEndorseComment(e.target.value)}
                                    placeholder="Comment (optional)"
                                    className="flex-1 px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all"
                                />
                                <button
                                    onClick={handleEndorse}
                                    disabled={endorsing || !endorseSkill.trim()}
                                    className="py-2.5 px-6 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                                >
                                    {endorsing ? 'Endorsing...' : 'Endorse'}
                                </button>
                            </div>
                        </AnimatedContent>
                    )}

                    {endorsements.length > 0 ? (
                        <div className="space-y-3">
                            {endorsements.map((end: any, i: number) => (
                                <AnimatedContent key={end.id} delay={i * 0.04}
                                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                                        <ThumbsUpIcon size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">{end.skill}</span>
                                            <span className="text-xs text-[var(--text-muted)]">by {end.endorser?.full_name || 'Someone'}</span>
                                        </div>
                                        {end.comment && <p className="text-xs text-[var(--text-secondary)] mt-1.5">{end.comment}</p>}
                                    </div>
                                </AnimatedContent>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-[var(--text-muted)] text-center py-6">No endorsements yet.</p>
                    )}
                </div>
            </div>
        </section>
    );
}
