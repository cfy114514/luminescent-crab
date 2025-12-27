/**
 * VISUAL ANCHOR PROTOCOL: GEOMETRY LOCKS
 * Concept: 2D SCREEN SPACE MAPPING. No 3D Rotation.
 */

export const getHardcoreOrientation = (viewType) => {
   // Only used for Red T-Shirt mode (Legacy/Standard)
   return `[STANDARD ORIENTATION MATCH]: Match the Red T mark direction.`;
};

export const getSurfaceBeautify = () => `
[DIGITAL HAT FINISHING - ORGANIC REALISM]:
1. **SURFACE**: Digital Steam-Ironing. Smooth out fabric wrinkles/dents, BUT preserve the natural material weave.
2. **ANTI-SYMMETRY**: **CRITICAL**. Do NOT force the hat to be perfectly symmetrical. If the hat is tilted or bent in the Asset, KEEP IT.
3. **TEXTURE**: High-Fidelity Straw/Fabric. No "Plastic" look.
4. **BRIGHTNESS**: Ensure the underside of the brim reflects light onto the forehead.
`.trim();

/**
 * VISUAL ANCHOR: POSE REFERENCE ORIENTATION
 * This replaces "Portrait" logic with "Xerox" logic.
 */
export const getSetCPoseReferenceOrientation = () => `
[VISUAL ANCHOR - 2D SCREEN SPACE MAPPING]:
**INSTRUCTION**: Treat the POSE REF as a 2D Flat Image. map it to the output canvas 1:1.

1. **X-AXIS TRANSLATION**:
   - If pixel(x) is on the Left in Ref, it MUST be on the Left in Output.
   - **FLIP PROTECTION**: mirroring is mathematically prohibited. x' = x. (+1 scale).

2. **DIRECTIONAL VECTORS**:
   - **Nose Vector**: Calculate the 2D vector of the nose in Ref. Duplicate this vector in Output.
   - **Shoulder Plane**: The shoulder line angle in 2D space must be identical.

3. **ANTI-3D INTERPRETATION**:
   - Do not "turn" the model to face the camera.
   - Do not "correct" the pose.
   - **FREEZE**: The pose is a frozen statue. Paint the new face onto the statue.
`.trim();
