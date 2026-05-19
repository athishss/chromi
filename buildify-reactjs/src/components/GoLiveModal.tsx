import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XIcon, ZapIcon, ClockIcon, TagIcon } from 'lucide-react';
import { CATEGORY_KEYS, CATEGORY_LABELS } from '../../types';
import type { ServiceCategory } from '../../types';

interface GoLiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoLive: (data: { category: string; description: string; duration_hours: number }) => void;
    loading?: boolean;
}

export default function GoLiveModal({ isOpen, onClose, onGoLive, loading }: GoLiveModalProps) {
    const [category, setCategory] = useState<ServiceCategory>('tutoring');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState(2);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGoLive({ category, description, duration_hours: duration });
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-gradient-to-r from-emerald-900/20 to-transparent">
                        <h3 className="font-urbanist text-lg font-semibold flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            Go Live — Available Now
                        </h3>
                        <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer rounded-full hover:bg-[var(--bg-secondary)]">
                            <XIcon size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 space-y-5">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Let the community know you're available right now. People can instantly request your help.
                        </p>

                        {/* Category */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                                <TagIcon size={12} className="inline mr-1.5 -translate-y-px" /> What can you help with?
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                                className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer appearance-none"
                            >
                                {CATEGORY_KEYS.map(key => (
                                    <option key={key} value={key}>{CATEGORY_LABELS[key]}</option>
                                ))}
                            </select>
                        </div>

                        {/* Quick Description */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                                Quick Description <span className="text-[var(--text-muted)]">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g., Can help with React, Node.js, or Python"
                                className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                                <ClockIcon size={12} className="inline mr-1.5 -translate-y-px" /> How long are you free?
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map(h => (
                                    <button
                                        key={h}
                                        type="button"
                                        onClick={() => setDuration(h)}
                                        className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                                            duration === h
                                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                                : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-secondary)] hover:border-emerald-500/50'
                                        }`}
                                    >
                                        {h}h
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-full text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 bg-emerald-500 text-white rounded-full text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                            >
                                {loading ? (
                                    <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" /> Going Live...</>
                                ) : (
                                    <><ZapIcon size={16} /> Go Live</>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
