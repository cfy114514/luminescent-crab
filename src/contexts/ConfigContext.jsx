import React, { createContext, useContext, useState } from 'react';
import { usePresets } from '../hooks/usePresets';
import { useOutfits } from '../hooks/useOutfits';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    // 1. Core Config State
    const [config, setConfig] = useState({
        creativity: 20, // Default to Low Creativity (Strict Mode)
        model: 'gemini-2.5-flash-image', // Default Model
        ethnicity: 'caucasian',
        gender: 'female',
        categoryId: 'hat', // Default Category
        modelId: '', // Model Identity Preset
        thinkingLevel: 'high',
        imageSize: '2K',
        aspect_ratio: '1:1',
        temperature: 1.0,
        description: '',
        promptSet: 'A', // Default to Set A (Standard)
    });

    const [slotMetadata, setSlotMetadata] = useState({}); // Custom perspective overrides per slot
    const [styleReferenceImage, setStyleReferenceImage] = useState(null);
    const [isDryRun, setIsDryRun] = useState(false); // Dry Run / Simulation Mode

    // 2. Integration with Custom Hooks
    const { presets, savePresets } = usePresets();
    const {
        outfitSuggestion,
        isAnalyzing,
        analysisError,
        analysisStatus,
        analyzeStyle
    } = useOutfits();

    // 3. Actions
    const updateConfig = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const updateSlotMetadata = (id, data) => {
        setSlotMetadata(prev => ({ ...prev, [id]: data }));
    };

    const loadPreset = (presetName) => {
        // Implementation depends on how presets are structured in the hook vs local usage
        // This might need to interact with usePresets or just update local config
        const preset = presets[presetName];
        if (preset) {
            setConfig(prev => ({ ...prev, ...preset }));
        }
    };

    const value = {
        config,
        setConfig, // Expose setter for flexibility, or use updateConfig
        updateConfig,
        slotMetadata,
        updateSlotMetadata,
        styleReferenceImage,
        setStyleReferenceImage,
        isDryRun,
        setIsDryRun,

        // From usePresets
        presets,
        savePresets,
        loadPreset,

        // From useOutfits
        outfitSuggestion,
        isAnalyzing,
        analysisError,
        analysisStatus,
        analyzeStyle
    };

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};
