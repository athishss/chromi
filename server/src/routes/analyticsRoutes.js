import { Router } from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/analytics/demand - Get demand heatmap
 */
router.get('/demand', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        // Aggregate active requests
        const { data, error } = await supabase
            .from('service_listings')
            .select('category')
            .eq('type', 'request')
            .eq('status', 'active');

        if (error) throw error;

        const heatmap = {};
        data.forEach(item => {
            heatmap[item.category] = (heatmap[item.category] || 0) + 1;
        });

        res.json(heatmap);
    } catch (err) {
        console.error('[GET /analytics/demand]', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/analytics/supply - Get supply heatmap
 */
router.get('/supply', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        // Aggregate active offers
        const { data, error } = await supabase
            .from('service_listings')
            .select('category')
            .eq('type', 'offer')
            .eq('status', 'active');

        if (error) throw error;

        const heatmap = {};
        data.forEach(item => {
            heatmap[item.category] = (heatmap[item.category] || 0) + 1;
        });

        res.json(heatmap);
    } catch (err) {
        console.error('[GET /analytics/supply]', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/analytics/system - System wide metrics
 */
router.get('/system', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const [
            { count: totalUsers },
            { count: totalExchanges },
            { data: sumData }
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('exchanges').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
            supabase.from('exchanges').select('hours_exchanged').eq('status', 'completed')
        ]);

        const totalHours = sumData ? sumData.reduce((sum, e) => sum + Number(e.hours_exchanged), 0) : 0;

        res.json({
            total_users: totalUsers || 0,
            completed_exchanges: totalExchanges || 0,
            hours_exchanged: totalHours
        });
    } catch (err) {
        console.error('[GET /analytics/system]', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
