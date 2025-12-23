import React, { useState } from 'react';
import { Save, Trash2, Plus, Info, Tag, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { interrogateImages } from '../../services/api';
import UploadZone from '../UploadZone';

const CategoryEditor = ({ presets, onSave }) => {
    const [localPresets, setLocalPresets] = useState(presets.productCategories || []);
    const [selectedId, setSelectedId] = useState(localPresets[0]?.id || null);
    const [isInterrogating, setIsInterrogating] = useState(false);
    const [interrogationRefImages, setInterrogationRefImages] = useState([]);

    const selectedCategory = localPresets.find(p => p.id === selectedId);

    const handleUpdateCategory = (id, updates) => {
        setLocalPresets(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const handleAddCategory = () => {
        const newCategory = {
            id: `cat_${Date.now()}`,
            name: 'New Category (新分类)',
            description: 'Description of the product type...',
            promptConstraint: 'Constraint to ensure structure...'
        };
        setLocalPresets([...localPresets, newCategory]);
        setSelectedId(newCategory.id);
    };

    const handleRemoveCategory = (id) => {
        setLocalPresets(prev => prev.filter(p => p.id !== id));
        if (selectedId === id) setSelectedId(localPresets[0]?.id || null);
    };

    const handleRunInterrogation = async () => {
        if (interrogationRefImages.length === 0) {
            alert("请先上传参考图进行分类结构分析");
            return;
        }

        setIsInterrogating(true);
        try {
            // Pass the category name as context
            const result = await interrogateImages(interrogationRefImages, 'product_category', selectedCategory.name);
            if (result.promptConstraint) {
                handleUpdateCategory(selectedId, {
                    promptConstraint: result.promptConstraint,
                    lastInterrogationResult: result
                });
            }
        } catch (err) {
            console.error("Interrogation failed:", err);
            alert("结构分析失败: " + err.message);
        } finally {
            setIsInterrogating(false);
        }
    };

    const handleSaveAll = () => {
        onSave({ ...presets, productCategories: localPresets });
        alert("分类预设已保存 (Categories saved)");
    };

    return (
        <div className="grid grid-cols-12 gap-8 h-full">
            {/* List */}
            <div className="col-span-4 border-r border-white/5 pr-6 space-y-3">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">分类列表</h3>
                    <button
                        onClick={handleAddCategory}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-emerald-400 transition-colors"
                        title="Add Category"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                {localPresets.map(cat => (
                    <div
                        key={cat.id}
                        onClick={() => setSelectedId(cat.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all group relative cursor-pointer border ${selectedId === cat.id ? 'bg-emerald-500/10 border-emerald-500/30 text-white shadow-lg shadow-emerald-500/5' : 'hover:bg-white/5 border-transparent text-slate-400'}`}
                    >
                        <div className="font-bold flex items-center gap-2">
                            <Tag className="w-3 h-3" />
                            {cat.name}
                        </div>
                        <div className="text-[10px] opacity-50 mt-1 truncate max-w-[80%]">{cat.description}</div>

                        {/* Independent Delete Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('确定要删除此分类吗？')) {
                                    handleRemoveCategory(cat.id);
                                }
                            }}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 ${selectedId === cat.id ? 'text-slate-400' : ''}`}
                            title="Delete Category"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                <div className="pt-6">
                    <button
                        onClick={handleSaveAll}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                    >
                        <Save className="w-5 h-5" />
                        保存更改
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="col-span-8 space-y-6">
                {selectedCategory ? (
                    <>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">分类名称 (Name)</label>
                                <input
                                    type="text"
                                    value={selectedCategory.name}
                                    onChange={(e) => handleUpdateCategory(selectedId, { name: e.target.value })}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">描述信息 (Description)</label>
                                <input
                                    type="text"
                                    value={selectedCategory.description}
                                    onChange={(e) => handleUpdateCategory(selectedId, { description: e.target.value })}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                    结构约束 (Prompt Constraint)
                                    <span className="text-[10px] text-slate-600 flex items-center gap-1">
                                        <Info className="w-3 h-3" /> 定义该品类的核心结构要求
                                    </span>
                                </label>
                                <textarea
                                    value={selectedCategory.promptConstraint}
                                    onChange={(e) => handleUpdateCategory(selectedId, { promptConstraint: e.target.value })}
                                    rows={4}
                                    placeholder="例如：保持鞋底纹理清晰..."
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 font-mono text-sm transition-colors"
                                />
                            </div>
                        </div>

                        {/* Reverse Engineering Section */}
                        <div className="p-6 rounded-2xl bg-slate-800/20 border border-emerald-500/20 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-emerald-400" />
                                    <h4 className="font-semibold">分类结构逆向 (Category Structure Trace)</h4>
                                </div>
                                <button
                                    onClick={handleRunInterrogation}
                                    disabled={isInterrogating || interrogationRefImages.length === 0}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${isInterrogating || interrogationRefImages.length === 0 ? 'bg-slate-800 text-slate-500 opacity-50' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:scale-105'}`}
                                >
                                    {isInterrogating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            正在分析结构...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-4 h-4" />
                                            提取结构约束
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="text-xs text-slate-400">
                                <b>操作指引：</b>批量上传该品类（如“跑鞋”）的标准图，AI 将逆向分析其核心物理结构（鞋底、鞋面、鞋舌等），并自动生成 Prompt 约束。
                            </p>

                            <div className="h-48">
                                <UploadZone
                                    images={interrogationRefImages}
                                    onImagesChange={setInterrogationRefImages}
                                    isProcessing={isInterrogating}
                                />
                            </div>

                            {selectedCategory.lastInterrogationResult?.visual_description && (
                                <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10 text-[10px] text-emerald-200/80 italic">
                                    AI 分析结论: {selectedCategory.lastInterrogationResult.visual_description}
                                </div>
                            )}
                        </div>

                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 mt-8">
                            <div className="flex items-start gap-2 text-emerald-300/80 text-xs">
                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <p>
                                    <b>提示：</b> "结构约束" 将被注入到 System Prompt 中，用于指导 AI 保持产品的物理形态特征。
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 italic">
                        请从左侧选择或创建一个分类进行编辑
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryEditor;
