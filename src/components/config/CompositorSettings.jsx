import React from 'react';

const CompositorSettings = ({ config, onChange }) => {
    return (
        <div className="flex items-center justify-between py-2 px-3 bg-amber-900/20 rounded-lg border border-amber-500/30">
            <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-300">🔗 Clone Mode (克隆模式)</span>
                <span className="text-[10px] text-amber-200/60">
                    完全克隆参考图的姿势 + 着装，仅替换脸部和帽子
                </span>
            </div>
            <button
                onClick={() => onChange('cloneOutfitFromRef', !config.cloneOutfitFromRef)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${config.cloneOutfitFromRef ? 'bg-amber-500' : 'bg-slate-700'}`}
            >
                <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${config.cloneOutfitFromRef ? 'translate-x-5' : 'translate-x-1'}`}
                />
            </button>
        </div>
    );
};

export default CompositorSettings;
