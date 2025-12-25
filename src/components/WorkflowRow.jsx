import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, User, Play, X, Loader2, Download, Maximize2, AlertCircle, Map, Focus, RotateCcw, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WorkflowRow = ({
    slot,
    file,
    poseFile,
    result,
    isProcessing,
    onUpload,
    onPoseUpload,
    onRemove,
    onPoseRemove,
    onGenerate,
    onZoom,
    index,
    metadata,
    onMetadataChange
}) => {

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            onUpload(slot.id, acceptedFiles[0]);
        }
    }, [slot.id, onUpload]);

    const onPoseDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            onPoseUpload(slot.id, acceptedFiles[0]);
        }
    }, [slot.id, onPoseUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1,
        multiple: false,
        disabled: isProcessing
    });

    const { getRootProps: getPoseRootProps, getInputProps: getPoseInputProps, isDragActive: isPoseDragActive } = useDropzone({
        onDrop: onPoseDrop,
        accept: { 'image/*': [] },
        maxFiles: 1,
        multiple: false,
        disabled: isProcessing
    });

    const previewUrl = file ? URL.createObjectURL(file) : null;
    const posePreviewUrl = poseFile ? URL.createObjectURL(poseFile) : null;

    const getStatusColor = () => {
        if (result?.error) return 'border-red-500/50 bg-red-500/5';
        if (result?.url) return 'border-green-500/50 bg-green-500/5';
        if (isProcessing) return 'border-blue-500/50 bg-blue-500/5';
        return 'border-slate-700 bg-slate-800/20';
    };

    const perspectives = [
        { id: 'front', label: '正', icon: Layout, color: 'text-blue-400' },
        { id: 'side', label: '侧', icon: Focus, color: 'text-green-400' },
        { id: 'back', label: '背', icon: RotateCcw, color: 'text-purple-400' },
        { id: 'angle', label: '斜', icon: Map, color: 'text-amber-400' },
    ];

    return (
        <div className={`
            group relative grid grid-cols-1 md:grid-cols-[auto_1fr_auto_1fr] gap-4 p-3 rounded-xl border transition-all duration-300
            ${getStatusColor()}
            hover:border-slate-600
        `}>
            {/* Index Badge */}
            <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center justify-center border border-slate-600 shadow-lg z-20 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {index + 1}
            </div>

            {/* 0. PERSPECTIVE SELECTOR + POSE REFERENCE */}
            <div className="flex items-center gap-3">
                {/* Manual Perspective Selector */}
                <div className="flex flex-col gap-1.5 p-1.5 bg-slate-900/50 rounded-lg border border-slate-800">
                    <span className="text-[7px] font-black text-slate-500 uppercase text-center mb-0.5">Focus</span>
                    {perspectives.map(p => {
                        const isActive = metadata?.perspective === p.id;
                        return (
                            <button
                                key={p.id}
                                onClick={() => onMetadataChange(slot.id, { ...metadata, perspective: isActive ? null : p.id })}
                                className={`
                                    w-8 h-8 rounded-md flex flex-col items-center justify-center transition-all
                                    ${isActive
                                        ? 'bg-white/10 ring-1 ring-white/20'
                                        : 'hover:bg-white/5 opacity-40 hover:opacity-100'}
                                `}
                                title={`${p.label}面对正 (Locked to ${p.id} perspective)`}
                            >
                                <p.icon className={`w-3.5 h-3.5 ${isActive ? p.color : 'text-slate-400'}`} />
                                <span className={`text-[8px] font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>{p.label}</span>
                            </button>
                        );
                    })}
                </div>

                {slot.type === 'model' && (
                    <div
                        {...getPoseRootProps()}
                        className={`
                        relative w-32 aspect-[3/4] rounded-lg border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-2 text-center overflow-hidden
                        ${poseFile ? 'border-transparent bg-slate-900' : 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10'}
                        ${isPoseDragActive ? 'border-purple-500 bg-purple-500/20' : ''}
                    `}
                    >
                        <input {...getPoseInputProps()} />
                        {poseFile ? (
                            <>
                                <img src={posePreviewUrl} alt="Pose Ref" className="absolute inset-0 w-full h-full object-cover opacity-70" />
                                <div className="z-10 absolute top-1 right-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onPoseRemove(slot.id); }}
                                        className="p-1 bg-red-500/80 rounded-full text-white hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-2.5 h-2.5" />
                                    </button>
                                </div>
                                <div className="z-10 absolute bottom-0 left-0 right-0 p-0.5 bg-purple-600/80">
                                    <span className="text-[8px] font-bold text-white uppercase">Pose Ref</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-1 text-purple-400 opacity-60">
                                <User className="w-5 h-5" />
                                <span className="text-[8px] font-bold">参考姿势</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 1. INPUT SLOT (Hat Asset) */}
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
                        <div className="z-10 absolute bottom-0 left-0 right-0 p-1 bg-blue-600/80">
                            <span className="text-[10px] font-bold text-white block truncate">
                                {slot.type === 'model' ? 'HAT ASSET' : slot.label}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-500">
                        {slot.type === 'product'
                            ? <Camera className="w-5 h-5 mb-1 opacity-50" />
                            : <Camera className="w-5 h-5 mb-1 opacity-50 text-blue-400" />
                        }
                        <span className="text-[10px] font-bold leading-tight">
                            {slot.type === 'model' ? '帽子原图' : slot.label}
                        </span>
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
