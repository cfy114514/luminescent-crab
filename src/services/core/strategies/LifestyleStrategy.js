/**
 * Lifestyle Strategy (Set B)
 * Handles environmental / persona-based generation.
 */

import { BaseStrategy } from './BaseStrategy';
import * as SetB_Standard from '../prompts/engines/setB/modelStandardEngine';
import * as SetB_Pose from '../prompts/engines/setB/modelPoseEngine';
import * as SetB_Product from '../prompts/engines/setB/productStandardEngine';

export class LifestyleStrategy extends BaseStrategy {
    async execute(task, onStatus) {
        onStatus(`[Set B] Generating ${task.key}...`);

        const isModelTask = task.key.startsWith('m_');
        let prompt = '';

        if (!isModelTask) {
            // Set B Product Engine
            prompt = SetB_Product.getProductStandardPrompt(this.config, task.key);
        } else {
            // Model Logic
            const selectedModel = this.getSelectedModel();

            // Gender Logic
            const isMale =
                (selectedModel?.gender?.toLowerCase() === 'male' || selectedModel?.gender?.toLowerCase() === 'man') ||
                (this.config.gender === 'male');
            const genderLabel = isMale ? "Male" : "Female";

            // Pose Logic
            if (this.config.manualPose) {
                prompt = SetB_Pose.getPoseModelPrompt(
                    this.config,
                    selectedModel,
                    task.key,
                    genderLabel,
                    isMale,
                    this.config.manualPose
                );
            } else {
                prompt = SetB_Standard.getStandardModelPrompt(
                    this.config,
                    selectedModel,
                    task.key,
                    genderLabel,
                    isMale
                );
            }
        }

        // Call Shared Adapter
        return await this.callAdapter(prompt, task.inputImage, task.key);
    }
}
