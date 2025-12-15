import React, { useState } from 'react';
import { Download, Maximize2, X, Image as ImageIcon, Package, ShieldCheck, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const ResultGallery = ({ results }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [isZipping, setIsZipping] = useState(false);

    if (!results) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 opacity-50" />
                </div>
                <p>暂无生成结果，请上传图片并开始生成</p>
            </div>
        );
    }

    const handleDownload = (url, label) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `product-ai-${label}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAll = async () => {
        setIsZipping(true);
        const zip = new JSZip();
        const folder = zip.folder("product-ai-images");

        const images = Object.values(results);

        await Promise.all(images.map(async (img) => {
            // Fetch blob from data URL or remote URL
            const response = await fetch(img.url);
            const blob = await response.blob();
            // Sanitize filename
            const filename = `${img.label.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}.png`;
            folder.file(filename, blob);
        }));

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `product-ai-set-${Date.now()}.zip`);
        setIsZipping(false);
    };

    const images = Object.values(results);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                {/* Header Action Bar */}
                <div className="md:col-span-2 flex justify-end gap-2 mb-2">
                    <button
                        onClick={handleDownloadAll}
                        disabled={isZipping}
                        className="flex items-center space-x-2 text-xs text-white hover:bg-white/10 transition-colors px-3 py-1.5 rounded-full border border-white/20"
                    >
                        {isZipping ? (
                            <span className="animate-pulse">打包中...</span>
                        ) : (
                            <>
                                <Package className="w-3 h-3" />
                                <span>全部打包下载 (.zip)</span>
                            </>
                        )}
                    </button>
                </div>

                {images.map((item, index) => {
                    // DEBUG: Check if QC data is present
                    console.log(`[Gallery] Image ${index}:`, item.label, "QC:", item.qc);
                    return (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`
              relative group rounded-xl overflow-hidden glass-panel border border-white/5
              ${index === 0 ? 'md:col-span-2 md:aspect-[2/1]' : 'aspect-square'}
            `}
                        >
                            {/* QC Badge */}
                            {item.qc && (
                                <div className={`absolute top-3 left-3 z-20 px-3 py-1.5 rounded-lg backdrop-blur-md border ${item.qc.score >= 8
                                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100'
                                    : 'bg-rose-500/20 border-rose-500/50 text-rose-100'
                                    } flex items-center gap-2 shadow-lg cursor-help transition-all duration-300 hover:scale-105`}>
                                    {item.qc.score >= 8 ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                    <span className="text-xs font-bold font-mono">QC:{item.qc.score}</span>

                                    {/* Tooltip */}
                                    <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-slate-950/95 border border-white/10 rounded-xl text-xs text-left shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none backdrop-blur-xl z-50">
                                        <div className={`font-bold text-sm mb-2 pb-2 border-b border-white/10 ${item.qc.score >= 8 ? "text-emerald-400" : "text-rose-400"
                                            }`}>
                                            {item.qc.score >= 8 ? "✅ AI Supervisor Passed" : "⚠️ AI Review Flagged"}
                                        </div>
                                        <div className="text-slate-300 leading-relaxed mb-2">
                                            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block mb-1">Reasoning</span>
                                            {item.qc.reason}
                                        </div>
                                        {item.qc.retry_suggestion && (
                                            <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg mt-2">
                                                <span className="text-amber-500 font-bold uppercase text-[10px] tracking-wider block mb-1">Auto-Fix Suggestion</span>
                                                <span className="text-amber-200">{item.qc.retry_suggestion}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <img
                                src={item.url}
                                alt={item.label}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                                    <span className="text-white font-medium">{item.label}</span>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleDownload(item.url, item.label)}
                                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"
                                            title="下载原图"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setSelectedImage(item)}
                                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"
                                            title="查看大图"
                                        >
                                            <Maximize2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
            </div>

            {/* Lightbox / Zoom Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
                        >
                            <X className="w-8 h-8" />
                        </button>

                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            src={selectedImage.url}
                            alt={selectedImage.label}
                            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                        />

                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(selectedImage.url, selectedImage.label);
                                }}
                                className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                下载图片
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ResultGallery;
