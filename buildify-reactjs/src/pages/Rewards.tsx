import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AnimatedContent from '../components/animated-content';
import SectionTitle from '../components/section-title';
import { SparkleIcon, CheckCircleIcon, GiftIcon, TargetIcon, CalendarIcon, LockIcon } from 'lucide-react';

interface DailyReward {
    date: string;
    day: string;
    status: 'locked' | 'available' | 'claimed' | 'missed';
    key: string;
}

interface Milestone {
    id: string;
    title: string;
    description: string;
    reward: number;
    progress: number;
    max: number;
    status: 'locked' | 'available' | 'claimed';
}

export default function Rewards() {
    const { getAccessToken, refreshProfile } = useAuth();
    const [week, setWeek] = useState<DailyReward[]>([]);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);

    useEffect(() => { loadRewards(); }, []);

    async function loadRewards() {
        try {
            const data = await api.getRewards(getAccessToken);
            setWeek(data.week);
            setMilestones(data.milestones);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleClaim(key: string) {
        setClaiming(key);
        try {
            await api.claimReward(key, getAccessToken);
            await loadRewards();
            await refreshProfile(); // To update balance in header
        } catch (err) {
            alert('Failed to claim reward. You may have already claimed it.');
        } finally {
            setClaiming(null);
        }
    }

    if (loading) return <div className="flex justify-center pt-20 min-h-screen"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent)]" /></div>;

    return (
        <section className="px-4 md:px-16 lg:px-24 xl:px-32 pt-24 pb-16 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <SectionTitle dir="center" icon={GiftIcon} title="Rewards & Tasks" subtitle="Earn time credits by participating in the community." />

                {/* Daily Rewards Section */}
                <AnimatedContent delay={0.1} className="mt-10 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-[var(--card-shadow)]">
                    <div className="flex items-center gap-3 mb-6">
                        <CalendarIcon size={24} className="text-[var(--accent)]" />
                        <h2 className="text-2xl font-urbanist font-bold text-[var(--text-primary)]">Daily Check-In</h2>
                    </div>
                    <p className="text-[var(--text-secondary)] mb-8">Sign in every day to claim your free 0.1 time credits. Don't miss out!</p>
                    
                    <div className="grid grid-cols-7 gap-2 md:gap-4">
                        {week.map((day, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{day.day}</span>
                                <div className={`w-full aspect-square flex flex-col items-center justify-center rounded-2xl border-2 transition-all ${
                                    day.status === 'claimed' ? 'bg-[var(--success-bg)] border-[var(--success-border)] text-[var(--success-text)]' :
                                    day.status === 'available' ? 'bg-[var(--accent)]/10 border-[var(--accent)] cursor-pointer hover:bg-[var(--accent)] hover:text-[var(--accent-text)] text-[var(--accent)] shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]' :
                                    day.status === 'missed' ? 'bg-[var(--bg-input)] border-[var(--error-border)]/30 text-[var(--text-muted)] opacity-50' :
                                    'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-muted)]'
                                }`}
                                onClick={() => day.status === 'available' && !claiming && handleClaim(day.key)}>
                                    {day.status === 'claimed' && <CheckCircleIcon size={24} />}
                                    {day.status === 'available' && (claiming === day.key ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-current" /> : <SparkleIcon size={24} className="animate-pulse" />)}
                                    {day.status === 'missed' && <span className="text-[10px] font-bold">MISSED</span>}
                                    {day.status === 'locked' && <LockIcon size={20} />}
                                </div>
                            </div>
                        ))}
                    </div>
                </AnimatedContent>

                {/* Milestones Section */}
                <h3 className="text-xl font-urbanist font-bold mt-16 mb-6 flex items-center gap-2"><TargetIcon className="text-amber-400" /> Milestone Tasks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {milestones.map((m, i) => (
                        <AnimatedContent key={m.id} delay={0.2 + (i * 0.1)} className={`p-6 rounded-2xl border transition-all ${
                            m.status === 'claimed' ? 'bg-[var(--success-bg)]/20 border-[var(--success-border)] opacity-70' :
                            m.status === 'available' ? 'bg-[var(--bg-card)] border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.15)] scale-[1.02]' :
                            'bg-[var(--bg-card)] border-[var(--border)]'
                        }`}>
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-urbanist font-bold text-lg pr-2 leading-tight">{m.title}</h4>
                                <span className="bg-amber-400/20 text-amber-500 font-bold px-3 py-1 rounded-full text-xs whitespace-nowrap">+{m.reward} TC</span>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] mb-6 min-h-[40px]">{m.description}</p>
                            
                            {m.status !== 'claimed' && (
                                <div className="mb-6">
                                    <div className="flex justify-between text-xs mb-2 font-medium">
                                        <span className="text-[var(--text-muted)] uppercase tracking-wider">Progress</span>
                                        <span className="text-[var(--text-primary)]">{m.progress} / {m.max}</span>
                                    </div>
                                    <div className="h-2 bg-[var(--bg-input)] rounded-full overflow-hidden border border-[var(--border)]">
                                        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000" style={{ width: `${(m.progress / m.max) * 100}%` }}></div>
                                    </div>
                                </div>
                            )}

                            {m.status === 'claimed' ? (
                                <button disabled className="w-full py-3 bg-[var(--success-bg)] text-[var(--success-text)] rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-[var(--success-border)]">
                                    <CheckCircleIcon size={16} /> Claimed
                                </button>
                            ) : m.status === 'available' ? (
                                <button onClick={() => handleClaim(m.id)} disabled={claiming === m.id} className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-yellow-950 rounded-xl text-sm font-bold hover:from-amber-300 hover:to-amber-400 transition-colors cursor-pointer shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2">
                                    {claiming === m.id ? 'Claiming...' : <><GiftIcon size={16}/> Claim Reward</>}
                                </button>
                            ) : (
                                <button disabled className="w-full py-3 bg-[var(--bg-input)] text-[var(--text-muted)] rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-[var(--border)] cursor-not-allowed">
                                    <LockIcon size={14} /> Locked
                                </button>
                            )}
                        </AnimatedContent>
                    ))}
                </div>
            </div>
        </section>
    );
}
