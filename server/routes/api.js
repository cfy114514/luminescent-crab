import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

/**
 * GET /api/config
 * Get configuration (public, no keys exposed)
 */
router.get('/config', (req, res) => {
    try {
        const configPath = path.resolve(process.cwd(), 'config.json');
        let userConfig = {};

        if (fs.existsSync(configPath)) {
            const fileContent = fs.readFileSync(configPath, 'utf-8');
            userConfig = JSON.parse(fileContent);
        }

        // Return config WITHOUT API keys
        // Keys are only used server-side for proxying
        res.json({
            userConfig,
            // Indicate which keys are available (without exposing values)
            apiKeys: {
                key1: !!process.env.GEMINI_API_KEY_1,
                key2: !!process.env.GEMINI_API_KEY_2,
                custom: !!process.env.CUSTOM_API_URL
            }
        });
    } catch (error) {
        console.error('[API] Config read error:', error);
        res.status(500).json({ error: 'Failed to read config' });
    }
});

/**
 * POST /api/config
 * Save configuration
 */
router.post('/config', requireAuth, (req, res) => {
    try {
        const configPath = path.resolve(process.cwd(), 'config.json');
        fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('[API] Config save error:', error);
        res.status(500).json({ error: 'Failed to save config' });
    }
});

/**
 * POST /api/generate
 * Proxy image generation request (API keys stay server-side)
 */
router.post('/generate', requireAuth, async (req, res) => {
    try {
        const { payload, apiKeySelection = 'key1', model } = req.body;

        // Select API key based on user choice
        let apiKey;
        let apiUrl;

        if (apiKeySelection === 'key1') {
            apiKey = process.env.GEMINI_API_KEY_1;
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash-exp'}:generateContent`;
        } else if (apiKeySelection === 'key2') {
            apiKey = process.env.GEMINI_API_KEY_2;
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash-exp'}:generateContent`;
        } else if (apiKeySelection === 'custom') {
            apiKey = process.env.CUSTOM_API_KEY;
            apiUrl = process.env.CUSTOM_API_URL || 'http://127.0.0.1:8045/v1/chat/completions';
        } else {
            return res.status(400).json({ error: 'Invalid API key selection' });
        }

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

        // Log generation
        User.logGeneration(
            req.session.user.id,
            'image',
            model || 'gemini-2.0-flash-exp',
            0 // Token count would need to be extracted from response
        );

        // Make the actual API request
        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API] Generation error:', errorText);
            return res.status(response.status).json({
                error: 'Generation failed',
                details: process.env.NODE_ENV === 'development' ? errorText : undefined
            });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('[API] Generate error:', error);
        res.status(500).json({ error: 'Generation request failed' });
    }
});

/**
 * POST /api/analyze
 * Proxy style analysis request
 */
router.post('/analyze', requireAuth, async (req, res) => {
    try {
        const { payload, apiKeySelection = 'key1' } = req.body;

        let apiKey = apiKeySelection === 'key1'
            ? process.env.GEMINI_API_KEY_1
            : process.env.GEMINI_API_KEY_2;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API] Analysis error:', errorText);
            return res.status(response.status).json({ error: 'Analysis failed' });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('[API] Analyze error:', error);
        res.status(500).json({ error: 'Analysis request failed' });
    }
});

/**
 * POST /api/upscale
 * Proxy super-resolution request
 */
router.post('/upscale', requireAuth, async (req, res) => {
    try {
        const { imageBase64, scale = 2 } = req.body;

        // Use configured upscale service or default
        const upscaleUrl = process.env.UPSCALE_API_URL || 'http://127.0.0.1:8045/upscale';

        const response = await fetch(upscaleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageBase64, scale })
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Upscale failed' });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('[API] Upscale error:', error);
        res.status(500).json({ error: 'Upscale request failed' });
    }
});

export default router;
