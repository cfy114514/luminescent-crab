import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone'; // Assuming react-dropzone is installed, checking package.json might be good but assuming yes based on previous UploadZone
import { Camera, User, Upload, X, Image as ImageIcon } from 'lucide-react';

// Define the 12 Slots
const VIEW_SLOTS = [
    // Product Views (White BG)
    { id: 'p_front', label: '正视图 (Front)', type: 'product', desc: 'Product Front' },
    { id: 'p_angle', label: '侧角图 (Angle)', type: 'product', desc: 'Product Angle' },
    { id: 'p_back', label: '后视图 (Back)', type: 'product', desc: 'Product Back' },
    { id: 'p_top', label: '俯视图 (Top)', type: 'product', desc: 'Product Top' },
    { id: 'p_detail', label: '细节图 (Detail)', type: 'product', desc: 'Product Detail' },
    { id: 'p_inside', label: '内部结构 (Inside)', type: 'product', desc: 'Product Inside' },

    // Model Views (Hat Stand Replacement)
    { id: 'm_front', label: '模特-正面 (Front)', type: 'model', desc: 'Model Front Upper' },
    { id: 'm_side', label: '模特-侧面 (Side)', type: 'model', desc: 'Model Side Upper' },
    { id: 'm_back', label: '模特-背面 (Back)', type: 'model', desc: 'Model Back Upper' },
    { id: 'm_pose1', label: '模特-展示1 (Pose A)', type: 'model', desc: 'Model Pose A' },
    { id: 'm_pose2', label: '模特-展示2 (Pose B)', type: 'model', desc: 'Model Pose B' },
    { id: 'm_pose3', label: '模特-展示3 (Pose C)', type: 'model', desc: 'Model Pose C' },
];

const SingleSlot = ({ slot, file, onDrop, onRemove }) => {
    const onDropCallback = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            onDrop(slot.id, acceptedFiles[0]);
        }
    }, [slot.id, onDrop]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: onDropCallback,
        accept: { 'image/*': [] },
        maxFiles: 1,
        multiple: false
    });

    // Preview
    const previewUrl = file ? URL.createObjectURL(file) : null;

    return (
        <div
            {...getRootProps()}
            className={`
                relative aspect-square rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-2 text-center group
                ${file ? 'border-transparent bg-slate-900' : 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-purple-500/50'}
                ${isDragActive ? 'border-purple-500 bg-purple-500/10' : ''}
            `}
        >
            <input {...getInputProps()} />

            {file ? (
                <>
                    <img
                        src={previewUrl}
                        alt={slot.label}
                        className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-60 group-hover:opacity-40 transition-opacity"
                    />
                    <div className="z-10 absolute top-1 right-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(slot.id); }}
                            className="p-1 bg-red-500/80 rounded-full text-white hover:bg-red-600 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="z-10 absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl">
                        <span className="text-[10px] font-medium text-white block truncate">{slot.label}</span>
                        <span className="text-[9px] text-slate-300 block truncate">{(file.size / 1024).toFixed(0)}KB</span>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center gap-1 text-slate-500 group-hover:text-purple-400 transition-colors">
                    {slot.type === 'product' ? <Camera className="w-6 h-6 mb-1 opacity-50" /> : <User className="w-6 h-6 mb-1 opacity-50" />}
                    <span className="text-[10px] font-bold">{slot.label}</span>
                    <span className="text-[9px] opacity-70">点击上传</span>
                </div>
            )}
        </div>
    );
};

const MultiViewUpload = ({ viewImages, setViewImages }) => {

    const handleDrop = (slotId, file) => {
        setViewImages(prev => ({ ...prev, [slotId]: file }));
    };

    const handleRemove = (slotId) => {
        setViewImages(prev => {
            const next = { ...prev };
            delete next[slotId];
            return next;
        });
    };

    return (
        <div className="w-full space-y-6">
            {/* Product Views Section */}
            <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                    <Camera className="w-4 h-4 text-blue-400" />
                    产品白底图 (Product White BG)
                </h4>
                <div className="grid grid-cols-3 gap-3">
                    {VIEW_SLOTS.filter(s => s.type === 'product').map(slot => (
                        <SingleSlot
                            key={slot.id}
                            slot={slot}
                            file={viewImages[slot.id]}
                            onDrop={handleDrop}
                            onRemove={handleRemove}
                        />
                    ))}
                </div>
            </div>

            {/* Model Views Section */}
            <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                    <User className="w-4 h-4 text-purple-400" />
                    模特佩戴图 (Model Try-On)
                </h4>
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-3 text-xs text-purple-200">
                    <span className="font-bold">✨ AI Magic:</span> Upload photo with hat stand → AI replaces stand with model.
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {VIEW_SLOTS.filter(s => s.type === 'model').map(slot => (
                        <SingleSlot
                            key={slot.id}
                            slot={slot}
                            file={viewImages[slot.id]}
                            onDrop={handleDrop}
                            onRemove={handleRemove}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MultiViewUpload;
