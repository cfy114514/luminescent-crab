import { useState } from 'react';
import { analyzeHatStyleAndSuggestOutfit } from '../services/api';

export const useOutfits = () => {
    const [outfitSuggestion, setOutfitSuggestion] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState(null);
    const [analysisStatus, setAnalysisStatus] = useState("");

    const SLOT_LABELS = {
        'p_front': 'Product Front',
        'p_angle': 'Product Angle',
        'p_back': 'Product Back',
        'p_top': 'Product Top',
        'p_detail': 'Product Detail',
        'p_inside': 'Product Inside',
    };

    const analyzeStyle = async (viewImages, styleReferenceImage) => {
        // Collect product images
        const productImages = Object.entries(viewImages)
            .filter(([key]) => key.startsWith('p_'))
            .map(([key, file]) => ({ file, label: SLOT_LABELS[key] || key }));

        if (productImages.length === 0) {
            setAnalysisError("请先上传至少一张产品图 (Please upload at least one product image)");
            return;
        }

        setIsAnalyzing(true);
        setAnalysisError(null);
        setAnalysisStatus("分析风格中... (Analyzing style...)");

        try {
            const outfitData = await analyzeHatStyleAndSuggestOutfit(
                productImages,
                styleReferenceImage
            );

            setOutfitSuggestion(outfitData);
            console.log("[Manual Style Analysis]", outfitData);
            setAnalysisStatus("风格分析完成 (Style analysis complete)");

            // Clear status after brief display
            setTimeout(() => setAnalysisStatus(""), 2000);
        } catch (err) {
            console.error("[Style Analysis Error]:", err);
            setAnalysisError(`风格分析失败: ${err.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return {
        outfitSuggestion,
        setOutfitSuggestion, // Exposed in case we need to manual clear or set
        isAnalyzing,
        analysisError,
        analysisStatus,
        analyzeStyle
    };
};
