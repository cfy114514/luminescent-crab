import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Palette,
    Camera,
    ChevronLeft,
    Settings,
    Layout,
    ArrowLeft,
    User,
    Users
} from 'lucide-react';
import StyleEditor from './StyleEditor';
import ViewpointEditor from './ViewpointEditor';
import ModelEditor from './ModelEditor';
import CategoryEditor from './CategoryEditor';
import SyncSettings from './SyncSettings';
import UserManagement from './UserManagement';
// Contexts
import { useConfig } from '../../contexts/ConfigContext';

const AdminView = ({ onBack }) => {
    const { presets, savePresets: setPresets } = useConfig();
    const [activeTab, setActiveTab] = useState('categories');

    const tabs = [
        { id: 'categories', label: '产品分类管理', icon: Layout },
        // { id: 'styles', label: '风格预设管理', icon: Palette },
        { id: 'models', label: '模特库管理', icon: User },
        { id: 'users', label: '用户管理', icon: Users },
        { id: 'sync', label: '同步与备份', icon: Settings },
        // { id: 'viewpoints', label: '视角/机位配置', icon: Camera },
    ];

    return (
        <div className="min-h-screen bg-[#050510] text-slate-200">
            {/* Header */}
            <header className="min-h-[5rem] border-b border-slate-800/50 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 py-3 sm:py-0 bg-[#050510]/80 backdrop-blur-xl sticky top-0 z-50 gap-4">
                <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                    <button
                        onClick={onBack}
                        aria-label="Back to User Mode"
                        className="p-2 sm:p-3 hover:bg-slate-800 rounded-2xl transition-all group shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 group-hover:text-white" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">Admin Dashboard</h1>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-bold">Presets & Logic Control</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-[10px] sm:text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 whitespace-nowrap">
                        Visual Consistency Engine v2
                    </span>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-800/50 p-4 sm:p-6 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible custom-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap lg:w-full
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
                <div className="flex-1 p-4 sm:p-10 overflow-y-auto max-h-none lg:max-h-[calc(100vh-80px)] custom-scrollbar">
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
                        {activeTab === 'users' && (
                            <UserManagement />
                        )}
                        {activeTab === 'viewpoints' && (
                            <ViewpointEditor presets={presets} setPresets={setPresets} />
                        )}
                        {activeTab === 'sync' && (
                            <SyncSettings presets={presets} onSave={setPresets} />
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AdminView;
