import React from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageViewer = ({ isOpen, imageUrl, onClose }) => {
    if (!isOpen || !imageUrl) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative max-w-full max-h-full flex flex-col items-center justify-center p-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <img
                        src={imageUrl}
                        alt="Zoomed Review"
                        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
                    />

                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={onClose}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            title="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <a
                            href={imageUrl}
                            download="zoomed-image.png"
                            className="p-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors flex items-center gap-2"
                            title="Download"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Download className="w-6 h-6" />
                        </a>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ImageViewer;
