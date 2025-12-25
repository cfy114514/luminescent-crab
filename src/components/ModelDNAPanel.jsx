import React, { useState } from 'react';
import { Fingerprint, Upload, X, Trash2, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { interrogateImages } from '../services/api';

const ModelDNAPanel = ({ config, setConfig }) => {
    const [dnaImages, setDnaImages] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    const handleUpload = (e) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                id: Math.random().toString(36).substr(2, 9),
                preview: URL.createObjectURL(file),
                label: '默认 (General)'
            }));
            setDnaImages(prev => [...prev, ...newFiles].slice(0, 6)); // Max 6 images
        }
    };

    const removeImage = (id) => {
        setDnaImages(prev => prev.filter(img => img.id !== id));
    };

    const clearAll = () => {
        setDnaImages([]);
        setAnalysisResult(null);
    };

    const handleAlignDNA = async () => {
        if (dnaImages.length === 0) return;
        setIsAnalyzing(true);
        try {
            const files = dnaImages.map(img => img.file);
            const result = await interrogateImages(files, 'model_dna');
            setAnalysisResult(result);

            // Auto-apply basic fields to config
            if (result.predicted_gender) setConfig(prev => ({ ...prev, gender: result.predicted_gender }));
            if (result.predicted_ethnicity) setConfig(prev => ({ ...prev, ethnicity: result.predicted_ethnicity }));

            // Store complex DNA in config
            setConfig(prev => ({
                ...prev,
                modelDNA: result.visual_identity,
                physiqueDNA: result.physique_dna,
                clothing: result.outfit_dna,
                modelId: '' // Switch to custom mode
            }));

        } catch (error) {
            console.error("DNA Extraction Error:", error);
            alert("提取失败: " + error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
                <label className="text-sm text-pink-400 flex items-center gap-2 font-medium">
                    <Fingerprint className="w-4 h-4" /> 模特面部/基因特征提取 (Identity DNA)
                </label>
                <div className="flex gap-2">
                    <button
                        onClick={clearAll}
                        className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                    >
                        <Trash2 className="w-3 h-3" /> 一键清空
                    </button>
                </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <b className="text-pink-300">操作指引：</b>由管理员上传模特的真实照片。AI 将专门提取面部比例、眼睛、肤色等固定特征。注意：姿势描述已移至“视角/机位配置”中统一管理。
            </p>

            {/* Grid for Uploaded Images */}
            <div className="grid grid-cols-3 gap-2">
                {dnaImages.map((img) => (
                    <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                        <img src={img.preview} alt="Model DNA" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5">
                            <select
                                value={img.label}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setDnaImages(prev => prev.map(i => i.id === img.id ? { ...i, label: val } : i));
                                }}
                                className="w-full bg-slate-800 text-[9px] text-white border border-slate-600 rounded px-1 py-0.5 outline-none mb-1"
                            >
                                <option>默认 (General)</option>
                                <option>正面 (Front)</option>
                                <option>侧面 (Side)</option>
                                <option>全身 (Full Body)</option>
                            </select>
                        </div>
                        <button
                            onClick={() => removeImage(img.id)}
                            className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </div>
                ))}

                {dnaImages.length < 6 && (
                    <label className="aspect-square border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center hover:border-pink-500/50 hover:bg-pink-500/5 cursor-pointer transition-all">
                        <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
                        <Upload className="w-5 h-5 text-slate-500 mb-1" />
                        <span className="text-[9px] text-slate-500">添加参考图</span>
                    </label>
                )}
            </div>

            <button
                onClick={handleAlignDNA}
                disabled={isAnalyzing || dnaImages.length === 0}
                className={`
                    w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg
                    ${isAnalyzing || dnaImages.length === 0
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white hover:scale-[1.01] active:scale-[0.98]'
                    }
                `}
            >
                {isAnalyzing ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>正在提取模特 DNA...</span>
                    </>
                ) : (
                    <>
                        <Fingerprint className="w-5 h-5" />
                        <span>一键对齐模特 DNA</span>
                    </>
                )}
            </button>

            {analysisResult && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-2">
                        <CheckCircle2 className="w-4 h-4" /> 提取成功 (Extraction Successful)
                    </div>
                    <div className="space-y-2">
                        <div>
                            <span className="text-[9px] text-slate-400 block uppercase">IDENTITY DNA:</span>
                            <p className="text-[10px] text-emerald-200/80 line-clamp-2">{analysisResult.visual_identity}</p>
                        </div>
                        <div>
                            <span className="text-[9px] text-slate-400 block uppercase">OUTFIT DNA:</span>
                            <p className="text-[10px] text-emerald-200/80 line-clamp-2">{analysisResult.outfit_dna}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModelDNAPanel;
