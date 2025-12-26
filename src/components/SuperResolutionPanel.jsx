import React, { useState } from 'react';
import { Upload, Zap, Download, Loader2, ImageIcon, X } from 'lucide-react';
import { upscaleImage } from '../services/api';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const SuperResolutionPanel = ({ config }) => {
    const [sourceImages, setSourceImages] = useState([]);
    const [targetResolution, setTargetResolution] = useState('2K');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [results, setResults] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            id: Date.now() + Math.random()
        }));

        setSourceImages(prev => [...prev, ...newImages]);
        setError('');
    };

    const removeImage = (id) => {
        setSourceImages(prev => prev.filter(img => img.id !== id));
        setResults(prev => prev.filter(r => r.id !== id));
    };

    const handleBatchUpscale = async () => {
        if (sourceImages.length === 0) {
            setError('请先上传图片');
            return;
        }

        setIsProcessing(true);
        setError('');
        setProgress({ current: 0, total: sourceImages.length });
        setResults([]);

        const newResults = [];

        for (let i = 0; i < sourceImages.length; i++) {
            const img = sourceImages[i];
            try {
                const upscaled = await upscaleImage(img.file, targetResolution, config);
                newResults.push({
                    id: img.id,
                    original: img.preview,
                    upscaled,
                    filename: img.file.name
                });
            } catch (err) {
                console.error(`[SuperResolution] Failed for ${img.file.name}: `, err);
                newResults.push({
                    id: img.id,
                    original: img.preview,
                    error: err.message,
                    filename: img.file.name
                });
            }
            setProgress({ current: i + 1, total: sourceImages.length });

            // Add delay to avoid rate limiting (2 seconds between requests)
            if (i < sourceImages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        setResults(newResults);
        setIsProcessing(false);
    };

    const handleDownloadAll = async () => {
        if (results.length === 0) return;

        const zip = new JSZip();

        results.forEach((result, index) => {
            if (result.upscaled) {
                const base64Data = result.upscaled.split(',')[1];
                zip.file(`upscaled_${targetResolution}_${index + 1}.png`, base64Data, { base64: true });
            }
        });

        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(blob, `upscaled_batch_${targetResolution}_${Date.now()}.zip`);
    };

    const handleDownloadSingle = (dataUrl, filename) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `upscaled_${targetResolution}_${filename} `;
        link.click();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400 font-medium">
                <Zap className="w-5 h-5" />
                <span>超分辨率 (Super-Resolution)</span>
            </div>

            {/* Upload Area */}
            <div className="space-y-2">
                <div
                    className={`block border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 hover:border-purple-500/50 hover:bg-slate-800/30'
                        }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files) handleImageUpload({ target: { files: e.dataTransfer.files } });
                    }}
                    onClick={() => document.getElementById('sr-upload-input').click()}
                >
                    <input
                        id="sr-upload-input"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                    <div className="pointer-events-none"> {/* Prevent events on children interfering with drag */}
                        <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-purple-400' : 'text-slate-500'}`} />
                        <span className={`text-sm ${isDragging ? 'text-purple-300' : 'text-slate-400'}`}>
                            {isDragging ? "释放以上传图片" : "点击或拖拽上传图片 (支持多选)"}
                        </span>
                        {sourceImages.length > 0 && (
                            <div className="text-xs text-purple-400 mt-1">
                                已选择 {sourceImages.length} 张图片
                            </div>
                        )}
                    </div>
                </div>

                {/* Image Previews */}
                {sourceImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                        {sourceImages.map(img => (
                            <div key={img.id} className="relative group">
                                <img
                                    src={img.preview}
                                    alt="Source"
                                    className="w-full h-20 object-cover rounded border border-slate-700"
                                />
                                <button
                                    onClick={() => removeImage(img.id)}
                                    className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Resolution Selector */}
            <div className="space-y-2">
                <label className="text-sm text-slate-300">目标分辨率</label>
                <select
                    value={targetResolution}
                    onChange={(e) => setTargetResolution(e.target.value)}
                    className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
                >
                    <option value="1K">1K (1024×1024)</option>
                    <option value="2K">2K (2048×2048)</option>
                    <option value="4K">4K (4096×4096)</option>
                </select>
            </div>

            {/* Upscale Button */}
            <button
                onClick={handleBatchUpscale}
                disabled={sourceImages.length === 0 || isProcessing}
                className={`
w - full py - 3 px - 4 rounded - lg font - medium text - sm transition - all flex items - center justify - center gap - 2
                    ${isProcessing || sourceImages.length === 0
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-purple-500/25'
                    }
`}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>处理中 ({progress.current}/{progress.total})</span>
                    </>
                ) : (
                    <>
                        <Zap className="w-4 h-4" />
                        <span>批量超分辨率 ({sourceImages.length}张)</span>
                    </>
                )}
            </button>

            {/* Error Display */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
                    {error}
                </div>
            )}

            {/* Results Display */}
            {results.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-green-400 font-medium">
                            完成 {results.filter(r => r.upscaled).length}/{results.length}
                        </span>
                        <button
                            onClick={handleDownloadAll}
                            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            <Download className="w-3 h-3" />
                            打包下载全部
                        </button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {results.map((result) => (
                            <div key={result.id} className="p-2 bg-slate-800/50 rounded border border-slate-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-slate-400 truncate">{result.filename}</span>
                                    {result.upscaled && (
                                        <button
                                            onClick={() => handleDownloadSingle(result.upscaled, result.filename)}
                                            className="text-xs text-purple-400 hover:text-purple-300"
                                        >
                                            <Download className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                    <img
                                        src={result.original}
                                        alt="Original"
                                        className="w-full h-20 object-cover rounded"
                                    />
                                    {result.upscaled ? (
                                        <img
                                            src={result.upscaled}
                                            alt="Upscaled"
                                            className="w-full h-20 object-cover rounded border border-purple-500/50"
                                        />
                                    ) : (
                                        <div className="w-full h-20 flex items-center justify-center bg-red-500/10 rounded text-xs text-red-400">
                                            失败
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperResolutionPanel;
