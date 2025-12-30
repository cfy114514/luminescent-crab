/**
 * Quality Control Service
 * Handles AI-based image quality assessment and compliance checks.
 */

import { getReviewerConfig } from './apiClient';
import { fileToBase64 } from './core/utils/imageUtils';

/**
 * AI Supervisor: Assess Image Quality & Compliance
 * @param {string} generatedImageUrl - URL or DataURL of the generated image
 * @param {string} originalPrompt - The prompt used for generation
 * @param {Array} referenceImageObjList - List of reference images
 * @param {string} viewName - Name of the view (e.g., "Front", "Back")
 * @returns {Promise<Object>} Assessment results { score, reason, retry_suggestion, error_type }
 */
export const assessImageQuality = async (generatedImageUrl, originalPrompt, referenceImageObjList, viewName = "General") => {
    const { url, key } = getReviewerConfig();
    const reviewApiUrl = url.replace('gemini-2.0-flash-exp', 'gemini-2.5-flash');

    if (!key || !reviewApiUrl) {
        console.warn("[Supervisor] Missing API config. Skipping QC.");
        return { score: 10, reason: "Skipped (No API)", retry_suggestion: "", error_type: "NONE" };
    }

    // 1. Get Generated Image Base64
    let generatedBase64 = "";
    if (generatedImageUrl.startsWith("data:")) {
        generatedBase64 = generatedImageUrl.split(',')[1];
    } else {
        const resp = await fetch(generatedImageUrl);
        const blob = await resp.blob();
        generatedBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
        });
    }

    // 2. Prepare Reference Images
    const refList = Array.isArray(referenceImageObjList) ? referenceImageObjList : [referenceImageObjList];
    const refParts = [];
    for (const [index, refObj] of refList.entries()) {
        try {
            const fileToRead = refObj.file || refObj;
            if (fileToRead instanceof Blob || fileToRead.data) {
                const base64Info = refObj.data ? { data: refObj.data, mimeType: refObj.mimeType } : await fileToBase64(fileToRead);
                refParts.push({ text: `REFERENCE ${index + 1} (${refObj.label || 'Ref'}):` });
                refParts.push({ inline_data: { mime_type: base64Info.mimeType, data: base64Info.data } });
            }
        } catch (e) { continue; }
    }

    const systemPrompt = `
SYSTEM ROLE: Senior Product Quality Control Specialist.
TASK: Evaluate the "Candidate Image" against "Reference Images" for view: **${viewName.toUpperCase()}**.
STRICT RULES:
1. Logo Position: Must match reference (Viewer Left/Right).
2. Hallmark Hallucinations: No extra tags, labels, or misshapen crowns.
3. Tags/Loops: Automatic FAIL (< 5) if hang tags or price labels are present.
OUTPUT JSON: { "score": 0-10, "reason": "...", "retry_suggestion": "...", "error_type": "..." }
`.trim();

    const payload = {
        contents: [{
            parts: [
                { text: systemPrompt },
                ...refParts,
                { text: "CANDIDATE IMAGE:" },
                { inline_data: { mime_type: "image/jpeg", data: generatedBase64 } }
            ]
        }],
        generationConfig: { response_mime_type: "application/json" }
    };

    const endpoint = `${reviewApiUrl}${reviewApiUrl.includes('?') ? '&' : '?'}key=${key}`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`QC API Error: ${response.status}`);

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(text || '{"score": 10, "reason": "No response"}');
};
