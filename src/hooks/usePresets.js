import { useState, useEffect } from 'react';
import defaultPresets from '../config/presets.json';

export const usePresets = () => {
    const [presets, setPresets] = useState(() => {
        const saved = localStorage.getItem('product_ai_presets');
        const initial = saved ? JSON.parse(saved) : defaultPresets;

        // Sync logic: Ensure new default viewpoints/styles/categories are added even if user has saved data
        const syncedViewpoints = [...initial.viewpoints];
        defaultPresets.viewpoints.forEach(dv => {
            if (!syncedViewpoints.find(v => v.id === dv.id)) {
                syncedViewpoints.push(dv);
            }
        });

        // 1. Sync Product Categories (New Feature)
        // Only initialize if 'productCategories' is undefined (first run). 
        // If it exists but is empty (user deleted all), respect that.
        const syncedCategories = initial.productCategories || defaultPresets.productCategories || [];

        // Remove legacy one-off lifestyle attempts to avoid clutter
        const legacyIds = ['model_lifestyle', 'model_lifestyle_walking', 'model_lifestyle_leaning'];
        const finalViewpoints = syncedViewpoints.filter(v => !legacyIds.includes(v.id));

        // Sync Models (New Feature)
        const syncedModels = [...(initial.models || [])];
        if (defaultPresets.models) {
            defaultPresets.models.forEach(dm => {
                if (!syncedModels.find(m => m.id === dm.id)) {
                    syncedModels.push(dm);
                }
            });
        }

        return {
            ...initial,
            viewpoints: finalViewpoints,
            models: syncedModels,
            productCategories: syncedCategories
        };
    });

    const savePresets = (newPresets) => {
        try {
            setPresets(newPresets);
            localStorage.setItem('product_ai_presets', JSON.stringify(newPresets));
        } catch (err) {
            console.error("Storage Error:", err);
            if (err.name === 'QuotaExceededError' || err.toString().includes('exceeded')) {
                alert("保存失败：图片太大，超过了浏览器存储限制！\n请尝试压缩图片或使用更小的分辨率（建议 1MB 以内）。\n(Save Failed: Image too large for local storage)");
            } else {
                alert(`保存失败: ${err.message}`);
            }
        }
    };

    return { presets, savePresets };
};
