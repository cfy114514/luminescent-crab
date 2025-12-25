export const getGenderNegative = (isMale) => {
    return isMale
        ? ", (female:2.0), (woman:2.0), (girl:2.0), (lady:2.0), (feminine features:2.0), (makeup:1.5), (lipstick:1.5), (curvy body:2.0), (breasts:2.0)"
        : ", (male:2.0), (man:2.0), (boy:2.0), (beard:2.0), (stubble:1.5), (masculine features:2.0)";
};

export const MODEL_NEGATIVE_BASE = (baseNegatives, viewType, genderNegative) => {
    const backViewNegatives = viewType === 'model_back' ? ', (face visible:3.0), (side view:2.5), (three quarter view:2.5), (profile:2.5), (looking at camera:3.0)' : '';
    const backAngleNegatives = viewType === 'model_back_angle' ? ', (face visible:3.0), (front view:3.0), (looking at camera:3.0), (full side view:2.5), (pure profile:2.5)' : '';

    return `NEGATIVE PROMPT: ${baseNegatives}${backViewNegatives}${backAngleNegatives}${genderNegative}.`;
};

export const BASE_NEGATIVE_STRING = "(straightened hat:2.0), (corrected angle:2.0), (leveled hat:2.0), (perfectly symmetry:1.5), (rotated to show face:3.5), (adjusted angle for face:3.5), (turned hat for visibility:3.5), (hat facing camera when reference faces side:3.5), (wrong hat direction:3.0), (full body:3.0), (waist visible:3.0), (legs visible:3.0), (feet:3.0), (hips:3.0), (below elbow:2.5), (whole body:2.5), (standing pose:2.0), (rotated hat:2.5), (spinning hat:2.5), (turned hat:2.5), (face not matching hat direction:2.5), (mismatched orientation:2.5), (rotated product:2.0), (tilted hat:2.0), (歪头:2.0), (floating hat:1.8), (perched hat:1.8), (head tilt:1.8), (close-up:2.0), (zoomed-in face:1.5), (cropped body:1.8), (crooked:2.0), (diagonal:2.0), (askew:2.0), large head, fashion pose, hair sticking out, smudged cloth, blurred logo, full body shot, extreme close up, product stand, headless torso";

export const PRODUCT_NEGATIVE_IN_BASE = "(wrong orientation:2.0), (rotated hat:2.0), (tilted:2.0), (wrinkles:1.3), (creases:1.3), (dust:1.3), (lint:1.3), gray background, off-white, studio floor, vignette, drawing, painting, illustration, 3d render, sketch, low quality, hanging tag, price label, security tag, plastic loop, extra bow, extra knot, missing bow, bow in wrong position.";
