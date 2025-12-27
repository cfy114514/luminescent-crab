import { LEAF_PROMPT_MODEL_FRONT } from './front';
import { LEAF_PROMPT_MODEL_BACK } from './back';
import { LEAF_PROMPT_MODEL_SIDE } from './side';
import { LEAF_PROMPT_MODEL_BACK_ANGLE } from './back_angle';

export const getModelLeafPrompt = (viewType) => {
    const vt = viewType.toLowerCase();

    if (vt.includes('back') && vt.includes('angle')) return LEAF_PROMPT_MODEL_BACK_ANGLE;
    if (vt.includes('back')) return LEAF_PROMPT_MODEL_BACK;
    if (vt.includes('side') || vt.includes('profile')) return LEAF_PROMPT_MODEL_SIDE;
    if (vt.includes('front')) return LEAF_PROMPT_MODEL_FRONT;

    return LEAF_PROMPT_MODEL_FRONT; // Default fallback
};
