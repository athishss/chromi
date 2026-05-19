import AnimatedContent from "../components/animated-content";
import SectionTitle from "../components/section-title";
import { faqs } from "../data/faqs";
import { ChevronDownIcon, CircleHelpIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function FaqSection() {
    return (
        <section id="faq" className="border-b border-[var(--border)]">
            <div className="px-4 md:px-16 lg:px-24 xl:px-32">
                <div className="p-4 pt-20 md:p-20 flex flex-col items-center max-w-7xl mx-auto justify-center border-x border-[var(--border)]">
                    <SectionTitle icon={CircleHelpIcon} title="Got Questions?" subtitle="Everything you need to know about Chromi, how time credits work, and what makes it different." />
                </div>
            </div>
            <div className="px-4 md:px-16 lg:px-24 xl:px-32 border-t border-[var(--border)]">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-[var(--border)] border-x border-[var(--border)] max-w-7xl mx-auto">
                    <div className="p-4 pt-12 md:p-16 space-y-4">
                        {faqs.map((faq, index) => (
                            <AnimatedContent key={index}>
                                <details className="group bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl" open={index === 0}>
                                    <summary className="flex items-center justify-between p-5 select-none cursor-pointer">
                                        <h3 className="font-medium text-base pr-4">{faq.question}</h3>
                                        <ChevronDownIcon size={20} className="group-open:rotate-180 transition-transform shrink-0 text-[var(--text-muted)]" />
                                    </summary>
                                    <p className="text-sm/6 text-[var(--text-secondary)] max-w-md p-5 pt-0">{faq.answer}</p>
                                </details>
                            </AnimatedContent>
                        ))}
                    </div>
                    <div className="p-4 pt-12 md:p-16">
                        <div className="sticky top-30 flex items-center justify-between gap-5 p-6 bg-[var(--accent)] w-full rounded-xl">
                            <h3 className="text-lg text-[var(--accent-text)] text-balance">
                                Ready to exchange your skills? Join Chromi and start earning time credits today.
                            </h3>
                            <Link to="/signup" className="bg-[var(--bg-card)] text-[var(--text-primary)] w-max shrink-0 hover:opacity-90 px-5 py-2 rounded-full transition-opacity">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
