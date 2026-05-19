import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AnimatedContent from '../components/animated-content';
import { ClockIcon, MailIcon, LockIcon, LogInIcon, SunIcon, MoonIcon } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user, navigate]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (!email.trim() || !password) { setError('Please enter both email and password.'); return; }
        setLoading(true);
        try { await login(email.trim(), password); navigate('/dashboard'); }
        catch (err: unknown) { setError(err instanceof Error ? err.message : 'Login failed'); }
        finally { setLoading(false); }
    }

    return (
        <section className="bg-[var(--bg-page)] px-4 md:px-16 lg:px-24 xl:px-32">
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen py-12">
                <AnimatedContent reverse distance={30} className="mb-8 flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="bg-[var(--accent)] p-2.5 rounded-xl text-[var(--accent-text)]">
                            <ClockIcon size={28} />
                        </div>
                        <span className="font-urbanist font-bold text-2xl">Chromi</span>
                    </Link>
                    <button onClick={toggleTheme} className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer" title="Toggle theme">
                        {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
                    </button>
                </AnimatedContent>

                <AnimatedContent distance={30} delay={0.1} className="w-full max-w-md">
                    <div className="bg-[var(--bg-card)] backdrop-blur-lg rounded-2xl border border-[var(--border)] shadow-[var(--card-shadow)] p-8">
                        <div className="text-center mb-6">
                            <h1 className="font-urbanist text-3xl font-bold">Welcome Back</h1>
                            <p className="text-[var(--text-secondary)] mt-2">Sign in to your Chromi account</p>
                        </div>

                        {error && <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-xl p-3 mb-4 text-[var(--error-text)] text-sm" id="login-error">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5" htmlFor="login-email">
                                    <MailIcon size={14} className="inline mr-1.5 -translate-y-px" /> Email
                                </label>
                                <input id="login-email" type="email" className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/50 transition-all" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5" htmlFor="login-password">
                                    <LockIcon size={14} className="inline mr-1.5 -translate-y-px" /> Password
                                </label>
                                <input id="login-password" type="password" className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/50 transition-all" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3 bg-[var(--accent)] text-[var(--accent-text)] rounded-full font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer" id="login-submit">
                                {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-[var(--accent-text)]" /> Signing in...</>) : (<><LogInIcon size={18} /> Sign In</>)}
                            </button>
                        </form>

                        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
                            Don't have an account? <Link to="/signup" className="text-[var(--text-primary)] font-medium hover:underline">Create one</Link>
                        </p>
                    </div>
                </AnimatedContent>
            </div>
        </section>
    );
}
