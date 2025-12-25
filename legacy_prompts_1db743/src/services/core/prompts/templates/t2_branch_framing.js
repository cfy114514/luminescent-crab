export const COMPOSITION_REQUIREMENT = `
DUAL ABSOLUTE REQUIREMENTS: 1) HAT ORIENTATION FROZEN - Copy exact 3D angle from reference. 2) HALF-BODY FRAMING MANDATORY - Show ONLY elbow-to-head crop. BOTH are non-negotiable. Frame: Human Model Portrait from ELBOW LEVEL (when arms naturally hang) to top of head. Bottom edge at mid-torso. NO waist, NO hips, NO legs, NO feet visible. If you show below elbow level = FAILED. The reference is a stand-only product shot - IGNORE its framing, create a HUMAN MODEL PORTRAIT instead. Model's face may be hidden if hat angle requires it - this is acceptable. Hat angle preservation > face visibility.
`;

export const FRAMING_PRIORITY_2 = (viewType) => {
    const backViewLogic = viewType === 'model_back' ? `
- **BACK VIEW SPECIFIC**: This is a BACK VIEW. Show ONLY the model's BACK. The model must face AWAY from camera. Show the back of the head, back of shoulders, back of torso. DO NOT show the face, side profile, or three-quarter view. The model looks in the OPPOSITE direction of the camera.
` : '';

    const backAngleLogic = viewType === 'model_back_angle' ? `
- **BACK-ANGLED OBLIQUE VIEW SPECIFIC**: This is a BACK-ANGLED OBLIQUE perspective. The camera is positioned BEHIND and to the SIDE of the model (approximately 135° angle - between back and side view). Show: back of the head, back of one shoulder prominently, partial side profile of torso. The model's face should be mostly HIDDEN or only show a sliver of the side profile. This is NOT a front view, NOT a side view - it's specifically a back-oblique angle showing primarily the BACK with slight side visibility. The hat should be viewed from this back-angled perspective.
` : '';

    return `
[PRIORITY #2 - FRAMING REQUIREMENT - ABSOLUTE ENFORCEMENT - EQUAL TO HAT PRIORITY]:
**HALF-BODY FRAMING LOCK (CRITICAL)**: This requirement has EQUAL WEIGHT to hat orientation. BOTH must be satisfied.
- MANDATORY CROP: Show ONLY from natural elbow level (when arms hang down) to above the head. 
- POSITIVE REQUIREMENT: The final image MUST include: upper chest, both shoulders, neck, full head, and hat. The bottom edge is at mid-torso/upper abdomen.
- FORBIDDEN ELEMENTS: You MUST NOT show waist, hips, legs, feet, full body, or any body part below the elbow line.
- FAILURE CONDITION: If the image shows waist, hips, legs, or anything below elbow level, it is a COMPLETE FAILURE regardless of hat accuracy.
- IGNORE REFERENCE FRAMING: The reference shows a product stand. DO NOT copy its composition. You are creating a HUMAN MODEL PORTRAIT.
- FRAME BREAKDOWN (ENFORCED): Bottom 10% = torso fade-out, Middle 60% = chest + shoulders + neck, Top 30% = head + hat.
- CROP VERIFICATION: Before finalizing, ask: "Can I see the waist/hips/legs?" If YES anywhere in the image, REJECT and re-crop to strict elbow-level bottom edge.
- **PERSPECTIVE UNLOCK**: DO NOT assume this is a standard eye-level portrait. The Camera Angle is DYNAMIC.
   - If Hat is High-Angle -> Camera is HIGH.
   - If Hat is Low-Angle -> Camera is LOW.
   - If Hat is Side -> Camera is SIDE.
   - There is NO "Default View". The Hat dictates the View.
${backViewLogic}${backAngleLogic}
`;
};

export const TEMPLATE_COMPOSITE_STRATEGY = `
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
`;
