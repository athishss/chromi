import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AnimatedContent from '../components/animated-content';
import type { IExchange } from '../../types';
import { EXCHANGE_STATUS_LABELS, CATEGORY_LABELS } from '../../types';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, PlayIcon, StarIcon, SendIcon, ClockIcon, UserIcon, ShieldIcon } from 'lucide-react';

export default function ExchangeDetail() {
    const { exchangeId } = useParams<{ exchangeId: string }>();
    const [exchange, setExchange] = useState<IExchange | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { getAccessToken, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { loadExchange(); }, [exchangeId]);

    async function loadExchange() {
        setLoading(true); setError('');
        try { setExchange(await api.getExchangeDetail(exchangeId!, getAccessToken)); }
        catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load'); }
        finally { setLoading(false); }
    }

    async function handleStatusUpdate(status: string) {
        try {
            const updated = await api.updateExchangeStatus(exchangeId!, status, getAccessToken);
            setExchange(updated);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to update'); }
    }

    async function handleReview(e: React.FormEvent) {
        e.preventDefault(); setSubmitting(true);
        try {
            await api.submitReview(exchangeId!, { rating: reviewRating, comment: reviewComment }, getAccessToken);
            setReviewComment(''); loadExchange();
        } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to submit review'); }
        finally { setSubmitting(false); }
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen pt-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent)]" /></div>;
    if (error || !exchange) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 pt-20 px-4">
            <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-xl p-4 text-[var(--error-text)] text-sm max-w-md">{error || 'Exchange not found'}</div>
            <button onClick={() => navigate('/dashboard')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer"><ArrowLeftIcon size={16} /> Back to Dashboard</button>
        </div>
    );

    const isProvider = user?.id === exchange.provider_id;
    const isRequester = user?.id === exchange.requester_id;
    const statusColor: Record<string, string> = {
        pending: 'bg-amber-900/30 text-amber-400', accepted: 'bg-blue-900/30 text-blue-400',
        in_progress: 'bg-[var(--success-bg)] text-[var(--success-text)]', completed: 'bg-emerald-900/30 text-emerald-400',
        cancelled: 'bg-[var(--error-bg)] text-[var(--error-text)]', disputed: 'bg-red-900/30 text-red-400'
    };

    return (
        <section className="px-4 md:px-16 lg:px-24 xl:px-32 pt-24 pb-16">
            <div className="max-w-3xl mx-auto">
                <button onClick={() => navigate('/dashboard')} className="mb-6 flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                    <ArrowLeftIcon size={16} /> Back to Dashboard
                </button>

                {/* Status Hero */}
                <AnimatedContent className="bg-[var(--accent)] rounded-2xl p-8 text-center mb-8">
                    <p className="text-xs uppercase tracking-widest text-[var(--accent-text)]/60 font-semibold mb-2">Exchange Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold uppercase ${statusColor[exchange.status] || ''}`}>
                        {EXCHANGE_STATUS_LABELS[exchange.status]}
                    </span>
                    <p className="text-[var(--accent-text)] mt-4 font-urbanist text-2xl font-bold">{exchange.listing?.title || 'Service Exchange'}</p>
                    {exchange.listing && <p className="text-[var(--accent-text)]/60 text-sm mt-1">{CATEGORY_LABELS[exchange.listing.category]}</p>}
                </AnimatedContent>

                {/* Exchange Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <AnimatedContent delay={0.08} className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-[var(--card-shadow)]">
                        <div className="flex items-center gap-2 mb-3"><UserIcon size={16} className="text-[var(--success-text)]" /><span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Provider</span></div>
                        <p className="font-medium">{exchange.provider_name || exchange.provider_email || 'Community Member'}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">{isProvider ? '(You)' : ''}</p>
                    </AnimatedContent>
                    <AnimatedContent delay={0.12} className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-[var(--card-shadow)]">
                        <div className="flex items-center gap-2 mb-3"><UserIcon size={16} className="text-blue-400" /><span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Requester</span></div>
                        <p className="font-medium">{exchange.requester_name || exchange.requester_email || 'Community Member'}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">{isRequester ? '(You)' : ''}</p>
                    </AnimatedContent>
                </div>

                {exchange.collateral_item && (
                    <AnimatedContent delay={0.14} className="p-5 rounded-xl bg-blue-900/10 border border-blue-500/30 shadow-[var(--card-shadow)] mb-8">
                        <div className="flex items-center gap-2 mb-3"><ShieldIcon size={16} className="text-blue-400" /><span className="text-xs uppercase tracking-wider text-blue-400 font-semibold">Collateral Offer</span></div>
                        <p className="font-medium text-[var(--text-secondary)] mb-3">Requester offered collateral: <span className="font-bold text-[var(--text-primary)]">{exchange.collateral_item}</span></p>
                        {exchange.collateral_photo_url && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-[var(--border)] inline-block max-w-full">
                                <img src={exchange.collateral_photo_url} alt="Collateral Evidence" className="h-48 object-contain bg-[var(--bg-secondary)]" />
                            </div>
                        )}
                    </AnimatedContent>
                )}

                <AnimatedContent delay={0.16} className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-[var(--card-shadow)] mb-8">
                    <div className="flex items-center gap-2 mb-3"><ClockIcon size={16} /><span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Credits</span></div>
                    <p className="font-urbanist text-3xl font-bold">{exchange.hours_exchanged} <span className="text-lg font-medium text-[var(--text-secondary)]">time credits</span></p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Created {new Date(exchange.created_at).toLocaleDateString()}</p>
                </AnimatedContent>

                {/* Actions */}
                {exchange.status === 'pending' && isProvider && (
                    <div className="flex gap-3 mb-8">
                        <button onClick={() => handleStatusUpdate('accepted')} className="flex-1 py-3 bg-[var(--success-bg)] border border-[var(--success-border)] text-[var(--success-text)] rounded-full font-medium flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
                            <CheckCircleIcon size={18} /> Accept
                        </button>
                        <button onClick={() => handleStatusUpdate('cancelled')} className="flex-1 py-3 bg-[var(--error-bg)] border border-[var(--error-border)] text-[var(--error-text)] rounded-full font-medium flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
                            <XCircleIcon size={18} /> Decline
                        </button>
                    </div>
                )}
                {exchange.status === 'accepted' && isProvider && (
                    <button onClick={() => handleStatusUpdate('in_progress')} className="w-full py-3 bg-[var(--accent)] text-[var(--accent-text)] rounded-full font-medium flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity mb-8">
                        <PlayIcon size={18} /> Start Exchange
                    </button>
                )}
                {exchange.status === 'in_progress' && isRequester && (
                    <button onClick={() => handleStatusUpdate('completed')} className="w-full py-3 bg-[var(--success-bg)] border border-[var(--success-border)] text-[var(--success-text)] rounded-full font-medium flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity mb-8">
                        <CheckCircleIcon size={18} /> Confirm Completion
                    </button>
                )}
                {exchange.status === 'pending' && isRequester && (
                    <button onClick={() => handleStatusUpdate('cancelled')} className="w-full py-3 bg-[var(--error-bg)] border border-[var(--error-border)] text-[var(--error-text)] rounded-full font-medium flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity mb-8">
                        <XCircleIcon size={18} /> Cancel Request
                    </button>
                )}

                {/* Review Form */}
                {exchange.status === 'completed' && (
                    <AnimatedContent className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-[var(--card-shadow)]">
                        <h3 className="font-urbanist text-lg font-semibold mb-4">Leave a Review</h3>
                        <form onSubmit={handleReview} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Rating</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star} type="button" onClick={() => setReviewRating(star)} className="cursor-pointer p-1">
                                            <StarIcon size={24} className={star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-muted)]'} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="How was your experience?"
                                className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all resize-none" rows={3} />
                            <button type="submit" disabled={submitting} className="py-2.5 px-6 bg-[var(--accent)] text-[var(--accent-text)] rounded-full font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer">
                                {submitting ? 'Submitting...' : <><SendIcon size={16} /> Submit Review</>}
                            </button>
                        </form>
                    </AnimatedContent>
                )}
            </div>
        </section>
    );
}
