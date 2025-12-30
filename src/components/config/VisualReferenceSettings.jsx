import React, { useState } from 'react';
import { Hash, Sparkles, Upload, X, Camera } from 'lucide-react';

const VisualReferenceSettings = ({ config, onChange, styleReferenceImage, setStyleReferenceImage }) => {
    const [styleRefIsDragging, setStyleRefIsDragging] = useState(false);
    const labelStyle = "text-xs uppercase text-slate-300 font-semibold flex items-center gap-2 mb-2 tracking-wide";

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="flex justify-between items-center">
                    <span className={`${labelStyle} ${config.promptSet === 'B' ? 'text-cyan-400' : ''}`}>
                        <Hash className="w-4 h-4" />
                        {config.promptSet === 'B' ? "服装与场景关键词" : "服装描述 / 风格关键词"}
                    </span>
                </label>
                <div className="relative group">
                    <input
                        type="text"
                        placeholder={config.promptSet === 'B' ? "例如：'Hiking gear', 'Vacation linen'..." : "例如：White linen shirt, studio lighting..."}
                        value={config.clothing || ''}
                        onChange={(e) => onChange('clothing', e.target.value)}
                        className={`w-full bg-slate-900/60 border rounded-xl px-4 py-3 text-sm text-white focus:ring-2 outline-none transition-all shadow-inner
                            ${config.promptSet === 'B' ? 'border-cyan-500/30 focus:border-cyan-500 focus:ring-cyan-500/10' : 'border-white/10 focus:border-purple-500 focus:ring-purple-500/10'}`}
                    />
                    {config.promptSet === 'B' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Sparkles className="w-4 h-4 text-cyan-500/50 animate-pulse" />
                        </div>
                    )}
                </div>
                {config.promptSet === 'B' && (
                    <p className="text-[10px] text-cyan-400/60 italic px-1 font-medium">
                        * 使用如 "hiking", "golf", "resort" 等关键词来触发 AI 场景预设。
                    </p>
                )}
            </div>

            {/* Style Reference Upload */}
            <div className="space-y-3">
                <label className={`${labelStyle} text-amber-500`}>
                    <Camera className="w-4 h-4" /> 风格参考图
                </label>

                {styleReferenceImage ? (
                    <div className="relative group rounded-2xl overflow-hidden border border-amber-500/30 shadow-xl bg-slate-900/40 p-2">
                        <img
                            src={URL.createObjectURL(styleReferenceImage)}
                            alt="Style Reference"
                            className="w-full h-40 object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <button
                                onClick={() => setStyleReferenceImage(null)}
                                className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                            <p className="text-[10px] text-white/80 font-medium truncate">{styleReferenceImage.name}</p>
                        </div>
                    </div>
                ) : (
                    <div
                        className={`group relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer overflow-hidden
                            ${styleRefIsDragging
                                ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                                : 'border-white/10 hover:border-amber-500/40 hover:bg-white/5'}`}
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
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5 group-hover:scale-110 transition-transform">
                                <Upload className={`w-6 h-6 ${styleRefIsDragging ? 'text-amber-400' : 'text-slate-500 group-hover:text-amber-400/70'}`} />
                            </div>
                            <p className="text-sm font-bold text-slate-300 mb-1">上传风格参考图</p>
                            <p className="text-xs text-slate-500">点击或拖拽上传</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VisualReferenceSettings;
