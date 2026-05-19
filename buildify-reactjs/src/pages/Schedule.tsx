import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AnimatedContent from '../components/animated-content';
import SectionTitle from '../components/section-title';
import { CalendarIcon, ClockIcon } from 'lucide-react';

interface ScheduleEntry {
    id: string;
    scheduled_at: string;
    scheduled_end_at: string;
    status: string;
    service_listings?: { title: string; category: string };
    provider?: { full_name: string };
    requester?: { full_name: string };
}

export default function Schedule() {
    const [entries, setEntries] = useState<ScheduleEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { getAccessToken } = useAuth();

    useEffect(() => { load(); }, []);

    async function load() {
        try { const d = await api.getSchedule(getAccessToken); setEntries(d || []); }
        catch { /* ignore */ }
        finally { setLoading(false); }
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen pt-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent)]" /></div>;

    return (
        <section className="px-4 md:px-16 lg:px-24 xl:px-32 pt-24 pb-16">
            <div className="max-w-3xl mx-auto">
                <SectionTitle dir="left" icon={CalendarIcon} title="Schedule" subtitle="Your upcoming scheduled exchanges." />

                {entries.length === 0 ? (
                    <AnimatedContent className="flex flex-col items-center justify-center py-20 text-center mt-8">
                        <div className="bg-[var(--bg-muted)] p-5 rounded-full mb-6"><CalendarIcon size={36} className="text-[var(--text-muted)]" /></div>
                        <h2 className="font-urbanist text-2xl font-semibold mb-2">No scheduled exchanges</h2>
                        <p className="text-[var(--text-secondary)] max-w-sm">When you schedule an exchange, it will appear here.</p>
                    </AnimatedContent>
                ) : (
                    <div className="space-y-3 mt-8">
                        {entries.map((e, i) => (
                            <AnimatedContent key={e.id} delay={i * 0.04} className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-sm">{e.service_listings?.title || 'Exchange'}</h3>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-900/30 text-blue-400">{e.status}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                                    <span className="flex items-center gap-1"><ClockIcon size={14} />{new Date(e.scheduled_at).toLocaleString()}</span>
                                    <span>→</span>
                                    <span>{new Date(e.scheduled_end_at).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-2">with {e.provider?.full_name || e.requester?.full_name || 'Community Member'}</p>
                            </AnimatedContent>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
