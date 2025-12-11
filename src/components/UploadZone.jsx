import React, { useState, useRef } from 'react';
import { Upload, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UploadZone = ({ files = [], onFilesChange, isProcessing }) => {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(Array.from(e.target.files));
        }
    };

    const processFiles = (newFiles) => {
        const validFiles = newFiles.filter(file => file.type.startsWith('image/'));
        // callback to parent to append files
        onFilesChange([...files, ...validFiles]);
    };

    const removeFile = (indexToRemove) => {
        const updated = files.filter((_, index) => index !== indexToRemove);
        onFilesChange(updated);
    };

    // Helper to generate preview URL safe
    const getPreview = (file) => URL.createObjectURL(file);

    return (
        <div className="w-full h-full flex flex-col gap-4">
            {/* Main Drop Zone (Always visible if empty, or small if has files?) 
                Le's keep it consistent: A drop zone that adds to the list 
            */}

            <div
                className={`
                    relative group cursor-pointer
                    rounded-2xl border-2 border-dashed transition-all duration-300
                    flex flex-col justify-center items-center
                    ${files.length === 0 ? 'h-64' : 'h-32'}
                    ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-blue-400 hover:bg-slate-800/50 glass-panel'}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={inputRef}
                    className="hidden"
                    accept="image/*"
                    multiple // Enable multiple
                    onChange={handleFileChange}
                />

                <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="p-3 rounded-full bg-slate-800/50 group-hover:bg-blue-500/20 transition-colors">
                        {files.length === 0 ? (
                            <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
                        ) : (
                            <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
                        )}
                    </div>
                    <div>
                        <p className="text-slate-300 text-sm font-medium">
                            {files.length === 0 ? "拖拽产品图片到这里" : "添加更多参考图"}
                        </p>
                        <p className="text-slate-500 text-xs mt-1">支持多图上传 / JPG, PNG</p>
                    </div>
                </div>
            </div>

            {/* Thumbnails Grid */}
            {files.length > 0 && (
                <div className="flex-1 overflow-y-auto min-h-[100px] custom-scrollbar">
                    <p className="text-xs text-slate-400 mb-2 font-medium">参考图片列表 ({files.length})</p>
                    <div className="grid grid-cols-3 gap-3">
                        <AnimatePresence>
                            {files.map((file, index) => (
                                <motion.div
                                    key={`${file.name}-${index}`}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 group"
                                >
                                    <img
                                        src={getPreview(file)}
                                        alt="thumb"
                                        className="w-full h-full object-cover"
                                    />
                                    {!isProcessing && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(index);
                                            }}
                                            className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadZone;
