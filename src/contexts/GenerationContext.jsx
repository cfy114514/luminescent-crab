import React, { createContext, useContext, useState } from 'react';
import { useConfig } from './ConfigContext';
import { useImageGeneration } from '../hooks/useImageGeneration';

const GenerationContext = createContext();

export const GenerationProvider = ({ children }) => {
    // 1. Local State for Uploads (View Images & Pose Images)
    const [viewImages, setViewImages] = useState({});
    const [poseImages, setPoseImages] = useState({});

    // 2. Consume Config Context (needed for generation)
    const { config, presets, slotMetadata, outfitSuggestion, isDryRun } = useConfig();

    // 3. Use the existing Generation Hook (which contains the heavy lifting)
    // We pass the config/presets from context into the hook
    const {
        isProcessing,
        results,
        setResults,
        error,
        setError,
        progress,
        visualProgress,
        statusMessage,
        history,
        lastPayload,
        generateAll: hookGenerateAll,
        generateSingle: hookGenerateSingle,
        downloadAll,
        clearAll: hookClearAll
    } = useImageGeneration(presets, poseImages, slotMetadata);

    // 4. Wrapped Actions
    const uploadImage = (slotId, file) => {
        setViewImages(prev => ({ ...prev, [slotId]: file }));
    };

    const removeImage = (slotId) => {
        setViewImages(prev => {
            const next = { ...prev };
            delete next[slotId];
            return next;
        });
    };

    const uploadPoseImage = (slotId, file) => {
        setPoseImages(prev => ({ ...prev, [slotId]: file }));
    };

    const removePoseImage = (slotId) => {
        setPoseImages(prev => {
            const next = { ...prev };
            delete next[slotId];
            return next;
        });
    };

    const generateAll = (activeTab = 'product') => {
        hookGenerateAll(viewImages, { ...config, isDryRun }, outfitSuggestion, activeTab);
    };

    const generateSingle = (slotId, overrideConfig = null) => {
        hookGenerateSingle(slotId, viewImages, { ...config, isDryRun }, overrideConfig);
    };

    const clearAll = () => {
        hookClearAll(setViewImages);
        setPoseImages({});
    };

    const value = {
        // State
        viewImages,
        poseImages,
        results,
        history,
        lastPayload,

        // Status
        isProcessing,
        error,
        progress,
        visualProgress,
        statusMessage,

        // Actions
        uploadImage,
        removeImage,
        uploadPoseImage,
        removePoseImage,
        generateAll,
        generateSingle,
        downloadAll,
        clearAll
    };

    return (
        <GenerationContext.Provider value={value}>
            {children}
        </GenerationContext.Provider>
    );
};

export const useGeneration = () => {
    const context = useContext(GenerationContext);
    if (!context) {
        throw new Error('useGeneration must be used within a GenerationProvider');
    }
    return context;
};
