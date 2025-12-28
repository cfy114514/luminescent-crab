import React, { useState, useEffect } from 'react';
import { Layers, Eraser, Settings, ChevronDown, ChevronUp, User, Camera, Sparkles, Loader2, Fingerprint, Key, Hash, Layout, Zap, Save, RefreshCw } from 'lucide-react';
import SuperResolutionPanel from './SuperResolutionPanel';
import ModelDNAPanel from './ModelDNAPanel';
import PersonaManagementPanel from './PersonaManagementPanel';
import { DEFAULT_PERSONA_GROUPS } from '../services/core/prompts/engines/setB/defaultPersonas';

const ConfigPanel = ({ config, setConfig, presets: propPresets, savePresets: propSavePresets, styleReferenceImage, setStyleReferenceImage, outfitSuggestion, onAnalyzeStyle, isAnalyzing, status, onGenerate }) => {
    const [isModelExpanded, setIsModelExpanded] = useState(true);
    const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);

    // Server-side Config State
    const [serverPresets, setServerPresets] = useState({});
    const [availableApiKeys, setAvailableApiKeys] = useState({});
    const [newPresetName, setNewPresetName] = useState('');
    const [showSavePreset, setShowSavePreset] = useState(false);

    // Drag UI State
    const [styleRefIsDragging, setStyleRefIsDragging] = useState(false);

    // Fetch Config on Mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/config');
                if (res.ok) {
                    const data = await res.json();
                    setAvailableApiKeys(data.apiKeys || {});
                    if (data.userConfig) {
                        const { presets, apiKeySelection, customApiUrl, personaGroups } = data.userConfig;
                        if (presets) setServerPresets(presets);

                        // Apply saved key/url preferences
                        setConfig(prev => ({
                            ...prev,
                            apiKeySelection: apiKeySelection || 'key1',
                            customApiUrl: customApiUrl || prev.customApiUrl,
                            // Initialize Persona Groups (Use saved or Default)
                            personaGroups: personaGroups || DEFAULT_PERSONA_GROUPS
                        }));
                    } else {
                        // First time load, no userConfig
                        setConfig(prev => ({ ...prev, personaGroups: DEFAULT_PERSONA_GROUPS }));
                    }
                }
            } catch (err) {
                console.error("Failed to load config:", err);
                setConfig(prev => ({ ...prev, personaGroups: DEFAULT_PERSONA_GROUPS }));
            }
        };
        fetchConfig();
    }, []);

    // Helper to save config to server
    const saveConfigToServer = async (newPresets, newApiKeySelection, newCustomApiUrl) => {
        try {
            const configToSave = {
                presets: newPresets !== undefined ? newPresets : serverPresets,
                apiKeySelection: newApiKeySelection !== undefined ? newApiKeySelection : config.apiKeySelection,
                customApiUrl: newCustomApiUrl !== undefined ? newCustomApiUrl : config.customApiUrl,
                personaGroups: config.personaGroups // Persist Personas
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
        setConfig(prev => ({ ...prev, [key]: value }));
        // Auto-save API Key and Custom URL changes
        if (key === 'apiKeySelection' || key === 'customApiUrl') {
            saveConfigToServer(undefined,
                key === 'apiKeySelection' ? value : undefined,
                key === 'customApiUrl' ? value : undefined
            );
        }
    };

    // Handler for saving a new model preset (server-side)
    const handleSavePreset = () => {
        if (!newPresetName) return alert("Please enter a preset name");

        // Construct new preset object matching the current config state relevant to model/style
        const newPreset = {
            id: `custom_${Date.now()}`,
            name: newPresetName,
            prompt: config.prompt,
            negative_prompt: config.negative_prompt,
            imageSize: config.imageSize,
            aspect_ratio: config.aspect_ratio,
            model: config.model,
            clothing: config.clothing,
            gender: config.gender,
            ethnicity: config.ethnicity
        };

        const newPresets = { ...serverPresets, [newPresetName]: newPreset };
        setServerPresets(newPresets);
        saveConfigToServer(newPresets);
        setNewPresetName('');
        setShowSavePreset(false);
        alert(`Saved preset: ${newPresetName}`);
    };

    const loadPreset = (name) => {
        const preset = serverPresets[name];
        if (preset) {
            setConfig(prev => ({ ...prev, ...preset }));
        }
    };

    return (
        <div className="w-full glass-panel rounded-2xl p-6 space-y-6 mt-6">

            {/* 1. Header & Mode Switch */}
            <div className="space-y-4 pb-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white flex items-center">
                        <span className="w-1 h-6 bg-purple-500 rounded-full mr-3" />
                        Configuration
                    </h3>

                    {/* Mode Toggle */}
                    <div className="flex bg-slate-900/80 rounded-lg p-1 border border-slate-700">
                        <button
                            onClick={() => handleChange('promptSet', 'A')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${config.promptSet === 'A' || (!config.promptSet) ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <span className="flex items-center gap-1">Standard (A)</span>
                        </button>
                        <button
                            onClick={() => handleChange('promptSet', 'B')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${config.promptSet === 'B' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Lifestyle (B)</span>
                        </button>
                        <button
                            onClick={() => handleChange('promptSet', 'C')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${config.promptSet === 'C' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <span className="flex items-center gap-1">🎭 Compositor (C)</span>
                        </button>
                    </div>
                </div>

                {/* Global Settings Grid: API, Res, Ratio, Engine */}
                <div className="grid grid-cols-4 gap-3">
                    {/* 1. API Key */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1"><Key className="w-3 h-3" /> API 密钥</label>
                        <select
                            value={config.apiKeySelection || 'key1'}
                            onChange={(e) => {
                                const val = e.target.value;
                                handleChange('apiKeySelection', val);
                                if (val === 'custom') {
                                    // Hardcoded Local API as requested
                                    handleChange('customApiUrl', 'http://127.0.0.1:8045/v1');
                                }
                            }}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                        >
                            <option value="key1">Key 1 {availableApiKeys.key1 ? '✓' : ''}</option>
                            <option value="key2">Key 2 {availableApiKeys.key2 ? '✓' : ''}</option>
                            <option value="custom">Custom (Local 8045)</option>
                        </select>
                    </div>

                    {/* 2. Base Model Engine (Moved to Global) */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1"><Zap className="w-3 h-3" /> 生图引擎 (Engine)</label>
                        <select
                            value={config.model || 'gemini-2.5-flash-image'}
                            onChange={(e) => handleChange('model', e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-purple-300 outline-none focus:border-purple-500"
                        >
                            <optgroup label="Google Vertex AI">
                                <option value="gemini-2.5-flash-image">Gemini 2.5 Flash</option>
                                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Exp)</option>
                                {/* User specified Manual Override */}
                                <option value="gemini-3-pro-image-preview">gemini-3-pro-image-preview</option>
                                <option value="imagen-3.0-generate-002">Imagen 3 (Fast)</option>
                            </optgroup>
                            <optgroup label="High Fidelity (Banana/Replicate)">
                                <option value="banana-pro">Flux 1.1 Pro (Banana)</option>
                                <option value="flux-dev">Flux Dev (Replicate)</option>
                            </optgroup>
                        </select>
                    </div>

                    {/* 3. Resolution */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1"><Settings className="w-3 h-3" /> 分辨率</label>
                        <select
                            value={config.imageSize || '2K'}
                            onChange={(e) => handleChange('imageSize', e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                        >
                            <option value="1K">1K (Square)</option>
                            <option value="2K">2K (High-Res)</option>
                            <option value="4K">4K (Ultra)</option>
                        </select>
                    </div>

                    {/* 4. Aspect Ratio */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1"><Layout className="w-3 h-3" /> 比例</label>
                        <select
                            value={config.aspect_ratio || '1:1'}
                            onChange={(e) => handleChange('aspect_ratio', e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-pink-500"
                        >
                            <option value="1:1">1:1 (Square)</option>
                            <option value="3:4">3:4 (Portrait)</option>
                            <option value="4:3">4:3 (Landscape)</option>
                            <option value="9:16">9:16 (Story)</option>
                            <option value="16:9">16:9 (Cinema)</option>
                        </select>
                    </div>
                </div>

            </div>

            {/* 2. Context & Engine Settings (Conditional) */}
            <div className="space-y-4 pb-4 border-b border-slate-700/50">
                {(config.promptSet === 'B' || config.promptSet === 'C') ? (
                    // === SET B / SET C UI (Shared Persona Engine) ===
                    <div className="animate-in fade-in duration-300 space-y-4">
                        <div className={`flex items-center gap-2 p-3 rounded-lg border ${config.promptSet === 'C' ? 'bg-amber-900/10 border-amber-500/20' : 'bg-cyan-900/10 border-cyan-500/20'}`}>
                            <Zap className={`w-4 h-4 ${config.promptSet === 'C' ? 'text-amber-400' : 'text-cyan-400'}`} />
                            <div className="flex-1">
                                <h4 className={`text-xs font-bold ${config.promptSet === 'C' ? 'text-amber-300' : 'text-cyan-300'}`}>
                                    {config.promptSet === 'C' ? 'Set C 已激活: Compositor 模式 (换脸换帽)' : 'Set B 已激活: 自动化角色引擎'}
                                </h4>
                                <p className={`text-[10px] ${config.promptSet === 'C' ? 'text-amber-200/60' : 'text-cyan-200/60'}`}>
                                    {config.promptSet === 'C'
                                        ? '使用参考图底板，仅替换头部 (帽子 + 脸部)。'
                                        : '系统将根据下方关键词自动选择度假、户外或高尔夫角色。'}
                                </p>
                            </div>
                        </div>

                        {/* Clone Mode Toggle - SET C ONLY */}
                        {config.promptSet === 'C' && (
                            <div className="flex items-center justify-between py-2 px-3 bg-amber-900/20 rounded-lg border border-amber-500/30">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-amber-300">🔗 Clone Mode (克隆模式)</span>
                                    <span className="text-[10px] text-amber-200/60">
                                        完全克隆参考图的姿势 + 着装，仅替换脸部和帽子
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleChange('cloneOutfitFromRef', !config.cloneOutfitFromRef)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${config.cloneOutfitFromRef ? 'bg-amber-500' : 'bg-slate-700'}`}
                                >
                                    <span
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${config.cloneOutfitFromRef ? 'translate-x-5' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                        )}

                        {/* Persona Manager (Shared between Set B and Set C) */}
                        <PersonaManagementPanel config={config} setConfig={setConfig} />
                    </div>
                ) : (
                    // === SET A UI (Legacy / Standard) ===
                    <div className="animate-in fade-in duration-300 space-y-4">
                        {/* Category & Admin Model Select */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-slate-500 font-bold">产品品类 (Category)</label>
                                <select
                                    value={config.categoryId || ''}
                                    onChange={(e) => handleChange('categoryId', e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-emerald-300 outline-none"
                                >
                                    {propPresets?.productCategories?.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* ADMIN MODEL LIBRARY SELECTOR */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-blue-400 font-bold flex items-center justify-between">
                                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> 模特预设库 (Admin Library)</span>
                                </label>
                                <select
                                    value={config.modelId || ''}
                                    onChange={(e) => {
                                        const selectedId = e.target.value;
                                        handleChange('modelId', selectedId);

                                        // Auto-sync DNA from Admin Preset
                                        if (selectedId) {
                                            const preset = propPresets?.models?.find(m => m.id === selectedId);
                                            if (preset) {
                                                handleChange('modelDNA', preset.visual_identity || '');
                                            }
                                        }
                                    }}
                                    className={`w-full border rounded px-2 py-1.5 text-xs outline-none transition-all ${config.modelId
                                        ? 'bg-blue-900/20 border-blue-500/50 text-blue-200'
                                        : 'bg-slate-900/50 border-slate-700 text-slate-400'
                                        }`}
                                >
                                    <option value="">-- 自定义 DNA (Custom) --</option>
                                    {propPresets?.models?.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Model DNA Panel (Collapsible) */}
                        <div className="border border-slate-700/50 rounded-xl overflow-hidden">
                            <div
                                className="flex justify-between items-center bg-slate-800/30 p-3 cursor-pointer hover:bg-slate-800/50"
                                onClick={() => setIsModelExpanded(!isModelExpanded)}
                            >
                                <label className="text-xs font-bold text-purple-400 flex items-center gap-2 cursor-pointer">
                                    <User className="w-3 h-3" /> 模特 DNA 与身份 (Identity/Custom)
                                </label>
                                {isModelExpanded ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
                            </div>
                            {isModelExpanded && (
                                <div className="p-3 border-t border-slate-700/50 bg-slate-900/20">
                                    <ModelDNAPanel config={config} setConfig={setConfig} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Inputs (Shared) */}
            <div className="space-y-4 pb-4 border-b border-slate-700/50">
                {/* Clothing / Style Keywords */}
                <div className="space-y-1">
                    <label className="flex justify-between items-center">
                        <span className={`text-xs font-bold uppercase flex items-center gap-2 ${config.promptSet === 'B' ? 'text-cyan-400' : 'text-slate-400'}`}>
                            <Hash className="w-3 h-3" />
                            {config.promptSet === 'B' ? "Clothing & Persona Keywords (Triggers)" : "Clothing Description / Style"}
                        </span>
                    </label>
                    <input
                        type="text"
                        placeholder={config.promptSet === 'B' ? "e.g., 'Hiking gear', 'Vacation linen', 'Golf polo'..." : "e.g. White linen shirt, studio lighting..."}
                        value={config.clothing || ''}
                        onChange={(e) => handleChange('clothing', e.target.value)}
                        className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2.5 text-sm text-white focus:ring-1 outline-none transition-colors
                            ${config.promptSet === 'B' ? 'border-cyan-500/30 focus:border-cyan-500 focus:ring-cyan-500/20' : 'border-slate-700 focus:border-indigo-500'}`}
                    />
                    {config.promptSet === 'B' && (
                        <p className="text-[10px] text-cyan-200/50 italic px-1">
                            * Enter keywords like "hiking", "golf", "resort" to switch personas.
                        </p>
                    )}
                </div>

                {/* Style Reference Upload */}
                <div className="space-y-2">
                    <label className="text-[10px] uppercase text-amber-500 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Style Reference Image
                    </label>

                    {styleReferenceImage ? (
                        <div className="relative group">
                            <img
                                src={URL.createObjectURL(styleReferenceImage)}
                                alt="Style Reference"
                                className="w-full h-32 object-cover rounded-lg border border-amber-500/30 shadow-md"
                            />
                            <button
                                onClick={() => setStyleReferenceImage(null)}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur rounded-full text-white hover:bg-red-500 transition-colors"
                            >
                                <span className="text-xs">✕</span>
                            </button>
                        </div>
                    ) : (
                        <div
                            className={`border border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${styleRefIsDragging ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 hover:border-amber-500/40 hover:bg-slate-800/50'
                                }`}
                            onDragOver={(e) => { e.preventDefault(); setStyleRefIsDragging(true); }}
                            onDragLeave={() => setStyleRefIsDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setStyleRefIsDragging(false);
                                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                    setStyleReferenceImage(e.dataTransfer.files[0]);
                                }
                            }}
                            onClick={() => document.getElementById('style-ref-input').click()}
                        >
                            <input
                                id="style-ref-input"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setStyleReferenceImage(e.target.files[0]);
                                    }
                                }}
                            />
                            <Camera className={`w-8 h-8 mx-auto mb-2 ${styleRefIsDragging ? 'text-amber-400' : 'text-slate-600'}`} />
                            <p className="text-xs text-slate-400">
                                Drag & Drop Style Reference
                            </p>
                        </div>
                    )}

                    {/* Analyze Button */}
                    <button
                        onClick={onAnalyzeStyle}
                        disabled={isAnalyzing}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded border border-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Analyze Style
                    </button>

                    {/* Outfit Suggestion Display */}
                    {outfitSuggestion && (
                        <div className="p-3 bg-amber-900/20 border border-amber-500/20 rounded-lg text-xs">
                            <div className="font-bold text-amber-500 mb-1">AI Suggestion:</div>
                            <div className="text-amber-200/80 mb-2 line-clamp-2">{outfitSuggestion.outfit_description}</div>
                            <button
                                onClick={() => {
                                    const updates = { clothing: outfitSuggestion.outfit_description };
                                    Object.entries(updates).forEach(([key, val]) => handleChange(key, val));
                                }}
                                className="w-full py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded transition-colors"
                            >
                                Apply Suggestion
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Post-Processing & Creativity */}
            <div className="space-y-4">
                {/* Post-Processing Toggle */}
                <div className="flex items-center justify-between py-2 px-3 bg-slate-900/30 rounded-lg border border-slate-700/30">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-300">自动缩放 (Auto Scale)</span>
                        <span className="text-[10px] text-slate-500">产品图后处理，自动居中缩放至 78%</span>
                    </div>
                    <button
                        onClick={() => handleChange('enablePostProcessing', config.enablePostProcessing === false ? true : false)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${config.enablePostProcessing !== false ? 'bg-emerald-500' : 'bg-slate-700'}`}
                    >
                        <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${config.enablePostProcessing !== false ? 'translate-x-5' : 'translate-x-1'}`}
                        />
                    </button>
                </div>

                {/* Color Correction Toggle */}
                <div className="flex items-center justify-between py-2 px-3 bg-slate-900/30 rounded-lg border border-slate-700/30">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-300">颜色校正 (Color Correction)</span>
                        <span className="text-[10px] text-slate-500">基于首张参考图校正生成图颜色</span>
                    </div>
                    <button
                        onClick={() => handleChange('enableColorCorrection', config.enableColorCorrection === false ? true : false)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${config.enableColorCorrection !== false ? 'bg-cyan-500' : 'bg-slate-700'}`}
                    >
                        <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${config.enableColorCorrection !== false ? 'translate-x-5' : 'translate-x-1'}`}
                        />
                    </button>
                </div>

                {/* Creativity Slider */}
                <div className="flex items-center gap-4">
                    <label className="text-[10px] uppercase text-pink-500 font-bold w-12 text-right">Creativity</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={config.creativity !== undefined ? config.creativity : 20}
                        onChange={(e) => handleChange('creativity', parseInt(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <span className="text-[10px] font-mono text-pink-400">{config.creativity}%</span>
                </div>

                {/* Super Res / Post Processing */}
                <div className="border border-slate-700/30 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                        className="w-full flex items-center justify-between p-3 bg-slate-900/30 text-xs font-bold text-slate-400 hover:text-slate-200"
                    >
                        <span className="flex items-center gap-2"><Settings className="w-3 h-3" /> Post-Processing & Upscale</span>
                        {isAdvancedExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {isAdvancedExpanded && (
                        <div className="p-3 bg-slate-950/30">
                            <SuperResolutionPanel config={config} />
                        </div>
                    )}
                </div>
            </div>

            {/* 5. Footer Actions */}
            <div className="pt-2">
                {onGenerate && (
                    <button
                        onClick={onGenerate}
                        disabled={status === 'generating'}
                        className={`w-full py-3 rounded-lg font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 ${status === 'generating'
                            ? 'bg-slate-700 cursor-not-allowed'
                            : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-white/10'
                            }`}
                    >
                        {status === 'generating' ? (
                            <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
                        ) : (
                            <><Zap className="w-4 h-4 fill-current" /> Generate Image</>
                        )}
                    </button>
                )}
            </div>

        </div>
    );
};

export default ConfigPanel;
