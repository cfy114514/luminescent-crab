import db from '../db.js';

/**
 * Find user by ID
 */
export function findById(id) {
    return db.prepare(`
        SELECT id, username, role, display_name, created_at, last_login, is_active
        FROM users WHERE id = ?
    `).get(id);
}

/**
 * Find user by username
 */
export function findByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

/**
 * Get all users (for admin)
 */
export function findAll() {
    return db.prepare(`
        SELECT id, username, role, display_name, created_at, last_login, is_active
        FROM users ORDER BY created_at DESC
    `).all();
}

/**
 * Create new user
 */
export function create(username, passwordHash, role = 'user', displayName = null) {
    const stmt = db.prepare(`
        INSERT INTO users (username, password_hash, role, display_name)
        VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(username, passwordHash, role, displayName || username);
    return findById(result.lastInsertRowid);
}

/**
 * Update user
 */
export function update(id, updates) {
    const allowedFields = ['display_name', 'role', 'is_active'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
    }

    if (fields.length === 0) return findById(id);

    values.push(id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return findById(id);
}

/**
 * Update password
 */
export function updatePassword(id, passwordHash) {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id);
}

/**
 * Update last login time
 */
export function updateLastLogin(id) {
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(id);
}

/**
 * Delete user
 */
export function deleteUser(id) {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

/**
 * Log user session
 */
export function logSession(userId, ipAddress, userAgent) {
    db.prepare(`
        INSERT INTO user_sessions (user_id, ip_address, user_agent)
        VALUES (?, ?, ?)
    `).run(userId, ipAddress, userAgent);
}

/**
 * Log generation
 */
export function logGeneration(userId, generationType, modelUsed, tokensUsed = 0) {
    db.prepare(`
        INSERT INTO generation_logs (user_id, generation_type, model_used, tokens_used)
        VALUES (?, ?, ?, ?)
    `).run(userId, generationType, modelUsed, tokensUsed);
}

export default {
    findById,
    findByUsername,
    findAll,
    create,
    update,
    updatePassword,
    updateLastLogin,
    deleteUser,
    logSession,
    logGeneration
};
