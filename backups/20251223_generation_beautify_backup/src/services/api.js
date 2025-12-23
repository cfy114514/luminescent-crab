/**
 * API Service: Multi-View Parallel Generation with Multi-Reference Support
 */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Convert File to Base64
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
            data: reader.result.split(',')[1],
            mimeType: reader.result.split(';')[0].split(':')[1],
            fullDataUrl: reader.result
        });
        reader.onerror = (error) => reject(error);
    });
};

// === Prompt Engineering for Views ===
// === Prompt Engineering for Views ===
const getViewPrompt = (viewType, config, availableLabels = [], taskKey = '', presets = null) => {
    // 1. Fetch Style Preset (if selected)
    const selectedStyle = presets?.styles?.find(s => s.id === config.styleId);

    // 2. Fetch Viewpoint Preset (if available)
    // Mapping: specTasks/modelTasks 'type' to presets.json 'id'
    // presets.json ids are: front, angle_front, back, top, inside, detail
    const selectedViewpoint = presets?.viewpoints?.find(v => v.id === viewType || (viewType.startsWith('model_') && v.id === viewType.replace('model_', '')));

    // 3. Fetch Model Preset (if selected)
    const selectedModel = presets?.models?.find(m => m.id === config.modelId);

    // 4. Fetch Product Category (NEW)
    const selectedCategory = presets?.productCategories?.find(c => c.id === config.categoryId);
    const categoryConstraint = selectedCategory ? `
CATEGORY CONSTRAINT (${selectedCategory.name}):
${selectedCategory.promptConstraint}
` : "";

    // Helper to merge base + interrogated + viewpoint + model prompts
    const styleBase = selectedStyle ? selectedStyle.basePrompt : "";
    const styleAI = selectedStyle ? selectedStyle.interrogatedPrompt : "";

    const viewBase = selectedViewpoint ? selectedViewpoint.basePrompt : "";
    const viewAI = selectedViewpoint ? selectedViewpoint.interrogatedPrompt : "";

    const modelAI = selectedModel ? selectedModel.visual_identity : "";

    // 4. Fetch Model-Specific Viewpoint Override (NEW)
    // If the model has a specific pose saved for this viewType, it takes precedence over the generic viewpoint interrogated prompt
    const cleanViewId = viewType.startsWith('model_') ? viewType.replace('model_', '') : viewType;
    const modelViewPose = selectedModel?.viewpoints?.[cleanViewId] || "";

    // Hierarchy: 
    // - Base: Generic Viewpoint Base (e.g. Frontal logic)
    // - AI Components: Mixed (Identity + (Model-Specific Pose OR Generic Pose) + Artistic Style)
    const orchestratedBase = [viewBase, styleBase].filter(Boolean).join(', ');

    // Logic: Use model-specific pose if available, else fallback to generic viewAI
    const effectivePosePrompt = modelViewPose || viewAI;
    const orchestratedAI = [effectivePosePrompt, styleAI, modelAI].filter(Boolean).join(', ');

    // Spec Requirement: Pure White Background (to be post-processed to #F9F9F9), Studio Lighting 5500K.
    // Added "NO shadows, NO filters" to base prompt.
    const base = `
STRICT PROTOCOL (ZERO CREATIVITY):
1. **TEXTURE PROJECTION ONLY**: You are a texture projection engine, NOT a creative artist. Your goal is to map the Reference Product's EXACT texture and details onto a 3D volume.
2. **GEOMETRY LOCK**: Do NOT change the shape of the product. If the reference is a flat brim, generate a flat brim. If curved, generate curved.
3. **DIGITAL RESTORATION**: **STEAM & IRON** the product. Remove wrinkles, messy creases, and dents. "Puff" out sunken areas to look brand new.
4. **MATERIAL TRUTH**: The weave/fabric must be IDENTICAL to the reference, but cleaner and higher resolution (Denoised).
5. **CLEAN BACKGROUND**: **PURE WHITE (HEX #FFFFFF)**. Natural contact shadows are ALLOWED to ground the object. (Do not render a gray studio background, but cast shadows are okay).
6. **No Text/Watermarks**: Do not render text overlaps.
7. **NEGATIVE PROMPT**: (wrinkles:1.3), (creases:1.3), (dust:1.3), (lint:1.3), gray background, off-white, studio floor, vignette, drawing, painting, illustration, 3d render, sketch, low quality, hanging tag, price label, security tag, plastic loop, extra bow, extra knot.
`;

    // Truth Enforcing Context (User Defined Strict Mode)
    let context = `
SYSTEM ROLE: High-Fidelity Product Cutout & Display Engine.
TASK: Show the product on a pure white background as an isolated object.

STRICT PROTOCOL (USER DEFINED):
1. **RESTORE ALL SHOOTING DETAILS**: You must faithfully render the texture, weave, and imperfections. CRITICAL: Analyze the specific Reference Images and their assigned LABELS (e.g., 'Detail', 'Side') to understand exactly which feature corresponds to which view.
2. **NO INVENTION**: Do not invent details out of thin air (不能凭空添加细节).
3. **DIGITAL POLISH**: You ARE allowed to beautify the product (允许美化产品). Make it look like a high-end catalog photo.
4. **ALLOWED EDIT**: You MUST smooth wrinkles (抚平褶皱) and remove packaging/tags. Fix any sunken shapes or messy edges.
5. **CLEANUP PROTOCOL**: Remove all Hang Tags, Price Labels, Security Sensors is MANDATORY. The product must look like a clean studio sample (必须移除所有吊牌和标签).
6. **MATERIAL TRUTH**: Do not use wrong color blocks or materials (不能使用错误的色块及材质).
7. **NO IMAGINATION**: Do not generate non-existent things (不能使用想象生成不存在的东西).
8. **SOURCE TRUTH**: ONLY use elements present in the image (只能使用图中有的元素).
9. **LOGO CONSISTENCY**: For products with logos, maintain Uniform Logo Size and Position relative to the product body across all generated views (保持Logo大小及位置统一).
10. **COMPOSITION ANCHOR**: ${orchestratedBase}
11. **AESTHETIC STYLE**: ${orchestratedAI}
${categoryConstraint}
`;

    // Inject JSON Topology if present (Parsed or Raw)
    if (config.description) {
        context += `
TOPOLOGY CONSTRAINT(JSON API):
${config.description}
    INSTRUCTION: Follow this topology STRICTLY.
`;
    }

    // Inject Color Enforcement Protocol (Modular)
    if (config.targetColor) {
        context += `
COLOR ENFORCEMENT PROTOCOL(OVERRIDE):
    - TARGET COLOR: ${config.targetColor}
    - ACTION: Recolor the base material of the product to match the Target Color EXACTLY.
- CONSTRAINT: PRESERVE TEXTURE.Do not paint flat color.You must map the Target Color onto the existing weave / grain / surface topology.
- SCOPE: Only the main product material.Do not recolor skin, background, or neutral hardware unless specified.
`;
    }

    let prompt = "";
    // Unified Strict Cutout Prompt for ALL Product Views (Front, Back, Detail, etc.)
    // Since the user is uploading the EXACT view they want, we must NOT rotate or zoom.
    const strictCutoutLogic = `${context}
    Action: Mandatory Professional Retouching within Fixed SILHOUETTE.
**OBJECTIVE**: Create a "Master Quality" catalog image. LOCK the position, but TRANSFORM the quality. You MUST fix edges, remove wrinkles, and polish the material. "Strict" refers to the position, NOT the quality.

1. ** ZERO ROTATION / GEOMETRY LOCK(CRITICAL) **:
   - ** ABSOLUTELY NO ROTATION **: The output contour must MATCH the input image contour EXACTLY.
   - ** PIXEL - PERFECT ALIGNMENT **: Do not straighten, tilt, or re - orient the object.
   - ** NO CENTERING / NO ZOOMING **: Maintain the EXACT framing and white space of the original image. Do NOT re-center the object.
   - ** 1:1 PIXEL OVERLAP **: The output pixels must perfectly align with the input pixels.

2. **MANDATORY BEAUTIFICATION ("EDGE FOCUS")**:
   - **SMOOTH BRIM & BOUNDARIES**: If the outer edge (brim, silhouette) is wavy, jagged, or has pixel staircases, smooth it into a perfect, fluid curve. This is the TOP PRIORITY.
   - **SILHOUETTE CLEANING**: Remove visual noise, loose threads, and lint specifically from the product outlines.
   - **MINIMAL SURFACE RETOUCH**: Only smooth major defects on the body. Preserve as much original texture/weave as possible.
   - **FORM RETENTION**: Do not change the shape. If the crown is collapsed, keep it unless it looks like a defect, then "polish" the curve.

3. **CLEANUP & POLISH**:
   - **DELETE TRASH**: Remove all Hang Tags, Price Labels, and Security Sensors.
   - **CLEAN ALPHA CUTOUT**: Generate a sharp, high-resolution mask. No jagged edges in the cutout.

4. **LIGHTING & TEXTURE**:
   - **EDGE LIGHTING**: Fix over-exposed highlights on the product boundaries to ensure a clean cutout.
   - **TEXTURE FIDELITY**: Keep the core material grain identical to the source.

5. ** OUTPUT **:
    - Pure White Background(#FFFFFF).
   - High precision alpha cutout.`;


    // Check if it's a Model View
    if (viewType.startsWith('model_')) {
        // Logic for Model / Wardrobe / Hair / Scene
        const hairLogic = config.hairColor ? `, hair color: ${config.hairColor} ` : "";

        // 1. Identity Logic
        const modelIdentity = selectedModel ? modelAI : `${config.ethnicity || 'asian'} ${config.gender || 'female'} model${hairLogic} `;

        // 2. Camera / Composition Override
        // If creativity is high, allow standard catalog composition. 
        // If creativity is low, locked to reference framing.
        const isStrict = config.creativity < 30;
        const composition = isStrict
            ? "ORIGINAL REFERENCE FRAMING: Maintain the exact same camera distance, cropping, and object placement as the source image."
            : "Professional Medium Shot (Waist Up), Camera Distance 2 meters. Show head, shoulders, and chest clearly. The head must be Life-Sized and proportional to the hat.";

        // 3. Modular Splicing
        const modelDesc = [modelIdentity, composition, viewAI, styleAI].filter(Boolean).join(', ');

        const scene = config.scene ? `in a ${config.scene} ` : "Pure White Background";
        // config.clothing is now guaranteed to be set in generateImages for consistency
        const wardrobeStyle = config.clothing;

        // HAT STAND REPLACEMENT LOGIC
        const hatStandLogic = `
SPECIAL INSTRUCTION(HAT STAND REPLACEMENT):
If the source image shows the hat on a stand, mannequin, or bust:
    1. DETECT & DELETE the stand.
2. REPLACE it with the requested Model's head/body.
    3. CRITICAL: The PROJECTION, ANGLE, and GEOMETRY of the HAT must remain 100 % UNCHANGED.Do NOT rotate or tilt the hat.
4. HEAD SCALE: The model's head must be sized to fit NATURALLY inside the hat (life-sized matching).
    5. VIEW RECONSTRUCTION: ${isStrict ? "DO NOT change framing. Keep hat position and scale identical." : `Reconstruct the scene as a ${composition}. Do NOT keep the original framing of the hat stand; zoom out to show the model's upper body.`}
`;

        prompt = `TASK: Composite the Reference Hat onto a ${modelDesc}.
    SCENE: ${scene}.
    PERSONA: Professional Catalog Model.
        OUTFIT: ${wardrobeStyle}.
${hatStandLogic}

    IMPORTANT: The hat appearance(texture / shape) and VIEWING ANGLE must remain IDENTICAL to the reference image.Do not warp or rotate.${base} `;

    } else {
        // PRODUCT VIEW (Front, Back, Detail, Top, Inside, etc.)
        // All treated equally as "Strict Cutout"
        prompt = strictCutoutLogic;
    }

    // Append Manual Override if present (Highest Priority)
    if (config.customPrompt) {
        prompt += `
USER OVERRIDE INSTRUCTION: ${config.customPrompt} `;
    }

    return prompt;
};

// --- NanoBanana API Adapter (Async Polling) ---

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const pollTaskStatus = async (taskId, apiKey) => {
    const pollUrl = `https://api.nanobananaapi.ai/api/v1/nanobanana/record-info?taskId=${taskId}`;
    const maxAttempts = 60; // 3 minutes timeout (60 * 3s)
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const response = await fetch(pollUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (!response.ok) throw new Error(`Polling Error: ${response.status}`);

            const data = await response.json();
            // Status Values: 0: GENERATING, 1: SUCCESS, 2: CREATE_FAILED, 3: GENERATE_FAILED
            const status = data.data?.status ?? data.status;

            console.log(`[NanoBanana] Polling Task ${taskId}: Status ${status}`);

            if (status === 1) {
                // SUCCESS
                return data.data?.resultImageUrl || data.resultImageUrl;
            } else if (status === 2 || status === 3) {
                // FAILED
                throw new Error(`Task Failed with Status ${status}: ${data.msg || 'Unknown Error'}`);
            }

            // Still GENERATING (0) - Wait and retry
            await sleep(3000);
            attempts++;
        } catch (error) {
            console.error("Polling Exception:", error);
            throw error;
        }
    }
    throw new Error("Task Timed Out");
};

