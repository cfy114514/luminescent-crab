/**
 * Compositor Strategy (Set C)
 * Handles Reference and VFX Compositing logic.
 */

import { BaseStrategy } from './BaseStrategy';
import * as SetC_Reference from '../prompts/engines/setC/modelReferenceEngine';

export class CompositorStrategy extends BaseStrategy {
    async execute(task, onStatus) {
        onStatus(`[Set C] Generating ${task.key}...`);

        const isModelTask = task.key.startsWith('m_');

        if (!isModelTask) {
            // Set C doesn't officially support product slots yet, fallback to generic or throw error
            // For now, let's borrow logic from Set B or A if needed, or just throw.
            // But to avoid breakage, we'll just use Set B's product engine as a fallback for now 
            // since Set C is focused on Models.
            // Or better, skip it.
            throw new Error("Set C (Compositor) is optimized for Model Views only.");
        }

        // Model Logic
        const selectedModel = this.getSelectedModel();

        // Gender Logic
        const isMale =
            (selectedModel?.gender?.toLowerCase() === 'male' || selectedModel?.gender?.toLowerCase() === 'man') ||
            (this.config.gender === 'male');
        const genderLabel = isMale ? "Male" : "Female";

        // Set C always uses Reference Engine
        const prompt = SetC_Reference.getReferenceModelPrompt(
            this.config,
            selectedModel,
            task.key,
            genderLabel,
            isMale,
            this.config.manualPose,
            this.config.visualAnchorData
        );

        // Call Shared Adapter
        return await this.callAdapter(prompt, task.inputImage, task.key);
    }
}
