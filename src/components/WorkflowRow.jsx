import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, User, Play, X, Loader2, Download, Maximize2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WorkflowRow = ({
    slot,
    file,
    result,
    isProcessing,
    onUpload,
    onRemove,
    onGenerate,
    onZoom,
    index
}) => {

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            onUpload(slot.id, acceptedFiles[0]);
        }
    }, [slot.id, onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1,
        multiple: false,
        disabled: isProcessing
    });

    const previewUrl = file ? URL.createObjectURL(file) : null;

    // Helper to determine status color
    const getStatusColor = () => {
        if (result?.error) return 'border-red-500/50 bg-red-500/5';
        if (result?.url) return 'border-green-500/50 bg-green-500/5';
        if (isProcessing) return 'border-blue-500/50 bg-blue-500/5';
        return 'border-slate-700 bg-slate-800/20';
    };

    return (
        <div className={`
            group relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 p-3 rounded-xl border transition-all duration-300
            ${getStatusColor()}
            hover:border-slate-600
        `}>
            {/* Index Badge */}
            <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center justify-center border border-slate-600 shadow-lg z-20 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {index + 1}
            </div>

            {/* 1. INPUT SLOT (Left) */}
            <div
                {...getRootProps()}
                className={`
                    relative w-full aspect-square max-w-[400px] justify-self-end rounded-lg border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-2 text-center overflow-hidden
                    ${file ? 'border-transparent bg-slate-900' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'}
                    ${isDragActive ? 'border-purple-500 bg-purple-500/10' : ''}
                `}
            >
                <input {...getInputProps()} />

                {file ? (
                    <>
                        <img src={previewUrl} alt="Input" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                        <div className="z-10 absolute top-1 right-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(slot.id); }}
                                className="p-1 bg-red-500/80 rounded-full text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove Image"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="z-10 absolute bottom-0 left-0 right-0 p-1 bg-black/60 backdrop-blur-sm">
                            <span className="text-[10px] font-medium text-white block truncate">{slot.label}</span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-500">
                        {slot.type === 'product'
                            ? <Camera className="w-5 h-5 mb-1 opacity-50" />
                            : <User className="w-5 h-5 mb-1 opacity-50" />
                        }
                        <span className="text-[10px] font-bold leading-tight">{slot.label}</span>
                    </div>
                )}
            </div>

            {/* 2. ACTION COMPONENT (Middle) */}
            <div className="flex items-center justify-center">
                {file ? (
                    <button
                        onClick={() => onGenerate(slot.id)}
                        disabled={isProcessing}
                        className={`
                            w-10 h-10 rounded-full flex items-center justify-center transition-all bg-gradient-to-r shadow-lg
                            ${result?.url
                                ? 'from-green-600 to-emerald-600 hover:scale-110 shadow-green-500/20'
                                : 'from-blue-600 to-purple-600 hover:scale-110 shadow-blue-500/20'
                            }
                            ${isProcessing ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
                        `}
                        title="Generate Single View"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                        ) : (
                            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                        )}
                    </button>
                ) : (
                    <div className="w-8 h-1 bg-slate-800 rounded-full opacity-50" />
                )}
            </div>

            {/* 3. RESULT DISPLAY (Right) */}
            <div className={`
                relative w-full aspect-square max-w-[400px] justify-self-start bg-slate-900/50 rounded-lg border border-slate-700/50 flex items-center justify-center overflow-hidden
                ${!result ? 'border-dashed' : ''}
            `}>
                <AnimatePresence mode="wait">
                    {result?.url ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="relative w-full h-full group/result"
                        >
                            <img src={result.url} alt="Result" className="w-full h-full object-contain" />

                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/result:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                <a
                                    href={result.url}
                                    download={`product-ai-${slot.id}.png`}
                                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"
                                    title="Download"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                                <button
                                    onClick={() => onZoom(result.url)}
                                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"
                                    title="Zoom"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* QC Badge */}
                            {result.qc && (
                                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase shadow-sm ${result.qc.score >= 8 ? 'bg-green-500 text-white' : 'bg-amber-500 text-black'
                                    }`}>
                                    QC: {result.qc.score}/10
                                </div>
                            )}
                        </motion.div>
                    ) : result?.error ? (
                        <div className="text-center p-4">
                            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className="text-xs text-red-400 font-mono">{typeof result.error === 'string' ? result.error : 'Generation Failed'}</p>
                        </div>
                    ) : (
                        <div className="text-center text-slate-600">
                            <div className="text-4xl font-black opacity-10 select-none">{slot.id.split('_')[1].toUpperCase()}</div>
                            <span className="text-xs opacity-50">Waiting for generation...</span>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WorkflowRow;
