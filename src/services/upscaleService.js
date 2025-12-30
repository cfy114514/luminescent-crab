/**
 * Upscale Service
 * Handles super-resolution and image upscaling tasks.
 */

import { getApiConfig, API_PROVIDERS } from './apiClient';
import { fileToBase64 } from './core/utils/imageUtils';

/**
 * Super-Resolution / Upscaling using Gemini 3 Pro
 * @param {File} imageFile - The image to upscale
 * @param {string} targetResolution - Target resolution (1K, 2K, 4K)
 * @param {Object} config - Configuration object with API settings
 * @returns {Promise<string>} - Upscaled image URL
 */
export const upscaleImage = async (imageFile, targetResolution, config) => {
    // Force use of Gemini 3 Pro or 2.0 Flash for upscaling depending on provider
    const { url, key } = getApiConfig(API_PROVIDERS.GEMINI, config);
    const apiUrl = url.replace(/gemini-[^:]+/, 'gemini-3-pro-image-preview');

    if (!key || !apiUrl) throw new Error("Missing API Key for upscaling");

    const base64Info = await fileToBase64(imageFile);

    const resolutionMap = {
        '1K': '1024x1024',
        '2K': '2048x2048',
        '4K': '4096x4096'
    };

    const targetSize = resolutionMap[targetResolution] || '2048x2048';

    const prompt = `Upscale this image to ${targetSize} resolution while preserving all details exactly as they are. Pure upscaling task.`.trim();

    const payload = {
        contents: [{
            parts: [
                { text: prompt },
                { inline_data: { mime_type: base64Info.mimeType, data: base64Info.data } }
            ]
        }],
        generationConfig: { temperature: 0.1, topP: 0.8 }
    };

    const endpoint = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}key=${key}`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Upscaling Failed: ${response.status}`);

    const data = await response.json();
    const generatedImage = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData || p.inline_data);

    if (!generatedImage) throw new Error("No image returned from upscaling API");

    const blob = generatedImage.inlineData || generatedImage.inline_data;
    return `data:${blob.mimeType || blob.mime_type};base64,${blob.data}`;
};
