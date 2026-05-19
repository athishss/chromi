import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XIcon, UploadIcon, InfoIcon, ShieldIcon, Image as ImageIcon, UsersIcon, CrownIcon } from 'lucide-react';

interface RequestExchangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { collateral_item?: string; collateral_photo_url?: string; is_private?: boolean }) => void;
    listingTitle: string;
    resourceDeposit: number;
    maxParticipants?: number;
    premiumRateAllowed?: boolean;
    estimatedHours?: number;
    spotsRemaining?: number;
}

export default function RequestExchangeModal({ isOpen, onClose, onSubmit, listingTitle, resourceDeposit, maxParticipants = 1, premiumRateAllowed = false, estimatedHours = 1, spotsRemaining }: RequestExchangeModalProps) {
    const [depositType, setDepositType] = useState<'credits' | 'collateral'>('credits');
    const [collateralItem, setCollateralItem] = useState('');
    const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
    const [isPrivate, setIsPrivate] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const isResource = resourceDeposit > 0;
    const isGroupSession = maxParticipants > 1;
    const showPremiumOption = premiumRateAllowed;
    const effectiveHours = isPrivate ? estimatedHours * 2 : estimatedHours;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setPhotoDataUrl(event.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isResource && depositType === 'collateral') {
            if (!collateralItem.trim()) return;
            onSubmit({ collateral_item: collateralItem, collateral_photo_url: photoDataUrl, is_private: isPrivate });
        } else {
            onSubmit({ is_private: isPrivate });
        }
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
                    <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                        <h3 className="font-urbanist text-lg font-semibold flex items-center gap-2">
                            <ShieldIcon size={18} className="text-[var(--accent)]" />
                            Request Exchange
                        </h3>
                        <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer rounded-full hover:bg-[var(--bg-secondary)]">
                            <XIcon size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5">
                        <p className="text-sm text-[var(--text-secondary)] mb-5">
                            You are requesting <strong>{listingTitle}</strong>.
                        </p>

                        {/* Group Session Info Banner */}
                        {isGroupSession && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-900/20 border border-blue-500/30 mb-5">
                                <UsersIcon size={18} className="text-blue-400 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-blue-400">Group Session</p>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {spotsRemaining !== undefined ? `${spotsRemaining} of ${maxParticipants} spots remaining` : `Up to ${maxParticipants} participants`}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Premium / Private Session Option */}
                        {showPremiumOption && (
                            <div className={`p-4 rounded-xl border mb-5 transition-all ${isPrivate ? 'bg-amber-900/20 border-amber-500/40' : 'bg-[var(--bg-input)] border-[var(--border)]'}`}>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <CrownIcon size={18} className={isPrivate ? 'text-amber-400' : 'text-[var(--text-muted)]'} />
                                        <div>
                                            <p className={`text-sm font-medium ${isPrivate ? 'text-amber-400' : 'text-[var(--text-primary)]'}`}>Private Session</p>
                                            <p className="text-xs text-[var(--text-muted)]">Exclusive 1-on-1 for 2x credits</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsPrivate(!isPrivate)}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                                            isPrivate 
                                                ? 'bg-amber-500' 
                                                : 'bg-[#3a3a3a]'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow ${
                                                isPrivate ? 'translate-x-[24px]' : 'translate-x-[3px]'
                                            }`}
                                        />
                                    </button>
                                </label>
                            </div>
                        )}

                        {/* Credit Cost Summary */}
                        <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] mb-5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--text-secondary)]">Credit Cost</span>
                                <div className="text-right">
                                    {isPrivate ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm line-through text-[var(--text-muted)]">{estimatedHours} hr{estimatedHours !== 1 ? 's' : ''}</span>
                                            <span className="font-urbanist text-lg font-bold text-amber-400">{effectiveHours} hrs</span>
                                        </div>
                                    ) : (
                                        <span className="font-urbanist text-lg font-bold text-[var(--text-primary)]">{effectiveHours} hr{effectiveHours !== 1 ? 's' : ''}</span>
                                    )}
                                </div>
                            </div>
                            {isPrivate && (
                                <p className="text-xs text-amber-400/80 mt-2">Premium rate: 2x for private 1-on-1 session</p>
                            )}
                        </div>

                        {/* Collateral Section (only for resources) */}
                        {isResource && (
                            <>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Security Deposit</p>
                                <div className="space-y-3 mb-5">
                                    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${depositType === 'credits' ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'bg-[var(--bg-input)] border-[var(--border)] hover:border-[var(--accent)]/50'}`}>
                                        <div className="mt-0.5">
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${depositType === 'credits' ? 'border-[var(--accent)]' : 'border-[var(--text-muted)]'}`}>
                                                {depositType === 'credits' && <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
                                            </div>
                                        </div>
                                        <div className="flex-1" onClick={() => setDepositType('credits')}>
                                            <h4 className={`text-sm font-medium ${depositType === 'credits' ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>Time Credits</h4>
                                            <p className="text-xs text-[var(--text-muted)] mt-1">Lock {resourceDeposit} time credits in escrow while you borrow the item.</p>
                                        </div>
                                    </label>

                                    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${depositType === 'collateral' ? 'bg-blue-900/10 border-blue-500' : 'bg-[var(--bg-input)] border-[var(--border)] hover:border-blue-500/50'}`}>
                                        <div className="mt-0.5">
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${depositType === 'collateral' ? 'border-blue-500' : 'border-[var(--text-muted)]'}`}>
                                                {depositType === 'collateral' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                            </div>
                                        </div>
                                        <div className="flex-1" onClick={() => setDepositType('collateral')}>
                                            <h4 className={`text-sm font-medium ${depositType === 'collateral' ? 'text-blue-500' : 'text-[var(--text-primary)]'}`}>Physical Collateral</h4>
                                            <p className="text-xs text-[var(--text-muted)] mt-1">Offer one of your own items to the provider as a swap deposit.</p>
                                        </div>
                                    </label>
                                </div>

                                <AnimatePresence>
                                    {depositType === 'collateral' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border)] mb-5">
                                                <div className="mb-4">
                                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                                                        Item Description <span className="text-red-400">*</span>
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        value={collateralItem} 
                                                        onChange={(e) => setCollateralItem(e.target.value)} 
                                                        placeholder="e.g., I'll leave my Nintendo Switch"
                                                        className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                                                        required={depositType === 'collateral'}
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                                                        Photo Evidence <span className="text-[var(--text-muted)]">(Optional)</span>
                                                    </label>
                                                    
                                                    {photoDataUrl ? (
                                                        <div className="relative rounded-lg overflow-hidden border border-[var(--border)] h-32 group">
                                                            <img src={photoDataUrl} alt="Collateral" className="w-full h-full object-cover" />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setPhotoDataUrl('')}
                                                                className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                            >
                                                                <XIcon size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="w-full py-4 border-2 border-dashed border-[var(--border)] hover:border-blue-500/50 hover:bg-blue-900/10 rounded-lg flex flex-col items-center justify-center text-[var(--text-muted)] hover:text-blue-500 transition-colors cursor-pointer gap-2"
                                                        >
                                                            <UploadIcon size={20} />
                                                            <span className="text-xs font-medium">Click to upload a photo</span>
                                                        </button>
                                                    )}
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        className="hidden" 
                                                        ref={fileInputRef}
                                                        onChange={handleFileChange}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}

                        <div className="flex gap-3 pt-2 border-t border-[var(--border)] mt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isResource && depositType === 'collateral' && !collateralItem.trim()}
                                className="flex-1 py-2.5 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                            >
                                {isPrivate ? 'Book Private Session' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
