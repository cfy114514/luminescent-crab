import React, { useState, useRef } from 'react';
import { Upload, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UploadZone = ({ images = [], onImagesChange, isProcessing }) => {
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
        // Front
        if (lower.includes('front') || lower.includes('正面')) return 'front';

        // Back
        if (lower.includes('back') || lower.includes('rear') || lower.includes('背面')) return 'back';

        // Top
        if (lower.includes('top') || lower.includes('flat') || lower.includes('顶')) return 'top_overhead';

        // Inside
        if (lower.includes('inside') || lower.includes('inner') || lower.includes('lining') || lower.includes('内')) return 'inside';

        // Detail
        if (lower.includes('detail') || lower.includes('texture') || lower.includes('macro') || lower.includes('细')) return 'detail';

        // Angles
        if (lower.includes('angle') || lower.includes('斜')) {
            if (lower.includes('left') || lower.includes('左')) return 'angle_left';
            if (lower.includes('right') || lower.includes('右')) return 'angle_right';
            return 'angle_front'; // Generic fallback if just 'angle'
        }

        // Sides
        if (lower.includes('side') || lower.includes('侧')) {
            if (lower.includes('left') || lower.includes('左')) return 'side_left';
            if (lower.includes('right') || lower.includes('右')) return 'side_right';
            return 'side_left'; // Default fallback
        }

        return 'general';
    };

    const processFiles = (newFiles) => {
        const validFiles = newFiles.filter(file => file.type.startsWith('image/'));
        const newImageObjects = validFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            label: detectLabelFromFilename(file.name), // Auto-detect
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
        <div className="w-full h-full flex flex-col gap-4">
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
                    aria-label="Upload Reference Images"
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
                        <p className="text-slate-500 text-xs mt-1">支持多图上传 / JPG, PNG</p>
                        <p className="text-yellow-500/80 text-[10px] mt-2 bg-yellow-500/10 px-2 py-1 rounded">
                            * 提示：为获得准确的【背面/内部】生成，请务必上传实拍的背面和内饰参考图
                        </p>
                    </div>
                </div>
            </div>

            {/* Thumbnails Grid */}
            {images.length > 0 && (
                <div className="flex-1 overflow-y-auto min-h-[100px] custom-scrollbar">
                    <p className="text-xs text-slate-400 mb-2 font-medium">为图片指定视角 (Label Views)</p>
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
                                            alt="Reference Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <div className="flex flex-col justify-between flex-1 py-1">
                                        <select
                                            id={`label-select-${img.id}`}
                                            name={`label-select-${img.id}`}
                                            value={img.label}
                                            onChange={(e) => updateLabel(img.id, e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="bg-slate-900 border border-slate-600 text-xs text-white rounded px-2 py-1 outline-none focus:border-blue-500"
                                            aria-label="Select Image View Label"
                                            title="Assign View Label"
                                        >
                                            {labelOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>

                                        <div className="flex justify-end">
                                            {!isProcessing && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeImage(img.id);
                                                    }}
                                                    className="p-1.5 bg-slate-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                                                    aria-label="Remove Image"
                                                    title="Remove Image"
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