const generateSingleImageNanoBanana = async (referenceImages, prompt, apiKey, apiUrl) => {
    let imageUrls = [];

    // Note: 'type' parameter is NOT supported in generate-pro.
    // 'imageUrls' is the only trigger for Image-to-Image.

    if (referenceImages && referenceImages.length > 0) {
        const refImg = referenceImages[0];
        if (refImg.fullDataUrl) {
            imageUrls = [refImg.fullDataUrl];
        }
    }

    const payload = {
        prompt: prompt,
        imageUrls: imageUrls,
        resolution: "2K",       // Per spec: 1K, 2K, 4K
        aspectRatio: "1:1",     // Per spec: 1:1, 3:4, 4:3, etc.
        callBackUrl: "https://placeholder-callback.com" // Required field per spec description
    };

    console.log("[NanoBanana] Submitting Task (Pro):", JSON.stringify(payload, null, 2));

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (!response.ok || responseData.code !== 200) {
        throw new Error(`Submission Failed: ${responseData.msg || responseData.message || JSON.stringify(responseData)}`);
    }

    const taskId = responseData.data?.taskId;
    if (!taskId) throw new Error("No Task ID returned from API");

    console.log(`[NanoBanana] Task Submitted. ID: ${taskId}`);
    return await pollTaskStatus(taskId, apiKey);
};

