import { ClockIcon } from "lucide-react";
import AnimatedContent from "./animated-content";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

export default function Footer() {
    const { user } = useAuth();
    const location = useLocation();

    // Hide footer on auth pages
    if (['/login', '/signup'].includes(location.pathname)) return null;

    const isLanding = location.pathname === '/' && !user;

    // Full footer on landing page
    if (isLanding) {
        return (
            <footer className="px-4 md:px-16 lg:px-24 xl:px-32">
                <div className="border-x border-[var(--border)] px-4 md:px-12 max-w-7xl mx-auto pt-16">
                    <div className="flex flex-col md:flex-row items-start justify-between relative p-8 md:p-12 overflow-hidden pb-20 md:pb-28 bg-[var(--bg-muted)] rounded-t-2xl">
                        <AnimatedContent distance={40} className="max-w-80">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="bg-[var(--accent)] p-1.5 rounded-lg text-[var(--accent-text)]">
                                    <ClockIcon size={20} />
                                </div>
                                <span className="font-urbanist font-bold text-xl">Chromi</span>
                            </div>
                            <p className="text-[var(--text-secondary)] pb-6">
                                Community-powered service exchange. Trade skills using time as currency — equitable, digital, and trust-based.
                            </p>
                        </AnimatedContent>
                        <AnimatedContent className="text-[var(--text-muted)] text-sm mt-6 md:mt-0">
                            <p>© {new Date().getFullYear()} Chromi. All rights reserved.</p>
                        </AnimatedContent>
                    </div>
                </div>
            </footer>
        );
    }

    // Minimal footer on app pages
    return (
        <footer className="px-4 md:px-16 lg:px-24 xl:px-32 pb-6 pt-12">
            <div className="max-w-7xl mx-auto border-t border-[var(--border)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
                    <ClockIcon size={14} />
                    <span>Chromi</span>
                </div>
                <p className="text-[var(--text-muted)] text-xs">
                    © {new Date().getFullYear()} Chromi. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
