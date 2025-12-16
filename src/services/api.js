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
const getViewPrompt = (viewType, config, availableLabels = []) => {
    // Spec Requirement: Pure White Background (to be post-processed to #F9F9F9), Studio Lighting 5500K.
    // Added "NO shadows, NO filters" to base prompt.
    const base = `
White background, Studio 5500K, 8k resolution. NO dramatic shadows, NO artistic filters, NO post-processing styles.
GLOBAL NEGATIVE PROMPT (FORBIDDEN):
- **NO HANG TAGS / PRICE LABELS / SECURITY TAGS**: Remove all retail tags hanging from the hat. The product must look like a clean studio sample.
- NO MANNEQUIN HEAD (unless specified in model view).
- NO WATERMARKS.`;

    // Truth Enforcing Context (User Defined Strict Mode)
    let context = `
SYSTEM ROLE: High-Fidelity Product Cutout & Display Engine.
TASK: Show the product on a pure white background as an isolated object.

STRICT PROTOCOL (USER DEFINED):
1. **RESTORE ALL SHOOTING DETAILS**: You must faithfully render the texture, weave, and imperfections. CRITICAL: Analyze the specific Reference Images and their assigned LABELS (e.g., 'Detail', 'Side') to understand exactly which feature corresponds to which view.
2. **NO INVENTION**: Do not invent details out of thin air (不能凭空添加细节).
3. **NO BEAUTIFICATION**: Do not beautify the product (不能美化产品). Show it as it is.
4. **ALLOWED EDIT**: You may ONLY smooth wrinkles (只能抚平褶皱). Do not alter structural geometry.
5. **MATERIAL TRUTH**: Do not use wrong color blocks or materials (不能使用错误的色块及材质).
6. **NO IMAGINATION**: Do not generate non-existent things (不能使用想象生成不存在的东西).
7. **SOURCE TRUTH**: ONLY use elements present in the image (只能使用图中有的元素).
8. **LOGO CONSISTENCY**: For products with logos, maintain Uniform Logo Size and Position relative to the product body across all generated views (保持Logo大小及位置统一).
`;

    // Inject JSON Topology if present (Parsed or Raw)
    if (config.description) {
        context += `
TOPOLOGY CONSTRAINT (JSON API):
${config.description}
INSTRUCTION: Follow this topology STRICTLY.
`;
    }

    // Inject Color Enforcement Protocol (Modular)
    if (config.targetColor) {
        context += `
COLOR ENFORCEMENT PROTOCOL (OVERRIDE):
- TARGET COLOR: ${config.targetColor}
- ACTION: Recolor the base material of the product to match the Target Color EXACTLY.
- CONSTRAINT: PRESERVE TEXTURE. Do not paint flat color. You must map the Target Color onto the existing weave/grain/surface topology.
- SCOPE: Only the main product material. Do not recolor skin, background, or neutral hardware unless specified.
`;
    }

    let prompt = "";
    switch (viewType) {
        case 'front':
            prompt = `${context} 
ACTION: Generate 0-degree Front View.
VERIFICATION: Pixel-perfect match to reference. This is the GROUND TRUTH. ${base}`;
            break;

        case 'angle_front':
            prompt = `${context} 
ACTION: Rotate object exactly 45 degrees.
CONSTRAINT: Do not distort the proportions. Keep the perspective telephoto (low distortion), not wide-angle. Maintain RIGID structural integrity. ${base}`;
            break;

        case 'back':
            const hasBackRef = availableLabels.some(l => l.includes('back'));
            const backInstruction = hasBackRef ?
                "REFERENCE AVAILABLE: Use the provided 'Back View' image as primary source." :
                "MISSING BACK REFERENCE: Infer the back form from the 'Front View' silhouette. CRITICAL: Render the surface SMOOTH and PLAIN. Do NOT invent a Back Logo, Adjustable Strap, or Buckle unless explicitly seen in other views.";

            prompt = `${context} 
ACTION: Rotate object 180 degrees.
LOGIC: ${backInstruction}
CRITICAL WARNING: The back is often blank. When in doubt, render it SMOOTH. ${base}`;
            break;

        case 'top_overhead':
            const hasTopRef = availableLabels.some(l => l.includes('top'));
            const topInstruction = hasTopRef ?
                "REFERENCE AVAILABLE: Use the provided 'Top View' image." :
                "MISSING TOP REFERENCE: Infer the top geometry from the 'Front' and 'Side' brims. Assume standard symmetrical circle/oval shape.";

            prompt = `${context} 
ACTION: 90-degree Flat Lay View.
LOGIC: ${topInstruction}
ORIENTATION: The FRONT of the product must face the BOTTOM of the frame (6 o'clock).
CONSTRAINT: Perfect symmetry. Ensure the opening/brim is geometrically perfect (circle or oval). ${base}`;
            break;

        case 'inside':
            const hasInsideRef = availableLabels.some(l => l.includes('inside'));
            const insideInstruction = hasInsideRef ?
                "REFERENCE AVAILABLE: COPY the Reference Image's interior EXACTLY (Pattern/Tag)." :
                "MISSING INSIDE REFERENCE: Render a GENERIC PLAIN interior. Match the color to the outer material or standard black/beige. Do NOT invent a lining pattern or brand tag.";

            prompt = `${context} 
ACTION: Inside View.
LOGIC: ${insideInstruction}
CONSTRAINT: 
- If reference is available, copy it. 
- If missing, keep it minimal and realistic.
- Do not invent a generic satin lining if the reference is unlined or different.`;
            break;

        case 'detail':
            const hasDetailRef = availableLabels.some(l => l.includes('detail'));
            const detailInstruction = hasDetailRef ?
                "REFERENCE AVAILABLE: Use the provided 'Detail View' zoom-in as ground truth." :
                "MISSING DETAIL REFERENCE: Use the highest resolution 'Front' or 'General' view. Do NOT invent micro-textures. If you can't see the weave, render smooth material.";

            prompt = `${context} 
ACTION: Extreme Macro Textural Shot (Micro-Photography).
LOGIC: ${detailInstruction}
CAMERA: 100mm Macro Lens. Aperture f/8. Focus distance 10cm.
CONSTRAINT: 
- SINGLE FOCUS PRINCIPLE: IMPOSSIBLE to see the whole hat. Show ONLY a 5cm x 5cm patch of fabric.
- MAGNIFICATION: Extreme Close-up. I want to see the thread weave.
- NO LOGOS/BRANDING: Do NOT show the logo. This is a material sample shot. Showing the logo will ruin the texture focus.
- TEXTURE MATCH: The weave/grain must be identical to the zoom-in of the reference.`;
            break;

        case 'model_front':
        case 'model_angle':
        case 'model_side':
        case 'model_back':
        case 'model_lifestyle':
            // Logic for Model / Wardrobe / Hair / Scene
            const hairLogic = config.hairColor ? `, hair color: ${config.hairColor}` : "";
            const modelDesc = `${config.ethnicity || 'asian'} ${config.gender || 'female'} model${hairLogic}`;

            const scene = config.scene ? `in a ${config.scene}` : "Pure White Background";
            const wardrobeStyle = config.clothing ? config.clothing : "Match the product's style (Minimalist/Neutral).";

            // Model View Fallback Logic (Restored)
            let modelFallback = "";
            if (viewType === 'model_back' && !availableLabels.some(l => l.includes('back'))) {
                modelFallback = "MISSING BACK REFERENCE: Render the product back as PLAIN/SMOOTH. Do not invent details.";
            }

            // Global Constraints (Wardrobe, Composition, Subject Priority)
            const globalModelConstraints = `
SYSTEM ROLE: Commercial Fashion Compositor & Virtual Stylist.
GLOBAL MODEL CONSTRAINTS (ALL VIEWS):
1. SUBJECT PRIORITY: The hat MUST occupy 50% of the visual weight. The model is the canvas; the hat is the HERO.
2. COMPOSITION: Head-and-Shoulders or Half-Body crop ONLY. Fixed distance (1.3m).
3. WARDROBE PROTOCOL (STRICT):
    - NO patterns, prints, or logos on clothing.
    - FABRIC: Linen, Cotton, or simple Knitwear.
    - COLORS: Neutral, Light tones (White, Beige, Light Grey) ONLY. Dark/Neon forbidden.
    - STYLE: ${wardrobeStyle}
4. LIGHTING: Soft, even lighting, 5500K. No hard shadows on face.
5. BACKGROUND: ${scene}.
${modelFallback}
`;

            let specificAction = "";
            switch (viewType) {
                case 'model_front':
                    specificAction = `
ACTION: Portrait Frontal View (0°).
POSE: Faces camera directly. Direct eye contact.
FOCUS: Hat perfectly centered. Show brim width and crown height clearly.`;
                    break;
                case 'model_angle':
                    specificAction = `
ACTION: Angled Front View (45°).
POSE: Head turned slightly to side.
FOCUS: Showcase volumetric structure of brim and crown curvature.`;
                    break;
                case 'model_side':
                    specificAction = `
ACTION: Side Profile View (90°).
POSE: Looking straight ahead (off-camera).
FOCUS: Sharp profile. Highlight brim silhouette (flat or curved). Edge lines must be razor sharp.`;
                    break;
                case 'model_back':
                    specificAction = `
ACTION: Rear View (180°).
POSE: Back to camera.
FOCUS: Rear details of the hat.`;
                    break;
                case 'model_lifestyle':
                    specificAction = `
ACTION: Lifestyle / Editorial Shot.
POSE VARIATIONS (Randomly Select One):
  - Hand Touching Brim (手扶帽檐): Natural interaction.
  - Looking Down & Smiling (低头微笑): Candid, soft expression.
  - Looking Back (回头侧望): Over the shoulder view.
  - Sitting Pose (坐姿造型): Relaxed posture.
LIGHTING: Soft, even, diffused lighting (均匀柔光). No harsh shadows.
FLOW: Posture and eye contact must be natural and fluid.
FOCUS: Highlight the brim lines (突出帽檐线条) and the fit in different wearing states (不同佩戴状态的效果).`;
                    break;
            }

            prompt = `${globalModelConstraints}
TASK: Composite the Reference Product onto a ${modelDesc}.
SCENE: ${scene}.
${specificAction}
IMPORTANT: The product appearance (texture/shape) must remain IDENTICAL to the reference. Do not wrap or warp the product unrealistically. ${base}`;
            break;

        default:
            prompt = `${context} Projection of product. ${base}`;
            break;
    }

    // Append Manual Override if present (Highest Priority)
    if (config.customPrompt) {
        prompt += `
USER OVERRIDE INSTRUCTION: ${config.customPrompt}`;
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
const generateSingleImageGemini = async (referenceImages, prompt, apiKey, apiUrl, img2imgInput = null) => {

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
    const parts = [
        { text: prompt },
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
            temperature: 0.4,
            topK: 40,
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
const generateSingleImage = async (referenceImages, prompt, apiKey, apiUrl, img2imgInput = null) => {
    // Determine provider based on URL or Config
    if (apiUrl.includes("nanobanana")) {
        return await generateSingleImageNanoBanana(referenceImages, prompt, apiKey, apiUrl); // Note: NanoBanana adapter not updated, assuming direct usage
    } else {
        return await generateSingleImageGemini(referenceImages, prompt, apiKey, apiUrl, img2imgInput);
    }
};

export const generateImages = async (imageObjects, config, onImageGenerated, onStatus) => {
    const apiKey = import.meta.env.VITE_NANOBANANA_API_KEY;

    // Dynamic URL Construction based on Config Model
    let apiUrl = import.meta.env.VITE_NANOBANANA_API_URL || '';
    if (config.model) {
        // Regex to replace any existing model name "gemini-..." inside the URL
        apiUrl = apiUrl.replace(/models\/[a-zA-Z0-9-.]+:/, `models/${config.model}:`);
    } else {
        // Fallback default logic if not specified
        apiUrl = apiUrl.replace('{gemini-3-pro-image-preview}', 'gemini-2.5-flash-image');
    }

    console.log(`[API] Using Model: ${config.model || 'Default'} -> URL: ${apiUrl}`);

    const updateStatus = (msg) => {
        if (onStatus) onStatus(msg);
        console.log(`[Status] ${msg}`);
    };

    updateStatus("Processing Reference Images...");

    // Helper to process internal/external keys
    const processImg = async (imgObj) => {
        const file = imgObj.file ? imgObj.file : imgObj;
        const label = imgObj.label || 'general';
        const base64Info = await fileToBase64(file);
        return { ...base64Info, label };
    };

    // 1. Process Initial Images
    let processedImages = await Promise.all(imageObjects.map(processImg));

    // Define Tasks
    const specTasks = [
        { key: 'front', label: '正面视图 (0°)', type: 'front' },
        { key: 'angle_front', label: '斜侧视图 (Smart 45°)', type: 'angle_front' },
        { key: 'back', label: '背面视图 (180°)', type: 'back' },
        { key: 'top', label: '顶部俯视 (Flat Lay)', type: 'top_overhead' },
        { key: 'inside', label: '内部细节 (Inside)', type: 'inside' },
        { key: 'detail', label: '纹理特写 (Detail)', type: 'detail' }
    ];

    // Updated Model Tasks based on new SOP
    const modelTasks = [
        { key: 'model_front', label: '模特展示-正面 (Front)', type: 'model_front' },
        { key: 'model_angle', label: '模特展示-斜侧 (Angle)', type: 'model_angle' },
        { key: 'model_side', label: '模特展示-侧面 (Side)', type: 'model_side' },
        { key: 'model_back', label: '模特展示-背面 (Back)', type: 'model_back' },
        { key: 'model_lifestyle', label: '模特展示-生活 (Lifestyle)', type: 'model_lifestyle' }
    ];

    // Build Task List
    let tasks = [];
    if (config.includeProductViews) {
        // BUG FIX: Use 'task.key' (e.g. 'top') to check config, NOT 'task.type' (e.g. 'top_overhead')
        // App.jsx keys: front, angle_front, back, top, inside, detail
        const selectedSpecs = specTasks.filter(task => config.viewSelection ? config.viewSelection[task.key] : true);
        tasks = [...tasks, ...selectedSpecs];
    }

    // If Model View is enabled, add selected model sub-tasks
    if (config.includeModelView) {
        const selectedModels = modelTasks.filter(task =>
            config.modelViewSelection ? config.modelViewSelection[task.key] : true
        );
        tasks = [...tasks, ...selectedModels];
    }

    // --- ProductAI 2.0 Workflow: Decoupled Parallel Generation (No Anchor Injection) ---
    // Modification: All tasks run in parallel using ORIGINAL source images to prevent error propagation.

    const totalTasks = tasks.length;
    let completedTasks = 0;
    let generatedResults = { images: {}, payload: null };

    if (totalTasks > 0) {
        updateStatus(`Starting Parallel Optimization for ${totalTasks} Views...`);

        // Use map then Promise.all, but inject a DELAY based on index
        const results = await Promise.all(tasks.map(async (task, index) => {
            // ARTIFICIAL STAGGER: Wait 1.5s * index to force sequential-ish feeling
            // This prevents "Boom, all done" and ensures users see them pop in 1 by 1
            await delay(index * 1500);

            try {
                // Feature: Smart Fallback. Pass available labels to Prompt Engine.
                const availableLabels = processedImages.map(img => img.label);

                let attempt = 0;
                const maxRetries = 2; // Retry 0, 1, 2 (Total 3 attempts max if bad)
                let currentPrompt = getViewPrompt(task.type, config, availableLabels);
                let finalUrl = "";
                let finalAssessment = null;
                let passed = false;

                let img2imgInput = null; // Store failed image if usable for repainting

                // --- RETRY LOOP ---
                while (attempt <= maxRetries && !passed) {
                    if (attempt > 0) updateStatus(`Task ${task.label}: Retrying (Attempt ${attempt + 1})...`);

                    // 1. Generate (Pass previous failed image if available for Img2Img)
                    const url = await generateSingleImage(processedImages, currentPrompt, apiKey, apiUrl, img2imgInput);
                    finalUrl = url;

                    // 2. Assess
                    if (url) {
                        try {
                            const assessment = await assessImageQuality(url, currentPrompt, processedImages, apiKey, apiUrl, task.label);
                            finalAssessment = assessment;

                            if (assessment.score >= 8) {
                                passed = true;
                                console.log(`[Loop] Task ${task.key} PASSED with Score ${assessment.score}`);
                            } else {
                                console.warn(`[Loop] Task ${task.key} FAILED QC (Score ${assessment.score}). Reason: ${assessment.reason}`);

                                // PRESERVE FAILED RESULT:
                                // User wants to see ALL attempts. We assign a unique key to failed ones.
                                const failKey = `${task.key}_fail_${attempt + 1}`;
                                const failedResult = {
                                    url: finalUrl,
                                    label: `${task.label} (Fail #${attempt + 1})`,
                                    qc: assessment
                                };

                                // Stream immediately
                                if (onImageGenerated) onImageGenerated(failKey, failedResult, completedTasks, totalTasks);

                                // Save to final results (so it's included in download)
                                generatedResults.images[failKey] = failedResult;

                                // Prepare for next retry
                                if (attempt < maxRetries) {
                                    // SMART RETRY STRATEGY:
                                    if (assessment.error_type === "DETAIL") {
                                        // Geometry is good, Texture/Detail is bad -> Use Img2Img
                                        img2imgInput = finalUrl;
                                        currentPrompt += `\n\nPREVIOUS ATTEMPT (ATTACHED) HAD GOOD GEOMETRY BUT DETAIL ERRORS. FIX: ${assessment.retry_suggestion}. KEEP THE POSE, FIX THE DETAILS!`;
                                        console.log(`[Loop] Smart Retry: Using Img2Img for Detail Fix.`);
                                    } else {
                                        // Geometry Bad -> Full Regen
                                        img2imgInput = null;
                                        currentPrompt += `\n\nPREVIOUS ATTEMPT FAILED (BAD GEOMETRY). CRITICISM: ${assessment.reason}. RESTART AND FIX: ${assessment.retry_suggestion}.`;
                                        console.log(`[Loop] Smart Retry: Full Clean Regen.`);
                                    }
                                }
                            }
                        } catch (qcError) {
                            console.error(`[Loop] QC Crashed, treating as PASS to avoid stalling.`, qcError);
                            passed = true; // Fail open
                        }
                    }

                    if (!passed) attempt++;
                }
                // ------------------

                // Stream Update
                completedTasks++;

                const resultData = {
                    url: finalUrl,
                    label: task.label,
                    qc: finalAssessment
                };

                if (onImageGenerated) onImageGenerated(task.key, resultData, completedTasks, totalTasks);

                // Return result with QC Metadata
                return {
                    key: task.key,
                    data: resultData
                };
            } catch (err) {
                console.error(`Task ${task.key} failed:`, err);
                return { key: task.key, error: err.message };
            }
        }));

        results.forEach(res => {
            if (!res.error) {
                generatedResults.images[res.key] = res.data;
            }
        });
    }

    updateStatus("All Tasks Completed.");
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
  "_thinking_trace": "string (Step-by-step reasoning. CRITICAL: Explicitly verify if a 'Band' or 'Eyelets' actually exist. Do not assume. Many hats have NO band. If just a crease, say so.)",
  "reference_image_manifest": [
      { 
        "image_label": "string", 
        "description": "string",
        "contains_asymmetry": "boolean"
      }
  ],
  "global_consistency": {
      "material_name": "string",
      "texture_description": "string",
      "consistency_rule": "The described material MUST be applied uniformly. Ignore lighting variations."
  },
  "feature_side": "left" | "right" | "symmetrical" | "unknown",
  "design_dna": {
     "material_origin": "string",
     "weave_pattern": "string",
     "color_palette": "string"
  },
  "geometry_profile": {
     "crown_shape": "string",
     "brim_behavior": "string",
     "volumetric_feel": "string"
  },
  "components": {
     "band_specs": "string (Start with 'None' if no distinct band exists. Do NOT describe shadows as bands.)",
     "hardware_list": ["string"],
     "decoration_logic": "string"
  },
  "spatial_topology": {
      "logo_position": "string",
      "asymmetry_notes": "string",
      "side_visibility_check": "string"
  },
  "view_specific_features": {
      "back_view_details": "string",
      "inside_view_details": "string",
      "top_view_details": "string"
  }
}

CRITICAL ANTI-HALLUCINATION RULES:
1. **NO GENERIC COMPONENTS**: Do not list "Leather Band" or "Eyelets" unless you clearly see them. If the hat is a simple straw mold, say "No Band", "No Eyelets".
2. **Material Truth**: You must define a SINGLE "Global Material" based on the highest quality image provided.
3. **Back View Enforcer**: If a "Back View" image is provided, you MUST extract its features into "back_view_details".
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
    let reviewApiUrl = "";

    if (apiUrl && apiUrl.includes("googleapis.com")) {
        // User requested strict adherence to "gemini-2.5-flash"
        reviewApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    } else if (import.meta.env.VITE_NANOBANANA_API_URL && import.meta.env.VITE_NANOBANANA_API_URL.includes("gemini")) {
        // Update Proxy URL to target 2.5 Flash
        reviewApiUrl = import.meta.env.VITE_NANOBANANA_API_URL.replace(/gemini-[\w.-]+-exp/, 'gemini-2.5-flash').replace('gemini-3-pro-image-preview', 'gemini-2.5-flash');
    } else {
        reviewApiUrl = apiUrl;
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
CONTEXT: The User wants "Smart Correction". If the generator added a "Decorative Knot" that isn't in the reference, you MUST flag it for removal.

STRICT ANALYSIS STEPS:
1. **Analyze Reference**: Look at the Reference Images. Identify key features.
   - **Feature Verification**: Does the Reference *actually* have a Back Toggle/Knot? Or is it a hanging Chin Strap? Or is it Clean?
   - **Chin Strap vs Toggle**: A Chin Strap hangs down loosely. A Toggle is a fixed mechanism on the band. DO NOT CONFUSE THEM.

2. **PRIORITY CHECK - LOGO POSITION**: 
   - Check the **LOGO** (Graphic/Text). Is it on the correct side? 
   - If Reference has Logo on LEFT, Candidate MUST have it on LEFT. 
   - **Mirror Check**: Note that Front view might show logo on left, so "Top" view must verify vertically.
   - If Logo is missing or on wrong side -> **IMMEDIATE FAIL (Score < 5)**.

3. **Identify Features (STRICT MATCHING)**:
   - **BACK FEATURE CHECK**: 
     - If Reference = **CLEAN/SMOOTH**: Candidate MUST be clean. Any knot/bow is a **HALLUCINATION**.
     - If Reference = **CHIN STRAP** (Hanging): Candidate MUST show straps hanging down. A "Button Knot" or "Bow" on the band is **WRONG** (Score < 8).
     - If Reference = **TOGGLE** (dogleash/cord lock): Candidate MUST have it.

4. **Analyze View Logic**: 
   - **BACK VIEW**: 
     - **Hallucination Check**: "Did the generator invent a 'Cinch' or 'Bow'?" -> **FAIL**.
     - **Chin Strap Integrity**: If the reference has a Chin Strap, it must look like two separate straps or a loop hanging DOWN, not a bunched up knot at the center back.
   - **FLAT LAY (TOP VIEW)**: 
     - **Orientation Rule**: Front (Brim/Logo) -> Bottom. Back (Toggle) -> Top.
     - **Exterior Rule**: Must show **OUTSIDE**. If showing Inside -> WRONG.
     - **Defect Check**: If Back Toggle appears at Bottom -> WRONG.
   - **SIDE VIEW**: Profile must match.

CRITICAL RULES (Hats & Fashion):
1. **Logo Integrity**: Do not corrupt the spelling or shape of the logo.
2. **No Hallucinated Knots**: The model loves to add "cute bows" or "knots" at the back. If the reference doesn't have it, KILL IT.
3. **Strap Logic**: Chin Strips hang. Toggles sit. Distinguish them.
4. **View Consistency**: Reference is King. If Reference says Clean, Candidate implies Clean.
5. **Material Truth**: Texture/Weave must look identical.
6. **Clean Background**: Must be Pure White.

SCORING PRIORITIES (Weighted Penalty):
1. **FATAL ERROR (Score < 5)**: MISSING KEY ELEMENTS. (e.g., Reference has a back buckle, Candidate has None). Feature Omission is the worst offense.
2. **MAJOR ERROR (Score 5-6)**: WRONG ATTRIBUTES. (e.g., Reference is Denim, Candidate is Leather. Wrong color, wrong shape).
3. **MINOR ERROR (Score 6-7)**: HALLUCINATIONS / GHOSTING. (e.g., Adding a logo where there is none). While bad, Missing items is worse.

SCORING GUIDE (0-10):
- 10: Perfect. Indistinguishable.
- 8-9: Pass.
- < 8: FAIL (Trigger Retry).

OUTPUT JSON ONLY:
{
  "score": number, 
  "reason": "Start with 'MISSING: [item]' or 'WRONG: [item]' or 'EXTRA: [item]'.",
  "retry_suggestion": "Actionable fix. Mention the specific location.",
  "error_type": "GEOMETRY" | "DETAIL" | "NONE"
}
Detail Guide:
- "GEOMETRY": Wrong shape, distorted, wrong view angle (e.g. Front instead of Back). -> REQUIRES FULL REGEN.
- "DETAIL": Texture wrong, logo missing/wrong, extra artifacts, bad lighting. Geometry is fine. -> CAN BE FIXED WITH IMG2IMG.
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
