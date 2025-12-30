import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // UI State
    const [activeTab, setActiveTab] = useState('product'); // 'product' or 'model'
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);
    const [zoomedImage, setZoomedImage] = useState(null);

    // Actions
    const toggleAdmin = () => setIsAdminMode(prev => !prev);
    const openInspector = () => setIsInspectorOpen(true);
    const closeInspector = () => setIsInspectorOpen(false);
    const openImageViewer = (url) => setZoomedImage(url);
    const closeImageViewer = () => setZoomedImage(null);

    const value = {
        activeTab,
        setActiveTab,
        isAdminMode,
        toggleAdmin,
        setIsAdminMode, // Direct setter if needed
        isInspectorOpen,
        openInspector,
        closeInspector,
        zoomedImage,
        openImageViewer,
        closeImageViewer
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
