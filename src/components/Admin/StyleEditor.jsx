import React, { useState } from 'react';
import { Sparkles, Save, Trash2, Plus, Info, Loader2, Wand2 } from 'lucide-react';
import { interrogateImages, mergePrompts } from '../../services/api';
import UploadZone from '../UploadZone';

const StyleEditor = ({ presets, onSave }) => {
    const [localPresets, setLocalPresets] = useState(presets?.styles || []);
    const [selectedId, setSelectedId] = useState(localPresets[0]?.id || null);
    const [isInterrogating, setIsInterrogating] = useState(false);
    const [interrogationRefImages, setInterrogationRefImages] = useState([]);

    const selectedStyle = localPresets.find(p => p.id === selectedId);

    const handleUpdateStyle = (id, updates) => {
        setLocalPresets(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const handleAddStyle = () => {
        const newStyle = {
            id: `style_${Date.now()}`,
            name: 'New Style (新风格)',
            description: 'Provide a description...',
            basePrompt: 'Describe the core logic...',
            interrogatedPrompt: '',
            referenceImages: []
        };
        setLocalPresets([...localPresets, newStyle]);
        setSelectedId(newStyle.id);
    };

    const handleRemoveStyle = (id) => {
        setLocalPresets(prev => prev.filter(p => p.id !== id));
        if (selectedId === id) setSelectedId(localPresets[0]?.id || null);
    };

    const handleRunInterrogation = async () => {
        if (interrogationRefImages.length === 0) {
            alert("请先上传参考图进行逆向工程 (Please upload reference images first)");
            return;
        }

        setIsInterrogating(true);
        try {
            const result = await interrogateImages(interrogationRefImages);
            if (result.reverse_prompt_fragment) {
                handleUpdateStyle(selectedId, {
                    interrogatedPrompt: result.reverse_prompt_fragment,
                    lastInterrogationResult: result
                });
            }
        } catch (err) {
            console.error("Interrogation failed:", err);
            alert("逆向生成提示词失败: " + err.message);
        } finally {
            setIsInterrogating(false);
        }
    };

    const handleSaveAll = () => {
        onSave({ ...presets, styles: localPresets });
        alert("预设已成功保存到本地 (Presets saved successfully)");
    };

    return (
        <div className="grid grid-cols-12 gap-8 h-full">
            {/* List */}
            <div className="col-span-4 border-r border-white/5 pr-6 space-y-3">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">风格列表</h3>
                    <button
                        onClick={handleAddStyle}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-purple-400 transition-colors"
                        title="Add Style"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                {localPresets.map(style => (
                    <div
                        key={style.id}
                        onClick={() => setSelectedId(style.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all group relative cursor-pointer border ${selectedId === style.id ? 'bg-purple-500/10 border-purple-500/30 text-white shadow-lg shadow-purple-500/5' : 'hover:bg-white/5 border-transparent text-slate-400'}`}
                    >
                        <div className="font-bold">{style.name}</div>
                        <div className="text-[10px] opacity-50 mt-1 truncate max-w-[80%]">{style.description}</div>

                        {/* Independent Delete Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('确定要删除此风格预设吗？')) {
                                    handleRemoveStyle(style.id);
                                }
                            }}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 ${selectedId === style.id ? 'text-slate-400' : ''}`}
                            title="Delete Style"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                <div className="pt-6">
                    <button
                        onClick={handleSaveAll}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
                    >
                        <Save className="w-5 h-5" />
                        应用并保存所有更改
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="col-span-8 space-y-6">
                {selectedStyle ? (
                    <>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">风格名称</label>
                                    <input
                                        type="text"
                                        value={selectedStyle.name}
                                        onChange={(e) => handleUpdateStyle(selectedId, { name: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">描述信息</label>
                                    <input
                                        type="text"
                                        value={selectedStyle.description}
                                        onChange={(e) => handleUpdateStyle(selectedId, { description: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                    基础提示词 (Base Logic)
                                    <span className="text-[10px] text-slate-600 flex items-center gap-1">
                                        <Info className="w-3 h-3" /> 定义该风格的核心逻辑
                                    </span>
                                </label>
                                <textarea
                                    value={selectedStyle.basePrompt}
                                    onChange={(e) => handleUpdateStyle(selectedId, { basePrompt: e.target.value })}
                                    rows={3}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-purple-500 font-mono text-sm transition-colors"
                                />
                            </div>
                        </div>

                        {/* Reverse Engineering Section */}
                        <div className="p-6 rounded-2xl bg-slate-800/20 border border-purple-500/20 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    <h4 className="font-semibold">风格逆向工程 (Visual Reverse Engineering)</h4>
                                </div>
                                <button
                                    onClick={handleRunInterrogation}
                                    disabled={isInterrogating || interrogationRefImages.length === 0}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${isInterrogating || interrogationRefImages.length === 0 ? 'bg-slate-800 text-slate-500 opacity-50' : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 hover:scale-105'}`}
                                >
                                    {isInterrogating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            正在逆向解构中...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-4 h-4" />
                                            逆向输出内容提示词
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="text-xs text-slate-400">
                                <b>操作指引：</b>批量上传该风格的参考图，AI 将根据这些图片逆向提取其光影、材质和艺术特征。
                            </p>

                            <div className="h-48">
                                <UploadZone
                                    images={interrogationRefImages}
                                    onImagesChange={setInterrogationRefImages}
                                    isProcessing={isInterrogating}
                                />
                            </div>

                            {selectedStyle.interrogatedPrompt && (
                                <div className="space-y-2 mt-4">
                                    <label className="text-xs font-medium text-purple-400 uppercase tracking-widest">逆向生成的提示词片段 (Output Fragment)</label>
                                    <div className="relative group">
                                        <textarea
                                            value={selectedStyle.interrogatedPrompt}
                                            onChange={(e) => handleUpdateStyle(selectedId, { interrogatedPrompt: e.target.value })}
                                            rows={2}
                                            className="w-full bg-purple-500/5 border border-purple-500/30 rounded-lg px-4 py-2.5 outline-none font-mono text-xs text-purple-200"
                                        />
                                        {selectedStyle.lastInterrogationResult?.visual_description && (
                                            <div className="mt-2 text-[10px] text-slate-500 italic">
                                                AI 分析结论: {selectedStyle.lastInterrogationResult.visual_description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Final Prompt Preview */}
                        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                            <label className="text-[10px] font-bold text-green-500 uppercase tracking-[0.2em] mb-2 block">最终合并预览 (User Mode Merge Preview)</label>
                            <div className="text-xs text-slate-300 font-mono leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                                {mergePrompts(selectedStyle.basePrompt, selectedStyle.interrogatedPrompt)}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 italic">
                        请从左侧选择或创建一个风格进行编辑
                    </div>
                )}
            </div>
        </div>
    );
};

export default StyleEditor;
