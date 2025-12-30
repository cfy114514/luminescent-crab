/**
 * Generation Service
 * Focuses on task orchestration and calling API adapters via Strategies.
 */

import { asyncPool } from './core/utils/asyncUtils';
import { WorkflowFactory } from './core/WorkflowFactory';

/**
 * Orchestrates image generation batch tasks using the Strategy Pattern
 */
export const generateImages = async (viewImagesMap, config, onImageGenerated, onStatus, presets = null, poseImagesMap = {}, slotMetadata = {}) => {

    // 1. Instantiate the correct Strategy
    const strategy = WorkflowFactory.getStrategy(config, presets, slotMetadata);
    onStatus(`Initializing ${strategy.constructor.name}...`);

    const tasks = Object.keys(viewImagesMap).map(key => ({
        key,
        inputImage: viewImagesMap[key],
        poseImage: poseImagesMap[key] || null
    }));

    const results = { images: {}, payload: { provider: strategy.provider, url: strategy.url } };
    let completed = 0;

    // 2. Define Task Processor
    const processTask = async (task) => {
        try {
            // Delegate execution to the Strategy
            const resultUrl = await strategy.execute(task, onStatus);

            results.images[task.key] = { url: resultUrl };
            completed++;
            onImageGenerated(task.key, { url: resultUrl }, completed, tasks.length);

            return { key: task.key, url: resultUrl };
        } catch (error) {
            console.error(`Task Error [${task.key}]:`, error);
            // Optional: return error object or handle graceful failure
            throw error;
        }
    };

    // 3. Parallel Execution
    await asyncPool(2, tasks, processTask);

    onStatus("Generation Complete.");
    return results;
};
