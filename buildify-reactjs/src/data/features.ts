import { BrainCircuitIcon, ShieldCheckIcon, ClockIcon, GitBranchIcon, PackageIcon, UsersIcon } from "lucide-react";
import type { IFeature } from "../../types";

export const features: IFeature[] = [
    {
        icon: BrainCircuitIcon,
        title: "Smart Matching Engine",
        description: "Our algorithm analyzes your skills, needs, and community context to surface the most relevant exchanges — ranked by match score, availability, and trust level.",
        cardBg: "bg-violet-50",
        iconBg: "bg-violet-500"
    },
    {
        icon: ShieldCheckIcon,
        title: "Trust & Reputation System",
        description: "Every exchange builds your reputation. Completion scores, verified reviews, and fraud detection ensure a safe, reliable community for everyone.",
        cardBg: "bg-emerald-50",
        iconBg: "bg-emerald-500"
    },
    {
        icon: ClockIcon,
        title: "Time Credits Economy",
        description: "Earn credits by helping others, spend them to get help. Dynamic valuation adjusts credit multipliers based on real-time demand and supply within your community.",
        cardBg: "bg-amber-50",
        iconBg: "bg-amber-500"
    },
    {
        icon: GitBranchIcon,
        title: "Multi-Hop Exchange",
        description: "Can't find a direct match? Our engine discovers indirect chains — A teaches B, B repairs for C, C cooks for A — enabling exchanges that wouldn't otherwise happen.",
        cardBg: "bg-blue-50",
        iconBg: "bg-blue-500"
    },
    {
        icon: PackageIcon,
        title: "Resource Lending",
        description: "Beyond skills, share physical items like laptops, speakers, tools, or books. Earn time credits for lending and borrow what you need without spending money.",
        cardBg: "bg-rose-50",
        iconBg: "bg-rose-500"
    },
    {
        icon: UsersIcon,
        title: "Community Clusters",
        description: "Join campus groups, apartment communities, or neighborhood circles. Micro-economies form organically, with local trust networks and cluster-specific demand insights.",
        cardBg: "bg-orange-50",
        iconBg: "bg-orange-500"
    }
];
