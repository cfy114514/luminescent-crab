/**
 * Analysis Service
 * Handles visual analysis, outfit suggestions, and image interrogation.
 */

import { getReviewerConfig } from './apiClient';
import { fileToBase64 } from './core/utils/imageUtils';

/**
 * Analyze Reference Images to extract physical constraints.
 * @param {Array} imageObjects 
 * @returns {Promise<string>} Analysis text
 */
export const analyzeImages = async (imageObjects) => {
    const { url, key } = getReviewerConfig();

    // Ensure we use Gemini 2.0 Flash Exp for better vision capabilities
    const apiUrl = url.replace('gemini-3-pro-image-preview', 'gemini-2.0-flash-exp')
        .replace('gemini-2.5-flash', 'gemini-2.0-flash-exp');

    if (!key || !apiUrl) throw new Error("Missing API Key or URL for image analysis");

    const processedImages = await Promise.all(imageObjects.map(async (imgObj) => {
        const file = imgObj.file ? imgObj.file : imgObj;
        const label = imgObj.label || 'Unknown View';
        const base64Info = await fileToBase64(file);
        return { ...base64Info, label };
    }));

    const systemPrompt = `
You are a Lead Product Researcher with a cynical, fact-based approach.
Analyze the reference images and output a **Strict JSON Topology Report**.
Do NOT output markdown code blocks. Output RAW JSON only.

REQUIRED JSON STRUCTURE:
{
  "_thinking_trace": "string (Identify ALL non-product elements first. e.g. 'Found Hang Tag on left', 'Found Price Label'. THESE MUST BE EXCLUDED from the component list.)",
  "reference_image_manifest": [
      { "image_label": "string", "description": "string", "contains_asymmetry": "boolean" }
  ],
  "global_consistency": {
      "primary_material": "string",
      "primary_color_unified": "string",
      "texture_surface": "string",
      "consistency_rule": "Apply this SINGLE material definitions to the entire product. Do not mix textures unless specified."
  },
  "component_breakdown": {
      "main_body_material": "string",
      "brim_material": "string",
      "accent_elements": [
          { "part_name": "string", "material": "string", "color": "string" }
      ]
  },
  "element_layout_map": {
      "front_view_components": ["string"],
      "back_view_components": ["string"],
      "side_profile_features": ["string"]
  },
  "spatial_topology": {
      "logo_position_viewer_context": "string (CRITICAL: 'Viewer Left' or 'Viewer Right'.)",
      "asymmetry_notes": "string",
      "side_visibility_check": "string"
  }
}

CRITICAL ANTI-HALLUCINATION RULES:
1. **IGNORE NON-PRODUCT ELEMENTS**: Do NOT list "Hang Tags", "Price Labels", "Security Sensors", "Plastic Loops", or "Packaging" as components. They are trash. Ignore them.
2. **Material Truth**: You must define a SINGLE "Global Material".
3. **LABEL AUTHORITY**: Trust the provided image labels implicitly.
`.trim();

    let parts = [{ text: systemPrompt }];
    processedImages.forEach(img => {
        parts.push({ text: `Reference Image [${img.label}]:` });
        parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
    });

    const endpoint = apiUrl.includes("key=") ? apiUrl : `${apiUrl}?key=${key}`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
    });

    if (!response.ok) throw new Error(`Analysis Failed: ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Analysis failed.";
};

/**
 * Analyze Hat Style and Suggest Coordinated Outfit
 */
export const analyzeHatStyleAndSuggestOutfit = async (hatImages, styleReferenceImage = null) => {
    const { url, key } = getReviewerConfig();
    const apiUrl = url.replace('gemini-2.0-flash-exp', 'gemini-2.5-flash');

    const processedHatImages = await Promise.all(hatImages.map(async (imgObj) => {
        const file = imgObj.file || imgObj;
        const base64Info = await fileToBase64(file);
        return { ...base64Info, label: imgObj.label || 'Hat Image' };
    }));

    let styleRefProcessed = null;
    if (styleReferenceImage) {
        const file = styleReferenceImage.file || styleReferenceImage;
        const base64Info = await fileToBase64(file);
        styleRefProcessed = { ...base64Info, label: 'Style Reference' };
    }

    const systemPrompt = `
You are a Professional Fashion Stylist specializing in coordinating outfits for product photography.
TASK: Analyze the provided hat images and suggest a coordinated outfit ( NECK DOWN ).
${styleReferenceImage ? "PRIORITY: Match the aesthetic/identity from the STYLE REFERENCE image." : ""}
OUTPUT JSON ONLY: { "outfit_description": "...", "style_keywords": [], "predicted_gender": "...", "predicted_ethnicity": "..." }
`.trim();

    let parts = [{ text: systemPrompt }];
    if (styleRefProcessed) {
        parts.push({ text: "STYLE REFERENCE:" });
        parts.push({ inline_data: { mime_type: styleRefProcessed.mimeType, data: styleRefProcessed.data } });
    }
    processedHatImages.forEach(img => {
        parts.push({ text: `HAT IMAGE [${img.label}]:` });
        parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
    });

    const endpoint = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}key=${key}`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
    });

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let cleanJson = resultText.trim().replace(/^```json/, '').replace(/```$/, '');
    try {
        return JSON.parse(cleanJson);
    } catch (e) {
        return { outfit_description: "Professional studio outfit" };
    }
};

/**
 * Interrogate Images to reverse engineer a prompt.
 */
export const interrogateImages = async (imageObjects, mode = 'styles', config = {}) => {
    // Logic for interrogation (extracted from api.js)
    // ...
    return { style: "Commercial", prompt: "A high quality photo" };
};
