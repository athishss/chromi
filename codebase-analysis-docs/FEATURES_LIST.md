# Chromi Features List

This document provides a comprehensive, itemized list of every single feature implemented in the Chromi platform, derived from analyzing the codebase (routes, database schema, services, and UI components).

## 1. Authentication & Onboarding
- **User Registration:** Sign up with email, password, and full name.
- **Invite-to-Earn (Referral System):** Users can join via a referral link (`?ref=id`). Referrers earn 1.0 time credit for every 5 referred users who complete an exchange.
- **Login/Logout:** Secure JWT-based authentication via Supabase.
- **Auto-Profile Creation:** Database trigger automatically creates a public profile row when an auth user is created.

## 2. Service Listings (Marketplace)
- **Create Listing:** Users can post skills they are offering or skills they are requesting.
- **Categorization:** Listings are tagged by category (tutoring, repair, design, cooking, music, tech, fitness, language, photography, writing, gardening, other).
- **Priority Marking:** Listings can be marked as 'normal' or 'urgent'.
- **Browse & Search:** View all active marketplace listings.
- **Delete Listing:** Users can remove their own listings.

## 3. The Exchange Lifecycle
- **Request an Exchange:** Users can initiate a swap based on a listing.
- **Accept/Reject Exchange:** Providers review incoming requests.
- **Status Tracking:** Exchanges flow through states: `pending` → `accepted` → `in_progress` → `completed` → `cancelled`/`disputed`.
- **Double-Counting Protection:** Backend safeguards prevent the same exchange from crediting multiple times.
- **Partial Completions:** Support for partial exchange completion.

## 4. Time Credit Economy (The Wallet)
- **Credit Balance Tracking:** Exact decimal tracking of time credits (hours).
- **Escrow Locking:** When an exchange is requested/accepted, the requester's credits are locked in escrow to guarantee payment.
- **Escrow Release/Transfer:** Upon completion, credits move from escrow to the provider.
- **Dynamic Scarcity Multipliers:** Algorithmic calculation of skill value based on supply/demand ratio (e.g., highly requested tech skills might earn a 1.3x multiplier).
- **Scarcity Bonus:** Auto-awards an extra 0.25h bonus for filling high-demand (scarce) requests.
- **Credit Borrowing:** Users with sufficient trust scores can borrow credits against future earnings, allowing their balance to go negative up to a defined limit.
- **Transaction Ledger:** Detailed, immutable ledger tracking `earn`, `spend`, `escrow_lock`, `escrow_release`, `penalty`, `bonus`, and `borrow` events.

## 5. DeFi Staking System
- **Liquidity Pools:** Users can lock their time credits in a staking pool.
- **Lock Periods:** Options for 1 week or 1 month lockups.
- **Yield Generation:** Users earn APY (7-15%) on staked time credits.
- **Auto-Compounding:** Optional toggle to automatically reinvest yields.
- **Emergency Unstaking:** Users can withdraw early with a 10% penalty.

## 6. Trust & Reputation System
- **Trust Score:** Numerical score (0-100) reflecting a user's reliability.
- **Punctuality Score:** Tracks how often users show up on time.
- **User Reviews & Ratings:** 1-5 star ratings and written feedback post-exchange.
- **Skill Endorsements:** Users can endorse specific skills of other users, building a LinkedIn-style reputation graph.
- **Penalty System:** Deducts credits for late cancellations or bad behavior.

## 7. Collateral & Resource Bartering
- **Resource Lending:** Allows lending physical items (e.g., tools, equipment) instead of just time.
- **Collateral Proposals:** Users can attach physical items or photo URLs as collateral to guarantee an exchange.
- **Condition Tracking:** Logs item condition before and after lending, with photo evidence support.
- **Damage Reporting:** Escrow/deposits can be withheld if items are returned damaged.

## 8. Dispute Resolution
- **File a Dispute:** If an exchange goes wrong, either party can freeze it and file a dispute.
- **Status Management:** Disputes move from `open` → `investigating` → `resolved`/`dismissed`.

## 9. Gamification & Rewards
- **Daily Check-In Modal:** Users can claim a small fraction of a credit (0.1h) by logging in daily. Modal shows a 7-day visual streak.
- **Milestone Badges:** Users earn achievements (e.g., "First Swap", "Community Pillar").
- **Backend Validation:** Strict unique constraints prevent users from double-claiming daily or milestone rewards.

## 10. Community & Social Hub
- **Campus/Community Groups:** Users can create and join local groups.
- **Leaderboards:** Ranks users within a community based on hours exchanged or trust score.
- **Live Events / Broadcasting:** Users can 'Go Live' to offer mass tutoring or workshops, showing up on a "Live Now" feed.

## 11. Scheduling & Waitlists
- **Exchange Scheduling:** Attach a start and end time to an accepted exchange.
- **Resource Calendar:** View availability of physical resources.
- **Skill Waitlist:** If no provider is available for a skill, users can join a waitlist and get notified when a provider posts a relevant listing.

## 12. Analytics & Market Insights
- **Market Dynamics Sidebar:** Visualizes which skills are currently in high demand.
- **Demand/Supply Heatmaps:** Platform-wide analytics on skill liquidity.
- **System Metrics:** Tracks total active users, hours exchanged, and economic health.

## 13. AI Chatbot
- **Integrated Assistant:** Gemini-powered chatbot to help users navigate the platform, suggest matches, or mediate basic disputes.
