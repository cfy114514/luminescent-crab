import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Routes
import apiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

// Database initialization
import { initializeDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initializeDatabase();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
        },
    },
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
        : true,
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Trust proxy (required for secure cookies behind Nginx)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'change-this-in-production-immediately',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// API Routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));

    // SPA fallback - serve index.html for all non-API routes
    // Express 5.x requires named parameter for wildcards
    app.get('/{*splat}', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        }
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[Server Error]', err);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║  ProductAI Server Started                             ║
║  Environment: ${process.env.NODE_ENV || 'development'}
║  Port: ${PORT}
║  Time: ${new Date().toISOString()}
╚═══════════════════════════════════════════════════════╝
    `);
});

export default app;
