
// === Prompt Engineering for Views ===
export const getViewPrompt = (viewType, config, availableLabels = [], taskKey = '', presets = null, styleRefLabel = '') => {
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
STRICT PROTOCOL (ZERO CREATIVITY ON STRUCTURE):
1. **GEOMETRY & ORIENTATION LOCK**: You are a texture projection engine, NOT a creative artist. The hat's 3D orientation, angle, and core structure are FROZEN. Do NOT rotate, tilt, or reposition the hat in any way.
2. **STRUCTURAL PRESERVATION**: The shape, silhouette, brim angle, crown height, and all major structural elements MUST match the reference EXACTLY. If the reference has a flat brim, generate a flat brim. If curved, generate curved.
3. **ALLOWED BEAUTIFICATION (DECORATIVE ONLY)**: You MAY beautify decorative accessories and edges:
   - Bow/ribbon refinement: Smooth wrinkles in bows, make them more symmetrical and neat
   - Edge finishing: Clean up frayed edges, tidy loose threads
   - Surface polish: Remove dust, lint, and minor imperfections
   FORBIDDEN: Do NOT change the bow's position, size ratio, or color. Do NOT add new decorative elements.
4. **DIGITAL RESTORATION**: **STEAM & IRON** the fabric. Remove major wrinkles and dents. "Puff" out sunken areas to look brand new.
5. **MATERIAL TRUTH**: The weave/fabric texture must be IDENTICAL to the reference, but cleaner and higher resolution (Denoised).
6. **CLEAN BACKGROUND**: **PURE WHITE (HEX #FFFFFF)**. Natural contact shadows are ALLOWED to ground the object.
7. **No Text/Watermarks**: Do not render text overlaps.
8. **NEGATIVE PROMPT**: (wrong orientation:2.0), (rotated hat:2.0), (tilted:2.0), (wrinkles:1.3), (creases:1.3), (dust:1.3), (lint:1.3), gray background, off-white, studio floor, vignette, drawing, painting, illustration, 3d render, sketch, low quality, hanging tag, price label, security tag, plastic loop, extra bow, extra knot, missing bow, bow in wrong position.
`;

    // Truth Enforcing Context (User Defined Strict Mode)
    let context = `
SYSTEM ROLE: High-Fidelity Product Cutout & Display Engine.
TASK: Show the product on a pure white background as an isolated object.

STRICT PROTOCOL (USER DEFINED):
1. **ORIENTATION IMMUTABILITY**: The hat's 3D orientation (yaw, pitch, roll) is LOCKED. You MUST NOT rotate or tilt the hat. Copy the exact angle from the reference.
2. **RESTORE ALL SHOOTING DETAILS**: Faithfully render the texture, weave, and all structural features. Analyze the Reference Images and their LABELS (e.g., 'Detail', 'Side') to understand which feature corresponds to which view.
3. **NO STRUCTURAL INVENTION**: Do not invent details out of thin air (不能凭空添加细节). Do not change the hat's core structure, orientation, or material.
4. **ALLOWED BEAUTIFICATION**: You ARE allowed to beautify decorative elements (允许美化装饰细节):
   - Make bows/ribbons neater and more symmetrical
   - Smooth out wrinkles in bows
   - Clean edges and remove loose threads
   RESTRICTION: Do NOT change the bow's position, size, or color scheme. Do NOT add/remove decorative elements.
5. **CLEANUP PROTOCOL**: Remove all Hang Tags, Price Labels, Security Sensors (必须移除所有吊牌和标签). The product must look like a clean studio sample.
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



    // --- BRANCH: MODEL VIEW vs PRODUCT VIEW ---
    if (viewType.startsWith('model_')) {
        // ==========================================
        // SECTION: MODEL VIEW LOGIC
        // ==========================================

        // CHECK FOR TEMPLATE COMPOSITE MODE
        const templateImage = selectedModel?.templateImage;

        if (templateImage) {
            // --- TEMPLATE COMPOSITE MODE ---
            const templatePrompt = `
TASK: VIRTUAL TRY-ON / ACCESSORY REPLACEMENT.
INPUTS:
- IMAGE 1 (Reference Product): The Hat/Accessory to be worn.
- IMAGE 2 (Model Template): The Base Model Photo.

INSTRUCTION:
1. **ACTION**: Composite the Hat from IMAGE 1 onto the Model's head in IMAGE 2.
2. **CONSTRAINT - BODY LOCK**: You MUST preserve the model's exact pose, clothing, and background from IMAGE 2. Do not change the person's identity or dress unless instructed.
3. **CONSTRAINT - HAT TRUTH**: The Hat MUST look exactly like IMAGE 1 (Texture, Shape, Hardware).
4. **PERSPECTIVE ADAPTATION**: Tilt or rotate the HAT to match the Model's head angle in IMAGE 2. (Do not force the model to move).
5. **FACE REFINEMENT**: If the Model Template (Image 2) has a low-res face, you may RESTORE/REFINE the facial features (Eyes, Skin) to high quality, but keep the likeness.
6. **INTEGRATION**: Add realistic contact shadows on the forehead/hair where the hat sits.

NEGATIVE PROMPT: (changing background:1.5), (changing clothes:1.5), (new pose:1.5), floating hat, bad composite, bad shadow.
`.trim();
            prompt = templatePrompt;
        } else {
            // --- STANDARD GENERATIVE MODE (TXT2IMG) ---
            const hairLogic = config.hairColor ? `, hair color: ${config.hairColor} ` : "";
            const modelIdentity = selectedModel ? modelAI : `${config.ethnicity || 'asian'} ${config.gender || 'female'} model${hairLogic} `;

            const composition = "DUAL ABSOLUTE REQUIREMENTS: 1) HAT ORIENTATION FROZEN - Copy exact 3D angle from reference. 2) HALF-BODY FRAMING MANDATORY - Show ONLY elbow-to-head crop. BOTH are non-negotiable. Frame: model portrait from ELBOW LEVEL (when arms naturally hang) to top of head. Bottom edge at mid-torso. NO waist, NO hips, NO legs, NO feet visible. If you show below elbow level = FAILED. The reference is a stand-only product shot - IGNORE its framing, create a HUMAN MODEL PORTRAIT instead. Model's face may be hidden if hat angle requires it - this is acceptable. Hat angle preservation > face visibility.";

            const scene = config.scene ? `in a ${config.scene} ` : "Pure White Background";
            const wardrobeStyle = config.outfitSuggestion || config.clothing || "Professional Studio Outfit";
            const orchestratedAI_Model = [modelIdentity, styleAI, effectivePosePrompt].filter(Boolean).join(', ');

            const modelPrompt = `
TASK: Photorealistic ${viewType.toUpperCase().replace('MODEL_', '').replace('_', ' ')} Rendering.
PRINCIPLE: THE HAT IS A FIXED INDUSTRIAL ANCHOR. The model is a supporting background element.

[PRIORITY #1 - HAT ORIENTATION ABSOLUTE LOCK - OVERRIDES EVERYTHING]:
**CRITICAL**: The hat's 3D orientation is the SUPREME PRIORITY. ALL other requirements are SECONDARY to this.
1. **FROZEN ORIENTATION**: The hat's 3D angle (yaw, pitch, roll) from the reference is ABSOLUTE LAW. Copy it EXACTLY. Do NOT rotate the hat even by 1 degree.
2. **NO ROTATION FOR AESTHETICS**: Do NOT rotate the hat to "show the model's face better" or "improve composition". The hat angle is NON-NEGOTIABLE.
3. **FACE OCCLUSION IS ACCEPTABLE**: If the hat's correct angle means the model's face is partially or fully hidden, that is PERFECTLY ACCEPTABLE. Face visibility is NOT a requirement.
4. **MODEL FOLLOWS HAT**: The model's head/neck position adapts to the hat, NOT the other way around. If the hat faces left, the model's head faces left even if it hides the face.
5. **REFERENCE ORIENTATION COPY**: Look at the reference hat on the stand. Note its exact facing direction. The hat on the model MUST face that EXACT same direction.

[PRIORITY #2 - FRAMING REQUIREMENT - ABSOLUTE ENFORCEMENT - EQUAL TO HAT PRIORITY]:
**HALF-BODY PORTRAIT LOCK (CRITICAL)**: This requirement has EQUAL WEIGHT to hat orientation. BOTH must be satisfied.
- MANDATORY CROP: Show ONLY from natural elbow level (when arms hang down) to above the head. 
- POSITIVE REQUIREMENT: The final image MUST include: upper chest, both shoulders, neck, full head, and hat. The bottom edge is at mid-torso/upper abdomen.
- FORBIDDEN ELEMENTS: You MUST NOT show waist, hips, legs, feet, full body, or any body part below the elbow line.
- FAILURE CONDITION: If the image shows waist, hips, legs, or anything below elbow level, it is a COMPLETE FAILURE regardless of hat accuracy.
- IGNORE REFERENCE FRAMING: The reference shows a product stand. DO NOT copy its composition. You are creating a HUMAN MODEL PORTRAIT.
- FRAME BREAKDOWN (ENFORCED): Bottom 10% = torso fade-out, Middle 60% = chest + shoulders + neck, Top 30% = head + hat.
- CROP VERIFICATION: Before finalizing, ask: "Can I see the waist/hips/legs?" If YES anywhere in the image, REJECT and re-crop to strict elbow-level bottom edge.
- COMPOSITION ANCHOR: half-body portrait, medium shot, bust shot, torso visible, elbow-level crop, professional headshot composition
${viewType === 'model_back' ? `
- **BACK VIEW SPECIFIC**: This is a BACK VIEW. Show ONLY the model's BACK. The model must face AWAY from camera. Show the back of the head, back of shoulders, back of torso. DO NOT show the face, side profile, or three-quarter view. The model looks in the OPPOSITE direction of the camera.
` : ''}${viewType === 'model_back_angle' ? `
- **BACK-ANGLED OBLIQUE VIEW SPECIFIC**: This is a BACK-ANGLED OBLIQUE perspective. The camera is positioned BEHIND and to the SIDE of the model (approximately 135° angle - between back and side view). Show: back of the head, back of one shoulder prominently, partial side profile of torso. The model's face should be mostly HIDDEN or only show a sliver of the side profile. This is NOT a front view, NOT a side view - it's specifically a back-oblique angle showing primarily the BACK with slight side visibility. The hat should be viewed from this back-angled perspective.
` : ''}

[PRIORITY #3 - SECONDARY HAT CONSTRAINTS]:
1. **HORIZON PARALLELISM**: The hat's brim angle is IMMUTABLE. If horizontal in reference, it stays horizontal on the model.
2. **ZERO TOLERANCE FOR ROTATION**: Match exact pitch, yaw, roll from reference. The central axis must be perfectly vertical (90°).
3. **SYMMETRY ENFORCEMENT**: Hat must be perfectly centered and symmetrical. No diagonal slants.
4. **SKELETAL CONFORMANCE**: The model's neck and head position conform to the hat's geometry. The hat dictates pose, not vice versa.

[ANATOMICAL IMMERSION (WEAR DEPTH)]:
1. **1CM EYEBROW GAP**: The hat MUST be worn deeply. The gap between the brim edge and the model's eyebrows must be exactly **1cm**. Mask the upper forehead. 
2. **BRAIDED LOGO INTEGRITY**: Protect the "N&F" label and bronze grommets. These are high-priority branding assets. They must be sharp, legible, and un-smeared.
3. **SKULL WEIGHT**: The hat must look heavy and seated. Flatten the hair completely underneath the band.

[VISUAL HIERARCHY]:
1. **PRODUCT OVER MANNEQUIN**: The hat's straw texture is the ONLY master focus. Model skin is a blurred contextual background.
2. **DARK OCCLUSION LINE**: Render a deep black contact shadow exactly at the scalp-hat boundary to ground the object.

NEGATIVE PROMPT: (rotated to show face:3.5), (adjusted angle for face:3.5), (turned hat for visibility:3.5), (hat facing camera when reference faces side:3.5), (wrong hat direction:3.0), (full body:3.0), (waist visible:3.0), (legs visible:3.0), (feet:3.0), (hips:3.0), (below elbow:2.5), (whole body:2.5), (standing pose:2.0)${viewType === 'model_back' ? ', (face visible:3.0), (side view:2.5), (three quarter view:2.5), (profile:2.5), (looking at camera:3.0)' : ''}${viewType === 'model_back_angle' ? ', (face visible:3.0), (front view:3.0), (looking at camera:3.0), (full side view:2.5), (pure profile:2.5)' : ''}, (rotated hat:2.5), (spinning hat:2.5), (turned hat:2.5), (face not matching hat direction:2.5), (mismatched orientation:2.5), (rotated product:2.0), (tilted hat:2.0), (歪头:2.0), (floating hat:1.8), (perched hat:1.8), (head tilt:1.8), (close-up:2.0), (zoomed-in face:1.5), (cropped body:1.8), (crooked:2.0), (diagonal:2.0), (askew:2.0), large head, fashion pose, hair sticking out, smudged cloth, blurred logo, full body shot, extreme close up, product stand, headless torso.

[COMPOSITION]: ${composition}
MODEL IDENTITY: ${orchestratedAI_Model}.
SCENE: ${scene}.
OUTFIT: ${wardrobeStyle}.
${categoryConstraint}
${base}
`.trim();
            prompt = modelPrompt;
        }

    } else {
        // ==========================================
        // SECTION: PRODUCT VIEW LOGIC (STRICT CUTOUT)
        // ==========================================
        const productPrompt = `
${context}
1. **GEOMETRY LOCK & COMPOSITION**:
   - **ZERO ROTATION**: Maintain the exact same orientation and tilt as the reference image.
   - **HI-FI REPRO**: The product should be sharp, clear, and perfectly isolated on the pure white background.

2. **MANDATORY BEAUTIFICATION ("EDGE FOCUS")**:
   - **SMOOTH BRIM**: Fix all jagged edges or "pixel stairs" on the silhouette.
   - **SILHOUETTE CLEANING**: Remove loose threads, dust, and lint.
   - **MINIMAL SURFACE RETOUCH**: Smooth major wrinkles but preserve core weave/texture.

3. **CLEANUP & POLISH**:
   - REMOVE all Hang Tags, Price Labels, and Security Sensors.
   - PURE WHITE BACKGROUND (#FFFFFF) with high-precision alpha mask.

4. **LIGHTING & COLOR GRADING (PROFESSIONAL STUDIO)**:
   - **5500K COLOR TEMPERATURE**: Locked at a consistent 5500K neutral daylight temperature. Ensure color accuracy.
   - **PROFESSIONAL BRIGHTNESS**: Implement high-end product photography lighting. The object should look bright, clean, and well-exposed with a premium studio feel.
   - **SOFT CONTACT SHADOW**: CRITICAL: Render a very SOFT, subtle, and natural contact shadow directly underneath the product to ground it on the white floor. Avoid heavy or long drop shadows; it must look like professional ambient occlusion.
   - Fix over-exposed highlights on output boundaries.
`.trim();

        prompt = productPrompt;
    }

    // Append Style Reference Logic if present
    if (styleRefLabel) {
        prompt += `\n\n[STYLE REFERENCE ALERT]: An additional image labeled "${styleRefLabel}" is provided. Use its COLOR, LIGHTING, and MATERIAL TONES as the master reference for the output. Maintain the geometry of the target product, but match the visual style of this style reference EXACTLY.`;
    }

    return prompt;
};
