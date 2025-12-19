import React, { useState, useRef } from 'react';
import { Upload, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UploadZone = ({ images = [], onImagesChange, isProcessing, fixedLabel = null, className = "" }) => {
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

    const detectLabelFromFilename = (filename) => {
        const lower = filename.toLowerCase();
        if (lower.includes('front') || lower.includes('正面')) return 'front';
        if (lower.includes('back') || lower.includes('rear') || lower.includes('背面')) return 'back';
        if (lower.includes('top') || lower.includes('flat') || lower.includes('顶')) return 'top_overhead';
        if (lower.includes('inside') || lower.includes('inner') || lower.includes('lining') || lower.includes('内')) return 'inside';
        if (lower.includes('detail') || lower.includes('texture') || lower.includes('macro') || lower.includes('细')) return 'detail';
        if (lower.includes('angle') || lower.includes('斜')) {
            if (lower.includes('left') || lower.includes('左')) return 'angle_left';
            if (lower.includes('right') || lower.includes('右')) return 'angle_right';
            return 'angle_front';
        }
        if (lower.includes('side') || lower.includes('侧')) {
            if (lower.includes('left') || lower.includes('左')) return 'side_left';
            if (lower.includes('right') || lower.includes('右')) return 'side_right';
            return 'side_left';
        }
        return 'general';
    };

    const processFiles = (newFiles) => {
        const validFiles = newFiles.filter(file => file.type.startsWith('image/'));
        const newImageObjects = validFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            label: fixedLabel || detectLabelFromFilename(file.name),
            preview: URL.createObjectURL(file)
        }));
        onImagesChange([...images, ...newImageObjects]);
    };

    const removeImage = (idToRemove) => {
        const updated = images.filter(img => img.id !== idToRemove);
        onImagesChange(updated);
    };

    const updateLabel = (id, newLabel) => {
        const updated = images.map(img =>
            img.id === id ? { ...img, label: newLabel } : img
        );
        onImagesChange(updated);
    };

    const labelOptions = [
        { value: 'general', label: '默认 (General)' },
        { value: 'front', label: '正面 (Front 0°)' },
        { value: 'angle_left', label: '左斜侧 (Angle Left 45°)' },
        { value: 'angle_right', label: '右斜侧 (Angle Right 45°)' },
        { value: 'side_left', label: '左侧面 (Side Left 90°)' },
        { value: 'side_right', label: '右侧面 (Side Right 90°)' },
        { value: 'back', label: '背面 (Back 180°)' },
        { value: 'top_overhead', label: '顶视 (Top Flat Lay)' },
        { value: 'inside', label: '内饰 (Inside/Lining)' },
        { value: 'detail', label: '细节 (Detail/Texture)' },
    ];

    return (
        <div className={`w-full h-full flex flex-col gap-4 ${className}`}>
            <div
                className={`
                    relative group cursor-pointer
                    rounded-2xl border-2 border-dashed transition-all duration-300
                    flex flex-col justify-center items-center
                    ${images.length === 0 ? 'h-64' : 'h-32'}
                    ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-blue-400 hover:bg-slate-800/50 glass-panel'}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    id="file-upload-input"
                    name="fileUpload"
                    type="file"
                    ref={inputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                />

                <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="p-3 rounded-full bg-slate-800/50 group-hover:bg-blue-500/20 transition-colors">
                        {images.length === 0 ? (
                            <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
                        ) : (
                            <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
                        )}
                    </div>
                    <div>
                        <p className="text-slate-300 text-sm font-medium">
                            {images.length === 0 ? "拖拽产品图片到这里" : "添加更多参考图"}
                        </p>
                        <p className="text-slate-500 text-xs mt-1">
                            {fixedLabel ? `上传将自动标记为: ${fixedLabel}` : "支持多图上传 / JPG, PNG"}
                        </p>
                    </div>
                </div>
            </div>

            {images.length > 0 && (
                <div className="flex-1 overflow-y-auto min-h-[100px] custom-scrollbar">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-slate-400 font-medium">
                            {fixedLabel ? "已上传参考图" : "为图片指定视角 (Label Views)"}
                        </p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('确定要清空所有已上传的图片吗？')) {
                                    onImagesChange([]);
                                }
                            }}
                            className="text-[10px] flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all font-bold"
                        >
                            <X className="w-3 h-3" /> 一键清空
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <AnimatePresence>
                            {images.map((img) => (
                                <motion.div
                                    key={img.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="relative flex gap-3 p-2 rounded-lg bg-slate-800/50 border border-slate-700 group"
                                >
                                    <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0">
                                        <img
                                            src={img.preview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <div className="flex flex-col justify-between flex-1 py-1">
                                        {!fixedLabel ? (
                                            <select
                                                value={img.label}
                                                onChange={(e) => updateLabel(img.id, e.target.value)}
                                                className="bg-slate-900 border border-slate-600 text-xs text-white rounded px-2 py-1 outline-none focus:border-blue-500"
                                            >
                                                {labelOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest bg-blue-400/10 px-2 py-1 rounded inline-block self-start">
                                                Label: {img.label}
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            {!isProcessing && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                                                    className="p-1.5 bg-slate-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
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
