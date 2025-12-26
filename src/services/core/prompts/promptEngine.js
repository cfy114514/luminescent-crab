// === Main Dispatcher for View Prompts ===
// We now support branching (Set A / Set B)
// By default, we use Set A.
import * as SetA_Standard from './engines/setA/modelStandardEngine';
import * as SetA_Pose from './engines/setA/modelPoseEngine';
import * as SetA_Product from './engines/setA/productStandardEngine';

import * as SetB_Standard from './engines/setB/modelStandardEngine';
import * as SetB_Pose from './engines/setB/modelPoseEngine';
import * as SetB_Product from './engines/setB/productStandardEngine';

/**
 * Main Entry Point for Prompt Generation
 */
export const getViewPrompt = (viewType, config, availableLabels = [], taskKey = '', presets = null, contextTag = '') => {
    // 0. Determine Prompt Set (Default 'A')
    const useSetB = config.promptSet === 'B';
    const StandardEngine = useSetB ? SetB_Standard : SetA_Standard;
    const PoseEngine = useSetB ? SetB_Pose : SetA_Pose;
    const ProductEngine = useSetB ? SetB_Product : SetA_Product;

    // 1. Determine Task Type
    const isModelTask = taskKey.startsWith('m_');

    if (!isModelTask) {
        return ProductEngine.getProductStandardPrompt(config, viewType);
    }

    // 2. Model Logic
    const selectedModel = presets?.models?.find(m => m.id === config.modelId);

    const isMale =
        (selectedModel?.gender?.toLowerCase() === 'male' || selectedModel?.gender?.toLowerCase() === 'man') ||
        (config.gender === 'male');

    const genderLabel = isMale ? "Male" : "Female";

    // DECISION LOGIC: Are we doing a Pose Reference or a Standard Asset Projection?
    // If we have manualPose (extracted from a pose reference), use the Pose Engine.
    if (config.manualPose) {
        return PoseEngine.getPoseModelPrompt(config, selectedModel, viewType, genderLabel, isMale, config.manualPose);
    }

    // Otherwise, use the Standard Engine (Red T-Anchor, etc.)
    return StandardEngine.getStandardModelPrompt(config, selectedModel, viewType, genderLabel, isMale);
};
