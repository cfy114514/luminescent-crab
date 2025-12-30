/**
 * Centralized API Client for Luminescent Crab
 * Handles API key rotation, URL construction, and environment overrides.
 */

// API Configuration Constants
export const API_PROVIDERS = {
    GEMINI: 'gemini',
    NANOBANANA: 'nanobanana',
    OPENAI: 'openai'
};

/**
 * Gets the effective API configuration based on selected provider and environment
 */
export const getApiConfig = (provider, config = {}) => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Default URLs from env
    const urls = {
        [API_PROVIDERS.GEMINI]: import.meta.env.VITE_API_URL_GENERATOR || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
        [API_PROVIDERS.NANOBANANA]: import.meta.env.VITE_NANOBANANA_API_URL || 'https://api.nanobananaapi.ai/api/v1/nanobanana/generate-pro',
        [API_PROVIDERS.OPENAI]: 'https://api.openai.com/v1/chat/completions' // Placeholder
    };

    // Environment Overrides (Local Dev)
    if (isLocal && config.localUrl) {
        return {
            url: config.localUrl,
            key: config.localKey || ''
        };
    }

    // Key Selection Logic (Simplified from api.js)
    let key = '';
    const keyIndex = config.apiKeyIndex || 1;

    switch (provider) {
        case API_PROVIDERS.GEMINI:
            key = keyIndex === 1 ? import.meta.env.VITE_Banana_Key_1 : import.meta.env.VITE_Banana_Key_2;
            break;
        case API_PROVIDERS.NANOBANANA:
            key = import.meta.env.VITE_NANOBANANA_API_KEY;
            break;
        default:
            key = '';
    }

    return {
        url: urls[provider] || '',
        key: key || ''
    };
};

/**
 * Utility to construct Gemini Reviewer/Analyzer URL
 */
export const getReviewerConfig = () => {
    return {
        url: import.meta.env.VITE_API_URL_REVIEWER || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
        key: import.meta.env.VITE_Banana_Key_2 // Usually uses Key 2 for analysis to avoid generation rate limits
    };
};
