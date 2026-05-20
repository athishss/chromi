import supabase from '../config/supabase.js';

/**
 * Express middleware: checks if the authenticated user is a platform admin.
 * Must be used AFTER authMiddleware (requires req.userId to be set).
 * Admin emails are stored in the ADMIN_EMAILS env var (comma-separated).
 */
export default async function adminMiddleware(req, res, next) {
    try {
        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

        if (adminEmails.length === 0) {
            return res.status(403).json({ error: 'No admin accounts configured' });
        }

        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        // Get user email from Supabase auth
        const { data: { user }, error } = await supabase.auth.admin.getUserById(req.userId);

        if (error || !user) {
            return res.status(401).json({ error: 'Could not verify admin status' });
        }

        if (!adminEmails.includes(user.email.toLowerCase())) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.isAdmin = true;
        next();
    } catch (err) {
        console.error('[AdminMiddleware]', err);
        res.status(500).json({ error: 'Admin check failed' });
    }
}
