import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AnimatedContent from '../components/animated-content';
import { ClockIcon, MailIcon, LockIcon, UserPlusIcon, SunIcon, MoonIcon, UserIcon } from 'lucide-react';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const refCode = searchParams.get('ref') || undefined;

    // Redirect if already logged in
    useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user, navigate]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!fullName.trim() || !email.trim() || !password || !confirmPassword) { setError('Please fill in all fields.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        setLoading(true);
        try {
            await signup(email.trim(), password, fullName.trim(), refCode);
            setSuccess('Account created! Check your email to verify, then sign in.');
            setTimeout(() => navigate('/login'), 3000);
        }
        catch (err: unknown) { setError(err instanceof Error ? err.message : 'Signup failed'); }
        finally { setLoading(false); }
    }

    const inputClass = "w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/50 transition-all";

    return (
        <section className="bg-[var(--bg-page)] px-4 md:px-16 lg:px-24 xl:px-32">
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen py-12">
                <AnimatedContent reverse distance={30} className="mb-8 flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="bg-[var(--accent)] p-2.5 rounded-xl text-[var(--accent-text)]"><ClockIcon size={28} /></div>
                        <span className="font-urbanist font-bold text-2xl">Chromi</span>
                    </Link>
                    <button onClick={toggleTheme} className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer" title="Toggle theme">
                        {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
                    </button>
                </AnimatedContent>

                <AnimatedContent distance={30} delay={0.1} className="w-full max-w-md">
                    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-[var(--card-shadow)] p-8">
                        <div className="text-center mb-6">
                            <h1 className="font-urbanist text-3xl font-bold">Join Chromi</h1>
                            <p className="text-[var(--text-secondary)] mt-2">Create your account and start exchanging skills</p>
                        </div>

                        {error && <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-xl p-3 mb-4 text-[var(--error-text)] text-sm" id="signup-error">{error}</div>}
                        {success && <div className="bg-[var(--success-bg)] border border-[var(--success-border)] rounded-xl p-3 mb-4 text-[var(--success-text)] text-sm" id="signup-success">{success}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5" htmlFor="signup-name"><UserIcon size={14} className="inline mr-1.5 -translate-y-px" /> Full Name</label>
                                <input id="signup-name" type="text" className={inputClass} placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5" htmlFor="signup-email"><MailIcon size={14} className="inline mr-1.5 -translate-y-px" /> Email</label>
                                <input id="signup-email" type="email" className={inputClass} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5" htmlFor="signup-password"><LockIcon size={14} className="inline mr-1.5 -translate-y-px" /> Password</label>
                                <input id="signup-password" type="password" className={inputClass} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5" htmlFor="signup-confirm"><LockIcon size={14} className="inline mr-1.5 -translate-y-px" /> Confirm Password</label>
                                <input id="signup-confirm" type="password" className={inputClass} placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3 bg-[var(--accent)] text-[var(--accent-text)] rounded-full font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer" id="signup-submit">
                                {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-[var(--accent-text)]" /> Creating...</>) : (<><UserPlusIcon size={18} /> Create Account</>)}
                            </button>
                        </form>

                        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
                            Already have an account? <Link to="/login" className="text-[var(--text-primary)] font-medium hover:underline">Sign in</Link>
                        </p>
                    </div>
                </AnimatedContent>
            </div>
        </section>
    );
}
