import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AnimatedContent from '../components/animated-content';
import SectionTitle from '../components/section-title';
import { CATEGORY_LABELS } from '../../types';
import type { ServiceCategory } from '../../types';
import { BarChart3Icon, TrendingUpIcon, TrendingDownIcon, UsersIcon, ClockIcon, HandshakeIcon } from 'lucide-react';

export default function Analytics() {
    const [demand, setDemand] = useState<Record<string, number>>({});
    const [supply, setSupply] = useState<Record<string, number>>({});
    const [metrics, setMetrics] = useState({ total_users: 0, completed_exchanges: 0, hours_exchanged: 0 });
    const [loading, setLoading] = useState(true);
    const { getAccessToken } = useAuth();

    useEffect(() => { load(); }, []);

    async function load() {
        try {
            const [d, s, m] = await Promise.all([
                api.getDemandHeatmap(getAccessToken),
                api.getSupplyHeatmap(getAccessToken),
                api.getSystemMetrics(getAccessToken)
            ]);
            setDemand(d || {}); setSupply(s || {}); setMetrics(m || { total_users: 0, completed_exchanges: 0, hours_exchanged: 0 });
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen pt-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent)]" /></div>;

    const allCategories = [...new Set([...Object.keys(demand), ...Object.keys(supply)])];
    const maxVal = Math.max(...Object.values(demand), ...Object.values(supply), 1);

    return (
        <section className="px-4 md:px-16 lg:px-24 xl:px-32 pt-24 pb-16">
            <div className="max-w-5xl mx-auto">
                <SectionTitle dir="left" icon={BarChart3Icon} title="Analytics" subtitle="Platform demand, supply, and system metrics." />

                {/* System Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    {[
                        { icon: UsersIcon, label: 'Total Users', value: metrics.total_users },
                        { icon: HandshakeIcon, label: 'Completed Exchanges', value: metrics.completed_exchanges },
                        { icon: ClockIcon, label: 'Hours Exchanged', value: metrics.hours_exchanged },
                    ].map(stat => (
                        <AnimatedContent key={stat.label} className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--card-shadow)] text-center">
                            <stat.icon size={24} className="mx-auto mb-3 text-[var(--text-muted)]" />
                            <p className="font-urbanist text-3xl font-bold">{stat.value}</p>
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">{stat.label}</p>
                        </AnimatedContent>
                    ))}
                </div>

                {/* Demand vs Supply */}
                <div className="mt-10">
                    <h2 className="font-urbanist text-xl font-semibold mb-6">Demand vs Supply by Category</h2>
                    <div className="space-y-4">
                        {allCategories.map((cat, i) => {
                            const d = demand[cat] || 0;
                            const s = supply[cat] || 0;
                            return (
                                <AnimatedContent key={cat} delay={i * 0.04} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium">{CATEGORY_LABELS[cat as ServiceCategory] || cat}</span>
                                        <div className="flex gap-4 text-xs">
                                            <span className="flex items-center gap-1 text-[var(--error-text)]"><TrendingUpIcon size={12} /> {d} requests</span>
                                            <span className="flex items-center gap-1 text-[var(--success-text)]"><TrendingDownIcon size={12} /> {s} offers</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 h-4">
                                        <div className="bg-[var(--error-text)]/20 rounded-full overflow-hidden flex-1">
                                            <div className="h-full bg-[var(--error-text)]/60 rounded-full transition-all" style={{ width: `${(d / maxVal) * 100}%` }} />
                                        </div>
                                        <div className="bg-[var(--success-text)]/20 rounded-full overflow-hidden flex-1">
                                            <div className="h-full bg-[var(--success-text)]/60 rounded-full transition-all" style={{ width: `${(s / maxVal) * 100}%` }} />
                                        </div>
                                    </div>
                                </AnimatedContent>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
