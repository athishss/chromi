import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AnimatedContent from '../components/animated-content';
import SectionTitle from '../components/section-title';
import { CATEGORY_KEYS, CATEGORY_LABELS } from '../../types';
import type { ServiceCategory, ListingType } from '../../types';
import { SparkleIcon, SendIcon, ArrowLeftIcon, TagIcon, FileTextIcon, ClockIcon, CalendarIcon, ChevronRightIcon, ChevronLeftIcon, UsersIcon, CrownIcon, VideoIcon, MapPinIcon, LinkIcon, LockIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 30 : -30,
        opacity: 0,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 30 : -30,
        opacity: 0,
    })
};

export default function OfferService() {
    const [form, setForm] = useState({
        title: '', category: 'tutoring' as ServiceCategory, description: '',
        estimated_hours: 1, type: 'offer' as ListingType, availability: '',
        is_resource: false, resource_deposit: 0,
        max_participants: 1, premium_rate_allowed: false,
        is_online: true, meeting_link: '', meeting_password: '',
        offline_venue: '', offline_date: '', offline_time: ''
    });
    
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { getAccessToken } = useAuth();
    const navigate = useNavigate();

    function handleChange(field: string, value: string | number | boolean) { 
        setForm(prev => ({ ...prev, [field]: value })); 
        setError('');
    }

    const nextStep = () => {
        // Validation per step
        if (step === 2 && !form.title.trim()) { setError('Please enter a service title.'); return; }
        if (step === 3) {
            if (!form.description.trim()) { setError('Please provide a description.'); return; }
            if (form.type === 'offer' && !form.is_resource) {
                if (form.is_online && form.meeting_link.trim() && !form.meeting_password.trim()) {
                    setError('Meeting password is compulsory if you provide a meeting link.'); return;
                }
            }
        }
        
        setError('');
        setDirection(1);
        setStep(s => s + 1);
    };

    const prevStep = () => {
        setError('');
        setDirection(-1);
        setStep(s => s - 1);
    };

    async function handleSubmit() {
        setError('');
        const errors: string[] = [];
        if (!form.title.trim()) errors.push('Title is required');
        if (!form.description.trim()) errors.push('Description is required');
        if (form.estimated_hours <= 0) errors.push('Hours must be > 0');
        if (errors.length) { setError(errors.join('. ')); return; }
        
        setLoading(true);
        try { 
            await api.createListing(form, getAccessToken); 
            navigate('/dashboard'); 
        } catch (err: unknown) { 
            setError(err instanceof Error ? err.message : 'Failed to create listing'); 
        } finally { 
            setLoading(false); 
        }
    }

    const inputClass = "w-full px-4 py-4 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/50 transition-all text-lg";

    const totalSteps = 4;

    return (
        <section className="px-4 md:px-16 lg:px-24 xl:px-32 pt-24 pb-16 min-h-[90vh] flex flex-col">
            <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
                <button onClick={() => navigate('/dashboard')} className="mb-6 flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer self-start">
                    <ArrowLeftIcon size={16} /> Back to Dashboard
                </button>
                
                <AnimatedContent className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] shadow-[var(--card-shadow)] overflow-hidden flex-1 flex flex-col relative">
                    
                    {/* Header & Progress Dots */}
                    <div className="p-6 md:p-8 border-b border-[var(--border)] bg-[var(--bg-secondary)]/30">
                        <SectionTitle dir="center" icon={SparkleIcon} title="New Listing" subtitle="Share your skills with the community or request help." />
                        
                        <div className="flex justify-center items-center gap-2 mt-6">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`h-2 rounded-full transition-all duration-500 ease-out ${step === i + 1 ? 'w-8 bg-[var(--accent)]' : step > i + 1 ? 'w-2 bg-[var(--accent)]/50' : 'w-2 bg-[var(--border)]'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Form Content - Carousel */}
                    <div className="relative flex-1 p-6 md:p-8 overflow-hidden min-h-[350px] flex items-center">
                        <AnimatePresence initial={false} custom={direction} mode="wait">
                            <motion.div
                                key={step}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                                className="w-full space-y-6"
                            >
                                {error && <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-xl p-4 mb-6 text-[var(--error-text)] text-sm">{error}</div>}

                                {/* STEP 1 */}
                                {step === 1 && (
                                    <div className="space-y-8">
                                        <div className="text-center mb-8">
                                            <h2 className="text-2xl font-urbanist font-bold text-[var(--text-primary)]">What would you like to do?</h2>
                                            <p className="text-[var(--text-secondary)] mt-2">Choose whether you are offering a service or requesting one.</p>
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <button type="button" onClick={() => handleChange('type', 'offer')}
                                                className={`flex-1 py-5 px-4 rounded-2xl text-base font-medium border-2 transition-all cursor-pointer ${form.type === 'offer' ? 'bg-[var(--success-bg)] border-[var(--success-border)] text-[var(--success-text)] scale-[1.02]' : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--success-border)]/50'}`}>
                                                <span className="block text-3xl mb-3">🤝</span>
                                                I can offer a service
                                            </button>
                                            <button type="button" onClick={() => handleChange('type', 'request')}
                                                className={`flex-1 py-5 px-4 rounded-2xl text-base font-medium border-2 transition-all cursor-pointer ${form.type === 'request' ? 'bg-blue-900/30 border-blue-500 text-blue-400 scale-[1.02]' : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-secondary)] hover:border-blue-500/50'}`}>
                                                <span className="block text-3xl mb-3">🙋</span>
                                                I need help
                                            </button>
                                        </div>

                                        <div className="mt-8 border border-[var(--border)] bg-[var(--bg-input)] rounded-2xl p-5 flex items-center justify-between transition-colors hover:border-[var(--accent)]/50">
                                            <div>
                                                <p className="text-base font-medium text-[var(--text-primary)]">Is this a physical resource?</p>
                                                <p className="text-sm text-[var(--text-muted)] mt-1">E.g., lending an Arduino kit, a bike, or tools</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleChange('is_resource', !form.is_resource)}
                                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                                                    form.is_resource 
                                                        ? 'bg-[#e2e2e2] shadow-[inset_0px_3px_5px_rgba(0,0,0,0.15)]' 
                                                        : 'bg-[#3a3a3a] shadow-[inset_0px_3px_5px_rgba(0,0,0,0.4)]'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-6 w-6 transform rounded-full transition-transform duration-300 translate-y-[1px] ${
                                                        form.is_resource 
                                                            ? 'translate-x-[28px] bg-white shadow-[0px_2px_5px_rgba(0,0,0,0.2)]' 
                                                            : 'translate-x-[4px] bg-[#666666] shadow-[0px_2px_5px_rgba(0,0,0,0.4)]'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2 */}
                                {step === 2 && (
                                    <div className="space-y-8">
                                        <div className="text-center mb-8">
                                            <h2 className="text-2xl font-urbanist font-bold text-[var(--text-primary)]">Let's get some details</h2>
                                            <p className="text-[var(--text-secondary)] mt-2">Give your listing a clear title and categorize it.</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2" htmlFor="listing-title">
                                                <FileTextIcon size={16} className="inline mr-2 -translate-y-px" /> Service Title
                                            </label>
                                            <input id="listing-title" type="text" className={inputClass} placeholder={form.type === 'offer' ? "e.g., Python tutoring for beginners" : "e.g., Need help with graphic design"} value={form.title} onChange={(e) => handleChange('title', e.target.value)} autoFocus />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2" htmlFor="listing-category">
                                                <TagIcon size={16} className="inline mr-2 -translate-y-px" /> Category
                                            </label>
                                            <select id="listing-category" value={form.category} onChange={(e) => handleChange('category', e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                                                {CATEGORY_KEYS.map(key => (<option key={key} value={key}>{CATEGORY_LABELS[key]}</option>))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3 */}
                                {step === 3 && (
                                    <div className="space-y-8">
                                        <div className="text-center mb-8">
                                            <h2 className="text-2xl font-urbanist font-bold text-[var(--text-primary)]">Describe the value</h2>
                                            <p className="text-[var(--text-secondary)] mt-2">Explain what is needed and set the time value.</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2" htmlFor="listing-desc">
                                                <FileTextIcon size={16} className="inline mr-2 -translate-y-px" /> Description
                                            </label>
                                            <textarea id="listing-desc" className={`${inputClass} resize-none py-3`} rows={4} placeholder="Describe what you're offering or what you need. Be specific." value={form.description} onChange={(e) => handleChange('description', e.target.value)} autoFocus />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2" htmlFor="listing-hours">
                                                <ClockIcon size={16} className="inline mr-2 -translate-y-px" /> Estimated Hours
                                            </label>
                                            <div className="bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl p-6">
                                                <div className="flex items-center justify-between mb-5">
                                                    <span className="text-sm text-[var(--text-muted)] font-medium">0.5 hr</span>
                                                    <span className="text-lg font-bold bg-[var(--accent)] text-[var(--accent-text)] py-1.5 px-5 rounded-full shadow-lg">{form.estimated_hours} hr{form.estimated_hours !== 1 ? 's' : ''}</span>
                                                    <span className="text-sm text-[var(--text-muted)] font-medium">10 hrs</span>
                                                </div>
                                                <input id="listing-hours" type="range" min="0.5" max="10" step="0.5" value={form.estimated_hours}
                                                    onChange={(e) => handleChange('estimated_hours', parseFloat(e.target.value))} className="custom-slider w-full mt-2"
                                                    style={{ background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((form.estimated_hours - 0.5) / 9.5) * 100}%, var(--bg-muted) ${((form.estimated_hours - 0.5) / 9.5) * 100}%, var(--bg-muted) 100%)` }} />
                                                <p className="text-sm text-[var(--text-secondary)] mt-4 text-center">This exchange is worth <strong className="text-[var(--text-primary)]">{form.estimated_hours} time credit{form.estimated_hours !== 1 ? 's' : ''}</strong></p>
                                            </div>
                                        </div>

                                        {form.type === 'offer' && form.is_resource && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2" htmlFor="listing-deposit">
                                                    <SparkleIcon size={16} className="inline mr-2 -translate-y-px text-amber-400" /> Security Deposit (Time Credits)
                                                </label>
                                                <input id="listing-deposit" type="number" min="0" step="0.5" className={inputClass} placeholder="0" value={form.resource_deposit} onChange={(e) => handleChange('resource_deposit', parseFloat(e.target.value) || 0)} />
                                                <p className="text-sm text-[var(--text-muted)] mt-2 pl-3 border-l-2 border-amber-400/50">These credits will be locked in escrow from the borrower as a guarantee.</p>
                                            </motion.div>
                                        )}

                                        {/* Group Session & Premium — Offers only, NOT for physical resources */}
                                        {form.type === 'offer' && !form.is_resource && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                                        <UsersIcon size={16} className="inline mr-2 -translate-y-px" /> Group Session Size
                                                    </label>
                                                    <div className="bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl p-6">
                                                        <div className="flex items-center justify-between mb-5">
                                                            <span className="text-sm text-[var(--text-muted)] font-medium">1 (Private)</span>
                                                            <span className="text-lg font-bold bg-[var(--accent)] text-[var(--accent-text)] py-1.5 px-5 rounded-full shadow-lg">
                                                                {form.max_participants === 1 ? '1-on-1' : `Up to ${form.max_participants}`}
                                                            </span>
                                                            <span className="text-sm text-[var(--text-muted)] font-medium">20 people</span>
                                                        </div>
                                                        <input type="range" min="1" max="20" step="1" value={form.max_participants}
                                                            onChange={(e) => handleChange('max_participants', parseInt(e.target.value))} className="custom-slider w-full mt-2"
                                                            style={{ background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((form.max_participants - 1) / 19) * 100}%, var(--bg-muted) ${((form.max_participants - 1) / 19) * 100}%, var(--bg-muted) 100%)` }} />
                                                        <p className="text-sm text-[var(--text-secondary)] mt-4 text-center">
                                                            {form.max_participants === 1 
                                                                ? 'Standard 1-on-1 session' 
                                                                : <>Each participant pays <strong className="text-[var(--text-primary)]">{form.estimated_hours} credit{form.estimated_hours !== 1 ? 's' : ''}</strong> — you earn <strong className="text-[var(--success-text)]">{form.estimated_hours * form.max_participants} credits</strong> total</>}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="border border-[var(--border)] bg-[var(--bg-input)] rounded-2xl p-5 flex items-center justify-between transition-colors hover:border-[var(--accent)]/50">
                                                    <div>
                                                        <p className="text-base font-medium text-[var(--text-primary)] flex items-center gap-2">
                                                            <CrownIcon size={16} className="text-amber-400" /> Allow Private Booking
                                                        </p>
                                                        <p className="text-sm text-[var(--text-muted)] mt-1">Users can pay 2x credits for a private 1-on-1 session</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChange('premium_rate_allowed', !form.premium_rate_allowed)}
                                                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                                                            form.premium_rate_allowed 
                                                                ? 'bg-[#e2e2e2] shadow-[inset_0px_3px_5px_rgba(0,0,0,0.15)]' 
                                                                : 'bg-[#3a3a3a] shadow-[inset_0px_3px_5px_rgba(0,0,0,0.4)]'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`inline-block h-6 w-6 transform rounded-full transition-transform duration-300 translate-y-[1px] ${
                                                                form.premium_rate_allowed 
                                                                    ? 'translate-x-[28px] bg-white shadow-[0px_2px_5px_rgba(0,0,0,0.2)]' 
                                                                    : 'translate-x-[4px] bg-[#666666] shadow-[0px_2px_5px_rgba(0,0,0,0.4)]'
                                                            }`}
                                                        />
                                                    </button>
                                                </div>

                                                {/* Meeting Details (Online/Offline) */}
                                                <div className="mt-8 pt-8 border-t border-[var(--border)]">
                                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-4">
                                                        <VideoIcon size={16} className="inline mr-2 -translate-y-px" /> How will this service be delivered?
                                                    </label>
                                                    <div className="flex bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-1 mb-6">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleChange('is_online', true)}
                                                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${form.is_online ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                                                        >
                                                            <VideoIcon size={16} className="inline mr-2 -translate-y-px" /> Online
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleChange('is_online', false)}
                                                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${!form.is_online ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                                                        >
                                                            <MapPinIcon size={16} className="inline mr-2 -translate-y-px" /> In-Person
                                                        </button>
                                                    </div>

                                                    <AnimatePresence mode="wait">
                                                        {form.is_online ? (
                                                            <motion.div key="online" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                                                                <div>
                                                                    <label className="block text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider font-semibold"><LinkIcon size={12} className="inline mr-1" /> Meeting Link</label>
                                                                    <input type="url" className={inputClass} placeholder="https://zoom.us/j/..." value={form.meeting_link} onChange={(e) => handleChange('meeting_link', e.target.value)} />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider font-semibold"><LockIcon size={12} className="inline mr-1" /> Password <span className="text-red-400">*</span></label>
                                                                    <input type="text" className={inputClass} placeholder="Meeting password (compulsory if link is given)" value={form.meeting_password} onChange={(e) => handleChange('meeting_password', e.target.value)} />
                                                                </div>
                                                                <p className="text-xs text-[var(--text-muted)] pl-2 border-l-2 border-[var(--accent)]">These details will be locked until you approve the exchange request.</p>
                                                            </motion.div>
                                                        ) : (
                                                            <motion.div key="offline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                                                                <div>
                                                                    <label className="block text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider font-semibold"><MapPinIcon size={12} className="inline mr-1" /> Venue</label>
                                                                    <input type="text" className={inputClass} placeholder="e.g., Campus Library, Room 302" value={form.offline_venue} onChange={(e) => handleChange('offline_venue', e.target.value)} />
                                                                </div>
                                                                <div className="flex gap-4">
                                                                    <div className="flex-1">
                                                                        <label className="block text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider font-semibold">Date</label>
                                                                        <input type="date" className={`${inputClass} text-sm`} value={form.offline_date} onChange={(e) => handleChange('offline_date', e.target.value)} />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <label className="block text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider font-semibold">Time</label>
                                                                        <input type="time" className={`${inputClass} text-sm`} value={form.offline_time} onChange={(e) => handleChange('offline_time', e.target.value)} />
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-[var(--text-muted)] pl-2 border-l-2 border-[var(--accent)]">Location details will be hidden until you approve the exchange request.</p>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* STEP 4 */}
                                {step === 4 && (
                                    <div className="space-y-8">
                                        <div className="text-center mb-8">
                                            <h2 className="text-2xl font-urbanist font-bold text-[var(--text-primary)]">Almost there!</h2>
                                            <p className="text-[var(--text-secondary)] mt-2">When are you generally available for this exchange?</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2" htmlFor="listing-avail">
                                                <CalendarIcon size={16} className="inline mr-2 -translate-y-px" /> Availability <span className="text-[var(--text-muted)]">(optional)</span>
                                            </label>
                                            <input id="listing-avail" type="text" className={inputClass} placeholder="e.g., Weekday evenings, Saturday mornings" value={form.availability} onChange={(e) => handleChange('availability', e.target.value)} autoFocus />
                                        </div>
                                        
                                        <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-2xl p-6 mt-8">
                                            <h4 className="font-urbanist font-semibold text-[var(--text-primary)] mb-4">Summary</h4>
                                            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                                                <li className="flex justify-between"><span className="text-[var(--text-muted)]">Type:</span> <span className="font-medium text-[var(--text-primary)] capitalize">{form.type} {form.is_resource ? '(Resource)' : ''}</span></li>
                                                <li className="flex justify-between"><span className="text-[var(--text-muted)]">Title:</span> <span className="font-medium text-[var(--text-primary)]">{form.title}</span></li>
                                                <li className="flex justify-between"><span className="text-[var(--text-muted)]">Category:</span> <span className="font-medium text-[var(--text-primary)]">{CATEGORY_LABELS[form.category]}</span></li>
                                                <li className="flex justify-between"><span className="text-[var(--text-muted)]">Value:</span> <span className="font-medium text-[var(--text-primary)]">{form.estimated_hours} credits</span></li>
                                                {form.type === 'offer' && form.max_participants > 1 && (
                                                    <li className="flex justify-between"><span className="text-[var(--text-muted)]">Group Size:</span> <span className="font-medium text-[var(--success-text)]">Up to {form.max_participants} people</span></li>
                                                )}
                                                {form.type === 'offer' && form.premium_rate_allowed && (
                                                    <li className="flex justify-between"><span className="text-[var(--text-muted)]">Private Booking:</span> <span className="font-medium text-amber-400">2x Premium Available</span></li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer Controls */}
                    <div className="p-6 md:px-8 border-t border-[var(--border)] bg-[var(--bg-secondary)]/30 flex justify-between items-center">
                        <button 
                            type="button" 
                            onClick={prevStep} 
                            disabled={step === 1}
                            className={`flex items-center gap-2 py-3 px-6 rounded-full font-medium transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] cursor-pointer'}`}
                        >
                            <ChevronLeftIcon size={18} /> Back
                        </button>
                        
                        {step < totalSteps ? (
                            <button 
                                type="button" 
                                onClick={nextStep}
                                className="flex items-center gap-2 py-3 px-8 bg-[var(--accent)] text-[var(--accent-text)] rounded-full font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-lg"
                            >
                                Next <ChevronRightIcon size={18} />
                            </button>
                        ) : (
                            <button 
                                type="button" 
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 py-3 px-8 bg-[var(--accent)] text-[var(--accent-text)] rounded-full font-bold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-lg shadow-[var(--accent)]/20"
                            >
                                {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-[var(--accent-text)]" /> Creating...</>) : (<><SendIcon size={18} /> {form.type === 'offer' ? 'Publish Offer' : 'Post Request'}</>)}
                            </button>
                        )}
                    </div>
                </AnimatedContent>
            </div>
        </section>
    );
}
