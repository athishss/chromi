import AnimatedContent from "../components/animated-content";
import SectionTitle from "../components/section-title";
import { ListPlusIcon, BrainCircuitIcon, HandshakeIcon, ArrowRightIcon, ClockIcon } from "lucide-react";

const steps = [
    {
        icon: ListPlusIcon,
        step: "01",
        title: "List Your Skills",
        description: "Tell the community what you can offer — tutoring, cooking, repairs, design — or what you need help with. Set your estimated hours and availability."
    },
    {
        icon: BrainCircuitIcon,
        step: "02",
        title: "Get Matched",
        description: "Our intelligent matching engine finds the best skill-for-skill exchanges. It considers your needs, ratings, proximity, and even multi-hop paths for indirect matches."
    },
    {
        icon: HandshakeIcon,
        step: "03",
        title: "Exchange & Earn",
        description: "Complete the exchange, leave a review, and earn time credits. Spend your credits on any other service — 1 hour of your skill is worth 1 hour of any other."
    }
];

export default function HowItWorksSection() {
    return (
        <section id="how-it-works" className="border-y border-[var(--border)] px-4 md:px-16 lg:px-24 xl:px-32">
            <div className="p-4 pt-20 md:p-20 flex flex-col items-center max-w-7xl mx-auto justify-center border-x border-[var(--border)]">
                <SectionTitle
                    icon={ClockIcon}
                    title="How It Works"
                    subtitle="Three simple steps from listing your skill to earning time credits. No money involved, no complex setup."
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full">
                    {steps.map((s, index) => (
                        <AnimatedContent key={index} delay={index * 0.12} className="relative p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="bg-[var(--accent)] text-[var(--accent-text)] p-2.5 rounded-lg">
                                    <s.icon size={22} />
                                </div>
                                <span className="text-4xl font-urbanist font-bold text-[var(--bg-muted)]">{s.step}</span>
                            </div>
                            <h3 className="text-lg font-semibold font-urbanist">{s.title}</h3>
                            <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">{s.description}</p>
                            {index < steps.length - 1 && (
                                <ArrowRightIcon size={20} className="absolute -right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hidden md:block" />
                            )}
                        </AnimatedContent>
                    ))}
                </div>
            </div>
        </section>
    );
}
