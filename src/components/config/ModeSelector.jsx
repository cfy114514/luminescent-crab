import React from 'react';
import { Sparkles, Layers, Box } from 'lucide-react';

const ModeSelector = ({ activeMode, onChange }) => {
    const modes = [
        { id: 'A', label: 'Standard', icon: <Box className="w-3.5 h-3.5" />, color: 'slate' },
        { id: 'B', label: 'Lifestyle', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'cyan' },
        { id: 'C', label: 'Compositor', icon: <Layers className="w-3.5 h-3.5" />, color: 'amber' },
    ];

    return (
        <div className="flex bg-slate-900/40 backdrop-blur-md rounded-xl p-1 border border-white/5 shadow-inner">
            {modes.map((mode) => {
                const isActive = activeMode === mode.id || (mode.id === 'A' && !activeMode);
                const activeClasses = {
                    slate: 'bg-slate-700/50 text-white shadow-lg border-white/10',
                    cyan: 'bg-gradient-to-r from-cyan-600/80 to-blue-600/80 text-white shadow-lg shadow-cyan-900/20 border-cyan-500/20',
                    amber: 'bg-gradient-to-r from-amber-500/80 to-orange-500/80 text-white shadow-lg shadow-amber-900/20 border-amber-400/20',
                };

                return (
                    <button
                        key={mode.id}
                        onClick={() => onChange('promptSet', mode.id)}
                        className={`px-4 py-2 text-[11px] font-bold rounded-lg transition-all flex items-center gap-2 border border-transparent 
                            ${isActive ? activeClasses[mode.color] : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                    >
                        {mode.icon}
                        <span>{mode.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default ModeSelector;
