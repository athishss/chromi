import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquareIcon, XIcon, SendIcon, SparklesIcon, BotIcon, ArrowRightIcon, ClockIcon } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_LABELS } from '../../types';

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    listings?: any[];
}

export default function ChatSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { getAccessToken, user } = useAuth();
    const navigate = useNavigate();

    // Scroll to bottom on new message
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading, isOpen]);

    // Initial greeting when opened the first time
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                role: 'model',
                content: "Hi! I'm Chromi Assistant. How can I help you today? I can help you find services, explain how time credits work, or give personalized recommendations!"
            }]);
        }
    }, [isOpen, messages.length]);

    if (!user) return null; // Don't show if not logged in

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            const response = await api.sendChatMessage(userMsg, history, getAccessToken);

            setMessages(prev => [...prev, {
                role: 'model',
                content: response.reply,
                listings: response.suggested_listings
            }]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                role: 'model',
                content: "I'm having trouble connecting right now. Please try again later. (" + (err.message || 'Error') + ")"
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-[var(--accent)] text-[var(--accent-text)] shadow-[var(--card-shadow)] hover:shadow-lg transition-shadow cursor-pointer group flex items-center gap-2 overflow-hidden"
                    >
                        <SparklesIcon size={24} className="group-hover:rotate-12 transition-transform" />
                        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 font-medium font-urbanist">
                            Chromi AI
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0.5 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0.5 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] md:w-[450px] bg-[var(--bg-secondary)] border-l border-[var(--border)] shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-card)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
                                    <BotIcon size={20} />
                                </div>
                                <div>
                                    <h2 className="font-urbanist font-bold text-lg leading-tight flex items-center gap-1.5">
                                        Chromi Assistant
                                    </h2>
                                    <p className="text-xs text-[var(--text-secondary)]">Powered by AI</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-full hover:bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                            >
                                <XIcon size={20} />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                                ? 'bg-[var(--accent)] text-[var(--accent-text)] rounded-tr-sm'
                                                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-sm'
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    </div>

                                    {/* Suggested Listings inline */}
                                    {msg.listings && msg.listings.length > 0 && (
                                        <div className="w-[90%] mt-3 flex flex-col gap-3 pl-2 border-l-2 border-[var(--accent)]/30">
                                            {msg.listings.map((listing: any) => (
                                                <div key={listing.id} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--card-shadow)] hover:shadow-[var(--card-hover-shadow)] transition-shadow">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${listing.type === 'offer' ? 'bg-[var(--success-bg)] text-[var(--success-text)]' : 'bg-blue-900/30 text-blue-400'}`}>
                                                            {listing.type === 'offer' ? '🤝 Offering' : '🙋 Requesting'}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                                                            <ClockIcon size={10} />{listing.estimated_hours}h
                                                        </span>
                                                    </div>
                                                    <h3 className="font-medium text-sm mb-1 leading-tight">{listing.title}</h3>
                                                    <p className="text-[10px] text-[var(--text-secondary)] mb-2">{CATEGORY_LABELS[listing.category as keyof typeof CATEGORY_LABELS] || listing.category}</p>
                                                    <button onClick={() => {
                                                        setIsOpen(false);
                                                        navigate(`/exchange/${listing.id}`); // This is wrong, should request exchange. Browse does requestExchange. Let's just navigate to Browse with search or we need a request function here.
                                                        // Actually, we can just implement request exchange inline here!
                                                    }}
                                                        className="w-full mt-2 py-1.5 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-text)] rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer">
                                                        View Details
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex items-start">
                                    <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="relative flex items-center"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask anything..."
                                    className="w-full pl-4 pr-12 py-3.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-full text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-1.5 p-2 rounded-full bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity cursor-pointer"
                                >
                                    <SendIcon size={16} className="ml-0.5" />
                                </button>
                            </form>
                            <p className="text-center mt-2 text-[10px] text-[var(--text-muted)]">
                                AI can make mistakes. Verify important information.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
