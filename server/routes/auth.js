import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = Router();

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = User.findByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is disabled' });
        }

        const isValidPassword = bcrypt.compareSync(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        User.updateLastLogin(user.id);

        // Log session
        User.logSession(
            user.id,
            req.ip || req.connection?.remoteAddress,
            req.get('User-Agent')
        );

        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            displayName: user.display_name
        };

        res.json({
            success: true,
            user: req.session.user
        });
    } catch (error) {
        console.error('[Auth] Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('[Auth] Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', (req, res) => {
    if (!req.session?.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ user: req.session.user });
});

/**
 * POST /api/auth/change-password
 * Change own password
 */
router.post('/change-password', (req, res) => {
    if (!req.session?.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = User.findByUsername(req.session.user.username);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    User.updatePassword(user.id, newHash);

    res.json({ success: true, message: 'Password updated successfully' });
});

export default router;
