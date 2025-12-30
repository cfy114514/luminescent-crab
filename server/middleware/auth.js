/**
 * Authentication middleware
 */

/**
 * Require authenticated user
 */
export function requireAuth(req, res, next) {
    if (!req.session?.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}

/**
 * Require admin role
 */
export function requireAdmin(req, res, next) {
    if (!req.session?.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

/**
 * Optional auth - populates req.user if logged in
 */
export function optionalAuth(req, res, next) {
    // User info is already in session if logged in
    next();
}

export default {
    requireAuth,
    requireAdmin,
    optionalAuth
};