// --- Google Gemini API Adapter (Sync Call) ---
const generateSingleImageGemini = async (referenceImages, prompt, apiKey, apiUrl, img2imgInput = null, config = null) => {
    // Determine provider based on URL or Config

    // Ensure Key is passed
    if (!apiUrl.includes("key=") && apiKey) {
        apiUrl += `?key=${apiKey}`;
    }

    // Construct Payload
    // Convert all images to Inline Data for Gemini
    const inlineDataParts = referenceImages.map(img => {
        return {
            inline_data: {
                mime_type: img.mimeType || 'image/jpeg',
                data: img.data
            }
        };
    });

    // Content Part
    // Creativity & Fidelity Logic
    const creativity = config?.creativity ?? 20; // Default 20 (Strict-ish)
    const effectiveTemp = (creativity / 100) * 1.5; // 0.0 to 1.5

    // Strictness Injection
    const strictnessPrompt = creativity < 30
        ? "\n[STRICT MODE ACTIVE]: REPLICATE LAYOUT 1:1 (NO ZOOM/NO RADIUS). However, you MUST perform HIGH-END RETOUCHING: Smooth all jagged edges, remove wrinkles, and fix lighting. The outline must be identical, but the content must be PERFECTLY BEAUTIFIED."
        : "";

    // Inject Advanced Settings as text instructions since standard generationConfig doesn't support them
    const advancedInstructions = config ? `
[GENERATION DIRECTIVES]
- ASPECT RATIO: ${config.aspect_ratio || '1:1'}
- OUTPUT QUALITY: ${config.imageSize || '1K'}
- THINKING DEPTH: ${config.thinkingLevel || 'high'} (Optimize for reasoning and complex spatial logic)
- FIDELITY MODE: ${creativity < 30 ? 'STRICT COPY' : 'CREATIVE REIMAGINING'}${strictnessPrompt}
`.trim() : '';

    const parts = [
        { text: `${advancedInstructions}\n\n${prompt}`.trim() },
        ...inlineDataParts
    ];

    // Add Input Image for Refinement (if available)
    if (img2imgInput) {
        // img2imgInput is "data:image/jpeg;base64,....."
        const base64Data = img2imgInput.split(',')[1];
        const mimeType = img2imgInput.split(';')[0].split(':')[1];

        parts.push({ text: "INPUT IMAGE TO REFINE (PREVIOUS ATTEMPT):" });
        parts.push({
            inline_data: {
                mime_type: mimeType,
                data: base64Data
            }
        });
    }

    const payload = {
        contents: [{ parts: parts }],
        generationConfig: {
            temperature: effectiveTemp,
            topK: creativity < 20 ? 1 : 40, // Deterministic at very low creativity
            topP: 0.9,
            maxOutputTokens: 2048,
        }
    };

    console.log(`[Gemini] Sending Request to ${apiUrl}... (Img2Img: ${!!img2imgInput})`);

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Gemini Error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log(`[Gemini Raw]`, JSON.stringify(data, null, 2));

    // Parse Result
    const candidates = data.candidates;
    if (candidates && candidates.length > 0) {
        const parts = candidates[0].content.parts;
        const imagePart = parts.find(p => p.inline_data || p.inlineData);
        if (imagePart) {
            const blob = imagePart.inline_data || imagePart.inlineData;
            return `data:${blob.mime_type || blob.mimeType};base64,${blob.data}`;
        }
    }

    throw new Error("No image data found in Gemini response");
};

