import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AnimatedContent from '../components/animated-content';
import SectionTitle from '../components/section-title';
import type { IUserProfile } from '../../types';
import { UserIcon, MailIcon, CalendarIcon, ShieldCheckIcon, LogOutIcon, ArrowLeftIcon, ClockIcon, StarIcon, CheckCircle2Icon, TagIcon, SaveIcon } from 'lucide-react';

export default function Profile() {
    const { user, logout, getAccessToken } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<IUserProfile | null>(null);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ full_name: '', bio: '', skills: '', community: '', timetable_url: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadProfile(); }, []);

    async function loadProfile() {
        try {
            const data = await api.getProfile(getAccessToken);
            setProfile(data);
            if (data) setEditForm({ full_name: data.full_name || '', bio: data.bio || '', skills: (data.skills || []).join(', '), community: data.community || '', timetable_url: data.timetable_url || '' });
        } catch { /* profile may not exist yet */ }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const updated = await api.updateProfile({ ...editForm, skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean) }, getAccessToken);
            setProfile(updated); setEditing(false);
        } catch (err: any) { 
            console.error(err);
            alert('Failed to save profile: ' + (err.message || 'Unknown error'));
        }
        finally { setSaving(false); }
    }

    async function handleLogout() {
        try { await logout(); navigate('/login'); }
        catch (err) { console.error('Logout failed:', err); }
    }

    if (!user) return null;

    const joinedDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
    const inputClass = "w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all";

    const handleTimetableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setEditForm(p => ({ ...p, timetable_url: event.target!.result as string }));
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <section className="px-4 md:px-16 lg:px-24 xl:px-32 pt-24 pb-16">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => navigate('/dashboard')} className="mb-6 flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                    <ArrowLeftIcon size={16} /> Back to Dashboard
                </button>

                <AnimatedContent className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-[var(--card-shadow)] p-6 md:p-8">
                    <SectionTitle dir="left" icon={UserIcon} title="Profile" subtitle="Your account and community details." />

                    <div className="mt-8 space-y-6">
                        {/* Avatar */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center text-2xl font-bold font-urbanist">
                                {(profile?.full_name || user.email)?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <p className="font-semibold text-lg">{profile?.full_name || user.email}</p>
                                <p className="text-sm text-[var(--text-muted)]">Community Member</p>
                            </div>
                        </div>

                        {/* Time Balance Card */}
                        <div className="p-5 rounded-xl bg-[var(--accent)] text-center">
                            <p className="text-xs uppercase tracking-widest text-[var(--accent-text)]/60 font-semibold mb-1">Time Balance</p>
                            <p className="font-urbanist text-4xl font-bold text-[var(--accent-text)]">
                                {(profile?.time_balance ?? 2.0).toFixed(1)} <span className="text-lg">hrs</span>
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { icon: ClockIcon, label: 'Exchanges', value: profile?.total_exchanges ?? 0 },
                                { icon: StarIcon, label: 'Rating', value: profile?.rating ? profile.rating.toFixed(1) : 'N/A' },
                                { icon: CheckCircle2Icon, label: 'Completion', value: `${profile?.completion_score ?? 100}%` },
                                { icon: CalendarIcon, label: 'Joined', value: joinedDate.split(',')[0] },
                            ].map(stat => (
                                <div key={stat.label} className="p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <stat.icon size={16} className="text-[var(--text-muted)]" />
                                        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</span>
                                    </div>
                                    <p className="text-sm font-medium">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Editable Info */}
                        {editing ? (
                            <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Full Name</label>
                                    <input type="text" className={inputClass} value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Bio</label>
                                    <textarea className={`${inputClass} resize-none`} rows={3} value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell the community about yourself..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Skills (comma-separated)</label>
                                    <input type="text" className={inputClass} value={editForm.skills} onChange={e => setEditForm(p => ({ ...p, skills: e.target.value }))} placeholder="e.g., Python, Cooking, Guitar" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Community</label>
                                    <input type="text" className={inputClass} value={editForm.community} onChange={e => setEditForm(p => ({ ...p, community: e.target.value }))} placeholder="e.g., Campus A, Maple Apartments" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Upload Timetable (Image)</label>
                                    <input type="file" accept="image/*" onChange={handleTimetableChange} className={inputClass} />
                                    {editForm.timetable_url && (
                                        <div className="mt-2">
                                            <p className="text-xs text-[var(--text-muted)] mb-1">Preview:</p>
                                            <img src={editForm.timetable_url} alt="Timetable preview" className="max-w-full h-auto rounded-lg border border-[var(--border)] max-h-40 object-contain" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={handleSave} disabled={saving} className="py-2.5 px-6 bg-[var(--accent)] text-[var(--accent-text)] rounded-full flex items-center gap-2 text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer">
                                        <SaveIcon size={16} /> {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button onClick={() => setEditing(false)} className="py-2.5 px-6 border border-[var(--border)] text-[var(--text-secondary)] rounded-full text-sm cursor-pointer">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                                <div className="p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                                    <div className="flex items-center gap-2 mb-2"><MailIcon size={16} className="text-[var(--text-muted)]" /><span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Email</span></div>
                                    <p className="text-sm font-medium truncate">{user.email}</p>
                                </div>
                                {profile?.bio && (
                                    <div className="p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Bio</p>
                                        <p className="text-sm">{profile.bio}</p>
                                    </div>
                                )}
                                {profile?.skills && profile.skills.length > 0 && (
                                    <div className="p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                                        <div className="flex items-center gap-2 mb-2"><TagIcon size={16} className="text-[var(--text-muted)]" /><span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Skills</span></div>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.skills.map(skill => (
                                                <span key={skill} className="text-xs px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border)]">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {profile?.community && (
                                    <div className="p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                                        <div className="flex items-center gap-2 mb-2"><ShieldCheckIcon size={16} className="text-[var(--text-muted)]" /><span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Community</span></div>
                                        <p className="text-sm font-medium">{profile.community}</p>
                                    </div>
                                )}
                                {profile?.timetable_url && (
                                    <div className="p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                                        <div className="flex items-center gap-2 mb-2"><CalendarIcon size={16} className="text-[var(--text-muted)]" /><span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">My Timetable</span></div>
                                        <img src={profile.timetable_url} alt="My Timetable" className="max-w-full rounded-lg border border-[var(--border)]" />
                                    </div>
                                )}
                                <button onClick={() => setEditing(true)} className="py-2.5 px-6 border border-[var(--border)] text-[var(--text-secondary)] rounded-full flex items-center gap-2 text-sm hover:border-[var(--border-strong)] transition-colors cursor-pointer">
                                    Edit Profile
                                </button>
                            </div>
                        )}

                        {/* Logout */}
                        <div className="pt-4 border-t border-[var(--border)]">
                            <button onClick={handleLogout} className="py-2.5 px-6 bg-[var(--error-bg)] border border-[var(--error-border)] text-[var(--error-text)] rounded-full flex items-center gap-2 text-sm hover:opacity-90 transition-opacity cursor-pointer" id="profile-logout-btn">
                                <LogOutIcon size={16} /> Sign Out
                            </button>
                        </div>
                    </div>
                </AnimatedContent>
            </div>
        </section>
    );
}
