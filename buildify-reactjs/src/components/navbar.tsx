import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { links } from "../data/links";
import { api } from "../services/api";
import AnimatedContent from "./animated-content";
import type { ILink } from "../../types";
import { MenuIcon, XIcon, LogOutIcon, ClockIcon, PlusIcon, LayoutDashboardIcon, SunIcon, MoonIcon, UserIcon, SearchIcon, BellIcon, WalletIcon, UsersIcon, BarChart3Icon, CalendarIcon, GiftIcon, ShieldIcon } from "lucide-react";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const { user, logout, getAccessToken } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (user) {
            api.getUnreadCount(getAccessToken).then(d => setUnread(d?.count || 0)).catch(() => {});
            const interval = setInterval(() => {
                api.getUnreadCount(getAccessToken).then(d => setUnread(d?.count || 0)).catch(() => {});
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    async function handleLogout() {
        try { await logout(); navigate('/login'); }
        catch (err) { console.error('Logout failed:', err); }
    }

    if (['/login', '/signup'].includes(location.pathname)) return null;

    const isLanding = location.pathname === '/';

    const ThemeToggle = () => (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            id="theme-toggle"
        >
            {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
    );

    // ─── PUBLIC NAVBAR (Landing Page) ────────────────────────
    if (isLanding && !user) {
        return (
            <>
                <AnimatedContent reverse>
                    <nav className="fixed w-full top-0 z-50 px-4 md:px-16 lg:px-24 xl:px-32 py-4 border-b transition-all duration-300 border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-lg">
                        <div className="max-w-7xl mx-auto flex items-center justify-between">
                            <a href="/" className="flex items-center gap-2.5">
                                <div className="bg-[var(--accent)] p-1.5 rounded-lg text-[var(--accent-text)]">
                                    <ClockIcon size={20} />
                                </div>
                                <span className="font-urbanist font-bold text-xl">Chromi</span>
                            </a>

                            <div className="hidden md:flex gap-3">
                                {links.map((link: ILink) => (
                                    <a key={link.name} href={link.href} className="py-1 px-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                        {link.name}
                                    </a>
                                ))}
                            </div>

                            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                <MenuIcon className="size-6.5" />
                            </button>

                            <div className="hidden md:flex items-center gap-3">
                                <ThemeToggle />
                                <Link to="/login" className="py-2 px-5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                    Sign In
                                </Link>
                                <Link to="/signup" className="py-2 px-5 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-sm hover:opacity-90 transition-opacity">
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </nav>
                </AnimatedContent>

                {/* Mobile menu — landing */}
                <div className={`fixed top-0 right-0 z-60 w-full bg-[var(--bg-card)] shadow-xl transition-all duration-300 ease-in-out ${isMenuOpen ? "h-auto pb-4 overflow-hidden" : "h-0 overflow-hidden"}`}>
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-[var(--accent)] p-1.5 rounded-lg text-[var(--accent-text)]"><ClockIcon size={20} /></div>
                            <span className="font-urbanist font-bold text-xl">Chromi</span>
                        </div>
                        <XIcon className="size-6.5 cursor-pointer" onClick={() => setIsMenuOpen(false)} />
                    </div>
                    <div className="flex flex-col gap-4 p-4 text-base">
                        {links.map((link: ILink) => (
                            <a key={link.name} href={link.href} className="py-1 px-3" onClick={() => setIsMenuOpen(false)}>{link.name}</a>
                        ))}
                        <div className="flex items-center gap-3 px-3">
                            <ThemeToggle />
                            <span className="text-sm text-[var(--text-muted)]">{theme === 'dark' ? 'Dark' : 'Light'} mode</span>
                        </div>
                        <Link to="/login" className="py-1 px-3" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                        <Link to="/signup" className="py-2.5 px-6 w-max text-sm bg-[var(--accent)] text-[var(--accent-text)] rounded-full" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
                    </div>
                </div>
            </>
        );
    }

    // ─── AUTHENTICATED NAVBAR (App Pages) ────────────────────
    if (!user) return null;

    return (
        <>
            <AnimatedContent reverse>
                <nav className="fixed w-full top-0 z-50 px-4 md:px-16 lg:px-24 xl:px-32 py-4 border-b transition-all duration-300 border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-lg">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <Link to="/dashboard" className="flex items-center gap-2.5">
                            <div className="bg-[var(--accent)] p-1.5 rounded-lg text-[var(--accent-text)]">
                                <ClockIcon size={20} />
                            </div>
                            <span className="font-urbanist font-bold text-xl">Chromi</span>
                        </Link>

                        <div className="hidden md:flex gap-3">
                            <Link to="/dashboard" className="py-1 px-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors">
                                <LayoutDashboardIcon size={16} /> Dashboard
                            </Link>
                            <Link to="/offer" className="py-1 px-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors">
                                <PlusIcon size={16} /> Offer
                            </Link>
                            <Link to="/browse" className="py-1 px-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors">
                                <SearchIcon size={16} /> Browse
                            </Link>
                            <Link to="/community" className="py-1 px-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors">
                                <UsersIcon size={16} /> Community
                            </Link>
                            <Link to="/rewards" className="py-1 px-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors">
                                <GiftIcon size={16} /> Rewards
                            </Link>
                            {user.email === 'athishs999@gmail.com' && (
                                <Link to="/admin" className="py-1 px-3 text-[var(--text-secondary)] hover:text-[var(--accent)] flex items-center gap-1.5 transition-colors font-semibold">
                                    <ShieldIcon size={16} /> Admin
                                </Link>
                            )}
                        </div>

                        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <MenuIcon className="size-6.5" />
                        </button>

                        <div className="hidden md:flex items-center gap-3">
                            <Link to="/wallet" className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-muted)] transition-colors" title="Wallet">
                                <WalletIcon size={18} />
                            </Link>
                            <Link to="/notifications" className="relative p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-muted)] transition-colors" title="Notifications">
                                <BellIcon size={18} />
                                {unread > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--error-text)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>
                                )}
                            </Link>
                            <ThemeToggle />
                            <Link to="/profile" className="text-sm text-[var(--text-muted)] truncate max-w-40 hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors">
                                <UserIcon size={14} /> {user.email}
                            </Link>
                            <button onClick={handleLogout} className="py-2 px-5 bg-[var(--accent)] text-[var(--accent-text)] rounded-full flex items-center gap-2 text-sm cursor-pointer hover:opacity-90 transition-opacity" id="logout-btn">
                                <LogOutIcon size={14} /> Logout
                            </button>
                        </div>
                    </div>
                </nav>
            </AnimatedContent>

            {/* Mobile menu — authenticated */}
            <div className={`fixed top-0 right-0 z-60 w-full bg-[var(--bg-card)] shadow-xl transition-all duration-300 ease-in-out ${isMenuOpen ? "h-auto pb-4 overflow-hidden" : "h-0 overflow-hidden"}`}>
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-[var(--accent)] p-1.5 rounded-lg text-[var(--accent-text)]"><ClockIcon size={20} /></div>
                        <span className="font-urbanist font-bold text-xl">Chromi</span>
                    </div>
                    <XIcon className="size-6.5 cursor-pointer" onClick={() => setIsMenuOpen(false)} />
                </div>
                <div className="flex flex-col gap-4 p-4 text-base">
                    <Link to="/dashboard" className="py-1 px-3 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><LayoutDashboardIcon size={18} /> Dashboard</Link>
                    <Link to="/offer" className="py-1 px-3 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><PlusIcon size={18} /> Offer Service</Link>
                    <Link to="/browse" className="py-1 px-3 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><SearchIcon size={18} /> Browse</Link>
                    <Link to="/wallet" className="py-1 px-3 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><WalletIcon size={18} /> Wallet</Link>
                    <Link to="/community" className="py-1 px-3 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><UsersIcon size={18} /> Community</Link>
                    <Link to="/rewards" className="py-1 px-3 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><GiftIcon size={18} /> Rewards</Link>
                    <Link to="/analytics" className="py-1 px-3 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><BarChart3Icon size={18} /> Analytics</Link>
                    <Link to="/schedule" className="py-1 px-3 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><CalendarIcon size={18} /> Schedule</Link>
                    {user.email === 'athishs999@gmail.com' && (
                        <Link to="/admin" className="py-1 px-3 flex items-center gap-2 text-[var(--accent)] font-semibold" onClick={() => setIsMenuOpen(false)}><ShieldIcon size={18} /> Admin Panel</Link>
                    )}
                    <Link to="/notifications" className="py-1 px-3 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                        <BellIcon size={18} /> Notifications {unread > 0 && <span className="bg-[var(--error-text)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>}
                    </Link>
                    <div className="flex items-center gap-3 px-3">
                        <ThemeToggle />
                        <span className="text-sm text-[var(--text-muted)]">{theme === 'dark' ? 'Dark' : 'Light'} mode</span>
                    </div>
                    <Link to="/profile" className="py-1 px-3 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><UserIcon size={18} /> Profile</Link>
                    <span className="text-sm text-[var(--text-muted)] px-3">{user.email}</span>
                    <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="py-2.5 px-6 w-max text-sm bg-[var(--accent)] text-[var(--accent-text)] rounded-full cursor-pointer">
                        <LogOutIcon size={14} className="inline mr-1" /> Logout
                    </button>
                </div>
            </div>
        </>
    );
}