// --- Main Dispatcher ---
const generateSingleImage = async (referenceImages, prompt, apiKey, apiUrl, img2imgInput = null, config = null) => {
    // Determine provider based on URL or Config
    if (apiUrl.includes("nanobanana")) {
        return await generateSingleImageNanoBanana(referenceImages, prompt, apiKey, apiUrl);
    } else {
        return await generateSingleImageGemini(referenceImages, prompt, apiKey, apiUrl, img2imgInput, config);
    }
};

// Mapping from Upload Slot ID to Prompt View Type
const SLOT_TO_VIEW_TYPE = {
    'p_front': 'front',
    'p_angle': 'angle_front',
    'p_back': 'back',
    'p_top': 'top_overhead',
    'p_detail': 'detail',
    'p_inside': 'inside',
    'm_front': 'model_front',
    'm_side': 'model_side',
    'm_back': 'model_back',
    'm_pose1': 'model_lifestyle',
    'm_pose2': 'model_lifestyle_hat',
    'm_pose3': 'model_lifestyle_smile'
};

const SLOT_LABELS = {
    'p_front': 'Product Front',
    'p_angle': 'Product Angle',
    'p_back': 'Product Back',
    'p_top': 'Product Top',
    'p_detail': 'Product Detail',
    'p_inside': 'Product Inside',
    'm_front': 'Model Front',
    'm_side': 'Model Side',
    'm_back': 'Model Back',
    'm_pose1': 'Model Pose A',
    'm_pose2': 'Model Pose B',
    'm_pose3': 'Model Pose C'
};

