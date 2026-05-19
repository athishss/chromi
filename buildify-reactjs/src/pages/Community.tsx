import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AnimatedContent from '../components/animated-content';
import SectionTitle from '../components/section-title';
import type { ICommunityGroup, ILeaderboardEntry } from '../../types';
import { UsersIcon, TrophyIcon, PlusIcon, StarIcon, ShieldCheckIcon } from 'lucide-react';

export default function Community() {
    const [groups, setGroups] = useState<ICommunityGroup[]>([]);
    const [leaders, setLeaders] = useState<ILeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', campus: '', description: '' });
    const [error, setError] = useState('');
    const { getAccessToken } = useAuth();

    useEffect(() => { load(); }, []);

    async function load() {
        try {
            const [g, l] = await Promise.all([api.getCommunities(getAccessToken), api.getLeaderboard(getAccessToken)]);
            setGroups(g || []); setLeaders(l || []);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault(); setError('');
        if (!form.name.trim()) { setError('Name is required'); return; }
        try { await api.createCommunity(form, getAccessToken); setShowCreate(false); setForm({ name: '', campus: '', description: '' }); await load(); }
        catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed'); }
    }

    async function handleJoin(id: string) {
        try { await api.joinCommunity(id, getAccessToken); await load(); }
        catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed'); }
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen pt-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent)]" /></div>;

    const ic = "w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all";

    return (
        <section className="px-4 md:px-16 lg:px-24 xl:px-32 pt-24 pb-16">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <SectionTitle dir="left" icon={UsersIcon} title="Community" subtitle="Join groups and see the leaderboard." />
                    <button onClick={() => setShowCreate(!showCreate)} className="py-2.5 px-6 bg-[var(--accent)] text-[var(--accent-text)] rounded-full flex items-center gap-2 text-sm hover:opacity-90 transition-opacity cursor-pointer shrink-0">
                        <PlusIcon size={16} /> Create Group
                    </button>
                </div>

                {error && <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-xl p-3 mb-6 text-[var(--error-text)] text-sm">{error}</div>}

                {showCreate && (
                    <AnimatedContent className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-[var(--card-shadow)] p-6 mb-8">
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input type="text" className={ic} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Group name" />
                            <input type="text" className={ic} value={form.campus} onChange={e => setForm(p => ({ ...p, campus: e.target.value }))} placeholder="Campus (optional)" />
                            <textarea className={`${ic} resize-none`} rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description (optional)" />
                            <button type="submit" className="py-2.5 px-6 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-sm cursor-pointer">Create</button>
                        </form>
                    </AnimatedContent>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4"><UsersIcon size={18} /><h2 className="font-urbanist text-xl font-semibold">Groups</h2></div>
                        {groups.length === 0 ? (
                            <p className="text-[var(--text-secondary)] text-sm py-8 text-center">No groups yet. Create one!</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groups.map((g, i) => (
                                    <AnimatedContent key={g.id} delay={i * 0.06} className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
                                        <h3 className="font-medium text-base mb-1">{g.name}</h3>
                                        {g.campus && <p className="text-xs text-[var(--text-muted)] mb-2">{g.campus}</p>}
                                        {g.description && <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">{g.description}</p>}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-[var(--text-muted)]">{g.member_count} members</span>
                                            <button onClick={() => handleJoin(g.id)} className="py-1.5 px-4 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-xs cursor-pointer">Join</button>
                                        </div>
                                    </AnimatedContent>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-4"><TrophyIcon size={18} className="text-amber-400" /><h2 className="font-urbanist text-xl font-semibold">Leaderboard</h2></div>
                        <AnimatedContent className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
                            {leaders.length === 0 ? <p className="text-[var(--text-secondary)] text-sm text-center py-4">No data yet.</p> : (
                                <div className="space-y-3">
                                    {leaders.map((u, i) => (
                                        <div key={u.id} className="flex items-center gap-3">
                                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-400 text-black' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-[var(--bg-muted)]'}`}>{i + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate flex items-center gap-1">{u.full_name || 'Anonymous'}{u.badges?.includes('verified') && <ShieldCheckIcon size={12} className="text-[var(--accent)]" />}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{u.hours_given}h given</p>
                                            </div>
                                            <span className="flex items-center gap-1 text-xs text-amber-400"><StarIcon size={12} />{u.trust_score?.toFixed(0)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </AnimatedContent>
                    </div>
                </div>
            </div>
        </section>
    );
}
