import React from 'react';
import { motion } from 'framer-motion';
import { User2, MapPin, Shirt, Palette, Layers, Sparkles } from 'lucide-react';

const ConfigPanel = ({ config, setConfig, onAnalyze, isAnalyzing }) => {
    const handleChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="w-full glass-panel rounded-2xl p-6 space-y-6 mt-6">
            <h3 className="text-xl font-semibold text-white flex items-center mb-4">
                <span className="w-1 h-6 bg-purple-500 rounded-full mr-3" />
                参数设置
            </h3>

            {/* Feature Description (Moved to Top) */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm text-yellow-500/80 flex items-center gap-2 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> 产品特征描述 (关键 / JSON)
                    </label>
                    {onAnalyze && (
                        <button
                            onClick={onAnalyze}
                            disabled={isAnalyzing}
                            className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 transition-colors disabled:opacity-50"
                        >
                            {isAnalyzing ? (
                                <span className="animate-pulse">Analyzing...</span>
                            ) : (
                                <>
                                    <Sparkles className="w-3 h-3" />
                                    AI 智能分析
                                </>
                            )}
                        </button>
                    )}
                </div>
                <textarea
                    value={config.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="例如：Logo位于左侧（非居中），帽檐左边比右边宽... (或者粘贴 AI 分析的 JSON)"
                    rows={6}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-yellow-500/30 outline-none transition-all resize-y min-h-[120px] text-sm font-mono"
                />
                <p className="text-xs text-slate-500">* 用于纠正AI对非对称设计的偏差，请详细描述或使用 JSON。</p>
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
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={config.includeProductViews}
                                onChange={(e) => handleChange('includeProductViews', e.target.checked)}
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
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={config.includeModelView}
                                onChange={(e) => handleChange('includeModelView', e.target.checked)}
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
                                { k: 'model_lifestyle', l: '生活 (Lifestyle)' }
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ethnicity */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-400 flex items-center gap-2">
                        <User2 className="w-4 h-4" /> 模特人种
                    </label>
                    <select
                        value={config.ethnicity}
                        onChange={(e) => handleChange('ethnicity', e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
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
                    <label className="text-sm text-slate-400 flex items-center gap-2">
                        <User2 className="w-4 h-4" /> 性别
                    </label>
                    <select
                        value={config.gender}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    >
                        <option value="female">女性 (Female)</option>
                        <option value="male">男性 (Male)</option>
                    </select>
                </div>
            </div>

            {/* Scene */}
            <div className="space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> 场景 / 背景
                </label>
                <input
                    type="text"
                    value={config.scene}
                    onChange={(e) => handleChange('scene', e.target.value)}
                    placeholder="例如：现代客厅，阳光沙滩..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                />
            </div>

            {/* Clothing */}
            <div className="space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                    <Shirt className="w-4 h-4" /> 服装风格
                </label>
                <input
                    type="text"
                    value={config.clothing}
                    onChange={(e) => handleChange('clothing', e.target.value)}
                    placeholder="例如：休闲牛仔，正式西装..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                />
            </div>

            {/* Hair Color */}
            <div className="space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                    <Palette className="w-4 h-4" /> 发色
                </label>
                <input
                    type="text"
                    value={config.hairColor}
                    onChange={(e) => handleChange('hairColor', e.target.value)}
                    placeholder="例如：深棕色，金发..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                />
            </div>
        </div>
    );
};

export default ConfigPanel;
