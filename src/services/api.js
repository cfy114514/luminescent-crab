/**
 * API Service: Multi-View Parallel Generation with Multi-Reference Support
 * Refactored Phase 1: Modular Core
 */

import { SLOT_TO_VIEW_TYPE, SLOT_LABELS } from './core/constants';
import { fileToBase64, processImageToStandardScale } from './core/utils/imageUtils';
import { asyncPool } from './core/utils/asyncUtils';
import { getViewPrompt } from './core/prompts/promptEngine';
import { generateSingleImageNanoBanana } from './core/adapters/nanoBananaAdapter';
import { generateSingleImageGemini } from './core/adapters/geminiAdapter';

// --- Main Dispatcher ---
const generateSingleImage = async (referenceImages, prompt, apiKey, apiUrl, img2imgInput = null, config = null) => {
    let resultUrl;
    // Determine provider based on URL or Config
    if (apiUrl.includes("nanobanana")) {
        resultUrl = await generateSingleImageNanoBanana(referenceImages, prompt, apiKey, apiUrl, config);
    } else {
        resultUrl = await generateSingleImageGemini(referenceImages, prompt, apiKey, apiUrl, img2imgInput, config);
    }

    // Centralized Post-processing for scaling if it's a product view
    // EXCEPTION: Skip for 'detail' and 'model_*' views.
    // We use 'isModelTask' to ensure manual tags (Front/Back) don't trigger product scaling.
    const isModelView = config?.viewType?.startsWith('model_') || config?.isModelTask;
    const isDetailView = config?.viewType === 'detail';

    if (resultUrl && config?.viewType && !isModelView && !isDetailView) {
        return await processImageToStandardScale(resultUrl);
    }

    return resultUrl;
};

export const generateImages = async (viewImagesMap, config, onImageGenerated, onStatus, presets = null, poseImagesMap = {}, slotMetadata = {}) => {
    const apiKey = import.meta.env.VITE_NANOBANANA_API_KEY;

    // Dynamic URL Construction based on Config Model
    let apiUrl = import.meta.env.VITE_API_URL_GENERATOR || import.meta.env.VITE_NANOBANANA_API_URL || '';
    if (config.model && apiUrl) {
        apiUrl = apiUrl.replace(/models\/[a-zA-Z0-9-.]+:/, `models/${config.model}:`);
    }

    console.log(`[API] Using Model: ${config.model || 'Default'} -> URL: ${apiUrl}`);

    const updateStatus = (msg) => {
        if (onStatus) onStatus(msg);
        console.log(`[Status] ${msg}`);
    };

    // 0. PRE-FLIGHT
    // In Cutout Mode, we skip analysis.
    updateStatus("Processing Uploaded Images...");

    // 1. Build Task List based on Uploads
    // Unlike before, we don't generate 6 images from 1. We generate 1 image from 1 upload.
    const tasks = Object.entries(viewImagesMap).map(([slotId, file]) => {
        const metadata = slotMetadata[slotId];
        const viewType = metadata?.perspective || SLOT_TO_VIEW_TYPE[slotId] || 'front';

        return {
            key: slotId,
            file: file,
            viewType: viewType,
            label: SLOT_LABELS[slotId] || slotId,
            isModel: slotId.startsWith('m_')
        };
    });

    const totalTasks = tasks.length;
    let completedTasks = 0;
    let generatedResults = { images: {}, payload: null };

    if (totalTasks > 0) {
        const CONCURRENCY_LIMIT = 4;
        updateStatus(`Starting Parallel Processing (${totalTasks} files)...`);

        const results = await asyncPool(CONCURRENCY_LIMIT, tasks, async (task) => {
            try {
                // 1. Process Logic: Convert File to Base64 (Per Task)
                // We treat this SINGLE image as the "Reference" for this generation.
                const base64Info = await fileToBase64(task.file);
                const processedImages = [{ ...base64Info, label: task.label }];
                // Only 1 reference image passed to the model!

                // 2. Prompt Generation
                // Check if current config has a styleReference for this specific task
                const styleRef = config.styleReferences?.[task.key];
                if (styleRef) {
                    processedImages.push({
                        data: styleRef.data,
                        mimeType: styleRef.mimeType || 'image/jpeg',
                        label: 'STYLE_REFERENCE'
                    });
                }

                // 2b. Pose Control: INTERROGATION MODE (Safe & Precise)
                const poseFile = poseImagesMap[task.key];
                let manualPose = null;
                if (poseFile && task.isModel) {
                    updateStatus(`Analyzing Scale & Pose...`);
                    const poseResult = await interrogateImages([poseFile], 'structural_pose');
                    // Packaging all structural data including limb specifics
                    manualPose = {
                        structural_prompt: poseResult.structural_prompt,
                        scaling_mandate: poseResult.scaling_mandate,
                        limb_action: poseResult.limb_action,
                        facial_expression: poseResult.facial_expression
                    };
                }

                const currentPrompt = getViewPrompt(
                    task.viewType,
                    { ...config, manualPose }, // Inject extracted pose text
                    [task.label],
                    task.key,
                    presets
                );

                // 3. Generate
                updateStatus(`Refining: ${task.label}...`);

                // Update payload for inspector (last task wins)
                generatedResults.payload = currentPrompt;

                const resultUrl = await generateSingleImage(
                    processedImages,
                    currentPrompt,
                    apiKey,
                    apiUrl,
                    null, // No img2img input for now
                    { ...config, viewType: task.viewType, isModelTask: task.isModel } // Pass viewType for post-processing logic
                );

                // 4. Success Handling
                completedTasks++;
                const resultData = {
                    url: resultUrl,
                    label: task.label,
                    qc: { score: 10, reason: "Cutout Mode Direct Pass" } // Skip QC for speed/reliability in this mode
                };

                if (onImageGenerated) onImageGenerated(task.key, resultData, completedTasks, totalTasks);

                return {
                    key: task.key,
                    data: resultData
                };

            } catch (err) {
                console.error(`Task ${task.key} failed:`, err);
                // Return error state but don't crash whole batch
                const errorData = {
                    error: err.message,
                    label: task.label
                };
                if (onImageGenerated) onImageGenerated(task.key, errorData, completedTasks, totalTasks);
                return { key: task.key, error: err.message };
            }
        });

        results.forEach(res => {
            if (res && !res.error) {
                generatedResults.images[res.key] = res.data;
            }
        });
    }

    updateStatus("All Processing Completed.");
    return generatedResults;
};

