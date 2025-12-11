import React from 'react';
import { X, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RequestInspector = ({ isOpen, onClose, payload }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800">
                            <div className="flex items-center space-x-2 text-blue-400">
                                <Code className="w-5 h-5" />
                                <h3 className="font-semibold text-white">API Request Inspector</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-auto custom-scrollbar">
                            <p className="text-sm text-slate-400 mb-4">
                                以下是将发送给 Nanobanana API 的完整请求载荷 (Payload)。您可以检查参数是否符合预期。
                            </p>

                            <div className="bg-black/50 rounded-lg p-4 border border-slate-700 font-mono text-xs md:text-sm text-green-400 overflow-x-auto">
                                <pre>{JSON.stringify(payload, null, 2)}</pre>
                            </div>

                            <div className="mt-4 text-xs text-slate-500">
                                * Image data (Binary) is represented as "[Binary Data]" for display purposes.
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RequestInspector;
