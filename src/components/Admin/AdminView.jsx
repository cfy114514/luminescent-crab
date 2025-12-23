import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Palette,
    Camera,
    ChevronLeft,
    Settings,
    Layout,
    ArrowLeft,
    User
} from 'lucide-react';
import StyleEditor from './StyleEditor';
import ViewpointEditor from './ViewpointEditor';
import ModelEditor from './ModelEditor';
import CategoryEditor from './CategoryEditor';

const AdminView = ({ onBack, presets, setPresets }) => {
    const [activeTab, setActiveTab] = useState('categories');

    const tabs = [
        { id: 'categories', label: '产品分类管理', icon: Layout },
        { id: 'styles', label: '风格预设管理', icon: Palette },
        { id: 'models', label: '模特库管理', icon: User },
        { id: 'viewpoints', label: '视角/机位配置', icon: Camera },
    ];

    return (
        <div className="min-h-screen bg-[#050510] text-slate-200">
            {/* Header */}
            <header className="h-20 border-b border-slate-800/50 flex items-center justify-between px-8 bg-[#050510]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        aria-label="Back to User Mode"
                        className="p-3 hover:bg-slate-800 rounded-2xl transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-white" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">Admin Dashboard</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Presets & Logic Control</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        Visual Consistency Engine v2
                    </span>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar Navigation */}
                <div className="w-64 border-r border-slate-800/50 min-h-[calc(100vh-80px)] p-6 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all
                                ${activeTab === tab.id
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                                    : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}
                            `}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-10 overflow-y-auto max-h-[calc(100vh-80px)] custom-scrollbar">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="max-w-6xl mx-auto"
                    >
                        {activeTab === 'categories' && (
                            <CategoryEditor presets={presets} onSave={setPresets} />
                        )}
                        {activeTab === 'styles' && (
                            <StyleEditor presets={presets} onSave={setPresets} />
                        )}
                        {activeTab === 'models' && (
                            <ModelEditor presets={presets} onSave={setPresets} />
                        )}
                        {activeTab === 'viewpoints' && (
                            <ViewpointEditor presets={presets} setPresets={setPresets} />
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AdminView;
