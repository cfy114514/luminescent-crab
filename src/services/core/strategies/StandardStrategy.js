/**
 * Standard Strategy (Set A)
 * Handles Product Photography and Standard Studio Model logic.
 */

import { BaseStrategy } from './BaseStrategy';
import * as SetA_Standard from '../prompts/engines/setA/modelStandardEngine';
import * as SetA_Pose from '../prompts/engines/setA/modelPoseEngine';
import * as SetA_Product from '../prompts/engines/setA/productStandardEngine';

export class StandardStrategy extends BaseStrategy {
    async execute(task, onStatus) {
        onStatus(`[Set A] Generating ${task.key}...`);

        const isModelTask = task.key.startsWith('m_');
        let prompt = '';

        if (!isModelTask) {
            // Product Logic
            // Standard Product Engine
            prompt = SetA_Product.getProductStandardPrompt(this.config, task.key);
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
                prompt = SetA_Pose.getPoseModelPrompt(
                    this.config,
                    selectedModel,
                    task.key,
                    genderLabel,
                    isMale,
                    this.config.manualPose
                );
            } else {
                prompt = SetA_Standard.getStandardModelPrompt(
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
