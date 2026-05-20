import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AnimatedContent from '../components/animated-content';
import SectionTitle from '../components/section-title';
import { EXCHANGE_STATUS_LABELS, CATEGORY_LABELS } from '../../types';
import {
    ShieldIcon, UsersIcon, ArrowRightCircleIcon, CoinsIcon,
    SearchIcon, PlusIcon, MinusIcon, BanIcon, CheckCircleIcon,
    ActivityIcon, ClockIcon, BarChart3Icon, XIcon
} from 'lucide-react';

interface PlatformStats {
    total_users: number;
    total_exchanges: number;
    completed_exchanges: number;
    active_listings: number;
    credits_in_circulation: string;
}

interface AdminUser {
    id: string;
    full_name: string;
    email: string;
    time_balance: number;
    rating: number;
    trust_score: number;
    total_exchanges: number;
    is_verified: boolean;
    is_banned: boolean;
    community: string;
    created_at: string;
}

interface AdminExchange {
    id: string;
    status: string;
    hours_exchanged: number;
    listing_title: string;
    category: string;
    provider_name: string;
    requester_name: string;
    created_at: string;
    completed_at: string | null;
}

export default function Admin() {
    const { getAccessToken } = useAuth();
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [exchanges, setExchanges] = useState<AdminExchange[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [tab, setTab] = useState<'users' | 'exchanges'>('users');

    // Credit modal
    const [creditModal, setCreditModal] = useState<{ userId: string; name: string } | null>(null);
    const [creditAmount, setCreditAmount] = useState('');
    const [creditReason, setCreditReason] = useState('');
    const [creditLoading, setCreditLoading] = useState(false);

    useEffect(() => { loadAll(); }, []);

    async function loadAll() {
        setLoading(true);
        try {
            const [s, u, e] = await Promise.all([
                api.adminGetStats(getAccessToken),
                api.adminGetUsers('', getAccessToken),
                api.adminGetExchanges(getAccessToken)
            ]);
            setStats(s);
            setUsers(u || []);
            setExchanges(e || []);
        } catch (err: any) {
            if (err.message?.includes('Admin access required') || err.message?.includes('403')) {
                setAccessDenied(true);
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleSearch() {
        try {
            const u = await api.adminGetUsers(search, getAccessToken);
            setUsers(u || []);
        } catch { /* ignore */ }
    }

    async function handleCreditSubmit() {
        if (!creditModal || !creditAmount) return;
        setCreditLoading(true);
        try {
            await api.adminUpdateCredits(creditModal.userId, parseFloat(creditAmount), creditReason, getAccessToken);
            setCreditModal(null);
            setCreditAmount('');
            setCreditReason('');
            // Refresh
            const [s, u] = await Promise.all([
                api.adminGetStats(getAccessToken),
                api.adminGetUsers(search, getAccessToken)
            ]);
            setStats(s);
            setUsers(u || []);
        } catch (err: any) {
            alert('Failed: ' + (err.message || 'Unknown error'));
        } finally {
            setCreditLoading(false);
        }
    }

    async function handleBanToggle(userId: string, isBanned: boolean) {
        try {
            if (isBanned) {
                await api.adminUnbanUser(userId, getAccessToken);
            } else {
                if (!confirm('Are you sure you want to ban this user?')) return;
                await api.adminBanUser(userId, getAccessToken);
            }
            const u = await api.adminGetUsers(search, getAccessToken);
            setUsers(u || []);
        } catch (err: any) {
            alert('Failed: ' + (err.message || 'Unknown error'));
        }
    }

    if (loading) return <div className="flex justify-center pt-28 min-h-screen"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent)]" /></div>;

    if (accessDenied) return (
        <section className="px-4 md:px-16 lg:px-24 xl:px-32 pt-28 pb-16 min-h-screen">
            <div className="max-w-lg mx-auto text-center">
                <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-2xl p-10">
                    <ShieldIcon size={48} className="text-[var(--error-text)] mx-auto mb-4" />
                    <h1 className="font-urbanist text-2xl font-bold text-[var(--error-text)] mb-2">Access Denied</h1>
                    <p className="text-[var(--text-secondary)]">You do not have admin privileges. Contact the platform owner if you believe this is an error.</p>
                </div>
            </div>
        </section>
    );

    const statusColor: Record<string, string> = {
        pending: 'bg-amber-900/30 text-amber-400',
        accepted: 'bg-blue-900/30 text-blue-400',
        in_progress: 'bg-emerald-900/30 text-emerald-400',
        completed: 'bg-[var(--success-bg)] text-[var(--success-text)]',
        cancelled: 'bg-[var(--error-bg)] text-[var(--error-text)]',
        disputed: 'bg-red-900/30 text-red-400'
    };

    return (
        <section className="px-4 md:px-16 lg:px-24 xl:px-32 pt-24 pb-16 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <SectionTitle dir="left" icon={ShieldIcon} title="Admin Dashboard" subtitle="Manage the Chromi platform." />

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-8 mb-10">
                        {[
                            { icon: UsersIcon, label: 'Total Users', value: stats.total_users, color: 'text-blue-400' },
                            { icon: ArrowRightCircleIcon, label: 'Total Exchanges', value: stats.total_exchanges, color: 'text-[var(--accent)]' },
                            { icon: CheckCircleIcon, label: 'Completed', value: stats.completed_exchanges, color: 'text-emerald-400' },
                            { icon: ActivityIcon, label: 'Active Listings', value: stats.active_listings, color: 'text-amber-400' },
                            { icon: CoinsIcon, label: 'Credits Circulating', value: stats.credits_in_circulation, color: 'text-purple-400' }
                        ].map(s => (
                            <AnimatedContent key={s.label} className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-[var(--card-shadow)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <s.icon size={16} className={s.color} />
                                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">{s.label}</span>
                                </div>
                                <p className="font-urbanist text-2xl font-bold">{s.value}</p>
                            </AnimatedContent>
                        ))}
                    </div>
                )}

                {/* Tab Switcher */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setTab('users')}
                        className={`px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${tab === 'users' ? 'bg-[var(--accent)] text-[var(--accent-text)]' : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50'}`}
                    >
                        <UsersIcon size={14} className="inline mr-1.5 -translate-y-px" /> Users
                    </button>
                    <button
                        onClick={() => setTab('exchanges')}
                        className={`px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${tab === 'exchanges' ? 'bg-[var(--accent)] text-[var(--accent-text)]' : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50'}`}
                    >
                        <BarChart3Icon size={14} className="inline mr-1.5 -translate-y-px" /> Exchanges
                    </button>
                </div>

                {/* ── Users Tab ────────────────────────────── */}
                {tab === 'users' && (
                    <div>
                        {/* Search */}
                        <div className="flex gap-2 mb-6">
                            <div className="flex-1 relative">
                                <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search users by name..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                                />
                            </div>
                            <button onClick={handleSearch} className="px-5 py-2.5 bg-[var(--accent)] text-[var(--accent-text)] rounded-xl text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
                                Search
                            </button>
                        </div>

                        {/* User Table */}
                        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)]">
                                        <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">User</th>
                                        <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Email</th>
                                        <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Balance</th>
                                        <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Trust</th>
                                        <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Exchanges</th>
                                        <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Status</th>
                                        <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-muted)]/50 transition-colors ${u.is_banned ? 'opacity-50' : ''}`}>
                                            <td className="px-4 py-3">
                                                <p className="font-medium truncate max-w-[160px]">{u.full_name || 'Unnamed'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-[var(--text-secondary)] text-xs truncate max-w-[180px]">{u.email}</td>
                                            <td className="px-4 py-3 text-right font-medium">{parseFloat(String(u.time_balance)).toFixed(1)}</td>
                                            <td className="px-4 py-3 text-right">{u.trust_score ?? 'N/A'}</td>
                                            <td className="px-4 py-3 text-right">{u.total_exchanges}</td>
                                            <td className="px-4 py-3 text-center">
                                                {u.is_banned ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 uppercase">Banned</span>
                                                ) : u.is_verified ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 uppercase">Verified</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] uppercase">Active</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => setCreditModal({ userId: u.id, name: u.full_name || u.email })}
                                                        title="Adjust Credits"
                                                        className="p-1.5 rounded-lg bg-[var(--bg-muted)] hover:bg-[var(--accent)]/20 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                                                    >
                                                        <CoinsIcon size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleBanToggle(u.id, u.is_banned)}
                                                        title={u.is_banned ? 'Unban' : 'Ban'}
                                                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${u.is_banned ? 'bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-400' : 'bg-red-900/20 hover:bg-red-900/30 text-red-400'}`}
                                                    >
                                                        {u.is_banned ? <CheckCircleIcon size={14} /> : <BanIcon size={14} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.length === 0 && (
                                <p className="text-center py-8 text-sm text-[var(--text-muted)]">No users found.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Exchanges Tab ────────────────────────── */}
                {tab === 'exchanges' && (
                    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)]">
                                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Service</th>
                                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Provider</th>
                                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Requester</th>
                                    <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Status</th>
                                    <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Credits</th>
                                    <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exchanges.map(e => (
                                    <tr key={e.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-muted)]/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-medium truncate max-w-[200px]">{e.listing_title}</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">{CATEGORY_LABELS[e.category] || e.category}</p>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--text-secondary)]">{e.provider_name}</td>
                                        <td className="px-4 py-3 text-[var(--text-secondary)]">{e.requester_name}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${statusColor[e.status] || ''}`}>
                                                {EXCHANGE_STATUS_LABELS[e.status] || e.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">{e.hours_exchanged}</td>
                                        <td className="px-4 py-3 text-right text-xs text-[var(--text-muted)]">
                                            {new Date(e.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {exchanges.length === 0 && (
                            <p className="text-center py-8 text-sm text-[var(--text-muted)]">No exchanges yet.</p>
                        )}
                    </div>
                )}

                {/* ── Credit Adjustment Modal ─────────────── */}
                {creditModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                                <h3 className="font-urbanist text-lg font-semibold">Adjust Credits</h3>
                                <button onClick={() => setCreditModal(null)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                                    <XIcon size={18} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Adjusting credits for <span className="font-bold text-[var(--text-primary)]">{creditModal.name}</span>
                                </p>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Amount (positive to add, negative to remove)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={creditAmount}
                                        onChange={e => setCreditAmount(e.target.value)}
                                        placeholder="e.g., 5 or -2"
                                        className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Reason (optional)</label>
                                    <input
                                        type="text"
                                        value={creditReason}
                                        onChange={e => setCreditReason(e.target.value)}
                                        placeholder="e.g., Promotional bonus"
                                        className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setCreditModal(null)} className="flex-1 py-2.5 rounded-full text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">Cancel</button>
                                    <button
                                        onClick={handleCreditSubmit}
                                        disabled={creditLoading || !creditAmount}
                                        className="flex-1 py-2.5 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                                    >
                                        {creditLoading ? 'Saving...' : 'Apply'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
