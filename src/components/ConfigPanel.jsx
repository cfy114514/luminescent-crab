import React from 'react';
import { motion } from 'framer-motion';
import { User2, MapPin, Shirt, Palette, Layers, Sparkles, Wand2, Info } from 'lucide-react';

const ConfigPanel = ({ config, setConfig, onAnalyze, isAnalyzing, presets }) => {
    const handleChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="w-full glass-panel rounded-2xl p-6 space-y-6 mt-6">
            <h3 className="text-xl font-semibold text-white flex items-center mb-4">
                <span className="w-1 h-6 bg-purple-500 rounded-full mr-3" />
                参数设置
            </h3>

            {/* Model Selection */}
            <div className="space-y-2 pb-4 border-b border-slate-700/50">
                <label htmlFor="model-select" className="text-sm text-green-400 flex items-center gap-2 font-medium">
                    <Sparkles className="w-4 h-4" /> 生成模型 (AI Model)
                </label>
                <select
                    id="model-select"
                    name="model"
                    title="Select AI Model"
                    value={config.model || 'gemini-2.5-flash-image'}
                    onChange={(e) => handleChange('model', e.target.value)}
                    className="w-full bg-slate-900/50 border border-green-500/30 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-green-500/50 outline-none transition-all font-mono"
                >
                    <option value="gemini-2.5-flash-image">Gemini 2.5 Flash (Standard - Fast)</option>
                    <option value="gemini-3-pro-image-preview">Gemini 3.0 Pro (Preview - High Quality)</option>
                </select>
                <p className="text-xs text-slate-500">
                    * 3.0 Pro 处于预览阶段，可能生成较慢，但细节更丰富。
                </p>
            </div>


            {/* Style Selection (New) */}
            <div className="space-y-3 pb-6 border-b border-slate-700/50">
                <label className="text-sm text-purple-400 flex items-center gap-2 font-medium">
                    <Wand2 className="w-4 h-4" /> 风格选择 (Style Preset)
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {presets?.styles?.map(style => (
                        <button
                            key={style.id}
                            onClick={() => handleChange('styleId', style.id)}
                            className={`
                                relative p-3 rounded-xl border text-left transition-all group overflow-hidden
                                ${config.styleId === style.id
                                    ? 'bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/10'
                                    : 'bg-slate-900/40 border-slate-700 hover:border-slate-500'}
                            `}
                        >
                            <div className={`text-xs font-bold ${config.styleId === style.id ? 'text-white' : 'text-slate-300'}`}>
                                {style.name}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 line-clamp-1 group-hover:line-clamp-none transition-all">
                                {style.description}
                            </div>
                            {config.styleId === style.id && (
                                <div className="absolute top-1 right-1">
                                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                                </div>
                            )}
                        </button>
                    ))}
                    <button
                        onClick={() => handleChange('styleId', null)}
                        className={`
                            p-3 rounded-xl border text-center transition-all
                            ${!config.styleId
                                ? 'bg-slate-700 border-slate-500 text-white'
                                : 'bg-slate-900/40 border-slate-700 text-slate-500 hover:text-slate-300'}
                        `}
                    >
                        <div className="text-xs font-bold">无预设 (None)</div>
                    </button>
                </div>
                {config.styleId && (
                    <div className="p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/10 flex items-start gap-2">
                        <Info className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-purple-300/70 leading-relaxed italic">
                            已自动应用“{presets.styles.find(s => s.id === config.styleId)?.name}”提示词合并逻辑。
                        </p>
                    </div>
                )}
            </div>

            {/* View Selection Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Spec Toggle Group */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-full text-blue-400">
                                <Layers className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">产品规范套图</p>
                                <p className="text-xs text-slate-400">选择需要生成的标准视角</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer" title="Toggle Product Views">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={config.includeProductViews}
                                onChange={(e) => handleChange('includeProductViews', e.target.checked)}
                                aria-label="Toggle Product Spec Views"
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Sub-Selection Grid */}
                    {config.includeProductViews && config.viewSelection && (
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-blue-500/20 pl-1">
                            {[
                                { k: 'front', l: '正面 (Front)' },
                                { k: 'angle_front', l: '斜侧 (Angle)' },
                                { k: 'back', l: '背面 (Back)' },
                                { k: 'top', l: '顶视 (Top)' },
                                { k: 'inside', l: '内饰 (Inside)' },
                                { k: 'detail', l: '细节 (Detail)' }
                            ].map(item => (
                                <label key={item.k} className="flex items-center space-x-2 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${config.viewSelection[item.k] ? 'bg-blue-500 border-blue-500' : 'border-slate-600 bg-slate-800'}`}>
                                        {config.viewSelection[item.k] && <div className="w-2 h-2 bg-white rounded-sm" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={config.viewSelection[item.k]}
                                        onChange={(e) => {
                                            const newSelection = { ...config.viewSelection, [item.k]: e.target.checked };
                                            handleChange('viewSelection', newSelection);
                                        }}
                                        aria-label={`Select ${item.l}`}
                                    />
                                    <span className={`text-xs ${config.viewSelection[item.k] ? 'text-blue-200' : 'text-slate-500'} group-hover:text-blue-300 transition-colors`}>
                                        {item.l}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Model View Toggle Group */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-full text-purple-400">
                                <User2 className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">模特展示图</p>
                                <p className="text-xs text-slate-400">选择需要生成的模特视角</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer" title="Toggle Model Views">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={config.includeModelView}
                                onChange={(e) => handleChange('includeModelView', e.target.checked)}
                                aria-label="Toggle Model Views"
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    {/* Sub-Selection Grid (New) */}
                    {config.includeModelView && config.modelViewSelection && (
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-purple-500/20 pl-1">
                            {[
                                { k: 'model_front', l: '正面 (Front)' },
                                { k: 'model_angle', l: '斜侧 (Angle)' },
                                { k: 'model_side', l: '侧面 (Side)' },
                                { k: 'model_back', l: '背面 (Back)' },
                                { k: 'model_lifestyle_hat', l: '生活-手扶帽檐' },
                                { k: 'model_lifestyle_smile', l: '生活-低头微笑' },
                                { k: 'model_lifestyle_backlook', l: '生活-回头侧望' },
                                { k: 'model_lifestyle_sitting', l: '生活-坐姿造型' }
                            ].map(item => (
                                <label key={item.k} className="flex items-center space-x-2 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${config.modelViewSelection[item.k] ? 'bg-purple-500 border-purple-500' : 'border-slate-600 bg-slate-800'}`}>
                                        {config.modelViewSelection[item.k] && <div className="w-2 h-2 bg-white rounded-sm" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={config.modelViewSelection[item.k]}
                                        onChange={(e) => {
                                            const newSelection = { ...config.modelViewSelection, [item.k]: e.target.checked };
                                            handleChange('modelViewSelection', newSelection);
                                        }}
                                        aria-label={`Select ${item.l}`}
                                    />
                                    <span className={`text-xs ${config.modelViewSelection[item.k] ? 'text-purple-200' : 'text-slate-500'} group-hover:text-purple-300 transition-colors`}>
                                        {item.l}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Model Identity Preset */}
            <div className="md:col-span-2 space-y-2">
                <label htmlFor="model-preset-select" className="text-sm text-slate-400 flex items-center gap-2">
                    <User2 className="w-4 h-4" /> 预设模特身份 (Named Model)
                </label>
                <select
                    id="model-preset-select"
                    name="modelId"
                    value={config.modelId || ''}
                    onChange={(e) => {
                        const val = e.target.value;
                        handleChange('modelId', val);
                    }}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                >
                    <option value="">-- 手动配置 (Manual) --</option>
                    {presets?.models?.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
                {config.modelId && (
                    <p className="text-[10px] text-purple-400 italic">
                        * 已应用预设模特：基础人种/性别选项已锁定以维持肖像一致性。
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ethnicity */}
                <div className="space-y-2">
                    <label htmlFor="ethnicity-select" className="text-sm text-slate-400 flex items-center gap-2">
                        <User2 className={`w-4 h-4 ${config.modelId ? 'opacity-30' : ''}`} />
                        <span className={config.modelId ? 'opacity-30' : ''}>模特人种</span>
                    </label>
                    <select
                        id="ethnicity-select"
                        name="ethnicity"
                        disabled={!!config.modelId}
                        value={config.ethnicity}
                        onChange={(e) => {
                            handleChange('ethnicity', e.target.value);
                            if (config.modelId) handleChange('modelId', '');
                        }}
                        className={`w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all ${config.modelId ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                        <option value="asian">亚洲 (Asian)</option>
                        <option value="caucasian">欧美 (Caucasian)</option>
                        <option value="african">非洲 (African)</option>
                        <option value="latino">拉丁 (Latino)</option>
                        <option value="middle_eastern">中东 (Middle Eastern)</option>
                    </select>
                </div>

                {/* Gender */}
                <div className="space-y-2">
                    <label htmlFor="gender-select" className="text-sm text-slate-400 flex items-center gap-2">
                        <User2 className={`w-4 h-4 ${config.modelId ? 'opacity-30' : ''}`} />
                        <span className={config.modelId ? 'opacity-30' : ''}>性别</span>
                    </label>
                    <select
                        id="gender-select"
                        name="gender"
                        disabled={!!config.modelId}
                        value={config.gender}
                        onChange={(e) => {
                            handleChange('gender', e.target.value);
                            if (config.modelId) handleChange('modelId', '');
                        }}
                        className={`w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all ${config.modelId ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                        <option value="female">女性 (Female)</option>
                        <option value="male">男性 (Male)</option>
                    </select>
                </div>
            </div>

            {/* Scene */}
            <div className="space-y-2">
                <label htmlFor="scene-input" className="text-sm text-slate-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> 场景 / 背景
                </label>
                <div className="relative">
                    <input
                        id="scene-input"
                        name="scene"
                        type="text"
                        list="scene-options"
                        value={config.scene || ''}
                        onChange={(e) => handleChange('scene', e.target.value)}
                        placeholder="选择预设或手动输入 (Select or Type)..."
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                        aria-label="Scene Selection"
                    />
                    <datalist id="scene-options">
                        <option value="Minimalist Concrete Studio (极简水泥风)" />
                        <option value="Modern Living Room (现代客厅)" />
                        <option value="Sunny Beach (阳光沙滩)" />
                        <option value="Urban Street (城市街头)" />
                        <option value="Lush Park (自然公园)" />
                        <option value="Luxury Boutique (高级精品店)" />
                        <option value="Pure White Background (纯白背景)" />
                    </datalist>
                </div>
            </div>

            {/* Target Color (Palette) */}
            <div className="space-y-2">
                <label htmlFor="target-color-input" className="text-sm text-slate-400 flex items-center gap-2">
                    <Palette className="w-4 h-4" /> 产品色调 (Target Color)
                </label>
                <div className="flex gap-3">
                    <div className="relative w-12 h-10 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-700 hover:border-blue-500 transition-colors">
                        <input
                            id="target-color-picker"
                            name="targetColorPicker"
                            type="color"
                            value={config.targetColor || '#ffffff'}
                            onChange={(e) => handleChange('targetColor', e.target.value)}
                            className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                            title="Pick Target Color"
                            aria-label="Pick Target Color"
                        />
                    </div>
                    <input
                        id="target-color-input"
                        name="targetColor"
                        type="text"
                        value={config.targetColor || ''}
                        onChange={(e) => handleChange('targetColor', e.target.value)}
                        placeholder="#FFFFFF or Red"
                        className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-mono uppercase"
                    />
                </div>
                <p className="text-[10px] text-slate-500">* 指令AI将产品材质重新染色为指定颜色 (保持原有纹理)</p>
            </div>

            {/* Clothing */}
            <div className="space-y-2">
                <label htmlFor="clothing-input" className="text-sm text-slate-400 flex items-center gap-2">
                    <Shirt className="w-4 h-4" /> 服装风格
                </label>
                <input
                    id="clothing-input"
                    name="clothing"
                    type="text"
                    list="clothing-options"
                    value={config.clothing || ''}
                    onChange={(e) => handleChange('clothing', e.target.value)}
                    placeholder="选择预设或手动输入..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    aria-label="Clothing Style"
                />
                <datalist id="clothing-options">
                    <option value="Casual Minimalist (休闲极简)" />
                    <option value="Smart Business (商务通勤)" />
                    <option value="Summer Vacation (度假风)" />
                    <option value="Streetwear (街头潮流)" />
                    <option value="Sportswear (运动风)" />
                    <option value="Elegant Evening (优雅晚装)" />
                </datalist>
            </div>

            {/* Hair Color */}
            <div className="space-y-2">
                <label htmlFor="hair-color-input" className="text-sm text-slate-400 flex items-center gap-2">
                    <Palette className="w-4 h-4" /> 发色
                </label>
                <input
                    id="hair-color-input"
                    name="hairColor"
                    type="text"
                    list="hair-options"
                    value={config.hairColor || ''}
                    onChange={(e) => handleChange('hairColor', e.target.value)}
                    placeholder="选择预设或手动输入..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    aria-label="Hair Color"
                />
                <datalist id="hair-options">
                    <option value="Dark Brown (深棕色)" />
                    <option value="Black (黑色)" />
                    <option value="Blonde (金发)" />
                    <option value="Redhead (红发)" />
                    <option value="Grey/Silver (银灰色)" />
                    <option value="Pink Dyed (粉色染发)" />
                    <option value="Blue Dyed (蓝色染发)" />
                </datalist>
            </div>

            {/* Manual Prompt Override */}
            <div className="space-y-2 pt-4 border-t border-slate-700/50">
                <label htmlFor="custom-prompt-input" className="text-sm text-purple-400 flex items-center gap-2 font-medium">
                    <Sparkles className="w-4 h-4" /> 附加提示词 (Custom Prompt)
                </label>
                <textarea
                    id="custom-prompt-input"
                    name="customPrompt"
                    value={config.customPrompt || ''}
                    onChange={(e) => handleChange('customPrompt', e.target.value)}
                    placeholder="在此输入额外的 Prompt 指令 (将在最后拼接到提示词中)... 例如: 'Add intense rim lighting', 'Make it look like a sketch'"
                    rows={3}
                    className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all resize-y text-xs font-mono"
                    aria-label="Custom Prompt Override"
                />
            </div>

            {/* Advanced Settings Section */}
            <div className="pt-4 border-t border-slate-700/50 space-y-4">
                <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-400 group-hover:text-white transition-colors">
                            <Layers className="w-4 h-4" /> 高级生成参数 (Advanced Settings)
                        </div>
                        <div className="text-slate-500 group-open:rotate-180 transition-transform">
                            <Layers className="w-4 h-4 ml-1 transform transition-transform" />
                        </div>
                    </summary>

                    <div className="mt-4 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Thinking Level */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-400" /> 思考深度 (Thinking Level)
                                </label>
                                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                                    {['low', 'high'].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => handleChange('thinkingLevel', level)}
                                            className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${config.thinkingLevel === level
                                                ? 'bg-blue-600 text-white shadow-lg'
                                                : 'text-slate-500 hover:text-slate-300'
                                                }`}
                                        >
                                            {level === 'high' ? 'HIGH (推荐)' : 'LOW'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                High模式下模型会进行深度逻辑推理，显著提升复杂指令的还原度和细节质量。
                            </p>
                        </div>

                        {/* Image Size & Aspect Ratio Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400">输出分辨率 (Image Size)</label>
                                <select
                                    value={config.imageSize || '1K'}
                                    onChange={(e) => handleChange('imageSize', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                >
                                    <option value="1K">1K (Standard)</option>
                                    <option value="2K">2K (High Def)</option>
                                    <option value="4K">4K (Ultra HD)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400">构图比例 (Aspect Ratio)</label>
                                <select
                                    value={config.aspect_ratio || '1:1'}
                                    onChange={(e) => handleChange('aspect_ratio', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                >
                                    <option value="1:1">1:1 (Square)</option>
                                    <option value="16:9">16:9 (Cinema)</option>
                                    <option value="9:16">9:16 (TikTik/Story)</option>
                                    <option value="4:3">4:3 (Classic)</option>
                                    <option value="3:4">3:4 (Portrait)</option>
                                    <option value="2:3">2:3 (Photo)</option>
                                    <option value="3:2">3:2 (Landscape)</option>
                                </select>
                            </div>
                        </div>

                        {/* Temperature Slider */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-400">创意发散度 (Temperature)</label>
                                <span className="text-[10px] font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                                    {config.temperature?.toFixed(1) || '1.0'}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.0"
                                max="2.0"
                                step="0.1"
                                value={config.temperature || 1.0}
                                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-[8px] text-slate-600 font-bold uppercase tracking-tighter">
                                <span>精确稳定 (Reliable)</span>
                                <span>默认 (Default)</span>
                                <span>充满变数 (Creative)</span>
                            </div>
                        </div>
                    </div>
                </details>
            </div>
        </div>
    );
};

export default ConfigPanel;