/**
 * Analyze Reference Images to extract physical constraints.
 * @param {Array} imageObjects 
 * @returns {Promise<string>} Analysis text
 */
export const analyzeImages = async (imageObjects) => {
    const apiKey = import.meta.env.VITE_NANOBANANA_API_KEY;
    // Upgrade to Gemini 2.0 Flash Exp for better vision capabilities (User requested > 2.5mini level)
    const apiUrl = import.meta.env.VITE_NANOBANANA_API_URL
        ? import.meta.env.VITE_NANOBANANA_API_URL.replace('gemini-3-pro-image-preview', 'gemini-2.0-flash-exp')
        : '';

    if (!apiKey || !apiUrl) throw new Error("Missing API Key");

    // Process images with labels
    const processedImages = await Promise.all(imageObjects.map(async (imgObj) => {
        const file = imgObj.file ? imgObj.file : imgObj;
        const label = imgObj.label || 'Unknown View';
        const base64Info = await fileToBase64(file);
        return {
            ...base64Info,
            label
        };
    }));

    const systemPrompt = `
You are a Lead Product Researcher with a cynical, fact-based approach.
Analyze the reference images and output a **Strict JSON Topology Report**.
Do NOT output markdown code blocks. Output RAW JSON only.

REQUIRED JSON STRUCTURE:
{
  "_thinking_trace": "string (Identify ALL non-product elements first. e.g. 'Found Hang Tag on left', 'Found Price Label'. THESE MUST BE EXCLUDED from the component list.)",
  "reference_image_manifest": [
      { 
        "image_label": "string", 
        "description": "string",
        "contains_asymmetry": "boolean"
      }
  ],
  "global_consistency": {
      "primary_material": "string (Identify the core fabric/material. e.g. 'Straw', 'Canvas', 'Wool Felt')",
      "primary_color_unified": "string (The TRUE color code/name cross-referenced from all images. Ignore bad lighting. e.g. 'Navy Blue #000080')",
      "texture_surface": "string (e.g. 'Rough woven texture', 'Smooth matte finish', 'Shiny plastic')",
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
      "front_view_components": ["string (e.g. 'Logo at Viewer Left', 'Vent Hole at Top')"],
      "back_view_components": ["string (e.g. 'Strap at Center', 'Buckle on Right')"],
      "side_profile_features": ["string"]
  },
  "spatial_topology": {
      "logo_position_viewer_context": "string (CRITICAL: 'Viewer Left' or 'Viewer Right'. If Reference has Logo on Left, Top View MUST show it on Left relative to center.)",
      "asymmetry_notes": "string",
      "side_visibility_check": "string"
  },
  "view_specific_features": {
      "back_view_details": "string",
      "inside_view_details": "string",
      "top_view_details": "string"
  },
  "lifestyle_context": {
      "interaction_rules": "string (How should the product interact with a human? e.g. 'Can be tilted', 'Must maintain rigid top shape even if touched')",
      "occlusion_tolerance": "string (Which parts can be covered by hair or hands?)"
  }
}

CRITICAL ANTI-HALLUCINATION RULES:
1. **IGNORE NON-PRODUCT ELEMENTS**: Do NOT list "Hang Tags", "Price Labels", "Security Sensors", "Plastic Loops", or "Packaging" as components. They are trash. Ignore them.
2. **Material Truth**: You must define a SINGLE "Global Material".
3. **Back View Enforcer**: If a "Back View" image is provided, you MUST extract its features into "back_view_details".
4. **Viewer Context & Top View**: 
   - **Relative Logic**: In Top View (Flat Lay), the Logo Position must physically align with the Front View. 
   - If Front View = Logo on LEFT, then Top View = Logo on LEFT.
   - Do NOT flip or mirror features associated with specific sides.
5. **LABEL AUTHORITY**: Trust the provided image labels (e.g. "Front View", "Side View") implicitly.
   - If an image is labeled "Front View", you MUST treat it as the Front, even if it looks like a side profile.
   - **User Input > AI Inference**.
`.trim();

    // Construct Payload with Interleaved Labels
    let parts = [{ text: systemPrompt }];
    processedImages.forEach(img => {
        parts.push({ text: `Reference Image [${img.label}]:` });
        parts.push({
            inline_data: { mime_type: img.mimeType, data: img.data }
        });
    });

    const isGoogle = apiUrl.includes('googleapis.com');
    const endpoint = isGoogle && !apiUrl.includes("key=") ? `${apiUrl}?key=${apiKey}` : apiUrl;

    const payload = {
        contents: [{ parts: parts }]
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Analysis Failed: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis failed to produce text.";

    return resultText.trim();
};

/**
 * Analyze Hat Style and Suggest Coordinated Outfit
 * @param {Array} hatImages - Array of hat/product image objects
 * @param {Object|null} styleReferenceImage - Optional style reference image object
 * @returns {Promise<Object>} { outfit_description, style_keywords, color_palette }
 */
export const analyzeHatStyleAndSuggestOutfit = async (hatImages, styleReferenceImage = null) => {
    const apiKey = import.meta.env.VITE_NANOBANANA_API_KEY;
    const apiUrl = import.meta.env.VITE_NANOBANANA_API_URL
        ? import.meta.env.VITE_NANOBANANA_API_URL.replace('gemini-3-pro-image-preview', 'gemini-2.5-flash').replace('gemini-2.0-flash-exp', 'gemini-2.5-flash')
        : '';

    if (!apiKey || !apiUrl) throw new Error("Missing API Key for outfit analysis");

    // Process hat images
    const processedHatImages = await Promise.all(hatImages.map(async (imgObj) => {
        const file = imgObj.file || imgObj;
        const base64Info = await fileToBase64(file);
        return {
            ...base64Info,
            label: imgObj.label || 'Hat Image'
        };
    }));

    // Process style reference if provided
    let styleRefProcessed = null;
    if (styleReferenceImage) {
        const file = styleReferenceImage.file || styleReferenceImage;
        const base64Info = await fileToBase64(file);
        styleRefProcessed = {
            ...base64Info,
            label: 'Style Reference'
        };
    }

    const systemPrompt = `
You are a Professional Fashion Stylist specializing in coordinating outfits for product photography.

TASK: Analyze the provided hat/accessory images and suggest a coordinated outfit for a model photoshoot.

${styleReferenceImage ? `
PRIORITY INSTRUCTION: A STYLE REFERENCE image has been provided. You MUST use this reference as the PRIMARY style guide. Match the clothing aesthetic, color palette, and overall vibe from this reference image. The hat images are secondary - use them only to understand the product being worn.
` : `
INSTRUCTION: Analyze the hat's style (casual, formal, vintage, streetwear, etc.) and suggest an outfit that complements it perfectly.
`}

OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
{
  "style_analysis": "Brief analysis of the hat style and era (e.g., 'Casual straw boater hat, summer/beach aesthetic')",
  "outfit_description": "Detailed description of the clothing suitable for a fashion prompt (e.g., 'White linen button-up shirt with rolled sleeves, light khaki chinos, brown leather belt')",
  "style_keywords": ["casual", "summer", "beach", "relaxed"],
  "color_palette": ["white", "khaki", "brown", "natural tones"],
  "visual_identity": "string (If a person is present in REF: describe their Face/Hair/Ethnicity/Age in prompt format. e.g., 'Young Japanese woman with bob hair'. If no person, return null)",
  "predicted_gender": "male" | "female" | "boy" | "girl" | "null",
  "predicted_ethnicity": "asian" | "caucasian" | "black" | "hispanic" | "etc" | "null",
  "reasoning": "Why this outfit works with the hat"
}

RULES:
1. Be SPECIFIC: List actual clothing items, not vague descriptions
2. Consider SEASON and CONTEXT from the hat style
3. Choose colors that COMPLEMENT the hat, not clash
4. Keep it REALISTIC for product photography (not runway fashion)
5. If style reference provided, PRIORITIZE matching its aesthetic AND Model Identity (if visible)
6. **CRITICAL: DO NOT DESCRIBE THE HAT/HEADWEAR.** The hat is added separately. Describe ONLY what is worn from the NECK DOWN (Shirt, Jacket, Dress, Accessories). Do not mention "wearing a hat".
`.trim();

    // Build multimodal prompt
    let parts = [{ text: systemPrompt }];

    // Add style reference first if provided (higher priority)
    if (styleRefProcessed) {
        parts.push({ text: "STYLE REFERENCE IMAGE (Primary Guide):" });
        parts.push({
            inline_data: { mime_type: styleRefProcessed.mimeType, data: styleRefProcessed.data }
        });
    }

    // Add hat images
    parts.push({ text: "HAT/PRODUCT IMAGES:" });
    processedHatImages.forEach(img => {
        parts.push({ text: `[${img.label}]:` });
        parts.push({
            inline_data: { mime_type: img.mimeType, data: img.data }
        });
    });

    const endpoint = apiUrl.includes("key=") ? apiUrl : `${apiUrl}?key=${apiKey}`;

    const payload = {
        contents: [{ parts: parts }],
        generationConfig: {
            temperature: 0.7,
            topP: 0.9
        }
    };

    console.log("[Outfit Analyzer] Sending request...");

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Outfit Analysis Failed: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    console.log("[Outfit Analyzer] Raw response:", resultText);

    // Parse JSON (strip markdown if present)
    let cleanJson = resultText.trim();
    if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    try {
        const parsed = JSON.parse(cleanJson);
        console.log("[Outfit Analyzer] Parsed result:", parsed);
        return parsed;
    } catch (e) {
        console.error("[Outfit Analyzer] JSON parse error:", e);
        return {
            style_analysis: "Analysis failed",
            outfit_description: "Professional studio outfit",
            style_keywords: ["neutral"],
            color_palette: ["neutral"],
            reasoning: "Fallback due to parse error"
        };
    }
};


/**
 * AI Supervisor: Assess Image Quality & Compliance
 * Uses Gemini 2.0 Flash to score the image (0-10) and check for specific defects.
 * Now includes View-Specific Logic (e.g., Back View must not show Front Logo).
 * NOW SUPPORTS MULTI-REFERENCE (Array).
 */
export const assessImageQuality = async (generatedImageUrl, originalPrompt, referenceImageObjList, apiKey, apiUrl, viewName = "General") => {
    // Ensure we use Gemini 2.0 Flash for vision capabilities
    let reviewApiUrl = import.meta.env.VITE_API_URL_REVIEWER || '';

    if (!reviewApiUrl) {
        if (apiUrl && apiUrl.includes("googleapis.com")) {
            reviewApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
        } else if (import.meta.env.VITE_NANOBANANA_API_URL && import.meta.env.VITE_NANOBANANA_API_URL.includes("gemini")) {
            reviewApiUrl = import.meta.env.VITE_NANOBANANA_API_URL.replace(/gemini-[\w.-]+-exp/, 'gemini-2.5-flash').replace('gemini-3-pro-image-preview', 'gemini-2.5-flash');
        } else {
            reviewApiUrl = apiUrl;
        }
    }

    if (!reviewApiUrl) {
        console.warn("[Supervisor] No Review API URL found. Skipping QC.");
        return { score: 10, reason: "Skipped (No API)", retry_suggestion: "", error_type: "NONE" };
    }

    console.log(`[Supervisor] Review URL: ${reviewApiUrl} [v2.5 Flash]`);

    if (!reviewApiUrl.includes("key=") && apiKey) {
        reviewApiUrl += `?key=${apiKey}`;
    }

    // 1. Get Generated Image Base64
    let generatedBase64 = "";
    try {
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
    } catch (e) {
        console.error("[Supervisor] Failed to download generated image for review:", e);
        return { score: 5, reason: "Fetch Error", retry_suggestion: "", error_type: "NONE" };
    }

    // 2. Prepare Reference Images (Support Array or Single)
    const refList = Array.isArray(referenceImageObjList) ? referenceImageObjList : [referenceImageObjList];
    const refParts = [];

    for (const [index, refObj] of refList.entries()) {
        let refMime = "";
        let refB64 = "";
        try {
            if (refObj.data && refObj.mimeType) {
                refB64 = refObj.data;
                refMime = refObj.mimeType;
            } else {
                const fileToRead = refObj.file instanceof Blob ? refObj.file : (refObj instanceof Blob ? refObj : null);
                if (fileToRead) {
                    const base64Info = await fileToBase64(fileToRead);
                    refB64 = base64Info.data;
                    refMime = base64Info.mimeType;
                }
            }
        } catch (e) { continue; }

        if (refB64) {
            refParts.push({ text: `REFERENCE IMAGE ${index + 1} (${refObj.label || 'Unknown Ref'}):` });
            refParts.push({ inline_data: { mime_type: refMime, data: refB64 } });
        }
    }

    const promptText = `
SYSTEM ROLE: Senior Product Quality Control Specialist (AI Supervisor).
TASK: Evaluate the "Candidate Image" against the provided "Reference Images" given the REQUIRED VIEW: **${viewName.toUpperCase()}**.
CONTEXT: The User demands PIXEL-PERFECT FIDELITY. The AI Generator is prone to "Hallucinating" logos or mirroring them. You must catch this.

STRICT "VIEWER-PERSPECTIVE" RULES:
- "LEFT" always means "LEFT SIDE OF THE IMAGE" (Viewer's Left).
- "RIGHT" always means "RIGHT SIDE OF THE IMAGE" (Viewer's Right).
- Do not use "Stage Left" or "Wearer's Left". Stick to visual 2D coordinates.

STRICT ANALYSIS STEPS:
1. **REFERENCE TRUTH CHECK**: 
   - Look at the Reference. Does it have a Logo? If YES, where is it? (e.g., "Viewer's Left").
   - Does the Candidate have the SAME Logo in the SAME Visual Position?
   - **CRITICAL**: If the Reference has NO Logo, the Candidate MUST HAVE NO LOGO. Any added logo is an automatic FAIL.
   - **CRITICAL**: If the Reference has a Toggle/Knot at the back, the Candidate MUST have it. If Reference is smooth, Candidate must be smooth.

2. **TOP VIEW ORIENTATION CHECK (FLAT LAY)**:
   - **Relative Mapping**: Imagine the hat resting on its brim.
   - Front (Bottom of Frame) corresponds to Front View.
   - If Front View has Logo on LEFT, Top View MUST have Logo on LEFT relative to the center.
   - **Fail Condition**: If Top View shows Logo on Right (mirrored), it is WRONG -> FAIL.

3. **CLEANUP / TAG ENFORCEMENT**:
   - **TRASH DETECTION**: Does the Candidate show "Hang Tags", "Price Labels", "Plastic Loops", or "Security Tags"?
   - **YES -> FAIL IMMEDIATE** (Score < 5). The User hates tags. 
   - **NO (Clean)** -> PASS. (Removing tags is Desired Behavior).

4. **HALLUCINATION DETECTOR**:
   - Did the generator add a "Brand Tag", "Sticker", or "Extra Seam" that is NOT in the reference? -> FAIL.
   - Did the generator change the Shape (e.g., made a flat brim curved)? -> FAIL.

SCORING CRITERIA:
- **10/10**: Perfect Match. Texture projected exactly. No extra elements. No Tags. Logo correct side.
- **8/9**: Minor lighting shift. All geometry/logos correct. No Tags.
- **5-7**: Good geometry, but Logo is mirrored/missing OR **VISIBLE TAGS REMAIN**. -> **FAIL** (Score < 8 triggers retry).
- **1-4**: Completely wrong view, wrong shape, massive hallucination, or wrong logo side.

OUTPUT JSON FORMAT (Raw JSON only):
{
  "score": number (0-10),
  "reason": "string (Concise failure reason, e.g. 'visible hang tag', 'Logo mirrored to Right', 'Added non-existent feature')",
  "retry_suggestion": "string (Actionable fix, e.g. 'REMOVE HANG TAG', 'MOVE LOGO TO VIEWER LEFT', 'REMOVE HALLUCINATED KNOT')",
  "error_type": "GEOMETRY" | "TEXTURE" | "LOGO" | "TAGS" | "NONE"
}
`;

    const payload = {
        contents: [{
            parts: [
                { text: promptText },
                { text: "REFERENCE IMAGES (GROUND TRUTH):" },
                ...refParts,
                { text: "CANDIDATE IMAGE (TO EVALUATE):" },
                { inline_data: { mime_type: "image/jpeg", data: generatedBase64 } }
            ]
        }],
        generationConfig: { response_mime_type: "application/json" }
    };

    try {
        const response = await fetch(reviewApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("No JSON returned from Supervisor");

        console.log(`[Supervisor] Assessment: `, text);
        return JSON.parse(text);
    } catch (e) {
        console.error("[Supervisor] Analysis Failed", e);
        // Expose error message to UI for debugging
        return { score: 10, reason: `Supervisor Error (Bypassed): ${e.message}`, retry_suggestion: "", error_type: "NONE" };
    }
};

/**
 * Interrogate Reference Images to reverse engineer a prompt.
 * @param {Array} imageObjects 
 * @returns {Promise<Object>} Interrogation results (style, prompt, description)
 */
export const interrogateImages = async (imageObjects, mode = 'styles', contextLabel = '') => {
    const apiKey = import.meta.env.VITE_NANOBANANA_API_KEY;
    const apiUrl = import.meta.env.VITE_API_URL_INTERROGATOR ||
        (import.meta.env.VITE_NANOBANANA_API_URL ? import.meta.env.VITE_NANOBANANA_API_URL.replace('gemini-3-pro-image-preview', 'gemini-2.0-flash-exp') : '');

    if (!apiKey || !apiUrl) throw new Error("Missing API Key");

    const processedImages = await Promise.all(imageObjects.map(async (imgObj) => {
        const file = imgObj.file ? imgObj.file : imgObj;
        return await fileToBase64(file);
    }));

    let focusAreas = "";
    let outputSchema = "";

    if (mode === 'model_dna') {
        focusAreas = `
1. **Model Genetic DNA**: Absolute precise description of face shape (jaw, cheekbones), eye shape/tilt, nose bridge structure, lip shape, and skin texture/undertone.
2. **Body DNA**: Head-to-body ratio, shoulder width, neck length, and overall physique.
3. **Outfit DNA**: Detailed analysis of the outfit (layered textures, fabric type, tailoring). **CRITICAL: DO NOT INCLUDE THE HAT OR ANY HEADWEAR IN THIS DESCRIPTION.**
4. **Consistency Map**: Identify permanent features that must be replicated across all views.
`;
        outputSchema = `{
  "visual_identity": "Extreme detail prompt segment for face and skin.",
  "physique_dna": "Prompt segment for body proportions and build.",
  "outfit_dna": "Prompt segment for clothing (excluding the hat).",
  "predicted_gender": "male/female",
  "predicted_ethnicity": "e.g., East Asian, Caucasian, etc."
}`;
    } else if (mode === 'structural_pose') {
        focusAreas = `
1. **Compositional Harmony**: Describe the subject's position in the frame using visual logic (e.g., "Centered with a high-key focus", "Ample negative space at the top for a minimalist look").
2. **Subject Presence & Scale**: Relative size of the subject in the view. Is it a tight portrait or a relaxed medium-shot? 
3. **Anatomical Flow**: The natural angle of the head and shoulders. Use visual directions (e.g., "Gazing towards the upper left", "Shoulders relaxed and slightly tilted").
4. **Limb & Hand Rhythm**: Describe the action of the hands naturally (e.g., "A gentle hand resting on the hat's edge").
5. **Demeanor & Occlusion (神态与遮挡)**: The emotional soul of the reference. CRITICAL: Identify if the face or eyes are HIDDEN by the hat brim (e.g., "Eyes are completely obscured by the shadow of the brim", "Only the lower jaw is visible").
6. **Anatomical Flow**: The natural angle of the head and shoulders.
7. **FORBIDDEN**: DO NOT describe any lighting, shadows, exposure, or environmental highlights. Focus ONLY on geometry and anatomy.
`;
        outputSchema = `{
  "structural_prompt": "Stylistic description of the pose and flow.",
  "scaling_mandate": "Visual instruction for size and negative space.",
  "limb_action": "Description of the hands' organic movement.",
  "facial_expression": "The model's specific demeanor, including any MANDATORY OCCLUSION (e.g., 'Eyes hidden by hat brim shadow')."
}`;
    } else if (mode === 'model_identity') {
        focusAreas = `
1. **Human Action**: Detailed description of the specific pose (e.g., "Looking over shoulder", "One hand in pocket").
2. **Dynamic & Energy**: Relaxed, formal, athletic, or editorial.
3. **Framing & Scale**: Subject's position in frame (Half-body, full-body) and relative size.
`;
        outputSchema = `{
  "visual_description": "Describing the pose and action.",
  "pose_prompt": "Prompt segment defining ONLY the HUMAN ACTION AND POSE (no face/outfit details).",
  "framing_notes": "Camera distance and framing logic."
}`;
    } else if (mode === 'viewpoints') {
        focusAreas = `
1. **Composition**: Rule of thirds, centered, asymmetrical.
2. **Camera Angle**: Focal length (e.g., 85mm), camera height (eye-level, low, high), and distance (Portrait, Full Body, Macro).
3. **Pose & Dynamic**: Subject's orientation and relative scale to the frame.
`;
        outputSchema = `
{
  "composition_ratio": "e.g., 70% subject coverage, centered",
  "reverse_prompt_fragment": "The prompt snippet defining THE COMPOSITION, POSE, AND ANGLE ONLY.",
  "visual_description": "Describing the framing and camera logic."
}
`;
    } else if (mode === 'product_category') {
        const categoryName = contextLabel || "Product";
        focusAreas = `
1. **Structural Integrity**: Define the rigid shape rules for a "${categoryName}".
2. **Material Logic**: Common materials and textures specific to this category.
3. **Component Syntax**: Mandatory parts (e.g., for a shoe: sole, upper, tongue; for a bag: handle, strap, body).
`;
        outputSchema = `
{
  "visual_description": "General description of the category archetype.",
  "promptConstraint": "A strict instruction paragraph defining the GEOMETRY, STRUCTURE, and MANDATORY COMPONENTS of a '${categoryName}'. Focus on what MUST exist and what MUST NOT change."
}
`;
    } else {
        // Default: Styles
        focusAreas = `
1. **Artistic Style**: Specific medium (oil, digital, photo), lighting (cinematic, soft, neon), and mood.
2. **Textural DNA**: Describe materials (silk, matte plastic, rough linen) with extreme precision.
3. **Lighting & Environment**: Describe the background, light sources, and shadows.
`;
        outputSchema = `
{
  "style_keywords": ["keyword1", "keyword2"],
  "visual_description": "A detailed 2-sentence description of the visual essence.",
  "reverse_prompt_fragment": "The actual prompt snippet including style, textures, AND aesthetic rules."
}
`;
    }

    const systemPrompt = `
You are a Professional Prompt Engineer specialized in Stable Diffusion and Midjourney.
Analyze the provided reference images and reverse-engineer specific fragments of a Master Prompt.

FOCUS MODE: ${mode.toUpperCase()}
AREAS TO ANALYZE:
${focusAreas}

OUTPUT FORMAT:
Return a JSON object with the following structure:
${outputSchema}

Output RAW JSON ONLY. No markdown blocks.
`.trim();

    let parts = [{ text: systemPrompt }];
    processedImages.forEach((img, idx) => {
        parts.push({ text: `Style Reference Image ${idx + 1}:` });
        parts.push({
            inline_data: { mime_type: img.mimeType, data: img.data }
        });
    });

    const isGoogle = apiUrl.includes('googleapis.com');
    const endpoint = isGoogle && !apiUrl.includes("key=") ? `${apiUrl}?key=${apiKey}` : apiUrl;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: parts }] })
    });

    if (!response.ok) throw new Error(`Interrogation Failed: ${response.status}`);

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Robust JSON extraction (removes Markdown code blocks and extra text)
    let cleanedText = resultText.trim();
    if (cleanedText.includes('```')) {
        const matches = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (matches && matches[1]) {
            cleanedText = matches[1].trim();
        } else {
            cleanedText = cleanedText.replace(/```json\n|```json|```/g, "").trim();
        }
    }

    try {
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("Failed to parse Gemini output as JSON:", resultText);
        // Fallback: try finding first { and last }
        try {
            const startIdx = resultText.indexOf('{');
            const endIdx = resultText.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1) {
                return JSON.parse(resultText.substring(startIdx, endIdx + 1));
            }
        } catch (innerErr) {
            console.error("Critical JSON Parse Failure:", innerErr);
        }
        return { error: "Failed to parse JSON", raw: resultText };
    }
};

/**
 * Merge user-defined base prompt with interrogated style fragment.
 */
export const mergePrompts = (basePrompt, interrogatedFragment) => {
    return `${basePrompt}, ${interrogatedFragment}`.replace(/, ,/g, ',').trim();
};

/**
 * Super-Resolution / Upscaling using Gemini 3 Pro
 * @param {File} imageFile - The image to upscale
 * @param {string} targetResolution - Target resolution (1K, 2K, 4K)
 * @param {Object} config - Configuration object with API settings
 * @returns {Promise<string>} - Upscaled image URL
 */
export const upscaleImage = async (imageFile, targetResolution, config) => {
    const apiKey = import.meta.env.VITE_NANOBANANA_API_KEY;

    // Force use of Gemini 3 Pro for upscaling
    const apiUrl = import.meta.env.VITE_NANOBANANA_API_URL
        ? import.meta.env.VITE_NANOBANANA_API_URL.replace(/gemini-[^:]+/, 'gemini-3-pro-image-preview')
        : '';

    if (!apiKey || !apiUrl) throw new Error("Missing API Key for upscaling");

    // Convert image to base64
    const base64Info = await fileToBase64(imageFile);

    // Resolution mapping
    const resolutionMap = {
        '1K': '1024x1024',
        '2K': '2048x2048',
        '4K': '4096x4096'
    };

    const targetSize = resolutionMap[targetResolution] || '2048x2048';

    const prompt = `Upscale this image to ${targetSize} resolution while preserving all details, composition, and elements exactly as they are. 
    
    CRITICAL REQUIREMENTS:
    1. Do NOT change the composition or crop
    2. Do NOT add or remove any elements
    3. Do NOT alter colors or lighting significantly
    4. ONLY increase the resolution and enhance fine details
    5. Preserve all textures, patterns, and structures exactly
    
    This is a pure upscaling task - maintain 100% fidelity to the original image content.`;

    const endpoint = apiUrl.includes("key=") ? apiUrl : `${apiUrl}?key=${apiKey}`;

    const payload = {
        contents: [{
            parts: [
                { text: prompt },
                {
                    inline_data: {
                        mime_type: base64Info.mimeType,
                        data: base64Info.data
                    }
                }
            ]
        }],
        generationConfig: {
            temperature: 0.1, // Very low temperature for minimal creativity
            topP: 0.8
        }
    };

    console.log("[Upscaler] Sending upscale request for", targetResolution);

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("[Upscaler] API Error:", response.status, errorText);
        throw new Error(`Upscaling Failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("[Upscaler] Response structure:", Object.keys(data));
    console.log("[Upscaler] Candidates:", data.candidates);

    if (data.candidates && data.candidates[0]) {
        console.log("[Upscaler] First candidate content:", data.candidates[0].content);
        console.log("[Upscaler] Content parts:", data.candidates[0].content?.parts);
        console.log("[Upscaler] Parts JSON:", JSON.stringify(data.candidates[0].content?.parts, null, 2));
    }

    // Extract image from response
    const generatedImage = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (!generatedImage) {
        console.error("[Upscaler] No image in response. Full data:", data);
        throw new Error("No image returned from upscaling API");
    }

    const upscaledDataUrl = `data:${generatedImage.inlineData.mimeType};base64,${generatedImage.inlineData.data}`;

    console.log("[Upscaler] Upscaling complete");

    return upscaledDataUrl;
};
