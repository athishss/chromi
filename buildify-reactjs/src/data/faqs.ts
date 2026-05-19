import type { IFaq } from "../../types";

export const faqs: IFaq[] = [
    {
        question: "How do time credits work?",
        answer: "Every hour you spend helping someone earns you 1 time credit. You can then spend those credits to receive services from anyone else on the platform. New users start with 2 bonus credits so they can begin receiving help right away."
    },
    {
        question: "Are all services really valued equally?",
        answer: "Yes — that's our core principle. Whether you're teaching calculus, fixing a leaky faucet, or walking someone's dog, 1 hour = 1 credit. However, our dynamic valuation system may apply small multipliers (e.g., 1.2x) for high-demand skills in your community, rewarding providers where supply is low."
    },
    {
        question: "How does the intelligent matching system work?",
        answer: "Our matching engine considers multiple factors: skill-to-need alignment, user ratings, availability overlap, community proximity, and completion history. It also detects multi-hop chains — so even if no one directly needs your skill, the engine can find an indirect exchange path."
    },
    {
        question: "What if someone doesn't show up or deliver?",
        answer: "Every exchange affects your completion score and trust rating. Repeated no-shows or disputes lower your score, reducing your visibility in match results. Severe violations can lead to temporary suspension. We also offer a dispute resolution process."
    },
    {
        question: "Can I lend physical items too?",
        answer: "Absolutely. You can list items like laptops, cameras, tools, or books under our Resource Lending category. You earn time credits for lending periods, and borrowers spend credits to access them. Items are protected by our trust and review system."
    },
    {
        question: "How are communities and clusters organized?",
        answer: "You can join or create community clusters — for example, your campus, apartment complex, or neighborhood. Clusters act as micro-economies with their own demand/supply dynamics, making matches more relevant and building local trust networks."
    }
];
