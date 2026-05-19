# Chromi Codebase Knowledge Document

## PHASE 1: High-Level Overview

### 1. Application Purpose & Domain
**Chromi** is an advanced, gamified, community-driven "Time Bank" or skill-exchange platform. Instead of using fiat currency, users exchange "Time Credits" (hours) for services. The platform incorporates DeFi (Decentralized Finance) concepts, intelligent matching, and gamification into its economy.

**Target Users:** Students, campus communities, and local neighborhoods looking to barter skills, borrow time, and build trust without spending money.

### 2. Core Features
- **Service Listings:** Users can post "offers" (skills they can provide) and "requests" (skills they need).
- **Time Credit Economy (Wallet):** Users hold a balance of time credits. They can spend, earn, borrow, and stake these credits.
- **Collateral Escrow:** For high-value or physical exchanges, users can lock physical collateral.
- **Intelligent Matching:** Matches offers with requests based on category, skills, and proximity.
- **Gamification & Rewards:** Daily check-ins, invite-to-earn referral system, and milestone badges.
- **Trust & Dispute System:** Endorsements, user reviews, trust scores, and a dispute resolution flow.
- **Community Hub:** AI Chatbot integration and campus/community specific leaderboards.

### 3. Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router, GSAP & Framer Motion (for animations), Lucide React (icons).
- **Backend:** Node.js, Express.js.
- **Database & Authentication:** Supabase (PostgreSQL with Row Level Security).
- **AI Integrations:** Google GenAI (`@google/genai`) for chatbot features.

---

## PHASE 2: System Architecture Deep Dive

### 1. Data Flow
1. **Client Request:** React components (e.g., `CreditWallet.tsx`) call methods in `src/services/api.ts`.
2. **API Layer:** `api.ts` attaches the Supabase JWT (`Authorization: Bearer <token>`) and sends the HTTP request to the Express backend (`http://localhost:3001/api`).
3. **Backend Routing:** Express routes (e.g., `exchangeRoutes.js`) receive the request.
4. **Middleware:** `authMiddleware.js` intercepts the request, uses `supabase.auth.getUser(token)` to validate the JWT, and attaches `req.userId` to the request object.
5. **Business Logic:** The route handler processes the request, often calling helper services (`creditService.js`, `trustService.js`).
6. **Database:** The backend uses the `@supabase/supabase-js` client (initialized with a Service Role Key) to bypass client-side RLS and perform authoritative database operations.

### 2. Database Architecture (Supabase / PostgreSQL)
The database relies heavily on relational links and **Row Level Security (RLS)**.
- Auth users (`auth.users`) are automatically linked to `public.profiles` via a Postgres Trigger (`handle_new_user`).
- Most tables (`exchanges`, `service_listings`, `reviews`) include `user_id` or similar references to `profiles`.
- Database schema is defined in two major files: `supabase_schema.sql` (base tables) and `supabase_schema_v2.sql` (advanced features like waitlists, endorsements, badges).

### 3. Cross-Cutting Concerns
- **Security:** Fraud detection is handled in `trustService.js` (detecting rapid cyclic exchanges). RLS policies prevent users from modifying records they don't own from the client-side.
- **Side Effects:** Most side effects (like updating trust scores or badges) occur synchronously inside the Express route handlers immediately after a primary database update (e.g., when an exchange is marked 'completed').

---

## PHASE 3: Feature-by-Feature Analysis

### 1. The Exchange Lifecycle (`exchangeRoutes.js`)
- **Purpose:** Manages the core transaction of the platform—swapping time.
- **Technical Flow:**
  - `POST /` creates an exchange in `pending` status. `detectFraudPatterns` runs to flag suspicious activity.
  - `PATCH /:id/status` updates the state.
    - `pending` -> `accepted`: Calls `lockEscrow` in `creditService.js`. Time credits are deducted from the requester and a transaction ledger entry is created.
    - `accepted` -> `completed`: Calls `transferCredits`. The scarcity multiplier is calculated. Provider receives the multiplied credits + potential bonuses. Trust scores and badges are recalculated.
    - `accepted` -> `cancelled`: Calls `releaseEscrow`. If cancelled within 24 hours of the scheduled time, `applyPenalty` deducts 0.5h from the canceller.

