import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import listingRoutes from './routes/listingRoutes.js';
import exchangeRoutes from './routes/exchangeRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import creditRoutes from './routes/creditRoutes.js';
import disputeRoutes from './routes/disputeRoutes.js';
import endorsementRoutes from './routes/endorsementRoutes.js';
import schedulingRoutes from './routes/schedulingRoutes.js';
import waitlistRoutes from './routes/waitlistRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import rewardRoutes from './routes/rewardRoutes.js';
import stakingRoutes from './routes/stakingRoutes.js';
import { ensureBadgesExist } from './services/gamificationService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
    origin: function (origin, callback) {
        // Allow all origins for the presentation
        callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────
app.use('/api/listings', listingRoutes);
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/endorsements', endorsementRoutes);
app.use('/api/schedule', schedulingRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/chat', chatbotRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/staking', stakingRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global error handler ───────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[Unhandled Error]', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, async () => {
    console.log(`\n  ✦ Chromi API running → http://localhost:${PORT}`);
    console.log(`  ✦ Health check → http://localhost:${PORT}/api/health\n`);
    await ensureBadgesExist();
});
