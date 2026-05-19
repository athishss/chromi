import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AnimatedContent from '../components/animated-content';
import SectionTitle from '../components/section-title';
import type { INotification } from '../../types';
import { BellIcon, CheckIcon, CheckCheckIcon, InboxIcon } from 'lucide-react';

export default function Notifications() {
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [loading, setLoading] = useState(true);
    const { getAccessToken } = useAuth();

    useEffect(() => { load(); }, []);

    async function load() {
        try { const data = await api.getNotifications(getAccessToken); setNotifications(data || []); }
        catch { /* ignore */ }
        finally { setLoading(false); }
    }

    async function markRead(id: string) {
        try { await api.markNotificationRead(id, getAccessToken); setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n)); }
        catch { /* ignore */ }
    }

    async function markAllRead() {
        try { await api.markAllNotificationsRead(getAccessToken); setNotifications(prev => prev.map(n => ({ ...n, is_read: true }))); }
        catch { /* ignore */ }
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen pt-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent)]" /></div>;

    const unread = notifications.filter(n => !n.is_read).length;

    return (
        <section className="px-4 md:px-16 lg:px-24 xl:px-32 pt-24 pb-16">
            <div className="max-w-3xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <SectionTitle dir="left" icon={BellIcon} title="Notifications" subtitle={`You have ${unread} unread notification${unread !== 1 ? 's' : ''}.`} />
                    {unread > 0 && (
                        <button onClick={markAllRead} className="py-2.5 px-6 border border-[var(--border)] text-[var(--text-secondary)] rounded-full flex items-center gap-2 text-sm hover:border-[var(--border-strong)] transition-colors cursor-pointer">
                            <CheckCheckIcon size={16} /> Mark All Read
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <AnimatedContent className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-[var(--bg-muted)] p-5 rounded-full mb-6"><InboxIcon size={36} className="text-[var(--text-muted)]" /></div>
                        <h2 className="font-urbanist text-2xl font-semibold mb-2">No notifications yet</h2>
                        <p className="text-[var(--text-secondary)] max-w-sm">When you get new matches, badge awards, or exchange updates, they'll appear here.</p>
                    </AnimatedContent>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((n, i) => (
                            <AnimatedContent key={n.id} delay={i * 0.04}
                                className={`p-5 rounded-xl border bg-[var(--bg-card)] shadow-[var(--card-shadow)] transition-all ${n.is_read ? 'border-[var(--border)] opacity-70' : 'border-[var(--accent)]/30'}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />}
                                            <h3 className="font-medium text-sm">{n.title}</h3>
                                        </div>
                                        <p className="text-sm text-[var(--text-secondary)]">{n.body}</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-2">{new Date(n.created_at).toLocaleString()}</p>
                                    </div>
                                    {!n.is_read && (
                                        <button onClick={() => markRead(n.id)} className="p-2 border border-[var(--border)] rounded-lg hover:bg-[var(--bg-muted)] transition-colors cursor-pointer shrink-0" title="Mark as read">
                                            <CheckIcon size={14} />
                                        </button>
                                    )}
                                </div>
                            </AnimatedContent>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
