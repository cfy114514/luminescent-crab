import React from 'react';

const SkeletonLoader = ({ width = "100%", height = "100%", className = "", borderRadius = "0.5rem" }) => {
    return (
        <div
            className={`relative overflow-hidden bg-slate-800/50 ${className}`}
            style={{ width, height, borderRadius }}
        >
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
    );
};

export default SkeletonLoader;