### 2. Intelligent Matching Engine (`matchingEngine.js`)
- **Purpose:** Suggests relevant users to trade with.
- **Technical Flow:**
  - Calculates a `match_score` based on: Category alignment, keyword matching, user trust scores, campus proximity, and urgency.
  - **Multi-hop Detection:** Simulates 2-hop paths (A → B → C → A) to find indirect barter chains.
  - **Fallback Suggestions:** Uses a `CATEGORY_ADJACENCY` map to suggest related skills (e.g., suggesting a "tech" person if you need "design" and no designers are available).

### 3. Credit Economy & Escrow (`creditService.js`)
- **Purpose:** The central bank of the platform.
- **Technical Flow:**
  - **Dynamic Multipliers:** `getScarcityMultiplier` calculates supply/demand ratios for categories. If demand >> supply, the multiplier increases up to 1.5x.
  - **Borrowing:** Users with high trust scores can allow their `time_balance` to go negative (up to `max_negative`), enabling them to borrow time against future earnings.
  - **Ledger:** Every single credit movement is logged in `credit_transactions` (earn, spend, escrow_lock, bonus, penalty, borrow) for strict audibility.

### 4. DeFi Staking (`stakingRoutes.js`)
- **Purpose:** Encourages users to hold credits on the platform by offering APY yields.
- **Technical Flow:** Deposits lock credits for 1 week or 1 month. Cron-like logic calculates APY. Early withdrawals incur a 10% penalty.

### 5. Rewards & Invite-to-Earn (`rewardRoutes.js`)
- **Purpose:** Gamification to drive retention and growth.
- **Technical Flow:**
  - **Daily Claim:** Uses a generated string key (`daily_YYYY_MM_DD`) stored in `claimed_rewards`. Unique DB constraints prevent double claims.
  - **Invite-to-Earn:** `profiles.referred_by` tracks invites. When a referred user completes their *first* exchange, `transferCredits` checks their profile, increments the referrer's `successful_referrals`, and awards 1.0h credit for every 5 active referrals.

---

## PHASE 4: Nuances, Subtleties & Gotchas

### 1. Escrow Mechanics (Crucial)
When an exchange is `accepted`, credits are mathematically deducted from the user's `time_balance` via `logTransaction(..., -hours, 'escrow_lock')`. This means the user's balance drops immediately. When the exchange is `completed`, the requester is NOT charged again. Instead, a 0-value transaction is logged, and the provider is minted new credits. 

### 2. Scarcity Multiplier Asymmetry
The platform is inflationary. If a requester spends 1 hour on an exchange, and the provider has a 1.5x scarcity multiplier, the provider receives 1.5 hours. The extra 0.5 hours are "minted" by the platform to incentivize high-demand skills.

### 3. Double-Counting Protection
In `exchangeRoutes.js`, status updates have a strict guard:
```javascript
if (currentEx.status === 'completed' || currentEx.status === 'cancelled') {
     return res.status(400).json({ error: `Cannot change status of a ${currentEx.status} exchange` });
}
```
This is the ultimate safeguard ensuring credits are never transferred twice for the same exchange.

### 4. Negative Balance Check
Whenever checking if a user has enough funds, you cannot just do `if (balance >= cost)`. You must use the formula:
`available_to_spend = time_balance + (negative_balance_allowed ? abs(max_negative) : 0)`

---

## PHASE 5: Technical Reference & Glossary

### Glossary
- **Time Credit:** The base unit of the economy. Represents 1 hour of standard service.
- **Escrow:** The holding state of credits while an exchange is `in_progress`.
- **Scarcity Multiplier:** A dynamic coefficient (1.0x to 1.5x) applied to earned credits based on market demand.
- **Multi-hop:** A barter chain involving 3 or more users.
- **Collateral:** Physical items deposited or documented to guarantee high-risk/physical exchanges.

### Key Files Reference
- `server/src/services/creditService.js`: The central economic engine. Handles minting, burning, escrow, and ledger logging.
- `server/src/routes/exchangeRoutes.js`: State machine for exchanges. Triggers economy and trust updates.
- `server/src/services/matchingEngine.js`: Algorithmic matching, proximity weighting, and multi-hop.
- `buildify-reactjs/src/services/api.ts`: Centralized frontend fetch wrapper containing all API endpoint definitions.
- `server/supabase_schema_v2.sql`: The primary source of truth for all advanced database tables and Row Level Security policies.

---
*Generated by AI Codebase Analyzer.*
