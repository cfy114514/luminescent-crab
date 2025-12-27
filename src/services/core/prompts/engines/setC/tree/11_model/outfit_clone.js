/**
 * VISUAL ANCHOR PROTOCOL: OUTFIT CLONE
 * Concept: The POSE REF is the BASE PLATE. It is READ-ONLY.
 */

export const getOutfitCloneDirective = () => `
[VISUAL ANCHOR - BASE PLATE PROTECTION]:
**DEFINITION**: Image 2 (POSE REF) is the BACKGROUND LAYER. It must not be repainted.
1. **LAYER LOCK**: The Outfit and Background from POSE REF are a single flattened layer.
2. **PROTECTED REGION**: Everything below the **COLLAR LINE** is PIXEL-LOCKED.
   - **NECK INTEGRATION ZONE**: The Neck Area is OPEN for generation to ensure seamless head attachment.
   - **COLLAR PRESERVATION**: The Shirt Collar pixels are SACRED and must not be moved.
3. **OUTFIT INTEGRITY**: Do not generate a new outfit. USE THE BASE PLATE.
`.trim();

export const getVFXCompositorContext = () => `
[VFX COMPOSITOR MODE]:
**TASK**: Digital Compositing (2D). NOT 3D Generation.
1. **BASE PLATE**: Start with POSE REF (Image 2) as the bottom layer.
2. **MASKING**: Create a mask only for the FACE area (above the chin, below the hairline).
3. **INPAINT**: Generate the new face *inside* this mask.
4. **DO NOT INCUR**: Do not paint outside the mask. The blue shirt/outfit pixels are SACRED.
`.trim();

export const getEnhancedPoseLock = () => `
[VISUAL ANCHOR - PIXEL GRID LOCK (ABSOLUTE FIDELITY)]:
**Grid Mapping**: The subject's 2D position is IMMUTABLE. Do NOT re-compose.
1. **NO RE-FRAMING**: Do NOT move the camera. Do NOT crop or zoom. Do NOT center.2. **NEGATIVE SPACE PRESERVATION**: The exact pixel margins (Left, Right, Top, Bottom) MUST match the Pose Ref.
3. **BOUNDING BOX LOCK**: If the subject's bounding box starts at X=200 in the Pose Ref, it MUST start at X=200 in the output.
4. **ANTI-AUTOCENTER**: AI models have a bias to center subjects. ACTIVELY RESIST THIS. Use the margins from the Visual Anchor Report.
`.trim();

export const getCloneModeIdentity = (personaGroup, isMale, config = {}) => `
[MANDATORY FACE REPLACEMENT - ABSOLUTE REQUIREMENT]:
**CRITICAL**: Generate a COMPLETELY NEW face. The face in Image 2 is a PLACEHOLDER - ERASE IT.

**PERSONA TO GENERATE**:
- **ETHNICITY**: ${config.ethnicity || 'Caucasian'} (STRICT - DO NOT generate Asian if Caucasian is specified)
- **GENDER**: ${isMale ? 'Male' : 'Female'}
- **AGE**: ${config.age || '35-45 years old'}
- **APPEARANCE**: Professional Model, ${config.vibe || 'resort/casual/mature'} vibe

**EXECUTION**:
- **ERASE ORIGINAL FACE**: The face in Image 2 does NOT exist. Generate a NEW ${config.ethnicity || 'Caucasian'} face.
- **REGION**: Face and Neck Transition zone.
- **LIGHTING**: Match direction from Image 2, but identity is NEW.
`.trim();

export const getCloneModeEnvironment = () => `
[ENVIRONMENT - PASSTHROUGH]:
- **INSTRUCTION**: Use the Background from POSE REF (Base Plate).
- **OVERRIDE**: Only if the user requested a Pure White Background, apply a Luma Matte to extract the subject.
`.trim();
