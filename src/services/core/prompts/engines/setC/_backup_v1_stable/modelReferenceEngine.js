import { SYSTEM_IDENTITY, MASTER_NEGATIVE_ROOT, UNIVERSAL_REFINE_QUALITY } from './tree/00_root_integrity';
import { getHardcoreOrientation, getSurfaceBeautify, getSetCPoseReferenceOrientation } from './tree/11_model/0_geometry_locks';
import { getGenderNegative, MODEL_MASTER_NEGATIVE } from './tree/11_model/model_integrity';
import { getOutfitCloneDirective, getVFXCompositorContext, getEnhancedPoseLock, getCloneModeIdentity, getCloneModeEnvironment } from './tree/11_model/outfit_clone';
// Use Set B's Persona Module for Model Identity (shared with Set B)
import { getPersonaGroup, getSetBCharacter, getSetBEnvironment } from '../setB/personaConfig';

/**
 * SET C: Pose Reference + Hat Swap + Face Swap (Enhanced v2.0)
 * 
 * Goal: 
 *   - Extract POSE and ANGLE from POSE REF image.
 *   - Place the HAT from HAT ASSET onto the generated model.
 *   - Generate FACE from Persona config.
 *   - [NEW] Clone OUTFIT from POSE REF if config.cloneOutfitFromRef is true.
 *   - Body and Background are generated fresh (commercial studio standard).
 * 
 * MODE OPTIONS:
 *   - Standard Mode (default): Face + Hat from inputs, outfit from Persona Config.
 *   - Clone Mode (config.cloneOutfitFromRef = true): Face from Persona, Hat + Outfit from inputs.
 */
