import React, { useState, useEffect } from 'react';
import { Layers, ChevronDown, ChevronUp, Sparkles, Save, RefreshCw, Settings, Zap, Loader2 } from 'lucide-react';
import SuperResolutionPanel from './SuperResolutionPanel';
import PersonaManagementPanel from './PersonaManagementPanel';
import { DEFAULT_PERSONA_GROUPS } from '../services/core/prompts/engines/setB/defaultPersonas';

// Contexts
import { useConfig } from '../contexts/ConfigContext';
import { useGeneration } from '../contexts/GenerationContext';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';

// New Sub-components
import ModeSelector from './config/ModeSelector';
import GlobalTechnicalSettings from './config/GlobalTechnicalSettings';
import IdentitySettings from './config/IdentitySettings';
import VisualReferenceSettings from './config/VisualReferenceSettings';
import CompositorSettings from './config/CompositorSettings';

const ConfigPanel = () => {
    // 1. Consume Contexts
    const {
        config,
        setConfig,
        updateConfig,
        presets,
        savePresets, // Note: savePresets from userPresets hook is for local storage. 
        // ConfigPanel also has logic for server-side config. We'll keep that local to ConfigPanel for now or move to context later.
        styleReferenceImage,
        setStyleReferenceImage,
        outfitSuggestion,
        analyzeStyle,
        isAnalyzing,
        isDryRun,
        setIsDryRun
    } = useConfig();

    const {
        isProcessing,
        generateAll,
        viewImages
    } = useGeneration();

    const { activeTab } = useApp();
    const { addToast } = useToast();

    // Local UI State
    const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);
    const [serverPresets, setServerPresets] = useState({});
    const [availableApiKeys, setAvailableApiKeys] = useState({});
    const [newPresetName, setNewPresetName] = useState('');

    // Fetch Config on Mount (Legacy Server Config)
    // TODO: Move this into ConfigContext eventually
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/config');
                if (res.ok) {
                    const data = await res.json();
                    setAvailableApiKeys(data.apiKeys || {});
                    if (data.userConfig) {
                        const { presets: sPresets, apiKeySelection, customApiUrl, personaGroups } = data.userConfig;
                        if (sPresets) setServerPresets(sPresets);

                        setConfig(prev => ({
                            ...prev,
                            apiKeySelection: apiKeySelection || 'key1',
                            customApiUrl: customApiUrl || prev.customApiUrl,
                            personaGroups: personaGroups || DEFAULT_PERSONA_GROUPS
                        }));
                    } else {
                        setConfig(prev => ({ ...prev, personaGroups: DEFAULT_PERSONA_GROUPS }));
                    }
                }
            } catch (err) {
                console.error("Failed to load config:", err);
                setConfig(prev => ({ ...prev, personaGroups: DEFAULT_PERSONA_GROUPS }));
            }
        };
        fetchConfig();
    }, [setConfig]);

    const saveConfigToServer = async (newPresets, newApiKeySelection, newCustomApiUrl) => {
        try {
            const configToSave = {
                presets: newPresets !== undefined ? newPresets : serverPresets,
                apiKeySelection: newApiKeySelection !== undefined ? newApiKeySelection : config.apiKeySelection,
                customApiUrl: newCustomApiUrl !== undefined ? newCustomApiUrl : config.customApiUrl,
                personaGroups: config.personaGroups
            };

            await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configToSave)
            });
        } catch (err) {
            console.error("Failed to save config:", err);
        }
    };

    const handleChange = (key, value) => {
        updateConfig(key, value);
        if (key === 'apiKeySelection' || key === 'customApiUrl') {
            saveConfigToServer(undefined,
                key === 'apiKeySelection' ? value : undefined,
                key === 'customApiUrl' ? value : undefined
            );
        }
    };

    const handleSavePreset = () => {
        if (!newPresetName) return addToast("Please enter a preset name", "warning");

        const newPreset = {
            id: `custom_${Date.now()}`,
            name: newPresetName,
            ...config
        };

        const newPresets = { ...serverPresets, [newPresetName]: newPreset };
        setServerPresets(newPresets);
        saveConfigToServer(newPresets);
        setNewPresetName('');
        addToast(`Saved preset: ${newPresetName}`, "success");
    };

    const loadPreset = (name) => {
        const preset = serverPresets[name];
        if (preset) {
            setConfig(prev => ({ ...prev, ...preset }));
        }
    };

    return (
        <div className="w-full glass-panel rounded-[2rem] p-8 space-y-8 mt-6 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">

            {/* 1. Header & Mode Switch */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                    <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">配置面板</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-0.5">Studio Core v3.0 (核心版本)</p>
                    </div>
                </div>
                <ModeSelector activeMode={config.promptSet} onChange={handleChange} />
            </div>

            {/* 2. Global Technical Settings */}
            <GlobalTechnicalSettings
                config={config}
                onChange={handleChange}
                availableApiKeys={availableApiKeys}
                isDryRun={isDryRun}
                setIsDryRun={setIsDryRun}
            />

            {/* 3. Engine Specific Banner & Settings */}
            <div className="space-y-6">
                {(config.promptSet === 'B' || config.promptSet === 'C') ? (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
                        <div className={`relative overflow-hidden p-5 rounded-2xl border backdrop-blur-xl group
                            ${config.promptSet === 'C' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-cyan-500/5 border-cyan-500/20'}`}>
                            {/* Decorative light effect */}
                            <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[80px] opacity-20
                                ${config.promptSet === 'C' ? 'bg-amber-400' : 'bg-cyan-400'}`} />

                            <div className="relative flex items-center gap-4">
                                <div className={`p-3 rounded-xl shadow-lg
                                    ${config.promptSet === 'C' ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                                    {config.promptSet === 'C' ? <Layers className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className={`text-[13px] font-black uppercase tracking-widest
                                        ${config.promptSet === 'C' ? 'text-amber-300' : 'text-cyan-300'}`}>
                                        {config.promptSet === 'C' ? 'Compositor Engine (Set C)' : 'Lifestyle Persona (Set B)'}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                                        {config.promptSet === 'C'
                                            ? 'Professional VFX pipeline for surgical asset integration.'
                                            : 'Dynamic environmental generation based on persona presets.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {config.promptSet === 'C' && <CompositorSettings config={config} onChange={handleChange} />}
                        {/* Ensure PersonaManagementPanel also consumes context or pass props. For now pass props to minimize changes if it uses them heavily */}
                        <PersonaManagementPanel config={config} setConfig={setConfig} presets={presets} />
                    </div>
                ) : (
                    <IdentitySettings config={config} onChange={handleChange} presets={presets} />
                )}
            </div>

            {/* 4. Visual References */}
            <div className="space-y-6 pt-2">
                <VisualReferenceSettings
                    config={config}
                    onChange={handleChange}
                    styleReferenceImage={styleReferenceImage}
                    setStyleReferenceImage={setStyleReferenceImage}
                />

                {/* AI Analysis Container */}
                <div className="space-y-4">
                    <button
                        onClick={() => analyzeStyle(viewImages, styleReferenceImage)}
                        disabled={isAnalyzing}
                        className="w-full py-3.5 glass-button rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-2 group hover:text-white"
                    >
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> : <Sparkles className="w-4 h-4 text-purple-400 group-hover:animate-pulse" />}
                        <span>分析风格 & 推荐穿搭 (AI Analysis)</span>
                    </button>

                    {outfitSuggestion && (
                        <div className="p-5 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-[1.5rem] text-xs backdrop-blur-md animate-in zoom-in-95 duration-300 shadow-xl">
                            <div className="font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                                <Zap className="w-3.5 h-3.5 fill-current" /> AI 洞察 (AI INSIGHT)
                            </div>
                            <div className="text-amber-100/70 mb-4 leading-relaxed font-medium italic">"{outfitSuggestion.outfit_description}"</div>
                            <button
                                onClick={() => handleChange('clothing', outfitSuggestion.outfit_description)}
                                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all shadow-[0_8px_16px_-4px_rgba(217,119,6,0.5)] active:scale-95 text-[11px] uppercase tracking-wider"
                            >
                                应用推荐配置 (APPLY)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 5. Advanced Refinement & Library (Refined Accordion) */}
            <div className="border border-white/5 rounded-[1.5rem] overflow-hidden bg-slate-900/40 shadow-inner">
                <button
                    onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                    className="w-full flex justify-between items-center p-5 hover:bg-white/5 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${isAdvancedExpanded ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                            <Settings className={`w-4 h-4 ${isAdvancedExpanded ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                        </div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-200">高级设置 & 预设 (Refinement)</span>
                    </div>
                    {isAdvancedExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {isAdvancedExpanded && (
                    <div className="p-6 border-t border-white/5 space-y-8 animate-in slide-in-from-top-2 duration-300">
                        {/* Rendering Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] uppercase text-pink-500 font-black tracking-widest">创意度 (Creativity)</label>
                                    <span className="text-[10px] font-mono text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full">{config.creativity || 20}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={config.creativity !== undefined ? config.creativity : 20}
                                    onChange={(e) => handleChange('creativity', parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500 shadow-inner"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                                <div>
                                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider block">自动缩放 (Auto Scale)</span>
                                    <span className="text-[9px] text-slate-500 font-medium tracking-tight">自动居中并缩放至 78% (生产建议)</span>
                                </div>
                                <button
                                    onClick={() => handleChange('enablePostProcessing', config.enablePostProcessing === false ? true : false)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${config.enablePostProcessing !== false ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${config.enablePostProcessing !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Super Resolution Tool */}
                        <div className="bg-slate-900/60 rounded-2xl border border-white/5 overflow-hidden">
                            <SuperResolutionPanel config={config} setConfig={setConfig} />
                        </div>

                        {/* Library Management */}
                        <div className="space-y-4 pt-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                <div className="w-5 h-[1px] bg-slate-700" />
                                预设库管理 (Library)
                                <div className="flex-1 h-[1px] bg-slate-700" />
                            </label>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="预设名称 (Preset Name)..."
                                    value={newPresetName}
                                    onChange={(e) => setNewPresetName(e.target.value)}
                                    className="flex-1 bg-slate-950/80 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500/50 outline-none shadow-inner tracking-wider"
                                />
                                <button
                                    onClick={handleSavePreset}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95"
                                >
                                    <Save className="w-3.5 h-3.5" /> 保存
                                </button>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto custom-scrollbar pr-2 py-1">
                                {Object.keys(serverPresets).map(name => (
                                    <button
                                        key={name}
                                        onClick={() => loadPreset(name)}
                                        className="bg-slate-800/40 border border-white/5 hover:border-purple-500/40 hover:bg-purple-500/5 p-3 rounded-xl text-[10px] text-slate-400 font-bold tracking-wider truncate text-left flex items-center gap-3 transition-all group shadow-sm"
                                    >
                                        <RefreshCw className="w-3 h-3 text-slate-600 group-hover:text-purple-400 group-hover:rotate-180 transition-all duration-500" />
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 6. Primary Action Button (The "Wow" Factor) */}
            <div className="pt-4 group">
                <button
                    onClick={() => generateAll(activeTab)}
                    disabled={isProcessing}
                    className={`relative w-full py-5 rounded-[1.5rem] font-black text-lg tracking-[0.2em] transition-all overflow-hidden
                        ${isProcessing
                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5'
                            : 'bg-black text-white hover:scale-[1.01] active:scale-[0.98] shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] shadow-indigo-900/40'
                        }`}
                >
                    {/* Background animated gradient */}
                    {!isProcessing && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                    )}

                    {/* Particle/Glow Effect */}
                    {!isProcessing && (
                        <div className="absolute top-0 -left-1/2 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[45deg] group-hover:animate-[shimmer_2s_infinite]" />
                    )}

                    <div className="relative flex items-center justify-center gap-4">
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="uppercase">生产管线运行中 (Processing)...</span>
                            </>
                        ) : (
                            <>
                                <Zap className="w-6 h-6 fill-current text-white animate-pulse" />
                                <span className="uppercase">一键生成 (生产级)</span>
                            </>
                        )}
                    </div>
                </button>

                {/* Secondary Meta Links */}
                <div className="mt-5 flex items-center justify-center gap-8 text-[9px] text-slate-500 font-black uppercase tracking-[0.25em]">
                    <span className="flex items-center gap-2 hover:text-slate-300 transition-colors cursor-default select-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.5)]" /> 2K 原图直出
                    </span>
                    <span className="flex items-center gap-2 hover:text-slate-300 transition-colors cursor-default select-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> 自动质检 (Auto-QC)
                    </span>
                    <span className="flex items-center gap-2 hover:text-slate-300 transition-colors cursor-default select-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> 物理一致性锁 (Physics)
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ConfigPanel;
