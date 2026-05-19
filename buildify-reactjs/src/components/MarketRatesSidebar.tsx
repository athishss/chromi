import { useState } from 'react';
import { ActivityIcon, XIcon, ChevronRightIcon } from 'lucide-react';
import { CATEGORY_LABELS, CATEGORY_KEYS } from '../../types';
import type { ServiceCategory } from '../../types';

function getMultiplierStyle(m: number) {
    if (m >= 1.4) return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    if (m >= 1.2) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    if (m >= 1.05) return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
}

export default function MarketRatesSidebar({ multipliers }: { multipliers: Record<string, number> }) {
    const [isOpen, setIsOpen] = useState(false);

    const sortedCategories = CATEGORY_KEYS.slice().sort((a, b) => (multipliers[b] || 1) - (multipliers[a] || 1));

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-[var(--bg-card)] border border-l-0 border-[var(--border)] p-3 rounded-r-xl shadow-[var(--card-shadow)] hover:pl-4 transition-all duration-300 group ${isOpen ? '-translate-x-full' : 'translate-x-0'}`}
                title="View Live Market Rates"
            >
                <div className="flex flex-col items-center gap-2">
                    <ActivityIcon size={20} className="text-[var(--accent)]" />
                    <ChevronRightIcon size={16} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
                </div>
            </button>

            {/* Sidebar Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Content */}
            <div className={`fixed left-0 top-0 bottom-0 w-80 bg-[var(--bg-card)] border-r border-[var(--border)] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ActivityIcon size={18} className="text-[var(--accent)]" />
                            <h2 className="font-urbanist text-lg font-semibold">Live Market Rates</h2>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-[var(--bg-muted)] rounded-lg transition-colors cursor-pointer text-[var(--text-secondary)]">
                            <XIcon size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 overflow-y-auto flex-1">
                        <p className="text-xs text-[var(--text-muted)] mb-5">
                            Rates update in real-time based on local supply vs. demand.
                        </p>
                        
                        <div className="space-y-3">
                            {sortedCategories.map((cat) => {
                                const m = multipliers[cat] || 1.0;
                                const style = getMultiplierStyle(m);
                                // Remove emoji from label
                                const labelTokens = CATEGORY_LABELS[cat as ServiceCategory]?.split(' ') || [];
                                const textLabel = labelTokens.length > 1 ? labelTokens.slice(1).join(' ') : labelTokens[0];

                                return (
                                    <div key={cat} className={`flex items-center justify-between p-3 rounded-xl border ${style.border} ${style.bg}`}>
                                        <span className="font-medium text-sm text-[var(--text-primary)]">{textLabel}</span>
                                        <span className={`font-urbanist font-bold ${style.text}`}>{m.toFixed(2)}x</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
