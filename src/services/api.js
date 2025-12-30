/**
 * API Service Facade (Refactored)
 * This file now delegates all core work to specialized services.
 * Maintained for backward compatibility.
 */

import { generateImages as genBatch } from './generationService';
import { analyzeImages as analyzeImg, analyzeHatStyleAndSuggestOutfit as analyzeOutfit, interrogateImages as interrogate } from './analysisService';
import { assessImageQuality as assessQuality } from './qcService';
import { upscaleImage as upscaleImg } from './upscaleService';
import { fileToBase64 as b64Utils } from './core/utils/imageUtils';

// Facade Exports
export const generateImages = genBatch;
export const analyzeImages = analyzeImg;
export const analyzeHatStyleAndSuggestOutfit = analyzeOutfit;
export const assessImageQuality = assessQuality;
export const interrogateImages = interrogate;
export const upscaleImage = upscaleImg;
export const fileToBase64 = b64Utils;

// Legacy exports and internal utilities (if any) can remain here until fully migrated.
export const mergePrompts = (basePrompt, interrogatedFragment) => {
    if (!interrogatedFragment) return basePrompt;
    return `${basePrompt}, ${interrogatedFragment}`;
};
