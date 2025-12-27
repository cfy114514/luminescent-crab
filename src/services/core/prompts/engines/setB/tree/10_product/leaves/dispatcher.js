import { LEAF_PROMPT_PRODUCT_FRONT } from './front';
import { LEAF_PROMPT_PRODUCT_BACK } from './back';
import { LEAF_PROMPT_PRODUCT_ANGLE } from './angle';
import { LEAF_PROMPT_PRODUCT_TOP } from './top';
import { LEAF_PROMPT_PRODUCT_INSIDE } from './inside';
import { LEAF_PROMPT_PRODUCT_DETAIL } from './detail';

export const getProductLeafPrompt = (viewType) => {
    const vt = viewType.toLowerCase();

    if (vt.includes('back')) return LEAF_PROMPT_PRODUCT_BACK;
    if (vt.includes('angle') || vt.includes('side')) return LEAF_PROMPT_PRODUCT_ANGLE;
    if (vt.includes('top')) return LEAF_PROMPT_PRODUCT_TOP;
    if (vt.includes('inside')) return LEAF_PROMPT_PRODUCT_INSIDE;
    if (vt.includes('detail')) return LEAF_PROMPT_PRODUCT_DETAIL;
    if (vt.includes('front')) return LEAF_PROMPT_PRODUCT_FRONT;

    return LEAF_PROMPT_PRODUCT_FRONT; // Default fallback
};
