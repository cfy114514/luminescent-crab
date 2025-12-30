import React, { useState } from 'react';
import { Users, Sun, Shirt, Plus, X, User, UserPlus, Zap, BookOpen } from 'lucide-react';

const PersonaManagementPanel = ({ config, setConfig, presets }) => {
    const [activeGroupIndex, setActiveGroupIndex] = useState(0);
    const [activeGender, setActiveGender] = useState('female');

    const groups = config.personaGroups || [];

    const labelStyle = "text-xs uppercase text-slate-300 font-semibold flex items-center gap-2.5 mb-2 tracking-wide";
    const inputStyle = "w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all";
    const textareaStyle = "w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none";

    const handleUpdateGroup = (index, field, value) => {
        const newGroups = [...groups];
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            newGroups[index] = {
                ...newGroups[index],
                [parent]: { ...newGroups[index][parent], [child]: value }
            };
        } else {
            newGroups[index] = { ...newGroups[index], [field]: value };
        }
        setConfig(prev => ({ ...prev, personaGroups: newGroups }));
    };

    const handleUpdateModel = (groupIndex, gender, field, value) => {
        const newGroups = [...groups];
        newGroups[groupIndex].models[gender] = {
            ...newGroups[groupIndex].models[gender],
            [field]: value
        };
        setConfig(prev => ({ ...prev, personaGroups: newGroups }));
    };

    const handleLoadModelPreset = (selectedId) => {
        if (!selectedId) return;
        const preset = presets?.models?.find(m => m.id === selectedId);
        if (preset) {
            const newGroups = [...groups];
            const currentModel = newGroups[activeGroupIndex].models[activeGender];
            newGroups[activeGroupIndex].models[activeGender] = {
                ...currentModel,
                baseBody: preset.visual_identity || currentModel.baseBody,
                hair: preset.hair_style || currentModel.hair,
                [activeGender === 'male' ? 'grooming' : 'makeup']: activeGender === 'male' ? (preset.grooming || currentModel.grooming) : (preset.makeup || currentModel.makeup)
            };
            setConfig(prev => ({ ...prev, personaGroups: newGroups }));
        }
    };

    const handleAddOutfit = (groupIndex, gender) => {
        const newGroups = [...groups];
        const newOutfit = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'New Outfit',
            prompt: 'Describe the outfit here...'
        };
        newGroups[groupIndex].models[gender].outfits.push(newOutfit);
        setConfig(prev => ({ ...prev, personaGroups: newGroups }));
    };

    const handleUpdateOutfit = (groupIndex, gender, outfitIndex, field, value) => {
        const newGroups = [...groups];
        newGroups[groupIndex].models[gender].outfits[outfitIndex][field] = value;
        setConfig(prev => ({ ...prev, personaGroups: newGroups }));
    };

    const handleDeleteOutfit = (groupIndex, gender, outfitIndex) => {
        const newGroups = [...groups];
        newGroups[groupIndex].models[gender].outfits.splice(outfitIndex, 1);
        setConfig(prev => ({ ...prev, personaGroups: newGroups }));
    };

    if (!groups.length) return (
        <div className="p-10 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 text-slate-500 italic text-sm">
            正在初始化人物角色...
        </div>
    );

    const currentGroup = groups[activeGroupIndex];

    return (
        <div className="bg-slate-900/40 rounded-3xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            {/* 1. Header & Group Select Tabs */}
            <div className="flex bg-slate-950/40 p-2 gap-2 border-b border-white/5">
                {groups.map((group, idx) => (
                    <button
                        key={group.id}
                        onClick={() => setActiveGroupIndex(idx)}
                        className={`px-5 py-3 text-xs font-bold rounded-xl transition-all flex items-center gap-3 whitespace-nowrap border
                            ${activeGroupIndex === idx
                                ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-400 border-cyan-500/30 shadow-lg shadow-cyan-950/20'
                                : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
                            }`}
                    >
                        <Users className={`w-4 h-4 ${activeGroupIndex === idx ? 'text-cyan-400' : 'text-slate-600'}`} />
                        {group.name.split('/')[0]}
                    </button>
                ))}
            </div>

            {/* 2. Content Area */}
            <div className="p-8 space-y-10">
                {/* Global Group Configuration */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className={labelStyle}>分组名称</label>
                            <input
                                value={currentGroup.name}
                                onChange={(e) => handleUpdateGroup(activeGroupIndex, 'name', e.target.value)}
                                className={inputStyle}
                                placeholder="例如：度假/休闲"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={`${labelStyle} text-cyan-400`}>触发关键词</label>
                            <input
                                value={currentGroup.keywords.join(', ')}
                                onChange={(e) => handleUpdateGroup(activeGroupIndex, 'keywords', e.target.value.split(',').map(s => s.trim()))}
                                className={`${inputStyle} text-cyan-200/90`}
                                placeholder="vacation, resort, beach..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={`${labelStyle} text-amber-500`}>
                            <Sun className="w-4 h-4" /> 光线与环境
                        </label>
                        <textarea
                            value={currentGroup.environment.lighting}
                            onChange={(e) => handleUpdateGroup(activeGroupIndex, 'environment.lighting', e.target.value)}
                            rows={2}
                            className={`${textareaStyle} text-amber-100/80`}
                            placeholder="描述环境光线..."
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">模特形象配置</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                {/* Model & Outfits Section */}
                <div className="space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <label className={labelStyle}>模特形象选择</label>
                        <div className="flex items-center gap-4">
                            {/* NEW: Model Library Dropdown */}
                            <div className="relative group">
                                <select
                                    className="bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-300 font-medium outline-none focus:border-purple-500/50 appearance-none cursor-pointer transition-all hover:bg-slate-800"
                                    onChange={(e) => handleLoadModelPreset(e.target.value)}
                                    value=""
                                >
                                    <option value="" disabled>从库中加载...</option>
                                    {presets?.models?.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
                            </div>

                            <div className="flex bg-slate-950 p-1.5 rounded-xl border border-white/5 shadow-inner">
                                {[
                                    { id: 'female', label: '女性', icon: <User className="w-3.5 h-3.5" /> },
                                    { id: 'male', label: '男性', icon: <UserPlus className="w-3.5 h-3.5" /> }
                                ].map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => {
                                            setActiveGender(g.id);
                                            setConfig(prev => ({ ...prev, gender: g.id }));
                                        }}
                                        className={`px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2
                                            ${activeGender === g.id
                                                ? 'bg-slate-800 text-white shadow-lg border border-white/10'
                                                : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {g.icon}
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Identity & Features - Full Width */}
                        <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className={labelStyle}>人物外貌特征</label>
                                    <textarea
                                        value={currentGroup.models[activeGender].baseBody}
                                        onChange={(e) => handleUpdateModel(activeGroupIndex, activeGender, 'baseBody', e.target.value)}
                                        rows={2}
                                        className={`${textareaStyle} !bg-slate-950/40 text-slate-300`}
                                        placeholder="年龄、肤色、体型..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 font-medium">发型</label>
                                        <input
                                            value={currentGroup.models[activeGender].hair}
                                            onChange={(e) => handleUpdateModel(activeGroupIndex, activeGender, 'hair', e.target.value)}
                                            className={inputStyle}
                                            placeholder="低马尾, 波浪卷..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 font-medium">妆容风格</label>
                                        <input
                                            value={currentGroup.models[activeGender].makeup || currentGroup.models[activeGender].grooming || ''}
                                            onChange={(e) => handleUpdateModel(activeGroupIndex, activeGender, activeGender === 'male' ? 'grooming' : 'makeup', e.target.value)}
                                            className={inputStyle}
                                            placeholder="自然妆, 精致妆..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Outfit Pipeline - Full Width */}
                        <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <label className={`${labelStyle} text-purple-400 !mb-0`}>
                                    <Shirt className="w-4 h-4" /> 服装管理
                                </label>
                                <button
                                    onClick={() => handleAddOutfit(activeGroupIndex, activeGender)}
                                    className="px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />新增服装
                                </button>
                            </div>

                            <div className="space-y-4">
                                {currentGroup.models[activeGender].outfits.map((outfit, oIdx) => (
                                    <div key={outfit.id} className="group relative bg-slate-950/40 border border-white/5 rounded-2xl p-5 hover:border-purple-500/30 transition-all">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
                                                <Zap className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <input
                                                value={outfit.name}
                                                onChange={(e) => handleUpdateOutfit(activeGroupIndex, activeGender, oIdx, 'name', e.target.value)}
                                                className="flex-1 bg-transparent text-base font-bold text-slate-200 outline-none border-b-2 border-white/10 focus:border-purple-500/50 pb-1"
                                                placeholder="服装名称..."
                                            />
                                            <button
                                                onClick={() => handleDeleteOutfit(activeGroupIndex, activeGender, oIdx)}
                                                className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <textarea
                                            value={outfit.prompt}
                                            onChange={(e) => handleUpdateOutfit(activeGroupIndex, activeGender, oIdx, 'prompt', e.target.value)}
                                            rows={2}
                                            className="w-full bg-slate-950/60 text-sm text-slate-300 rounded-xl p-4 outline-none resize-none focus:bg-slate-950 border border-transparent focus:border-purple-500/20 leading-relaxed"
                                            placeholder="详细描述服装风格..."
                                        />
                                    </div>
                                ))}
                                {currentGroup.models[activeGender].outfits.length === 0 && (
                                    <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        <Shirt className="w-8 h-8 text-slate-700 mb-3" />
                                        <p className="text-sm text-slate-500 font-medium">暂无服装预设</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonaManagementPanel;
