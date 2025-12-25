
import { describe, it, expect } from 'vitest';
import { getViewPrompt } from './promptEngine';

// Mock Data
// Ensure IDs do not conflict to avoid "startsWith" ambiguity in testing
const mockPresets = {
    styles: [{ id: 'style1', basePrompt: 'StyleBase', interrogatedPrompt: 'StyleAI' }],
    viewpoints: [
        { id: 'front', basePrompt: 'ViewBaseFront', interrogatedPrompt: 'ViewAIFront' },
        { id: 'model_view_mock', basePrompt: 'ViewBaseModel', interrogatedPrompt: 'ViewAIModel' }
    ],
    models: [
        { id: 'mode1', visual_identity: 'ModelIdentity', viewpoints: { front: 'ModelPoseFront' } }
    ],
    productCategories: [
        { id: 'cat1', name: 'Hat', promptConstraint: 'CategoryConstraint' }
    ]
};

describe('getViewPrompt', () => {

    it('should generate a basic product prompt', () => {
        const config = { styleId: '', modelId: '', categoryId: '' };
        const prompt = getViewPrompt('front', config, ['Front Label'], 'slot1', mockPresets);

        expect(prompt).toMatch(/pure white background/i);
        expect(prompt).toContain('STRICT PROTOCOL');
        expect(prompt).toContain('ViewBaseFront'); // Check for preset base prompt
    });

    it('should inject JSON topology description if provided', () => {
        const config = { description: '{"shape": "round"}' };
        const prompt = getViewPrompt('front', config, [], 'slot1', mockPresets);

        expect(prompt).toContain('TOPOLOGY CONSTRAINT(JSON API)');
        expect(prompt).toContain('{"shape": "round"}');
    });

    it('should inject Target Color logic if provided', () => {
        const config = { targetColor: '#FF0000' };
        const prompt = getViewPrompt('front', config, [], 'slot1', mockPresets);

        expect(prompt).toContain('COLOR ENFORCEMENT PROTOCOL');
        expect(prompt).toContain('#FF0000');
    });

    it('should handle Style Reference label correctly', () => {
        const config = {};
        const prompt = getViewPrompt('front', config, [], 'slot1', mockPresets, 'STYLE_REF_LABEL');

        expect(prompt).toContain('[STYLE REFERENCE ALERT]');
        // The label text might only appear if we pass it as the last arg.
        // Signature: (viewType, config, availableLabels, taskKey, presets, styleRefLabel)
        expect(prompt).toContain('STYLE_REF_LABEL');
    });

    it('should generate Model View prompt correctly', () => {
        const config = { modelId: 'mode1', styleId: 'style1' };
        // Use a viewType that triggers Model Logic (starts with 'model_')
        // AND matches the ID mapping logic if needed. 
        // Logic: cleanViewId = 'model_front'.replace('model_', '') -> 'front'.
        // So it will look for 'front' in viewpoints.
        const prompt = getViewPrompt('model_front', config, [], 'slot1', mockPresets);

        expect(prompt).toContain('TASK: Photorealistic Model Portrait generation');

        // Components
        // Model View prompt uses StyleAI (interrogated), NOT StyleBase (generic base)
        expect(prompt).toContain('StyleAI');
        expect(prompt).toContain('ModelIdentity'); // Model Identity
        expect(prompt).toContain('ModelPoseFront'); // Model Specific Pose (override)

        // Check Strict Constraints
        expect(prompt).toContain('HAT ORIENTATION ABSOLUTE LOCK');
        expect(prompt).toContain('HALF-BODY FRAMING LOCK');
    });

    it('should fallback gracefully if presets are missing', () => {
        const config = { modelId: 'unknown', styleId: 'unknown' };
        const prompt = getViewPrompt('front', config, [], 'slot1', null);

        expect(prompt).toBeTruthy();
        expect(prompt).toMatch(/pure white background/i);
    });

    it('should handle template composite mode for models', () => {
        const presetsWithTemplate = {
            models: [{
                id: 'tmpl1',
                templateImage: 'data:image/png;base64,fake',
                visual_identity: 'Template Model'
            }],
            viewpoints: []
        };
        const config = { modelId: 'tmpl1' };
        const prompt = getViewPrompt('model_front', config, [], 'slot1', presetsWithTemplate);

        expect(prompt).toContain('TASK: VIRTUAL TRY-ON / ACCESSORY REPLACEMENT');
        expect(prompt).toContain('Composite the Hat from IMAGE 1');
    });

});
