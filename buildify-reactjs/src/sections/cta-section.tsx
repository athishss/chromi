import AnimatedContent from "../components/animated-content";
import { ArrowRightIcon, ClockIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function CtaSection() {
    return (
        <section className="px-4 md:px-16 lg:px-24 xl:px-32">
            <div className="border-x border-[var(--border)] max-w-7xl mx-auto">
                <AnimatedContent className="m-4 md:m-16 p-8 md:p-16 bg-[var(--accent)] rounded-2xl text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-[var(--accent-text)]/20 backdrop-blur p-3 rounded-xl">
                            <ClockIcon size={32} className="text-[var(--accent-text)]" />
                        </div>
                    </div>
                    <h2 className="font-urbanist text-3xl md:text-4xl font-bold text-[var(--accent-text)] max-w-xl mx-auto">
                        Stop paying. Start exchanging.
                    </h2>
                    <p className="text-[var(--accent-text)]/70 mt-4 max-w-md mx-auto">
                        Join Chromi and access services through contribution, not cash. Your skills have value — let the community benefit from them.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                        <Link to="/signup" className="py-3 px-8 bg-[var(--bg-card)] text-[var(--text-primary)] font-semibold rounded-full flex items-center gap-2 hover:opacity-90 transition-opacity">
                            Create Free Account <ArrowRightIcon size={18} />
                        </Link>
                        <Link to="/login" className="py-3 px-8 border border-[var(--accent-text)]/30 text-[var(--accent-text)] rounded-full hover:border-[var(--accent-text)]/60 transition-colors">
                            Sign In
                        </Link>
                    </div>
                </AnimatedContent>
            </div>
        </section>
    );
}
