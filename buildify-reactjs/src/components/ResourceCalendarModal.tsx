import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ResourceCalendarModalProps {
    listingId: string;
    listingTitle: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ResourceCalendarModal({ listingId, listingTitle, isOpen, onClose }: ResourceCalendarModalProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState<{ start: string, end: string, status: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const { getAccessToken } = useAuth();

    useEffect(() => {
        if (isOpen) {
            loadCalendar();
        }
    }, [isOpen, listingId]);

    async function loadCalendar() {
        setLoading(true);
        try {
            const data = await api.getResourceCalendar(listingId, getAccessToken);
            setBookings(data);
        } catch (err) {
            console.error('Failed to load calendar', err);
        } finally {
            setLoading(false);
        }
    }

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const isDateBooked = (day: number) => {
        const checkDate = new Date(year, month, day).getTime();
        return bookings.some(b => {
            const start = new Date(b.start).getTime();
            const end = new Date(b.end).getTime();
            return checkDate >= new Date(start).setHours(0,0,0,0) && checkDate <= new Date(end).setHours(23,59,59,999);
        });
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const isPast = (day: number) => {
        const checkDate = new Date(year, month, day, 23, 59, 59).getTime();
        return checkDate < new Date().getTime();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--bg-card)]">
                                <div>
                                    <h3 className="font-urbanist font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                                        <CalendarIcon size={18} className="text-[var(--accent)]" /> Availability
                                    </h3>
                                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{listingTitle}</p>
                                </div>
                                <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-input)] text-[var(--text-muted)] transition-colors cursor-pointer">
                                    <XIcon size={20} />
                                </button>
                            </div>

                            {/* Calendar Body */}
                            <div className="p-6">
                                {loading ? (
                                    <div className="h-64 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--accent)]" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between mb-6">
                                            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[var(--bg-input)] transition-colors cursor-pointer text-[var(--text-primary)]">
                                                <ChevronLeftIcon size={20} />
                                            </button>
                                            <h4 className="font-medium text-[var(--text-primary)]">{monthName}</h4>
                                            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[var(--bg-input)] transition-colors cursor-pointer text-[var(--text-primary)]">
                                                <ChevronRightIcon size={20} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-7 gap-2 text-center mb-2">
                                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                                <div key={d} className="text-xs font-semibold text-[var(--text-muted)]">{d}</div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-2">
                                            {Array.from({ length: firstDay }).map((_, i) => (
                                                <div key={`empty-${i}`} className="aspect-square" />
                                            ))}
                                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                                const day = i + 1;
                                                const booked = isDateBooked(day);
                                                const past = isPast(day);
                                                const today = isToday(day);

                                                return (
                                                    <div 
                                                        key={day} 
                                                        className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                                                            booked 
                                                                ? 'bg-[var(--error-bg)] text-[var(--error-text)] border border-[var(--error-border)]/50 cursor-not-allowed' 
                                                                : past
                                                                    ? 'text-[var(--text-muted)] opacity-50'
                                                                    : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                                                        } ${today && !booked ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-secondary)]' : ''}`}
                                                    >
                                                        {day}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Legend */}
                                        <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-secondary)]">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3 h-3 rounded-sm bg-[var(--bg-card)] border border-[var(--border)]" /> Available
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3 h-3 rounded-sm bg-[var(--error-bg)] border border-[var(--error-border)]" /> Booked
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
