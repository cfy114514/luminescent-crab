import React, { useState } from 'react';
import { User, ChevronUp, ChevronDown, Fingerprint } from 'lucide-react';
import ModelDNAPanel from '../ModelDNAPanel';

const IdentitySettings = ({ config, onChange, presets }) => {
    const [isModelExpanded, setIsModelExpanded] = useState(false);
    const labelStyle = "text-[11px] uppercase text-slate-400 font-bold flex items-center gap-2 mb-1.5 tracking-wider";
    const selectStyle = "w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500/50 focus:bg-slate-900 transition-all cursor-pointer shadow-inner";

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className={labelStyle}>Product Category</label>
                    <select
                        value={config.categoryId || ''}
                        onChange={(e) => onChange('categoryId', e.target.value)}
                        className={`${selectStyle} text-emerald-300 font-medium`}
                    >
                        {presets?.productCategories?.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className={`${labelStyle} text-blue-400`}>
                        <User className="w-3.5 h-3.5" /> Model Library
                    </label>
                    <select
                        value={config.modelId || ''}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            onChange('modelId', selectedId);
                            if (selectedId) {
                                const preset = presets?.models?.find(m => m.id === selectedId);
                                if (preset) {
                                    onChange('modelDNA', preset.visual_identity || '');
                                }
                            }
                        }}
                        className={`${selectStyle} ${config.modelId ? 'text-blue-200 border-blue-500/30 bg-blue-950/20' : 'text-slate-400'}`}
                    >
                        <option value="">-- Custom Identity --</option>
                        {presets?.models?.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="group border border-white/10 rounded-2xl overflow-hidden bg-white/5 transition-all hover:border-purple-500/30">
                <button
                    className="w-full flex justify-between items-center p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setIsModelExpanded(!isModelExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg transition-colors ${isModelExpanded ? 'bg-purple-500/20' : 'bg-slate-800'}`}>
                            <Fingerprint className={`w-4 h-4 ${isModelExpanded ? 'text-purple-400' : 'text-slate-400'}`} />
                        </div>
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Model DNA & Visual Identity</span>
                    </div>
                    {isModelExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {isModelExpanded && (
                    <div className="p-4 border-t border-white/5 bg-slate-900/40 animate-in slide-in-from-top-2 duration-300">
                        <ModelDNAPanel config={config} setConfig={(newConfig) => {
                            Object.keys(newConfig).forEach(key => onChange(key, newConfig[key]));
                        }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default IdentitySettings;
