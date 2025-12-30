/**
 * Workflow Strategy Factory
 * Instantiates the correct strategy based on configuration.
 */

import { StandardStrategy } from './strategies/StandardStrategy';
import { LifestyleStrategy } from './strategies/LifestyleStrategy';
import { CompositorStrategy } from './strategies/CompositorStrategy';

export class WorkflowFactory {
    /**
     * Get the appropriate strategy instance
     * @param {Object} config - User configuration
     * @param {Object} presets - Presets data
     * @param {Object} slotMetadata - Slot metadata
     * @returns {BaseStrategy} Strategy instance
     */
    static getStrategy(config, presets, slotMetadata) {
        switch (config.promptSet) {
            case 'B':
                return new LifestyleStrategy(config, presets, slotMetadata);
            case 'C':
                return new CompositorStrategy(config, presets, slotMetadata);
            case 'A':
            default:
                return new StandardStrategy(config, presets, slotMetadata);
        }
    }
}
