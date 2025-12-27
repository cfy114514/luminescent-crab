export const getHardcoreOrientation = (viewType) => {
   const vt = viewType.toLowerCase();

   const calibrationProtocol = `
[RED ANCHOR - SPATIAL TRUTH (ABSOLUTE)]:
1. **DETECTION**: Locate the hand-drawn RED 'T' or MARK.
2. **FACE ALIGNMENT**: The model's nose and gaze MUST point towards the same direction as the red mark relative to the mannequin center.
   - **DIRECTIONAL LOCK**: MATCH the directional vector of the Red Mark.
   - **X-AXIS MAPPING**: If Red Mark is on the right, Model faces RIGHT. If left, Model faces LEFT.
3. **NO REVERSAL**: Do NOT mirror. Follow 2D mark coordinates. Matches must be 1:1.
`.trim();

   // 2. CARTESIAN SYMMETRY LOCKS (Preventing Slant)
   let symmetryDirective = "";
   if (vt.includes('front') || vt.includes('back')) {
      symmetryDirective = `
[BILATERAL SYMMETRY LOCK]:
1. **HORIZONTAL LEVEL**: The line connecting the eyes (or shoulder tips) MUST be perfectly parallel to the bottom edge of the frame.
2. **ZERO TILT**: 0-degree roll. Do NOT slant the head or torso to the left or right.
3. **AXIS ALIGNMENT**: The vertical centerline of the hat must align with the vertical centerline of the model's torso.
`.trim();
   } else if (vt.includes('side')) {
      symmetryDirective = `
[PROFILE LEVELING]:
1. **HORIZONTAL DEPTH**: The brim of the hat must be perfectly level with the horizon.
2. **ZERO TILT**: Ensure the model is standing perfectly upright. No leaning.
`.trim();
   }

   let perspectiveDirective = "COMMAND: 1:1 GEOMETRY MIRROR. No rotation.";
   if (vt.includes('back')) {
      perspectiveDirective = "COMMAND: ABSOLUTE REAR VIEW (180deg). Face hidden.";
   }

   return `
${calibrationProtocol}
${symmetryDirective}
- **PERSPECTIVE**: ${perspectiveDirective}
`.trim();
};

export const getSurfaceBeautify = () => `
[DIGITAL STEAM-IRONING]:
1. **SURFACE REFINEMENT**: Smooth out all fabric wrinkles, dents, and ripples on the hat assets while preserving texture 1:1.
2. **EDGE SHARPENING**: Perfectly sharpen the hat's silhouette.
3. **FEATURE PRESERVATION**: Do not blur or remove logos, text (e.g., "N&F"), or stitching patterns from Image 1.
`.trim();

/**
 * SET C SPECIFIC: Orientation for Pose Reference Mode
 * This is simplified because we rely on POSE REF image, not Red T-Anchor
 */
export const getSetCPoseReferenceOrientation = () => `
[SPATIAL ORIENTATION - POSE REF DRIVEN]:
**The orientation is DERIVED from POSE REF (Image 2), not from any red marks.**

1. **MATCH EXACT ANGLE**: COPY the exact head and body rotation from the POSE REF. Match the profile angle 1:1.
2. **ANTI-FRONT-FACING BIAS**:
   - **CRITICAL**: The AI has a bias to rotate models to face the front. **RESIST THIS BIAS.**
   - **STRICT PROHIBITION**: Do NOT rotate the subject to face the camera. Keep the subject's angle EXACTLY as shown in POSE REF.
   - **SAME-ANGLE MAPPING**: Map the new face onto the EXISTING head angle. Do not turn the head.
3. **SPATIAL ANCHOR - VIEWER CENTRIC (ABSOLUTE)**:
   - **DIRECTIONAL FORCE**: The subject's facing direction is LOCKED to Pose Ref.
   - **MAPPING LAW**: Viewer-Left in Ref = Viewer-Left in Output. Viewer-Right in Ref = Viewer-Right in Output.
   - **MIRRORING PROHIBITED**: FORCE X-AXIS ALIGNMENT. NO FLIPPING PERMITTED.
   - **COORDINATE MAPPING**: Map pixels on the X-axis 1:1. Positive X remains Positive X.
   - **GAZE VECTOR**: DUPLICATE the eye-line vector relative to the camera lens.
4. **CAMERA ANGLE**: Replicate the exact camera-to-subject vector from POSE REF.

[CONSISTENCY LOCKS]:
- **HAT ALIGNMENT**: The hat must sit on the head at the same angle/tilt as the head in POSE REF.
- **BODY FRAME**: Maintain the same body framing (how much of the body is visible) as POSE REF.
`.trim();
