import React, { useState } from 'react';
import { Users, Sun, Shirt, Plus, Trash2, Edit2, Check, X, ChevronRight, ChevronDown } from 'lucide-react';

const PersonaManagementPanel = ({ config, setConfig }) => {
    const [activeGroupIndex, setActiveGroupIndex] = useState(0);
    const [activeGender, setActiveGender] = useState('female');

    // Ensure config.personaGroups exists, handled by parent later, but safe check here
    const groups = config.personaGroups || [];

    const handleUpdateGroup = (index, field, value) => {
        const newGroups = [...groups];
        // field can be dot notation e.g. "environment.lighting"
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            newGroups[index] = {
                ...newGroups[index],
                [parent]: {
                    ...newGroups[index][parent],
                    [child]: value
                }
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

    // --- Outfit CRUD ---
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

    if (!groups.length) return <div className="p-4 text-slate-500">Initializing Personas...</div>;

    const currentGroup = groups[activeGroupIndex];

    return (
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden mt-4">
            {/* Header / Tabs */}
            <div className="flex border-b border-slate-700/50 overflow-x-auto">
                {groups.map((group, idx) => (
                    <button
                        key={group.id}
                        onClick={() => setActiveGroupIndex(idx)}
                        className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap
                            ${activeGroupIndex === idx
                                ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                            }`}
                    >
                        <Users className="w-3 h-3" />
                        Group {group.id}: {group.name.split('/')[0]}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="p-4 space-y-6">

                {/* 1. Global Group Settings */}
                <div className="space-y-3">
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">分组名称 (Group Name)</label>
                            <input
                                value={currentGroup.name}
                                onChange={(e) => handleUpdateGroup(activeGroupIndex, 'name', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:border-cyan-500 outline-none"
                            />
                        </div>
                        <div className="flex-[2] space-y-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">触发关键词 (Keywords, comma separated)</label>
                            <input
                                value={currentGroup.keywords.join(', ')}
                                onChange={(e) => handleUpdateGroup(activeGroupIndex, 'keywords', e.target.value.split(',').map(s => s.trim()))}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-cyan-200/80 focus:border-cyan-500 outline-none font-mono"
                            />
                        </div>
                    </div>

                    {/* Environment */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-amber-500/80 font-bold flex items-center gap-1">
                            <Sun className="w-3 h-3" /> 环境与光效 (Lighting & Environment)
                        </label>
                        <textarea
                            value={currentGroup.environment.lighting}
                            onChange={(e) => handleUpdateGroup(activeGroupIndex, 'environment.lighting', e.target.value)}
                            rows={2}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-2 text-xs text-amber-100/80 focus:border-amber-500/50 outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="w-full h-px bg-slate-700/50" />

                {/* 2. Model & Outfits Config */}
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <span className="text-xs font-bold text-slate-400">模特配置 (Model Config):</span>
                        <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-700">
                            {['female', 'male'].map(g => (
                                <button
                                    key={g}
                                    onClick={() => {
                                        setActiveGender(g);
                                        setConfig(prev => ({ ...prev, gender: g })); // Sync to Global Config
                                    }}
                                    className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${activeGender === g ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {g === 'female' ? '女 (Female)' : '男 (Male)'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Base Body */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">基础体态特征 (Base Body & Identity)</label>
                            <textarea
                                value={currentGroup.models[activeGender].baseBody}
                                onChange={(e) => handleUpdateModel(activeGroupIndex, activeGender, 'baseBody', e.target.value)}
                                rows={3}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-2 text-xs text-slate-300 focus:border-slate-500 outline-none font-medium"
                                placeholder="Describe age, ethnicity, body type..."
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-slate-500 block mb-1">发型 (Hair Style)</label>
                                    <input
                                        value={currentGroup.models[activeGender].hair}
                                        onChange={(e) => handleUpdateModel(activeGroupIndex, activeGender, 'hair', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 block mb-1">妆容 (Makeup/Grooming)</label>
                                    <input
                                        value={currentGroup.models[activeGender].makeup || currentGroup.models[activeGender].grooming || ''}
                                        onChange={(e) => handleUpdateModel(activeGroupIndex, activeGender, activeGender === 'male' ? 'grooming' : 'makeup', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Outfit List */}
                        <div className="border-l border-slate-700/50 pl-4 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] uppercase text-purple-400 font-bold flex items-center gap-1">
                                    <Shirt className="w-3 h-3" /> 服装管理 (Managed Outfits)
                                </label>
                                <button
                                    onClick={() => handleAddOutfit(activeGroupIndex, activeGender)}
                                    className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> 添加 (Add)
                                </button>
                            </div>

                            <div className="space-y-2 overflow-y-auto max-h-[200px] pr-1 custom-scrollbar">
                                {currentGroup.models[activeGender].outfits.map((outfit, oIdx) => (
                                    <div key={outfit.id} className="group relative bg-slate-950 border border-slate-800 rounded-lg p-2 hover:border-slate-600 transition-colors">
                                        <div className="flex gap-2 mb-1">
                                            <input
                                                value={outfit.name}
                                                onChange={(e) => handleUpdateOutfit(activeGroupIndex, activeGender, oIdx, 'name', e.target.value)}
                                                className="flex-1 bg-transparent text-xs font-bold text-slate-200 outline-none border-b border-transparent focus:border-slate-600 placeholder-slate-600"
                                                placeholder="Outfit Name"
                                            />
                                            <button
                                                onClick={() => handleDeleteOutfit(activeGroupIndex, activeGender, oIdx)}
                                                className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <textarea
                                            value={outfit.prompt}
                                            onChange={(e) => handleUpdateOutfit(activeGroupIndex, activeGender, oIdx, 'prompt', e.target.value)}
                                            rows={2}
                                            className="w-full bg-slate-900/50 text-[10px] text-slate-400 rounded p-1 outline-none resize-none focus:bg-slate-900 focus:text-slate-300 border border-transparent focus:border-slate-700"
                                            placeholder="Outfit detailed prompt..."
                                        />
                                    </div>
                                ))}
                                {currentGroup.models[activeGender].outfits.length === 0 && (
                                    <div className="text-center py-4 text-[10px] text-slate-600 italic">
                                        暂无服装配置 (No outfits defined)
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
