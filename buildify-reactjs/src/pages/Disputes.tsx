import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AnimatedContent from '../components/animated-content';
import SectionTitle from '../components/section-title';
import type { IDispute } from '../../types';
import { ShieldAlertIcon, CheckCircle2Icon, ClockIcon } from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    open: { color: 'bg-amber-900/30 text-amber-400', label: 'Open' },
    investigating: { color: 'bg-blue-900/30 text-blue-400', label: 'Investigating' },
    resolved: { color: 'bg-[var(--success-bg)] text-[var(--success-text)]', label: 'Resolved' },
    dismissed: { color: 'bg-[var(--bg-muted)] text-[var(--text-muted)]', label: 'Dismissed' },
};

export default function Disputes() {
    const [disputes, setDisputes] = useState<IDispute[]>([]);
    const [loading, setLoading] = useState(true);
    const { getAccessToken } = useAuth();

    useEffect(() => { load(); }, []);

    async function load() {
        try { const d = await api.getDisputes(getAccessToken); setDisputes(d || []); }
        catch { /* ignore */ }
        finally { setLoading(false); }
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen pt-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent)]" /></div>;

    return (
        <section className="px-4 md:px-16 lg:px-24 xl:px-32 pt-24 pb-16">
            <div className="max-w-3xl mx-auto">
                <SectionTitle dir="left" icon={ShieldAlertIcon} title="Disputes" subtitle="Track disputes filed on your exchanges." />

                {disputes.length === 0 ? (
                    <AnimatedContent className="flex flex-col items-center justify-center py-20 text-center mt-8">
                        <div className="bg-[var(--bg-muted)] p-5 rounded-full mb-6"><CheckCircle2Icon size={36} className="text-[var(--success-text)]" /></div>
                        <h2 className="font-urbanist text-2xl font-semibold mb-2">No disputes</h2>
                        <p className="text-[var(--text-secondary)] max-w-sm">You have no active disputes. Keep up the great community interactions!</p>
                    </AnimatedContent>
                ) : (
                    <div className="space-y-3 mt-8">
                        {disputes.map((d, i) => {
                            const config = STATUS_CONFIG[d.status] || STATUS_CONFIG.open;
                            return (
                                <AnimatedContent key={d.id} delay={i * 0.04} className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.color}`}>{config.label}</span>
                                        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><ClockIcon size={12} />{new Date(d.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm font-medium mb-1">Exchange Dispute</p>
                                    <p className="text-sm text-[var(--text-secondary)] mb-2">{d.reason}</p>
                                    {d.resolution_notes && (
                                        <div className="p-3 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] mt-2">
                                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Resolution</p>
                                            <p className="text-sm">{d.resolution_notes}</p>
                                        </div>
                                    )}
                                </AnimatedContent>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
