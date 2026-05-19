import type { LucideIcon } from "lucide-react";

// ── Reusable component types ───────────────────────────────
export interface ILink {
    name: string;
    href: string;
};

export interface ICustomIcon {
    icon: LucideIcon;
    dir?: 'left' | 'right';
};

export interface ISectionTitle {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    dir?: 'left' | 'center';
};

export interface IFeature {
    icon: LucideIcon;
    title: string;
    description: string;
    cardBg?: string;
    iconBg?: string;
};

export interface IFaq {
    question: string;
    answer: string;
};

// ── Chromi domain types ──────────────────────────────────

export type ServiceCategory =
    | 'tutoring'
    | 'repair'
    | 'design'
    | 'cooking'
    | 'music'
    | 'tech'
    | 'fitness'
    | 'language'
    | 'photography'
    | 'writing'
    | 'gardening'
    | 'other';

export type ListingType = 'offer' | 'request';
export type ListingStatus = 'active' | 'paused' | 'completed' | 'in_progress';

export type ExchangeStatus =
    | 'pending'
    | 'accepted'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'disputed';

export interface IServiceListing {
    id: string;
    user_id: string;
    title: string;
    category: ServiceCategory;
    description: string;
    estimated_hours: number;
    type: ListingType;
    status: ListingStatus;
    availability?: string;
    priority?: 'normal' | 'urgent';
    is_resource?: boolean;
    resource_deposit?: number;
    resource_condition?: string;
    tags?: string[];
    demand_count?: number;
    max_participants?: number;
    premium_rate_allowed?: boolean;
    created_at: string;
    updated_at: string;
    // Joined fields
    user_name?: string;
    user_rating?: number;
    trust_score?: number;
    is_verified?: boolean;
};

export interface IExchange {
    id: string;
    listing_id: string;
    provider_id: string;
    requester_id: string;
    status: ExchangeStatus;
    hours_exchanged: number;
    scheduled_at?: string;
    scheduled_end_at?: string;
    escrow_locked?: boolean;
    escrow_amount?: number;
    is_partial?: boolean;
    is_private?: boolean;
    collateral_item?: string;
    collateral_photo_url?: string;
    created_at: string;
    completed_at?: string;
    // Joined fields
    listing?: IServiceListing;
    provider_name?: string;
    requester_name?: string;
    provider_email?: string;
    requester_email?: string;
};

export interface IStakedDeposit {
    id: string;
    user_id: string;
    amount: number;
    lock_period: '1_week' | '1_month';
    expected_yield: number;
    status: 'active' | 'completed' | 'slashed';
    auto_compound: boolean;
    unlocks_at: string;
    created_at: string;
}

export interface IUserProfile {
    id: string;
    email?: string;
    full_name: string;
    bio: string;
    skills: string[];
    time_balance: number;
    rating: number;
    completion_score: number;
    total_exchanges: number;
    community: string;
    campus?: string;
    trust_score?: number;
    punctuality_score?: number;
    endorsements_count?: number;
    is_verified?: boolean;
    badges?: string[];
    negative_balance_allowed?: boolean;
    max_negative?: number;
    total_cancellations?: number;
    fraud_flags?: number;
    hours_given?: number;
    hours_received?: number;
    timetable_url?: string;
    created_at: string;
    updated_at: string;
};

export interface IReview {
    id: string;
    exchange_id: string;
    reviewer_id: string;
    reviewee_id: string;
    rating: number;
    comment: string;
    created_at: string;
    reviewer_name?: string;
};

export interface IMatchSuggestion {
    listing: IServiceListing;
    match_score: number;
    match_reason: string;
    credit_multiplier: number;
    is_multi_hop?: boolean;
    hop_path?: string[];
    is_partial_candidate?: boolean;
};

export interface INotification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
    is_read: boolean;
    created_at: string;
};

export interface ICreditTransaction {
    id: string;
    user_id: string;
    amount: number;
    type: 'earn' | 'spend' | 'escrow_lock' | 'escrow_release' | 'penalty' | 'bonus' | 'borrow';
    reference_id?: string;
    description: string;
    balance_after: number;
    created_at: string;
};

export interface ICreditData {
    balance: number;
    locked_in_escrow: number;
    available_to_spend: number;
    negative_allowed: boolean;
    max_negative: number;
    successful_referrals?: number;
    transactions: ICreditTransaction[];
};

export interface IDispute {
    id: string;
    exchange_id: string;
    filed_by: string;
    against: string;
    reason: string;
    status: 'open' | 'investigating' | 'resolved' | 'dismissed';
    resolution_notes?: string;
    created_at: string;
    resolved_at?: string;
    exchanges?: IExchange;
};

export interface IEndorsement {
    id: string;
    endorser_id: string;
    endorsed_id: string;
    skill: string;
    comment?: string;
    created_at: string;
    endorser?: { full_name: string; avatar_url?: string; trust_score?: number };
};

export interface ICommunityGroup {
    id: string;
    name: string;
    campus?: string;
    description?: string;
    created_by?: string;
    member_count: number;
    created_at: string;
};

export interface ILeaderboardEntry {
    id: string;
    full_name: string;
    avatar_url?: string;
    campus?: string;
    hours_given: number;
    trust_score: number;
    badges?: string[];
};

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
    tutoring: '📚 Tutoring',
    repair: '🔧 Repair',
    design: '🎨 Design',
    cooking: '🍳 Cooking',
    music: '🎵 Music',
    tech: '💻 Tech',
    fitness: '💪 Fitness',
    language: '🌍 Language',
    photography: '📷 Photography',
    writing: '✍️ Writing',
    gardening: '🌱 Gardening',
    other: '📦 Other',
};

export const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as ServiceCategory[];

export const EXCHANGE_STATUS_LABELS: Record<ExchangeStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    disputed: 'Disputed',
};
