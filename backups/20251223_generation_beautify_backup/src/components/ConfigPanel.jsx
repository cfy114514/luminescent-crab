import React, { useState } from 'react';
import { Layers, Eraser, Settings, ChevronDown, ChevronUp, User, Camera, Sparkles } from 'lucide-react';

const ConfigPanel = ({ config, setConfig, presets }) => {
    const [isModelExpanded, setIsModelExpanded] = useState(true);

    const handleChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="w-full glass-panel rounded-2xl p-6 space-y-6 mt-6">
            <h3 className="text-xl font-semibold text-white flex items-center mb-4">
                <span className="w-1 h-6 bg-purple-500 rounded-full mr-3" />
                抠图设置 (Cutout Settings)
            </h3>

            {/* Product Category Selection */}
            <div className="space-y-2 pb-4 border-b border-slate-700/50">
                <label htmlFor="category-select" className="text-sm text-emerald-400 flex items-center gap-2 font-medium">
                    <Layers className="w-4 h-4" /> 产品品类 (Product Category)
                </label>
                <select
                    id="category-select"
                    name="categoryId"
                    value={config.categoryId || ''}
                    onChange={(e) => handleChange('categoryId', e.target.value)}
                    className="w-full bg-slate-900/50 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-mono"
                >
                    {presets?.productCategories?.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
                {config.categoryId && (() => {
                    const activeCat = presets?.productCategories?.find(c => c.id === config.categoryId);
                    return activeCat ? (
                        <p className="text-[10px] text-slate-500 mt-1 italic">
                            * {activeCat.description}
                        </p>
                    ) : null;
                })()}
            </div>

            {/* Model Selection (Full Restore) */}
            <div className="space-y-4 pb-4 border-b border-slate-700/50">
                <div
                    className="flex justify-between items-center cursor-pointer group"
                    onClick={() => setIsModelExpanded(!isModelExpanded)}
                >
                    <label className="text-sm text-purple-400 flex items-center gap-2 font-medium cursor-pointer">
                        <User className="w-4 h-4" /> 模特设置 (Model Settings)
                    </label>
                    <div className="p-1 rounded-full hover:bg-slate-800 transition-colors">
                        {isModelExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-white" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white" />
                        )}
                    </div>
                </div>

                {isModelExpanded && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* AI Model Engine */}
                        <div className="space-y-2">
                            <label className="text-xs text-slate-400">生成模型 (Engine)</label>
                            <select
                                name="model"
                                value={config.model}
                                onChange={(e) => handleChange('model', e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
                            >
                                <option value="gemini-2.5-flash-image">Gemini 2.5 Flash (Default)</option>
                                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                                <option value="gemini-3-pro-image-preview">Gemini 3 Pro (Image Preview)</option>
                            </select>
                        </div>

                        {/* Model Preset Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <button
                                onClick={() => handleChange('modelId', '')}
                                className={`
                                    relative p-2 rounded-lg border text-left transition-all group overflow-hidden
                                    ${!config.modelId
                                        ? 'bg-purple-500/20 border-purple-500 ring-1 ring-purple-500'
                                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}
                                `}
                            >
                                <div className="text-xs font-medium text-white mb-1">无模特</div>
                                <div className="text-[10px] text-slate-400">纯产品图</div>
                            </button>

                            {presets?.models?.map(model => (
                                <button
                                    key={model.id}
                                    onClick={() => handleChange('modelId', model.id)}
                                    className={`
                                        relative p-2 rounded-lg border text-left transition-all group overflow-hidden
                                        ${config.modelId === model.id
                                            ? 'bg-purple-500/20 border-purple-500 ring-1 ring-purple-500'
                                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}
                                    `}
                                >
                                    <div className="text-xs font-medium text-white mb-1">{model.name}</div>
                                    <div className="text-[10px] text-slate-400 truncate">{model.gender} / {model.ethnicity}</div>
                                </button>
                            ))}
                        </div>


                    </div>
                )}
            </div>


            {/* Creativity / Fidelity Control */}
            <div className="space-y-3 pb-4 border-b border-slate-700/50">
                <div className="flex justify-between items-center">
                    <label className="text-sm text-pink-400 flex items-center gap-2 font-medium">
                        <Sparkles className="w-4 h-4" /> 创造力 (Creativity)
                    </label>
                    <span className="text-xs text-pink-300 font-mono bg-pink-500/10 px-2 py-0.5 rounded">
                        {config.creativity || 20}%
                    </span>
                </div>

                <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={config.creativity !== undefined ? config.creativity : 20}
                    onChange={(e) => handleChange('creativity', parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                />

                <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>STRICT (0%)</span>
                    <span>BALANCED (50%)</span>
                    <span>WILD (100%)</span>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                    * Low: Fixes wrinkles/lighting but locks geometry.<br />
                    * High: Invents new details and angles.
                </p>
            </div>





            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                    <Eraser className="w-5 h-5 text-blue-400 mt-1" />
                    <div>
                        <h4 className="text-sm font-bold text-blue-300">智能抠图模式 (Smart Cutout)</h4>
                        <p className="text-xs text-blue-200/70 mt-1">
                            Current Mode: <b>High Precision Extraction</b>. <br />
                            AI will extract the subject matching the selected category. Background will be removed.
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ConfigPanel;
