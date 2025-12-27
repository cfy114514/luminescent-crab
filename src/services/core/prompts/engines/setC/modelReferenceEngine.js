import { SYSTEM_IDENTITY, MASTER_NEGATIVE_ROOT, UNIVERSAL_REFINE_QUALITY } from './tree/00_root_integrity';
import { getHardcoreOrientation, getSurfaceBeautify, getSetCPoseReferenceOrientation } from './tree/11_model/0_geometry_locks';
import { getGenderNegative, MODEL_MASTER_NEGATIVE } from './tree/11_model/model_integrity';
import { getOutfitCloneDirective, getVFXCompositorContext, getEnhancedPoseLock, getCloneModeIdentity, getCloneModeEnvironment } from './tree/11_model/outfit_clone';
import { getPersonaGroup, getSetBCharacter, getSetBEnvironment } from '../setB/personaConfig';

/**
 * SET C: VISUAL ANCHOR ENGINE (REBUILT)
 * Strategy: VFX Compositor / Layer-Based Logic
 */
export const getReferenceModelPrompt = (config) => `
[SYSTEM]:
[GLOBAL SYSTEM CONTEXT]:
1. ASPECT RATIO: ${config.aspectRatio || '1:1 (PERFECT SQUARE)'}.
2. RESOLUTION: 2048x2048 (2K HD).
3. BACKGROUND: **PURE WHITE (#FFFFFF) SEAMLESS**.
4. ASSET FIDELITY: Maintain 1:1 geometric truth of the input asset.
5. **COMMERCIAL STUDIO LIGHTING** (MANDATORY):
   - **SETUP**: Professional studio three-point lighting with large softboxes.
   - **KEY LIGHT**: Front-top position, soft and even illumination.
   - **FILL LIGHT**: Front fill to eliminate hard shadows under hat brim.
   - **RESULT**: Face and hat have CONSISTENT brightness. NO visible shadow under hat brim.
   - **COLOR TEMPERATURE**: Neutral (5500K), natural skin tone, no overexposure.
   - **STYLE**: E-commerce catalog photography, suitable for commercial display.
   
   **LIGHTING NEGATIVES (AVOID)**:
   - NO direct sunlight, NO outdoor lighting, NO strong directional light.
   - NO hard shadows, NO high contrast, NO golden hour/sunset light.
   - NO backlighting, NO rim lighting, NO color cast.
   
ROLE: DIGITAL COMPOSITOR (VFX ARTIST).
TASK: IMAGE COMPOSITING & GENERATION. NOT OUTDOOR PHOTOGRAPHY.

${config.visualAnchorData ? `
[SURGICAL DISSECTION - VISUAL ANCHOR DATA]:
**The following analysis is GROUND TRUTH. Adhere to it strictly.**
${config.visualAnchorData}
` : ''}

[GENERATION MODE - TEXT-GUIDED COMPOSITING]:
**CORE CONCEPT**: You are creating a NEW image combining Hat Asset (Image 1) with a generated model.

**IMAGE INPUT RULES**:
1. **HAT ASSET (Image 1)**: This is your ONLY source for the hat. Use this hat's exact shape, brim, crown, material.
2. **POSE SKETCH (Image 2)**: This is ONLY for body pose and composition. **IGNORE any hat outline in this sketch** - it's from a different hat and is irrelevant.
3. **HAT SHAPE**: Comes 100% from Image 1. Do NOT follow any hat outline from Image 2.

**GENERATION RULES**:
- **FACE**: Generate a completely NEW face.
- **BODY/POSE**: Follow the outline from Image 2 for body position, arm position, head angle.
- **HAT**: Use ONLY Image 1. Ignore Image 2's hat completely.

[COMPOSITION FROM TEXT - FOLLOW VISUAL ANCHOR DATA]:
**Use the VISUAL ANCHOR DATA above to determine:**
1. **SUBJECT_POSITION**: Follow the FRAME_MARGINS and NORMALIZED_BBOX values.
2. **BODY_POSE**: Follow the TORSO_ANGLE and SHOULDER_VISIBILITY descriptions.
3. **HEAD_ANGLE**: Follow the HEAD_YAW and HEAD_PITCH descriptions.
4. **OUTFIT**: Recreate the OUTFIT_SPEC and COLLAR_STRUCTURE as described.

[INSTRUCTION - COMPOSITING WORKFLOW]:

1. **BASE PLATE PREPARATION (LAYER 0)**:
   ${config.outfitClone || ''}
   ${config.geometryLocks || ''}

3. **FACE GENERATION (LAYER 2)**:
   [MANDATORY - GENERATE NEW FACE]:
   **CRITICAL**: You are generating a COMPLETELY NEW face from scratch. There is NO reference face.
   
   **PERSONA TO GENERATE**:
   - **ETHNICITY**: ${config.ethnicity || 'Caucasian'} (STRICT - Generate authentic ${config.ethnicity || 'Caucasian'} facial features)
   - **GENDER**: ${config.gender || config.modelDna?.predicted_gender || 'Male'}
   - **AGE**: 35-45 years old, mature professional appearance
   - **APPEARANCE**: Commercial model, confident, natural expression
   
   **EXECUTION**:
   - **FRESH GENERATION**: Generate a brand new face that matches the persona above.
   - **HEAD ANGLE**: Follow the HEAD_YAW and HEAD_PITCH from Visual Anchor Data.
   - **SKIN TONE**: Consistent with ethnicity, natural and healthy.
   
   [HAT-FACE LIGHTING INTEGRATION - CRITICAL]:
   **The hat casts shadows. The face must receive them.**
   - **BRIM SHADOW**: If the hat brim is tilted down, the upper forehead/eyes MUST be in shadow.
   - **BOUNCE LIGHT**: The underside of the hat brim reflects light onto the forehead. Simulate this.
   - **CONSISTENT KEY LIGHT**: The face must be lit from the SAME direction as the hat.
   - **MATCH KEY_LIGHT_DIRECTION**: Use the KEY_LIGHT_DIRECTION from Visual Anchor Data.

4. **PRODUCT PLACEMENT (LAYER 1 - HAT)**:
   - **OBJECT**: HAT ASSET (Image 1).
   - **PLACEMENT**: Composite onto the head.
   - **PERSPECTIVE**: Match the 2D head angle of the Base Plate.
   
   [HAT INVENTORY - ABSOLUTE FIDELITY]:
   **CRITICAL**: The Hat Asset (Image 1) is your SOURCE OF TRUTH. Do NOT deviate from it.
   - **NO ELEMENT ADDITION**: Do NOT add buckles, pins, feathers, bands, buttons, or decorations not present in Image 1.
   - **NO ELEMENT REMOVAL**: Do NOT remove features that exist in Image 1.
   - **MATERIAL PRESERVATION**: The material (straw, felt, canvas, etc.) MUST remain unchanged. Do NOT transform straw to felt or vice versa.
   - **GEOMETRY CLONE**: The hat's shape, brim angle, crown height, and proportions must be IDENTICAL to Image 1.
   - **TEXTURE FIDELITY**: Preserve the weave pattern, stitching, and surface texture of the original material.
   
   [DIGITAL HAT FINISHING - MICRO-ADJUSTMENTS ONLY]:
   **RULE**: Enhance the hat's appearance, but do NOT alter its fundamental structure.
   1. **SURFACE SMOOTHING**: Remove visible wrinkles, dents, and creases - but keep the original material weave visible.
   2. **SHAPE REFINEMENT**: Correct minor drooping/sagging, but do NOT redesign the hat shape.
   3. **NO REDESIGN**: This is TOUCH-UP, not REDESIGN. If the hat has a bent brim, keep it bent. If it has asymmetric features by design, preserve them.
   4. **MATERIAL UNCHANGED**: The output hat must be the SAME MATERIAL as Image 1. Straw stays straw. Felt stays felt.
   5. **LIGHTING ONLY**: Adjust brightness/shadows, but do NOT change the hat's color or texture.

[ANTI-HALLUCINATION PROTOCOL]:
1. **NO INVENTED DETAILS**: Do NOT add accessories (glasses, jewelry, scarves) unless present in the Base Plate.
2. **NO TEXT/WATERMARKS**: The output must be clean.
3. **NO BACKGROUND ARTIFACTS**: The background is PURE WHITE (#FFFFFF). Do not hallucinate gradients, shadows, or studio equipment.
4. **OUTFIT COLOR LOCK** (MANDATORY FOR ALL BATCH GENERATIONS):
   - **COLOR**: ${config.sharedOutfitColor || 'Light Blue Linen #B7C4CA'}
   - **RULE**: ALL images in this batch MUST use this EXACT outfit color. Do NOT vary the color.

[FINAL RENDER RULES - COMMERCIAL LIFESTYLE]:
- **STYLE**: Commercial Lifestyle Photography. Natural, Clean, Premium. Non-posey.
- **LIGHTING**: Dynamic Match to Base Plate.
- **TEXTURE**: REALISTIC. Straw/Fabric must look organic. No "Plastic/AI Smoothness".
- **ANTI-SYMMETRY**: Respect the natural shape of the hat. Do NOT force symmetry on asymmetrical designs.

[NEGATIVES]: ${MASTER_NEGATIVE_ROOT} ${MODEL_MASTER_NEGATIVE}
(grey background: 5.0), (gray background: 5.0), (gradient background: 5.0), (studio background: 4.0), (colored background: 5.0),
(outdoor: 5.0), (nature: 4.0), (sky: 5.0), (clouds: 5.0), (trees: 5.0), (window: 4.0), (room: 4.0),
(altering the outfit: 2.0), (changing the shirt: 2.0), (generating a neck: 2.0),
(painting over the collar: 2.0), (3d render: 1.5), (cartoon: 1.5), (illustration: 1.5),
(mirroring), (flipping), (rotating body),
(harsh shadows: 2.0), (dark face: 2.0), (eyes in shadow: 2.0), (high contrast: 1.5),
(plastic texture), (oil painting), (oversmoothed),
(watermark), (text), (logo), (glasses), (jewelry), (extra limbs), (deformed fingers),
(recomposing the scene: 3.0), (centering the subject: 3.0), (zooming in: 2.5), (zooming out: 2.5), (cropping: 2.5), (changing the background margins: 3.0), (moving the subject: 3.0),
(adding decorations to hat: 4.0), (inventing hat details: 4.0), (extra grommets: 3.0), (extra buttons: 3.0), (feathers on hat: 3.0), (changing hat shape: 4.0), (modifying hat brim: 4.0),
(same face as Image 2: 5.0), (copying the face: 5.0), (preserving original face: 5.0), (same person as reference: 4.0).
`.trim();

// Legacy Support for Non-Clone Mode (Simplified)
const getStandardModelPrompt_Legacy = (config, selectedModel, viewType, isMale) => {
   // Basic "Create a person" prompt for Standard Mode
   const personaGroup = getPersonaGroup(config);
   return `
    [SYSTEM]: ${SYSTEM_IDENTITY}
    ROLE: Commercial Photographer.
        MODE: STANDARD GENERATION.
[IDENTITY]: ${getSetBCharacter(personaGroup, isMale, config)}
    [ORIENTATION]: ${getHardcoreOrientation(viewType)}
    [TASK]: Wear HAT ASSET(Image 1).Match Pose of POSE REF(Image 2).
[ENV]: ${getSetBEnvironment(personaGroup)}
    [NEGATIVES]: ${MASTER_NEGATIVE_ROOT} ${MODEL_MASTER_NEGATIVE}
    `.trim();
}

export const getStandardModelPrompt = getReferenceModelPrompt;
