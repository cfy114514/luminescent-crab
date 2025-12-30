import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layout,
    ChevronRight,
    Save,
    Wand2,
    Trash2,
    Plus,
    Image as ImageIcon,
    Sparkles,
    Camera,
    Info
} from 'lucide-react';
import UploadZone from '../UploadZone';
import { interrogateImages, mergePrompts } from '../../services/api';

const ViewpointEditor = ({ presets, setPresets }) => {
    const [selectedId, setSelectedId] = useState(presets?.viewpoints?.[0]?.id || null);
    const [isInterrogating, setIsInterrogating] = useState(false);

    const currentViewpoint = useMemo(() =>
        presets?.viewpoints?.find(v => v.id === selectedId),
        [selectedId, presets?.viewpoints]
    );

    const handleUpdate = (field, value) => {
        const newViewpoints = (presets?.viewpoints || []).map(v =>
            v.id === selectedId ? { ...v, [field]: value } : v
        );
        setPresets({ ...presets, viewpoints: newViewpoints });
    };

    const handleReverseEngineering = async () => {
        if (!currentViewpoint?.referenceImages?.length) return;

        setIsInterrogating(true);
        try {
            // Contextual Mode: Use 'model_pose' for viewpoints starting with 'model_', otherwise 'viewpoints'
            const apiMode = currentViewpoint.id.startsWith('model_') ? 'model_pose' : 'viewpoints';
            const result = await interrogateImages(currentViewpoint.referenceImages, apiMode);

            if (result.reverse_prompt_fragment || result.pose_prompt) {
                const fragment = result.pose_prompt || result.reverse_prompt_fragment;
                const newViewpoints = (presets?.viewpoints || []).map(v =>
                    v.id === selectedId ? {
                        ...v,
                        interrogatedPrompt: fragment,
                        compositionRatio: result.composition_ratio || v.compositionRatio
                    } : v
                );
                setPresets({ ...presets, viewpoints: newViewpoints });
            }
        } catch (error) {
            console.error("Interrogation failed:", error);
            alert("逆向分析失败，请检查 API 配置或网络。");
        } finally {
            setIsInterrogating(false);
        }
    };

    const handleSave = () => {
        localStorage.setItem('admin_presets', JSON.stringify(presets));
        alert("机位配置已保存到本地存储");
    };

    return (
        <div className="grid grid-cols-12 gap-6">
            {/* Sidebar: Viewpoint List */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Camera className="w-4 h-4" /> 视角/机位列表
                    </h3>
                </div>

                <div className="space-y-2">
                    {(presets?.viewpoints || []).map(view => (
                        <button
                            key={view.id}
                            onClick={() => setSelectedId(view.id)}
                            className={`
                                w-full p-4 rounded-xl border text-left transition-all relative group
                                ${selectedId === view.id
                                    ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10'
                                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}
                            `}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className={`font-bold transition-colors ${selectedId === view.id ? 'text-white' : 'text-slate-300'}`}>
                                        {view.name}
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-tighter">
                                        ID: {view.id}
                                    </div>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-transform ${selectedId === view.id ? 'text-blue-400 translate-x-1' : 'text-slate-600'}`} />
                            </div>
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleSave}
                    className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all border border-blue-400/20"
                >
                    <Save className="w-5 h-5" /> 应用并保存所有机位
                </button>
            </div>

            {/* Main Content: Viewpoint Details */}
            <div className="col-span-12 lg:col-span-9">
                <AnimatePresence mode="wait">
                    {currentViewpoint ? (
                        <motion.div
                            key={currentViewpoint.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl space-y-8"
                        >
                            {/* Header info */}
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                        <Camera className="w-6 h-6 text-blue-500" /> {currentViewpoint.name}
                                    </h2>
                                    <p className="text-slate-400 text-sm">配置此视角的构图、焦距和光影规范</p>
                                </div>
                            </div>

                            {/* Prompt Sections */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Layout className="w-3.5 h-3.5" /> 构图逻辑 (COMPOSITION LOGIC)
                                    </label>
                                    <textarea
                                        value={currentViewpoint.basePrompt}
                                        onChange={(e) => handleUpdate('basePrompt', e.target.value)}
                                        className="w-full h-40 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none leading-relaxed"
                                        placeholder="例如：Front view, centered, eye-level..."
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                            <Sparkles className="w-3.5 h-3.5" /> 逆炼提示词 (INTERROGATED)
                                        </label>
                                        {currentViewpoint.compositionRatio && (
                                            <div className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                                                比例/尺寸: {currentViewpoint.compositionRatio}
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <textarea
                                            readOnly
                                            value={currentViewpoint.interrogatedPrompt}
                                            className="w-full h-40 bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 text-sm text-blue-300 italic leading-relaxed"
                                            placeholder="通过下方逆向工程自动填充..."
                                        />
                                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Reference & Reverse Engineering */}
                            <div className="pt-6 border-t border-slate-800/50">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="space-y-1">
                                        <h4 className="text-white font-bold flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4 text-blue-400" /> 视角参考图 (Composition References)
                                        </h4>
                                        <p className="text-[11px] text-slate-500">上传对此视角具有【标准构图/光影】意义的照片，供 AI 学习。</p>
                                    </div>
                                    <button
                                        disabled={!currentViewpoint.referenceImages?.length || isInterrogating}
                                        onClick={handleReverseEngineering}
                                        className={`
                                            px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all
                                            ${currentViewpoint.referenceImages?.length && !isInterrogating
                                                ? 'bg-white text-slate-950 hover:bg-blue-50 shadow-lg shadow-white/5'
                                                : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
                                        `}
                                    >
                                        {isInterrogating ? (
                                            <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
                                        ) : <Wand2 className="w-4 h-4" />}
                                        逆向输出视角规范
                                    </button>
                                </div>

                                <UploadZone
                                    images={currentViewpoint.referenceImages || []}
                                    onImagesChange={(newImages) => handleUpdate('referenceImages', newImages)}
                                    fixedLabel={currentViewpoint.id}
                                    className="!bg-slate-950/50 !border-slate-800 !py-12"
                                />

                                {currentViewpoint.referenceImages?.length > 0 && (
                                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mt-6">
                                        {currentViewpoint.referenceImages.map((img, idx) => (
                                            <div key={img.id || idx} className="aspect-square rounded-lg border border-slate-800 overflow-hidden relative group">
                                                <img src={img.preview || img.fullDataUrl || (img instanceof File ? URL.createObjectURL(img) : "")} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => {
                                                        const freshList = currentViewpoint.referenceImages.filter((_, i) => i !== idx);
                                                        handleUpdate('referenceImages', freshList);
                                                    }}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Final Merge Preview */}
                            <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800/50">
                                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-3 block">
                                    机位合并预览 (VIEWPORT CONTEXT PREVIEW)
                                </label>
                                <div className="text-xs text-slate-400 leading-relaxed font-mono">
                                    {mergePrompts(currentViewpoint.basePrompt, currentViewpoint.interrogatedPrompt)}
                                </div>
                                <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-start gap-2">
                                    <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5" />
                                    <p className="text-[10px] text-blue-300 leading-relaxed italic">
                                        此提示词将作为该视角的“地基”。生成时，它会更优先地固定物体的摆放、相机高度和视觉深度。
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex items-center justify-center p-20 border-2 border-dashed border-slate-800 rounded-3xl">
                            <div className="text-center space-y-4">
                                <Camera className="w-12 h-12 text-slate-700 mx-auto" />
                                <p className="text-slate-500 font-medium">请从左侧选择一个视角进行配置</p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ViewpointEditor;
