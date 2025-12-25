import React, { useState } from 'react';
import { Layers, Eraser, Settings, ChevronDown, ChevronUp, User, Camera, Sparkles, Loader2, Fingerprint } from 'lucide-react';
import SuperResolutionPanel from './SuperResolutionPanel';
import ModelDNAPanel from './ModelDNAPanel';

const ConfigPanel = ({ config, setConfig, presets, savePresets, styleReferenceImage, setStyleReferenceImage, outfitSuggestion, onAnalyzeStyle, isAnalyzing }) => {
    const [isModelExpanded, setIsModelExpanded] = useState(true);
    const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);

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

            {/* Resolution Selector */}
            <div className="space-y-2 pb-4 border-b border-slate-700/50">
                <label htmlFor="resolution-select" className="text-sm text-cyan-400 flex items-center gap-2 font-medium">
                    <Settings className="w-4 h-4" /> 输出分辨率 (Output Resolution)
                </label>
                <select
                    id="resolution-select"
                    name="imageSize"
                    value={config.imageSize || '2K'}
                    onChange={(e) => handleChange('imageSize', e.target.value)}
                    className="w-full bg-slate-900/50 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all font-mono"
                >
                    <option value="1K">1K (1024×1024)</option>
                    <option value="2K">2K (2048×2048) - 推荐</option>
                    <option value="4K">4K (4096×4096)</option>
                </select>
                <p className="text-[10px] text-slate-400 italic">
                    * 更高分辨率会提升细节，但生成时间更长
                </p>
            </div>

            {/* Style Reference Image Upload */}
            <div className="space-y-2 pb-4 border-b border-slate-700/50">
                <label className="text-sm text-amber-400 flex items-center gap-2 font-medium">
                    <Sparkles className="w-4 h-4" /> 服装风格参考 (Style Reference - Optional)
                </label>
                <p className="text-[10px] text-slate-400 italic">
                    上传风格参考图可覆盖AI的服装建议（Upload a style reference to override AI outfit suggestions）
                </p>

                {styleReferenceImage ? (
                    <div className="relative group">
                        <img
                            src={URL.createObjectURL(styleReferenceImage)}
                            alt="Style Reference"
                            className="w-full h-32 object-cover rounded-lg border border-amber-500/30"
                        />
                        <button
                            onClick={() => setStyleReferenceImage(null)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-full text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove"
                        >
                            <span className="text-xs">×</span>
                        </button>
                    </div>
                ) : (
                    <label className="block cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setStyleReferenceImage(e.target.files[0]);
                                }
                            }}
                        />
                        <div className="border-2 border-dashed border-slate-700 rounded-lg p-4 text-center hover:border-amber-500/50 hover:bg-slate-800/30 transition-all">
                            <Camera className="w-6 h-6 mx-auto mb-2 text-slate-500" />
                            <span className="text-xs text-slate-400">点击上传风格参考</span>
                        </div>
                    </label>
                )}

                {/* Manual Style Analysis Button */}
                <button
                    onClick={onAnalyzeStyle}
                    disabled={isAnalyzing}
                    className={`
                        w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2
                        ${isAnalyzing
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg hover:shadow-amber-500/25'
                        }
                    `}
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>分析中...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            <span>分析风格 (Analyze Style)</span>
                        </>
                    )}
                </button>

                {/* Show outfit suggestion if available */}
                {outfitSuggestion && (
                    <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2">
                        <div>
                            <div className="text-xs font-bold text-amber-300 mb-1">AI服装建议 (Outfit):</div>
                            <div className="text-[10px] text-amber-200/80">{outfitSuggestion.outfit_description}</div>
                        </div>

                        {/* New Identity Section */}
                        {outfitSuggestion.visual_identity && (
                            <div className="pt-2 border-t border-amber-500/20">
                                <div className="text-xs font-bold text-pink-300 mb-1">AI模特识别 (Identity):</div>
                                <div className="text-[10px] text-pink-200/80 mb-2">{outfitSuggestion.visual_identity}</div>
                                <div className="flex gap-2">
                                    <span className="text-[9px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded">
                                        {outfitSuggestion.predicted_gender}
                                    </span>
                                    <span className="text-[9px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded">
                                        {outfitSuggestion.predicted_ethnicity}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        const updates = {};
                                        if (outfitSuggestion.outfit_description) updates.clothing = outfitSuggestion.outfit_description;
                                        if (outfitSuggestion.predicted_gender && outfitSuggestion.predicted_gender !== 'null') updates.gender = outfitSuggestion.predicted_gender;
                                        if (outfitSuggestion.predicted_ethnicity && outfitSuggestion.predicted_ethnicity !== 'null') updates.ethnicity = outfitSuggestion.predicted_ethnicity;
                                        updates.modelId = ''; // Switch to custom

                                        // Update parent config
                                        Object.entries(updates).forEach(([key, val]) => handleChange(key, val));
                                        alert("已应用 AI 分析的服装与模特特征");
                                    }}
                                    className="mt-2 w-full py-1 bg-gradient-to-r from-amber-600 to-pink-600 hover:from-amber-500 hover:to-pink-500 text-white text-[10px] font-bold rounded shadow transition-all"
                                >
                                    应用建议 (Apply All)
                                </button>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-1 mt-2">
                            {outfitSuggestion.style_keywords?.slice(0, 3).map((keyword, idx) => (
                                <span key={idx} className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
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
                        {/* Model DNA Extraction Block */}
                        <ModelDNAPanel config={config} setConfig={setConfig} />

                        {/* Aspect Ratio & Engine */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400">比例 (Ratio)</label>
                                <select
                                    name="aspect_ratio"
                                    value={config.aspect_ratio || '1:1'}
                                    onChange={(e) => handleChange('aspect_ratio', e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
                                >
                                    <option value="1:1">1:1 (Square)</option>
                                    <option value="3:4">3:4 (Portrait)</option>
                                    <option value="4:3">4:3 (Landscape)</option>
                                    <option value="9:16">9:16 (Story)</option>
                                    <option value="16:9">16:9 (Cinema)</option>
                                </select>
                            </div>
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
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="text-xs font-medium text-white">{model.name}</div>
                                        {model.templateImage && (
                                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded border border-emerald-500/30" title="Uses fixed template base">
                                                底图
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">{model.gender} / {model.ethnicity}</div>
                                </button>
                            ))}
                        </div>

                        {/* Template Mode Indicator */}
                        {(() => {
                            const activeModel = presets?.models?.find(m => m.id === config.modelId);
                            if (activeModel?.templateImage) {
                                return (
                                    <div className="text-[10px] bg-emerald-900/20 border border-emerald-500/20 text-emerald-300 p-2 rounded-lg flex gap-2 items-center">
                                        <Camera className="w-3 h-3 flex-shrink-0" />
                                        <span>
                                            <b>模板底图模式已激活:</b> 将使用预设的 {activeModel.name} 底图（A图），仅替换帽子并重绘面部。身体与背景保持不变。
                                        </span>
                                    </div>
                                );
                            }
                        })()}




                        {/* --- Custom Model Attributes (New) --- */}
                        <div className="pt-2 border-t border-slate-700/50 space-y-3">
                            <label className="text-xs font-bold text-indigo-400">
                                自定义详细特征 (Custom Attributes)
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Gender */}
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400">性别 (Gender)</label>
                                    <select
                                        value={config.gender || 'female'}
                                        onChange={(e) => {
                                            handleChange('gender', e.target.value);
                                            handleChange('modelId', ''); // Disable preset
                                        }}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                                    >
                                        <option value="female">Woman (女性)</option>
                                        <option value="male">Man (男性)</option>
                                        <option value="girl">Girl (女孩)</option>
                                        <option value="boy">Boy (男孩)</option>
                                    </select>
                                </div>

                                {/* Ethnicity */}
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400">人种 (Ethnicity)</label>
                                    <select
                                        value={config.ethnicity || 'asian'}
                                        onChange={(e) => {
                                            handleChange('ethnicity', e.target.value);
                                            handleChange('modelId', ''); // Disable preset
                                        }}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                                    >
                                        <option value="asian">Asian (亚洲)</option>
                                        <option value="caucasian">Caucasian (高加索/欧美)</option>
                                        <option value="black">Black/African (黑人)</option>
                                        <option value="hispanic">Hispanic (拉丁裔)</option>
                                        <option value="indian">Indian (印度裔)</option>
                                        <option value="middle_eastern">Middle Eastern (中东)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Clothing Style */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-400 flex justify-between">
                                    <span>服装风格 (Clothing Style)</span>
                                    {config.modelId === '' && <span className="text-indigo-400">* Custom Active</span>}
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. White linen shirt, Professional Studio"
                                    value={config.clothing || ''}
                                    onChange={(e) => {
                                        handleChange('clothing', e.target.value);
                                        handleChange('modelId', ''); // Disable preset
                                    }}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                                <p className="text-[9px] text-slate-500">
                                    输入自定义服装描述，或使用上方"风格分析"自动填充。
                                </p>
                            </div>

                            {/* Save Preset UI */}
                            {config.modelId === '' && (
                                <div className="pt-2 flex gap-2">
                                    <input
                                        type="text"
                                        id="new-preset-name"
                                        placeholder="Preset Name..."
                                        className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                                    />
                                    <button
                                        onClick={() => {
                                            const name = document.getElementById('new-preset-name').value;
                                            if (!name) return alert("Please enter a preset name");

                                            // Construct new preset object
                                            const newModel = {
                                                id: `custom_${Date.now()}`,
                                                name: name,
                                                gender: config.gender,
                                                ethnicity: config.ethnicity,
                                                visual_identity: `${config.ethnicity} ${config.gender} model, ${config.clothing || 'minimalist outfit'}`,
                                                clothing: config.clothing // Helper for UI restoration
                                            };

                                            // Update Presets
                                            const updatedModels = [...(presets.models || []), newModel];
                                            const newPresets = { ...presets, models: updatedModels };

                                            // Save
                                            savePresets(newPresets);

                                            // Auto-select
                                            handleChange('modelId', newModel.id);
                                            alert(`Saved preset: ${name}`);
                                        }}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors font-medium"
                                    >
                                        保存预设
                                    </button>
                                </div>
                            )}

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





            {/* Advanced Features Section */}
            <div className="space-y-2 pb-4 border-b border-slate-700/50">
                <button
                    onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                    className="w-full flex items-center justify-between text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
                >
                    <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <span>高级功能 (Advanced Features)</span>
                    </div>
                    {isAdvancedExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isAdvancedExpanded && (
                    <div className="mt-4 p-4 bg-slate-900/30 rounded-lg border border-purple-500/20">
                        <SuperResolutionPanel config={config} />
                    </div>
                )}
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
