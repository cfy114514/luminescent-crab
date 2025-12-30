/**
 * Base Workflow Strategy
 * Abstract class defining the contract for generation workflows.
 */

import { getApiConfig, API_PROVIDERS } from '../../apiClient';
import { generateSingleImageGemini } from '../adapters/geminiAdapter';
import { generateSingleImageNanoBanana } from '../adapters/nanoBananaAdapter';

export class BaseStrategy {
    constructor(config, presets, slotMetadata) {
        this.config = config;
        this.presets = presets;
        this.slotMetadata = slotMetadata;

        // Initialize API Config
        this.provider = config.model?.includes('gemini') ? API_PROVIDERS.GEMINI : API_PROVIDERS.NANOBANANA;
        const apiData = getApiConfig(this.provider, config);
        this.url = apiData.url;
        this.key = apiData.key;
    }

    /**
     * Main execution method for a single task
     * @param {Object} task - { key, inputImage, poseImage }
     * @param {Function} onStatus - Callback for status updates
     * @returns {Promise<string>} - Generated Image URL
     */
    async execute(task, onStatus) {
        throw new Error("Method 'execute' must be implemented by concrete strategy");
    }

    /**
     * Shared helper to call the appropriate API adapter
     * @param {string} prompt 
     * @param {Object} inputImage 
     * @param {string} taskKey 
     * @returns {Promise<string>} URL of generated image
     */
    async callAdapter(prompt, inputImage, taskKey) {
        if (this.provider === API_PROVIDERS.GEMINI) {
            return await generateSingleImageGemini(
                [{ data: inputImage, mimeType: 'image/jpeg' }],
                prompt,
                taskKey,
                this.url,
                null,
                this.config
            );
        } else if (this.provider === API_PROVIDERS.NANOBANANA) {
            return await generateSingleImageNanoBanana(
                [{ fullDataUrl: `data:image/jpeg;base64,${inputImage}` }],
                prompt,
                taskKey,
                this.url,
                this.config
            );
        }
        throw new Error(`Unsupported provider: ${this.provider}`);
    }

    /**
     * Helper to resolve the model preset
     */
    getSelectedModel() {
        return this.presets?.models?.find(m => m.id === this.config.modelId);
    }
}
