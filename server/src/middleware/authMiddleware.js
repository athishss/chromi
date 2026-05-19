import supabase from '../config/supabase.js';

/**
 * Express middleware: verifies Supabase JWT from Authorization header.
 * Sets req.userId on success.
 */
export default async function authMiddleware(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid Authorization header' });
        }

        if (!supabase) {
            return res.status(503).json({ error: 'Supabase not configured on server' });
        }

        const token = header.split(' ')[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.userId = user.id;
        next();
    } catch (err) {
        console.error('[AuthMiddleware]', err);
        res.status(500).json({ error: 'Authentication failed' });
    }
}
