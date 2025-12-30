import React from 'react';
import { Key, Zap, Settings, Layout, TestTube } from 'lucide-react';

const GlobalTechnicalSettings = ({ config, onChange, availableApiKeys, isDryRun, setIsDryRun }) => {
    const labelStyle = "text-xs uppercase text-slate-300 font-semibold flex items-center gap-2 mb-2 tracking-wide";
    const selectStyle = "w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer";

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5 p-6 bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/[0.08]">
            {/* 1. API Key */}
            <div className="space-y-2">
                <label className={labelStyle}>
                    <Key className="w-4 h-4 text-purple-400" /> API 密钥
                </label>
                <select
                    value={config.apiKeySelection || 'key1'}
                    onChange={(e) => {
                        const val = e.target.value;
                        onChange('apiKeySelection', val);
                        if (val === 'custom') {
                            onChange('customApiUrl', 'http://127.0.0.1:8045/v1');
                        }
                    }}
                    className={selectStyle}
                >
                    <option value="key1">密钥 1 {availableApiKeys.key1 ? '✓' : ''}</option>
                    <option value="key2">密钥 2 {availableApiKeys.key2 ? '✓' : ''}</option>
                    <option value="custom">本地 (8045)</option>
                </select>
            </div>

            {/* 2. Base Model Engine */}
            <div className="space-y-2">
                <label className={labelStyle}>
                    <Zap className="w-4 h-4 text-blue-400" /> 生成引擎
                </label>
                <select
                    value={config.model || 'gemini-2.5-flash-image'}
                    onChange={(e) => onChange('model', e.target.value)}
                    className={`${selectStyle} text-blue-100 font-medium`}
                >
                    <optgroup label="Google Vertex AI" className="bg-slate-900">
                        <option value="gemini-2.5-flash-image">Gemini 2.5 Flash</option>
                        <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
                        <option value="gemini-3-pro-image-preview">Gemini 3 Pro (UHD)</option>
                    </optgroup>
                    <optgroup label="High Fidelity" className="bg-slate-900">
                        <option value="banana-pro">Flux 1.1 Pro</option>
                        <option value="flux-dev">Flux Dev</option>
                    </optgroup>
                </select>
            </div>

            {/* 3. Resolution */}
            <div className="space-y-2">
                <label className={labelStyle}>
                    <Settings className="w-4 h-4 text-cyan-400" /> 分辨率
                </label>
                <select
                    value={config.imageSize || '2K'}
                    onChange={(e) => onChange('imageSize', e.target.value)}
                    className={selectStyle}
                >
                    <option value="1K">1K (1:1)</option>
                    <option value="2K">2K (High Fidelity)</option>
                    <option value="4K">4K (Production)</option>
                </select>
            </div>

            {/* 4. Aspect Ratio */}
            <div className="space-y-2">
                <label className={labelStyle}>
                    <Layout className="w-4 h-4 text-pink-400" /> 画布比例
                </label>
                <select
                    value={config.aspect_ratio || '1:1'}
                    onChange={(e) => onChange('aspect_ratio', e.target.value)}
                    className={selectStyle}
                >
                    <option value="1:1">1:1 Square</option>
                    <option value="3:4">3:4 Portrait</option>
                    <option value="4:3">4:3 Landscape</option>
                    <option value="9:16">9:16 Vertical</option>
                    <option value="16:9">16:9 Cinema</option>
                </select>
            </div>
            {/* 5. Simulation Mode (Dry Run) */}
            <div className="space-y-2">
                <label className={labelStyle}>
                    <TestTube className="w-4 h-4 text-emerald-400" /> 模拟运行
                </label>
                <button
                    onClick={() => setIsDryRun(!isDryRun)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${isDryRun
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:bg-white/5'}`}
                >
                    <span className="text-xs font-medium">{isDryRun ? '开启' : '关闭'}</span>
                    <div className={`w-2 h-2 rounded-full ${isDryRun ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-700'}`} />
                </button>
            </div>
        </div>
    );
};

export default GlobalTechnicalSettings;
