import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// All admin routes require admin role
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * List all users
 */
router.get('/users', (req, res) => {
    try {
        const users = User.findAll();
        res.json({ users });
    } catch (error) {
        console.error('[Admin] Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

/**
 * POST /api/admin/users
 * Create new user
 */
router.post('/users', (req, res) => {
    try {
        const { username, password, role = 'user', displayName } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if username exists
        const existing = User.findByUsername(username);
        if (existing) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const passwordHash = bcrypt.hashSync(password, 10);
        const user = User.create(username, passwordHash, role, displayName);

        res.status(201).json({ success: true, user });
    } catch (error) {
        console.error('[Admin] Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

/**
 * PATCH /api/admin/users/:id
 * Update user
 */
router.patch('/users/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { displayName, role, isActive, password } = req.body;

        const user = User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent removing last admin
        if (role && role !== 'admin' && user.role === 'admin') {
            const admins = User.findAll().filter(u => u.role === 'admin');
            if (admins.length <= 1) {
                return res.status(400).json({ error: 'Cannot remove the last admin' });
            }
        }

        // Update basic fields
        const updates = {};
        if (displayName !== undefined) updates.display_name = displayName;
        if (role !== undefined) updates.role = role;
        if (isActive !== undefined) updates.is_active = isActive ? 1 : 0;

        const updated = User.update(id, updates);

        // Update password if provided
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }
            const hash = bcrypt.hashSync(password, 10);
            User.updatePassword(id, hash);
        }

        res.json({ success: true, user: updated });
    } catch (error) {
        console.error('[Admin] Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user
 */
router.delete('/users/:id', (req, res) => {
    try {
        const { id } = req.params;

        const user = User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deleting yourself
        if (req.session.user.id === parseInt(id)) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }

        // Prevent deleting last admin
        if (user.role === 'admin') {
            const admins = User.findAll().filter(u => u.role === 'admin');
            if (admins.length <= 1) {
                return res.status(400).json({ error: 'Cannot delete the last admin' });
            }
        }

        User.deleteUser(id);
        res.json({ success: true });
    } catch (error) {
        console.error('[Admin] Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;
