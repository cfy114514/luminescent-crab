export const getHardcoreOrientation = (viewType) => {
   const vt = viewType.toLowerCase();

   // 1. SPATIAL RED ANCHOR PROTOCOL (VIEWER-CENTRIC)
   const calibrationProtocol = `
[RED ANCHOR - SPATIAL TRUTH]:
1. **DETECTION**: Locate the hand-drawn RED 'T' or MARK.
2. **FACE ALIGNMENT**: The model's nose and gaze MUST point towards the same direction as the red mark relative to the mannequin center.
   - **IF RED MARK IS ON VIEWER-RIGHT**: Model MUST face VIEWER-RIGHT.
   - **IF RED MARK IS ON VIEWER-LEFT**: Model MUST face VIEWER-LEFT.
3. **NO REVERSAL**: Do NOT mirror. Follow 2D mark coordinates.
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
