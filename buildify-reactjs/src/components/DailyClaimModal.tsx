import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SparkleIcon, CheckCircleIcon, CalendarIcon, LockIcon, XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DailyReward {
    date: string;
    day: string;
    status: 'locked' | 'available' | 'claimed' | 'missed';
    key: string;
}

export default function DailyClaimModal() {
    const { user, getAccessToken } = useAuth();
    const [week, setWeek] = useState<DailyReward[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [claiming, setClaiming] = useState<string | null>(null);
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        if (user && !hasChecked) {
            checkDailyReward();
        }
    }, [user, hasChecked]);

    async function checkDailyReward() {
        try {
            const data = await api.getRewards(getAccessToken);
            setWeek(data.week);

            // Check if there is an available reward for today
            const hasAvailable = data.week.some((d: DailyReward) => d.status === 'available');
            if (hasAvailable) {
                setIsVisible(true);
            }
        } catch (err) {
            console.error('Failed to check daily rewards', err);
        } finally {
            setHasChecked(true);
        }
    }

    async function handleClaim(key: string) {
        setClaiming(key);
        try {
            await api.claimReward(key, getAccessToken);
            
            // Re-fetch to show the green checkmark for a second before closing
            const data = await api.getRewards(getAccessToken);
            setWeek(data.week);

            // Close modal after a short delay so they see the success state
            setTimeout(() => {
                setIsVisible(false);
            }, 1000);

        } catch (err) {
            alert('Failed to claim reward. You may have already claimed it.');
        } finally {
            setClaiming(null);
        }
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-2xl max-w-3xl w-full relative"
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        >
                            <XIcon size={24} />
                        </button>

                        <div className="flex items-center gap-3 mb-6 pr-8">
                            <CalendarIcon size={24} className="text-[var(--accent)]" />
                            <h2 className="text-2xl font-urbanist font-bold text-[var(--text-primary)]">Daily Check-In</h2>
                        </div>

                        <p className="text-[var(--text-secondary)] mb-8">
                            Welcome back! Sign in every day to claim your free 0.1 time credits. Don't miss out!
                        </p>

                        <div className="grid grid-cols-7 gap-2 md:gap-4">
                            {week.map((day, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{day.day}</span>
                                    <div className={`w-full aspect-square flex flex-col items-center justify-center rounded-2xl border-2 transition-all ${day.status === 'claimed' ? 'bg-[var(--success-bg)] border-[var(--success-border)] text-[var(--success-text)]' :
                                            day.status === 'available' ? 'bg-[var(--accent)]/10 border-[var(--accent)] cursor-pointer hover:bg-[var(--accent)] hover:text-[var(--accent-text)] text-[var(--accent)] shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] scale-105' :
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
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
