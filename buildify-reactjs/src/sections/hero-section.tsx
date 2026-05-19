import AnimatedContent from "../components/animated-content";
import CustomIcon from "../components/custom-icon";
import { SparkleIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function HeroSection() {
    return (
        <section className="bg-[var(--bg-page)] px-4 md:px-16 lg:px-24 xl:px-32">
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-screen">
                <AnimatedContent distance={30} delay={0.1} className="relative">
                    <h1 className="text-center font-urbanist text-5xl/15 md:text-6xl/18 mt-4 font-bold max-w-3xl">
                        Your Time Has Value. Exchange Skills, Not Money.
                    </h1>
                    <div className="absolute -top-5 right-13 hidden md:block">
                        <CustomIcon icon={SparkleIcon} dir="right" />
                    </div>
                </AnimatedContent>

                <AnimatedContent distance={30} delay={0.2}>
                    <p className="text-center text-base/7 text-[var(--text-secondary)] max-w-lg mt-4">
                        Chromi is a community-powered platform where 1 hour of any skill equals 1 hour of any other. Earn time credits by helping others and spend them to get the help you need.
                    </p>
                </AnimatedContent>

                <AnimatedContent className="flex flex-col md:flex-row items-center gap-4 mt-8 w-full md:w-auto">
                    <Link to="/signup" className="py-3 md:py-2.5 w-full md:w-auto px-8 bg-[var(--accent)] text-[var(--accent-text)] text-center rounded-full font-medium hover:opacity-90 transition-opacity">
                        Start Exchanging
                    </Link>
                    <a href="#features" className="relative py-3 md:py-2.5 w-full md:w-auto px-8 border border-[var(--border)] text-[var(--text-secondary)] font-medium text-center rounded-full hover:border-[var(--border-strong)] transition-colors">
                        See How It Works
                    </a>
                </AnimatedContent>
            </div>
        </section>
    );
}
