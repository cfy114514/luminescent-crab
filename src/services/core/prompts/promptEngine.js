// === Main Dispatcher for View Prompts ===
import { getStandardModelPrompt } from './engines/modelStandardEngine';
import { getPoseModelPrompt } from './engines/modelPoseEngine';
import { getProductStandardPrompt } from './engines/productStandardEngine';

/**
 * Main Entry Point for Prompt Generation
 */
export const getViewPrompt = (viewType, config, availableLabels = [], taskKey = '', presets = null, contextTag = '') => {
    // 1. Determine Task Type
    const isModelTask = taskKey.startsWith('m_');

    if (!isModelTask) {
        return getProductStandardPrompt(config, viewType);
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
        return getPoseModelPrompt(config, selectedModel, viewType, genderLabel, isMale, config.manualPose);
    }

    // Otherwise, use the Standard Engine (Red T-Anchor, etc.)
    return getStandardModelPrompt(config, selectedModel, viewType, genderLabel, isMale);
};
