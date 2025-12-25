import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateImages } from '../services/api';

export const useImageGeneration = (presets, poseImages = {}, slotMetadata = {}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState({});
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [visualProgress, setVisualProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");
    const [history, setHistory] = useState([]);
    const [lastPayload, setLastPayload] = useState(null);

    // Visual Progress Interpolation
    useEffect(() => {
        let interval;
        if (isProcessing && progress.total > 0) {
            const realPercent = (progress.current / progress.total) * 100;
            const stepSize = 100 / progress.total;
            const targetFakePercent = Math.min(realPercent + (stepSize * 0.8), 99);

            interval = setInterval(() => {
                setVisualProgress(prev => {
                    if (prev < realPercent) {
                        return prev + (realPercent - prev) * 0.2;
                    }
                    if (prev < targetFakePercent) {
                        return prev + 0.1;
                    }
                    return prev;
                });
            }, 50);
        } else if (!isProcessing) {
            setVisualProgress(0);
        }
        return () => clearInterval(interval);
    }, [isProcessing, progress]);

    const clearAll = (setViewImagesCallback) => {
        if (window.confirm("确定要清空所有上传的素材和生成结果吗？(Are you sure you want to clear all?)")) {
            if (setViewImagesCallback) setViewImagesCallback({});
            setResults({});
            setError(null);
            setProgress({ current: 0, total: 0 });
        }
    };

    const downloadAll = async () => {
        if (!results || Object.keys(results).length === 0) return;

        const zip = new JSZip();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const zipFilename = `ProductAI_Set_${timestamp}.zip`;

        const folder = zip.folder("generated_images");

        Object.entries(results).forEach(([id, data]) => {
            if (data && data.url) {
                const imgData = data.url.split(',')[1];
                if (imgData) {
                    folder.file(`${id}_${data.label}.png`, imgData, { base64: true });
                }
            }
        });

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, zipFilename);
    };

    const generateSingle = async (slotId, viewImages, config, overrideConfig = null) => {
        const file = viewImages[slotId];
        if (!file) return;

        // Model Check
        if (slotId.startsWith('m_') && !config.modelId) {
            setError("请先选择一个模特 (Please select a Model Identity)");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setStatusMessage(`Generating single view: ${slotId}...`);

        const singleMap = { [slotId]: file };
        const poseMap = poseImages[slotId] ? { [slotId]: poseImages[slotId] } : {};
        const finalConfig = overrideConfig ? { ...config, ...overrideConfig } : config;

        try {
            const data = await generateImages(
                singleMap,
                finalConfig,
                (key, resultData) => {
                    setResults(prev => ({ ...prev, [key]: resultData }));
                },
                (status) => setStatusMessage(status),
                presets,
                poseMap,
                slotMetadata
            );
            setResults(prev => ({ ...prev, ...data.images }));
        } catch (err) {
            console.error("Single Gen Error:", err);
            setError(`生成失败: ${err.message}`);
        } finally {
            setIsProcessing(false);
            setStatusMessage("");
        }
    };

    const generateAll = async (viewImages, config, outfitSuggestion, activeTab = 'product') => {
        // Check uploads
        const inputFiles = Object.values(viewImages);
        if (inputFiles.length === 0) {
            setError("请至少上传一张参考图片 (Please upload at least one image)");
            return;
        }

        // Model Check
        const hasModelImages = Object.keys(viewImages).some(k => k.startsWith('m_'));
        if (hasModelImages && activeTab === 'model' && !config.modelId) {
            setError("上传了模特展示图，请先选择一个模特 (Model View detected. Please select a Model Identity)");
            return;
        }

        setIsProcessing(true);
        setStatusMessage("Initializing engines...");
        setResults({});
        const totalSteps = inputFiles.length;
        setProgress({ current: 0, total: totalSteps });
        setVisualProgress(0);
        setError(null);

        const finalConfig = { ...config };
        if (outfitSuggestion) {
            finalConfig.outfitSuggestion = outfitSuggestion.outfit_description;
        }

        // FILTER: Only generate for slots belonging to the current "Logic Group"
        const filteredViewImages = Object.fromEntries(
            Object.entries(viewImages).filter(([key]) => {
                if (activeTab === 'product') return key.startsWith('p_');
                return key.startsWith('m_');
            })
        );

        try {
            const data = await generateImages(
                filteredViewImages,
                finalConfig,
                (key, resultData, current, total) => {
                    setResults(prev => ({ ...prev, [key]: resultData }));
                    setProgress({ current, total });
                },
                (status) => setStatusMessage(status),
                presets,
                poseImages,
                slotMetadata
            );

            const newBatch = {
                id: Date.now(),
                images: { ...data.images },
                config: { ...finalConfig }
            };

            setHistory(prev => [newBatch, ...prev]);
            setResults(prev => ({ ...prev, ...data.images }));
            setLastPayload(data.payload);

        } catch (err) {
            console.error("Global Generation Error:", err);
            setError(`生成失败: ${err.message}`);
        } finally {
            setIsProcessing(false);
            setProgress({ current: 0, total: 0 });
            setStatusMessage("");
        }
    };

    return {
        isProcessing,
        results,
        setResults,
        error,
        setError,
        progress,
        visualProgress,
        statusMessage,
        setStatusMessage, // in case needed externally
        history,
        lastPayload,
        generateAll,
        generateSingle,
        downloadAll,
        clearAll
    };
};
