/**
 * OUTFIT CLONE MODULE - Set C Enhancement
 * Provides directives for cloning outfit from POSE REF image
 */

/**
 * Returns the directive for outfit cloning mode
 * This tells the AI to preserve the exact clothing from POSE REF
 */
export const getOutfitCloneDirective = () => `
[OUTFIT LOCK - CLONE FROM POSE REF]:
**REPLICATE THE EXACT OUTFIT FROM POSE REF (Image 2) WITH 100% FIDELITY.**
1. **CLOTHING**: Clone the exact garment visible in POSE REF. Match fabric, color, texture, neckline, and sleeve style.
2. **NO SUBSTITUTION**: Do NOT replace with any other clothing. Do NOT interpret or "improve" the outfit.
3. **IMMUTABLE OUTFIT**: The outfit pixels are READ-ONLY. DO NOT CHANGE.
4. **GENDER DECOUPLING**: The Body/Outfit layer is LOCKED. Face generation MUST NOT influence the outfit.
5. **CHROMATIC PROTECTION**: ISOLATE the outfit color. Do NOT allow the Hat's color (Beige/Straw) or Studio Lighting to wash out the outfit's original color.
6. **COLOR/TEXTURE CLONE**: SAMPLE and LOCK the exact RGB values and fabric patterns from POSE REF.
7. **NECK SEAM SECURITY**: **CRITICAL**. Stop face generation at the JAWLINE. Do NOT generate a neck.
   - **COLLAR LOCK**: The collar and shoulders MUST come from POSE REF (Blue Shirt, etc.).
   - **NO OVERWRITE**: Do NOT paint a new t-shirt/neck over the existing outfit.
8. **VISUAL SAMPLING**: Detect the outfit color in POSE REF (e.g. Blue). FORCE the output to match this detected color.
`.trim();

/**
 * Returns VFX Compositor context for face replacement mode
 */
export const getVFXCompositorContext = () => `
[VFX MODE - FACE INTEGRATION CONTEXT]:
Think of this as a professional VFX compositing shot:
1. **PLATE (Base Layer)**: POSE REF (Image 2) provides the body, outfit, and pose.
2. **FACE INTEGRATION**: Generate ONLY a new face matching the persona description below, and composite it onto the POSE REF body.
3. **HAT SWAP**: Replace the hat in POSE REF with HAT ASSET (Image 1).
4. **PRESERVATION RULE**: Everything else (body, clothes, pose, arm position, background composition) should match POSE REF as closely as possible.
5. **GENDER/BODY INTEGRITY**: PRESERVE THE POSE REF BODY AND OUTFIT 100%. Do NOT feminize/masculinize the body or clothes to match the face. Composite the requested face onto the **EXISTING** body.
`.trim();

/**
 * Returns enhanced pose lock directive
 */
export const getEnhancedPoseLock = (structuralPrompt, limbAction, scalingMandate) => `
[POSE LOCK - ABSOLUTE 1:1 REPLICATION]:
**CLONE THE EXACT POSE FROM POSE REF (Image 2) WITH PIXEL-LEVEL PRECISION.**
This is a strict replication task, not a loose reference.

**MANDATORY MATCH POINTS:**
- **HEAD ANGLE**: Exact head tilt (pitch/yaw/roll) as seen in POSE REF. NO deviation.
- **BODY ORIENTATION**: Clone the exact shoulder angle, torso direction, and lean.
- **ARM POSITION**: Clone the exact arm placement, bend, and hand position (if visible).
- **GAZE DIRECTION**: Clone where the model is looking in POSE REF.
- **SPINE LINE**: Match the curvature and posture of the spine.
${structuralPrompt ? `- **STRUCTURAL DETAILS**: ${structuralPrompt}` : ''}
${limbAction ? `- **LIMB ACTION**: ${limbAction}` : ''}
${scalingMandate ? `- **FRAMING**: ${scalingMandate}` : ''}

**ANTI-DEVIATION RULE**: 
If unsure, match POSE REF exactly. Do NOT attempt to "improve" or "correct" the pose.
`.trim();

/**
 * Returns the identity block for clone mode
 * Only face is generated, body/outfit come from POSE REF
 */
export const getCloneModeIdentity = (personaGroup, isMale, config) => {
  const genderLabel = isMale ? 'Male' : 'Female';
  const age = isMale ? '30s' : '25-30s';
  const ethnicity = 'Caucasian'; // Default, can be parameterized

  return `
[MODEL IDENTITY - FACE ONLY (CLONE MODE)]:
- **FACE GENERATION**: Generate a ${genderLabel} face, ${age}, ${ethnicity}. Natural, confident expression.
- **BODY/OUTFIT**: DO NOT GENERATE. Clone from POSE REF (Image 2).
- **GENDER/BODY INTEGRITY**: PRESERVE the POSE REF body structure unconditionally. Composite the target face onto the EXISTING body regardless of gender mismatch. Do NOT feminize or masculinize the body.
- **SKIN TONE**: Match the skin tone of POSE REF's body for seamless blending.
- **HAIR**: If visible in POSE REF, maintain the same hairstyle. Only adjust if obstructed by the new hat.
`.trim();
};

/**
 * Returns a NEUTRAL commercial studio environment for Clone Mode.
 * Removes any persona-based "Atmosphere" (e.g. resort, golf) that might bias clothing colors.
 */
export const getCloneModeEnvironment = () => `
[COMMERCIAL STUDIO SETTING - NEUTRAL]:
- **BACKGROUND**: PURE WHITE (#FFFFFF) Seamless Paper.
- **LIGHTING**: Standard Commercial Softbox. Neutral 5500K temperature.
- **ATMOSPHERE**: Clean, clinical, high-fidelity commercial product photography. NO stylistic color grading.
- **COMPOSITION**:
  - Framing: Match POSE REF.
  - Focus: Sharp focus on the subject and product.
`.trim();
