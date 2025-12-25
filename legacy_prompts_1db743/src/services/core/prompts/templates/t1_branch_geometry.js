export const MODEL_TASK_HEADER = `
// TASK: Photorealistic Model Portrait (View orientation MUST match Reference Image exactly).
// Note: We use a neutral task description to prevent "Front View" text from overriding a "Side View" reference image.
TASK: Photorealistic Model Portrait generation.
PRINCIPLE: THE HAT IS A FIXED INDUSTRIAL ANCHOR. The model is a supporting background element.
`;

export const ORIENTATION_LOCK_PRIORITY_1 = `
[PRIORITY #1 - HAT ORIENTATION ABSOLUTE LOCK - OVERRIDES EVERYTHING]:
**CRITICAL**: The hat's 3D orientation is the SUPREME PRIORITY. ALL other requirements are SECONDARY to this.
1. **FROZEN ORIENTATION**: The hat's 3D angle (yaw, pitch, roll) from the reference is ABSOLUTE LAW. Copy it EXACTLY. Do NOT rotate the hat even by 1 degree.
2. **NO STRAIGHTENING / NO CORRECTION**: If the hat in the reference is TILTED, ASYMMETRICAL, or CROOKED, you MUST preserve that exact tilt. DO NOT "fix" the angle to be straight or perfectly level.
3. **NO ROTATION FOR AESTHETICS**: Do NOT rotate the hat to "show the model's face better" or "improve composition". The hat angle is NON-NEGOTIABLE.
4. **FACE OCCLUSION IS ACCEPTABLE**: If the hat's correct angle means the model's face is partially or fully hidden, that is PERFECTLY ACCEPTABLE. Face visibility is NOT a requirement.
5. **MODEL FOLLOWS HAT**: The model's head/neck position adapts to the hat, NOT the other way around. If the hat faces left, the model's head faces left even if it hides the face.
6. **REFERENCE ORIENTATION COPY**: Look at the reference hat on the stand. Note its exact facing direction. The hat on the model MUST face that EXACT same direction.
7. **CAMERA PITCH SYNC (CRITICAL)**:
   - **VISUAL HEURISTIC**: Look at the reference image. Can you see the **TOP (CROWN)** of the hat?
   - **YES (Top Visible)**: This is a **HIGH-ANGLE (BIRD'S EYE) SHOT**. You MUST place the camera ABOVE the model, looking down (俯拍). The model's chin should be tucked or lower than the forehead. Do NOT render a straight-on face.
   - **NO (Top Hidden)**: Use standard eye-level.
   - **STRICT FORBIDDEN**: Never render an eye-level portrait if the reference shows the top of the hat. It creates a physical impossibility.
8. **CAMERA YAW SYNC**: Match the Left/Right rotation EXACTLY.
`;

export const SECONDARY_HAT_CONSTRAINTS = `
[PRIORITY #3 - SECONDARY HAT CONSTRAINTS]:
1. **HORIZON PARALLELISM**: The hat's brim angle is IMMUTABLE. If horizontal in reference, it stays horizontal on the model.
2. **ZERO TOLERANCE FOR ROTATION**: Match exact pitch, yaw, roll from reference. The central axis must be perfectly vertical (90°).
3. **SYMMETRY ENFORCEMENT**: Hat must be perfectly centered and symmetrical. No diagonal slants.
4. **SKELETAL CONFORMANCE**: The model's neck and head position conform to the hat's geometry. The hat dictates pose, not vice versa.
`;

export const PRODUCT_GEOMETRY_LOCK = `
1. **GEOMETRY LOCK & COMPOSITION**:
   - **ZERO ROTATION**: Maintain the exact same orientation and tilt as the reference image.
   - **HI-FI REPRO**: The product should be sharp, clear, and perfectly isolated on the pure white background.
`;