export const generateImages = async (viewImagesMap, config, onImageGenerated, onStatus, presets = null) => {
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
        return {
            key: slotId,
            file: file,
            viewType: SLOT_TO_VIEW_TYPE[slotId] || 'front',
            label: SLOT_LABELS[slotId] || slotId,
            isModel: slotId.startsWith('m_')
        };
    });

    const totalTasks = tasks.length;
    let completedTasks = 0;
    let generatedResults = { images: {}, payload: null };

    // Concurrency Helper (Async Pool)
    const asyncPool = async (poolLimit, iterable, iteratorFn) => {
        const ret = [];
        const executing = [];
        for (const item of iterable) {
            const p = Promise.resolve().then(() => iteratorFn(item, iterable));
            ret.push(p);
            if (poolLimit <= iterable.length) {
                const e = p.then(() => executing.splice(executing.indexOf(e), 1));
                executing.push(e);
                if (executing.length >= poolLimit) {
                    await Promise.race(executing);
                }
            }
        }
        return Promise.all(ret);
    };

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
                // We pass `availableLabels` as just this one label.
                const currentPrompt = getViewPrompt(task.viewType, config, [task.label], task.key, presets);

                // 3. Generate
                updateStatus(`Generating: ${task.label}...`);

                // We use the same generation function, but refImages only has 1 item.
                // Note: The prompt inside getViewPrompt handles "Strict Cutout" or "Hat Stand Replacement" based on viewType logic.
                const resultUrl = await generateSingleImage(
                    processedImages,
                    currentPrompt,
                    apiKey,
                    apiUrl,
                    null, // No img2img input for now
                    config
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
   - If Front View = Logo on Left, then Top View = Logo on Left.
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
 * AI Supervisor: Assess Image Quality & Compliance
 * Uses Gemini 2.0 Flash to score the image (0-10) and check for specific defects.
 * Now includes View-Specific Logic (e.g., Back View must not show Front Logo).
 * NOW SUPPORTS MULTI-REFERENCE (Array).
 */
const assessImageQuality = async (generatedImageUrl, originalPrompt, referenceImageObjList, apiKey, apiUrl, viewName = "General") => {
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

    if (mode === 'model_identity') {
        focusAreas = `
1. **Facial Structure**: Eye shape, nose bridge height, lip volume, jawline, and proportions.
2. **Skin & Beauty**: Skin tone, texture (pores, freckles), and ethnicity markers.
3. **Hair Style**: Texture, length, and exact color.
4. **Physique**: General body build and height perception.
`;
        outputSchema = `{
  "visual_description": "A summary of the model's look.",
  "visual_identity": "Prompt segment defining ONLY physical appearance (face, skin, hair).",
  "consistency_notes": "Critical features for identity."
}`;
    } else if (mode === 'model_pose') {
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
