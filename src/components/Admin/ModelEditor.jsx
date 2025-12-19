import React, { useState } from 'react';
import { User, Save, Trash2, Plus, Info, Loader2, Wand2 } from 'lucide-react';
import { interrogateImages } from '../../services/api';
import UploadZone from '../UploadZone';

const ModelEditor = ({ presets, onSave }) => {
    const [localModels, setLocalModels] = useState(presets.models || []);
    const [selectedId, setSelectedId] = useState(localModels[0]?.id || null);
    const [isInterrogating, setIsInterrogating] = useState(false);
    const [interrogatingId, setInterrogatingId] = useState(null); // 'identity' or viewId
    const [interrogationRefImages, setInterrogationRefImages] = useState([]);

    const selectedModel = localModels.find(m => m.id === selectedId);

    const handleUpdateModel = (id, updates) => {
        setLocalModels(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    };

    const handleAddModel = () => {
        const newModel = {
            id: `model_${Date.now()}`,
            name: 'New Model Preset',
            description: 'Model description...',
            visual_identity: '', // AI extracted prompt segment
            viewpoints: {},      // viewId -> posePrompt
            referenceImages: []
        };
        setLocalModels([...localModels, newModel]);
        setSelectedId(newModel.id);
    };

    const handleRemoveModel = (id) => {
        if (window.confirm('确定要删除此模特预设吗？')) {
            setLocalModels(prev => prev.filter(m => m.id !== id));
            if (selectedId === id) setSelectedId(localModels[0]?.id || null);
        }
    };

    const handleRunInterrogation = async (id = 'identity') => {
        if (interrogationRefImages.length === 0) {
            alert("请先上传模特参考图 (Please upload model reference images first)");
            return;
        }

        setIsInterrogating(true);
        setInterrogatingId(id);
        try {
            const apiMode = id === 'identity' ? 'model_identity' : 'model_pose';
            const result = await interrogateImages(interrogationRefImages, apiMode);

            const updates = {
                lastInterrogationResult: result
            };

            // Update DNA ONLY if explicitly targeting identity
            if (id === 'identity' && result.visual_identity) {
                updates.visual_identity = result.visual_identity;
            }

            // Update Pose ONLY if targeting a specific viewpoint
            if (id !== 'identity' && result.pose_prompt) {
                const existingViewpoints = selectedModel.viewpoints || {};
                updates.viewpoints = {
                    ...existingViewpoints,
                    [id]: result.pose_prompt
                };
            }

            handleUpdateModel(selectedId, updates);
        } catch (err) {
            console.error("Model interrogation failed:", err);
            alert("特征提取失败: " + err.message);
        } finally {
            setIsInterrogating(false);
            setInterrogatingId(null);
        }
    };

    const handleSaveAll = () => {
        onSave({ ...presets, models: localModels });
        alert("模特预设已保存 (Model presets saved)");
    };

    return (
        <div className="grid grid-cols-12 gap-8 h-full">
            {/* List */}
            <div className="col-span-4 border-r border-white/5 pr-6 space-y-3">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">模特库 (Model Library)</h3>
                    <button
                        onClick={handleAddModel}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-blue-400 transition-colors"
                        title="Add Model"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    {localModels.map(model => (
                        <div
                            key={model.id}
                            onClick={() => setSelectedId(model.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all group relative cursor-pointer border ${selectedId === model.id ? 'bg-blue-500/10 border-blue-500/30 text-white shadow-lg shadow-blue-500/5' : 'hover:bg-white/5 border-transparent text-slate-400'}`}
                        >
                            <div className="flex items-center gap-2">
                                <User className={`w-4 h-4 ${selectedId === model.id ? 'text-blue-400' : 'text-slate-500'}`} />
                                <div className="font-bold truncate">{model.name}</div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveModel(model.id);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="pt-6">
                    <button
                        onClick={handleSaveAll}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                    >
                        <Save className="w-5 h-5" />
                        保存模特库更改
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="col-span-8 space-y-6">
                {selectedModel ? (
                    <>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">模特名称 (Identify)</label>
                                    <input
                                        type="text"
                                        placeholder="E.g. Lisa G. / Asian Male A"
                                        value={selectedModel.name}
                                        onChange={(e) => handleUpdateModel(selectedId, { name: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">备注描述</label>
                                    <input
                                        type="text"
                                        value={selectedModel.description}
                                        onChange={(e) => handleUpdateModel(selectedId, { description: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Model Interrogation Section - Focus on DNA Only */}
                        <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wand2 className="w-5 h-5 text-blue-400" />
                                    <h4 className="font-semibold text-blue-100">模特面部/基因特征提取 (Identity DNA)</h4>
                                </div>
                                <button
                                    onClick={() => handleRunInterrogation('identity')}
                                    disabled={isInterrogating || interrogationRefImages.length === 0}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${isInterrogating || interrogationRefImages.length === 0 ? 'bg-slate-800 text-slate-500 opacity-50' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:scale-105'}`}
                                >
                                    {isInterrogating && interrogatingId === 'identity' ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            正在分析基因...
                                        </>
                                    ) : (
                                        <>
                                            <User className="w-4 h-4" />
                                            一键对齐模特 DNA
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="text-xs text-slate-400">
                                <b>操作指引：</b>由管理员上传模特的真实照片。AI 将专门提取面部比例、眼睛、肤色等固定特征。注意：姿势描述已移至“视角/机位配置”中统一管理。
                            </p>

                            <div className="h-48">
                                <UploadZone
                                    images={interrogationRefImages}
                                    onImagesChange={setInterrogationRefImages}
                                    isProcessing={isInterrogating}
                                />
                            </div>

                            {selectedModel.visual_identity && (
                                <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <label className="text-xs font-medium text-blue-400 uppercase tracking-widest flex items-center justify-between">
                                        提取的视觉 DNA (Visual Identity Prompt)
                                        <span className="text-[10px] text-slate-500 normal-case">该片段将用于锁定模特长相</span>
                                    </label>
                                    <textarea
                                        value={selectedModel.visual_identity}
                                        onChange={(e) => handleUpdateModel(selectedId, { visual_identity: e.target.value })}
                                        rows={4}
                                        className="w-full bg-blue-950/20 border border-blue-500/20 rounded-lg px-4 py-2.5 outline-none font-mono text-xs text-blue-200 leading-relaxed custom-scrollbar"
                                    />
                                    {selectedModel.lastInterrogationResult?.visual_description && (
                                        <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/10 text-[10px] text-slate-400 italic">
                                            AI 特征捕获综述: {selectedModel.lastInterrogationResult.visual_description}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-96 text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl">
                        <User className="w-12 h-12 mb-4 opacity-20" />
                        <p className="italic">从左侧选择一个模特预设开始编辑特征</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModelEditor;
