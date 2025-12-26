import { MASTER_NEGATIVE_ROOT, UNIVERSAL_REFINE_QUALITY } from '../../tree/00_root_integrity';
import { PRODUCT_RENDERING_STYLE } from '../../tree/10_product/rendering';
import { PRODUCT_GEOMETRY_LOCK } from '../../tree/10_product/geometry';
import { getProductLeafPrompt } from '../../tree/10_product/leaves/dispatcher';
import {
    LEGACY_V1_SYSTEM_IDENTITY,
    LEGACY_V1_STRICT_PROTOCOL,
    LEGACY_V1_CONTEXT_RULES,
    LEGACY_V1_PRODUCT_NEGATIVES
} from '../../tree/10_product/legacy_rules_1db743';

/**
 * Product-Only Asset Projection Protocol (Restored from 1db743)
 * Pure white background, absolute fidelity, zero mannequin.
 */
export const getProductStandardPrompt = (config, viewType) => {
    const leafSpecifics = getProductLeafPrompt(viewType);

    return `
[SYSTEM]:
${LEGACY_V1_SYSTEM_IDENTITY}

${LEGACY_V1_STRICT_PROTOCOL}

${LEGACY_V1_CONTEXT_RULES}

[GEOMETRY & RENDERING]:
${PRODUCT_GEOMETRY_LOCK}
${PRODUCT_RENDERING_STYLE}

[VIEW-SPECIFIC INSTRUCTIONS]:
${leafSpecifics}

[REFINEMENT]:
${UNIVERSAL_REFINE_QUALITY}

[GLOBAL NEGATIVES]: ${MASTER_NEGATIVE_ROOT} ${LEGACY_V1_PRODUCT_NEGATIVES}
`.trim();
};