export const getReferenceModelPrompt = (config, selectedModel, viewType, genderLabel, isMale, manualPose) => {

    // Determine Clone Mode
    const isCloneMode = config.cloneOutfitFromRef === true;

    // Identity Construction (from Set B Persona Module)
    const personaGroup = getPersonaGroup(config);

    // In Clone Mode, we only need face identity, not outfit
    const identityBlock = isCloneMode
        ? getCloneModeIdentity(personaGroup, isMale, config)
        : getSetBCharacter(personaGroup, isMale, config);

    // In Clone Mode, use NEUTRAL environment to avoid style/color bias from Persona
    const environmentBlock = isCloneMode
        ? getCloneModeEnvironment()
        : getSetBEnvironment(personaGroup);

    // In Clone Mode, we use POSE REF driven orientation instead of Red T-Anchor
    const orientation = isCloneMode
        ? getSetCPoseReferenceOrientation()
        : getHardcoreOrientation(viewType);

    // Extract pose data if available (from pose analysis)
    const structuralPrompt = manualPose?.structural_prompt || "";
    const scalingMandate = manualPose?.scaling_mandate || "";
    const limbAction = manualPose?.limb_action || "";
    const expression = manualPose?.facial_expression || "A slight smile, eyes fully visible and directed towards the viewer.";

    // Build the enhanced prompt
    if (isCloneMode) {
        // ========== CLONE MODE (NEW) ==========
        // This mode clones pose + outfit from POSE REF, only generates face + swaps hat
        return `
[SYSTEM]: 
${SYSTEM_IDENTITY}
ROLE: Commercial Fashion Photographer.
MODE: VFX COMPOSITOR - FACE INTEGRATION + HAT SWAP.

${getVFXCompositorContext()}

[INPUT IMAGES]:
- **HAT ASSET (Image 1)**: The product hat. This hat MUST appear on the model's head with 100% geometric fidelity.
- **POSE REF (Image 2)**: The BODY, POSE, and OUTFIT to CLONE. Only the FACE will be replaced.

${getEnhancedPoseLock(structuralPrompt, limbAction, scalingMandate)}

${getOutfitCloneDirective()}

[SPATIAL ORIENTATION]:
${orientation}

[GENERATION GOAL - CLONE MODE]:
Create a commercial fashion shot by:
1. **CLONING THE BODY/POSE/OUTFIT**: Replicate the exact body, pose, and clothing from POSE REF.
2. **REPLACING THE FACE**: Generate a new face based on the identity description below.
3. **SWAPPING THE HAT**: Replace the hat in POSE REF with HAT ASSET (Image 1).
4. **STUDIO BACKGROUND**: Replace POSE REF's background with pure white studio.

${environmentBlock}

[MODEL IDENTITY]:
${identityBlock}
- Expression: ${expression}

[HAT FIDELITY & REFINEMENT]:
[HAT FIDELITY & REFINEMENT]:
- **STRUCTURE LOCK**: The hat is a RIGID OBJECT. Do NOT reimagine or reshape it. Clone the 3D structure from HAT ASSET.
- **SURFACE PERFECTING**: APPLY DIGITAL STEAM-IRONING. Eliminate all wrinkles, creases, and dents from the hat's surface.
- **TEXTURE**: Preserve the high-quality material weave (straw/fabric), but ensure it looks PRISTINE and NEW.
- **ANGLE**: Match the hat's perspective to the model's head angle (as determined by POSE REF).
- **ANGLE FREEZE**: The Hat Asset Angle is ABSOLUTE. Do NOT rotate.
- **PERSPECTIVE LOCK**: Do NOT adjust perspective. Treat the Hat Asset as a pre-rendered 3D layer. PASTE IT AS IS.

[COMMERCIAL STANDARDS]:
- Background: PURE WHITE studio seamless.
- Lighting: Soft studio lighting (no harsh shadows on face).
- **Framing**: ABSOLUTE CLONE. Do NOT Center the subject. Do NOT Crop.
- **NEGATIVE SPACE**: Maintain the exact negative space (left/right bias) from POSE REF.
- **CANVAS**: If Ref is off-center, Output MUST be off-center.

[REFINEMENT]:
${getSurfaceBeautify()}
${UNIVERSAL_REFINE_QUALITY}
- Clean skin, natural makeup.
- Seamless hat-hair boundary.
- Seamless face-body skin tone blending.

[NEGATIVES]: ${MASTER_NEGATIVE_ROOT} ${MODEL_MASTER_NEGATIVE}
different pose, wrong pose, ignoring pose reference,
different hat, wrong hat, hat missing, hat floating,
different outfit, wrong clothes, changing clothes from reference,
harsh shadows, dark face, brim shadow on eyes,
plastic skin, cartoon, illustration.
`.trim();

    } else {
        // ========== STANDARD MODE (Original, Enhanced) ==========
        return `
[SYSTEM]: 
${SYSTEM_IDENTITY}
ROLE: Commercial Fashion Photographer.
MODE: STRICT POSE REPLICATION + HAT SWAP.

[INPUT IMAGES]:
- **HAT ASSET (Image 1)**: The product hat. This hat MUST appear on the model's head with 100% geometric fidelity.
- **POSE REF (Image 2)**: The POSE to COPY. THE MODEL MUST MATCH THIS POSE EXACTLY.

[POSE LOCK - MANDATORY]:
**COPY THE EXACT POSE FROM POSE REF (Image 2).**
- Head Angle: MATCH POSE REF's head tilt/rotation exactly.
- Body Orientation: MATCH POSE REF's shoulder angle and torso direction.
- Arm Position: MATCH POSE REF's arm placement.
- Gaze Direction: MATCH where POSE REF is looking.
${structuralPrompt ? `- Structural Details: ${structuralPrompt}` : ""}
${limbAction ? `- Limb Action: ${limbAction}` : ""}
${scalingMandate ? `- Framing: ${scalingMandate}` : ""}

[SPATIAL ORIENTATION]:
${orientation}

[GENERATION GOAL]:
Create a commercial model portrait that:
1. **HAS IDENTICAL POSE TO POSE REF**: Body position, head angle, and gaze MUST match POSE REF.
2. **WEARS HAT ASSET's HAT**: The exact hat from HAT ASSET is placed on the model's head.
3. **HAS GENERATED FACE**: Based on identity below.
4. **HAS COMMERCIAL BACKGROUND**: Pure white studio (ignore POSE REF's background).

${environmentBlock}

[MODEL IDENTITY]:
${identityBlock}
- Expression: ${expression}.

[HAT FIDELITY]:
- The hat from HAT ASSET must be rendered with 100% accuracy.
- Match the hat's perspective to the model's head angle.
- Preserve all hat details: texture, logo (N&F), strap, shape.

[COMMERCIAL STANDARDS]:
- Background: PURE WHITE studio seamless.
- Lighting: Soft studio lighting (no harsh shadows on face).
- Framing: Half-body portrait (head to mid-chest).

[REFINEMENT]:
${getSurfaceBeautify()}
${UNIVERSAL_REFINE_QUALITY}
- Clean skin, natural makeup.
- Seamless hat-hair boundary.

[NEGATIVES]: ${MASTER_NEGATIVE_ROOT} ${MODEL_MASTER_NEGATIVE} ${getGenderNegative(isMale)},
different pose, wrong pose, ignoring pose reference,
different hat, wrong hat, hat missing, hat floating,
harsh shadows, dark face, brim shadow on eyes,
plastic skin, cartoon, illustration.
`.trim();
    }
};

// Alias for standard calls
export const getStandardModelPrompt = getReferenceModelPrompt;
