import React from 'react';
import { Sparkles, Settings } from 'lucide-react';
import { AppProvider, useApp } from './contexts/AppContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { GenerationProvider, useGeneration } from './contexts/GenerationContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';

// Components
import WorkflowRow from './components/WorkflowRow';
import ConfigPanel from './components/ConfigPanel';
import RequestInspector from './components/RequestInspector';
import RefinementChat from './components/RefinementChat';
import AdminView from './components/Admin/AdminView';
import ImageViewer from './components/ImageViewer';
import LoginPage from './components/LoginPage';
import { Loader2, Play, Trash2, Package } from 'lucide-react';
import { useConfig } from './contexts/ConfigContext';
// 1. Inner App Content (Consumes Contexts)
const AppContent = () => {
  const {
    activeTab,
    isAdminMode,
    toggleAdmin,
    isInspectorOpen,
    openInspector,
    closeInspector,
    zoomedImage,
    closeImageViewer
  } = useApp();

  // Keyboard shortcut to toggle Inspector (Ctrl+I)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        isInspectorOpen ? closeInspector() : openInspector();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInspectorOpen, openInspector, closeInspector]);

  const { lastPayload } = useGeneration();

  return (
    <div className="min-h-screen p-4 md:p-8 selection:bg-blue-500/30">
      <RequestInspector
        isOpen={isInspectorOpen}
        onClose={closeInspector}
        payload={lastPayload}
      />

      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl opacity-30 mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl opacity-30 mix-blend-screen" />
      </div>

      {/* Header */}
      <header className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Sparkles className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          ProductAI 智能图生图 (Cutout Studio)
        </span>
        <button
          onClick={toggleAdmin}
          className="ml-auto p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-purple-400 transition-colors"
          title="Open Admin Dashboard"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Admin View Overlay */}
      {isAdminMode && (
        <div className="fixed inset-0 z-[100] animate-in fade-in duration-300">
          {/* AdminView will need to be refactored to use Context if it takes props, 
               but for now we might need to pass trivial props or refactor it later. 
               Assuming AdminView connects to useConfig internally or via props. 
               Let's assume it needs refactoring or we pass simple props if possible.
               Actually, AdminView uses presets/setPresets. We can access that from useConfig inside it.
               For this step, we'll wrap it or pass null if it self-manages.
           */}
          <AdminView onBack={toggleAdmin} />
        </div>
      )}

      {/* Main Split Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)] min-h-[600px]">

        {/* Left Column: Config Panel (1/3) */}
        <div className="w-full lg:col-span-1 flex-shrink-0 h-full overflow-y-auto custom-scrollbar lg:sticky lg:top-0 space-y-6">
          <ConfigPanel />
        </div>

        {/* Right Column: Workflow Rows (2/3) */}
        <div className="lg:col-span-2 flex-1 h-full flex flex-col gap-6">

          {/* Action Bar & Tab Switcher */}
          <ActionBar /> {/* We'll extract actionable buttons here */}

          {/* Workflow List */}
          <WorkflowList />

        </div>
      </main>

      {/* Refinement Chat Tool */}
      <RefinementChat />

      {/* Image Viewer Lightbox */}
      <ImageViewer
        isOpen={!!zoomedImage}
        imageUrl={zoomedImage}
        onClose={closeImageViewer}
      />
    </div>
  );
};

// 2. Sub-components (Inline for now to replace monolithic App logic)

const ActionBar = () => {
  const { setActiveTab, activeTab } = useApp();
  const {
    generateAll, clearAll, downloadAll,
    isProcessing, results, error, statusMessage, viewImages
  } = useGeneration();
  const { outfitSuggestion } = useConfig(); // Needed for displayStatus logic if we want to show analysis status? 
  // Actually displayStatus was keys off isAnalyzing. 
  // Let's get isAnalyzing from ConfigContext
  const { isAnalyzing, analysisStatus } = useConfig();

  const displayStatus = isAnalyzing ? analysisStatus : statusMessage;
  const displayError = error; // or analysisError if we merge them

  return (
    <div className="flex flex-col gap-4">
      <div className="flex-shrink-0 flex gap-4">
        {/* Clear Button */}
        <button
          onClick={clearAll}
          disabled={isProcessing || Object.keys(viewImages).length === 0}
          className="p-4 rounded-xl font-bold text-lg bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="清空所有 (Clear All)"
        >
          <Trash2 className="w-6 h-6" />
        </button>

        {/* Generate Button */}
        <button
          onClick={() => generateAll(activeTab)}
          disabled={isProcessing || Object.keys(viewImages).length === 0}
          className={`
                        flex-1 py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-3
                        ${isProcessing || Object.keys(viewImages).length === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] hover:shadow-blue-500/25 text-white cursor-pointer'}
                    `}
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
          <span>{isProcessing ? `生成中... ${displayStatus}` : "全部生成 (Generate All)"}</span>
        </button>

        {/* Download Button */}
        <button
          onClick={downloadAll}
          disabled={!results || Object.keys(results).length === 0}
          className="p-4 rounded-xl font-bold text-lg bg-slate-800 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 border border-transparent hover:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="打包下载 (Download All)"
        >
          <Package className="w-6 h-6" />
        </button>

        {displayError && (
          <div className="px-4 py-2 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-center">
            {displayError}
          </div>
        )}
      </div>

      {/* Tab Switcher (Pill Style) */}
      <div className="flex-shrink-0 flex items-center p-1 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 self-start">
        <button
          onClick={() => setActiveTab('product')}
          className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'product' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
          产品视图 (Product)
        </button>
        <button
          onClick={() => setActiveTab('model')}
          className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'model' ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.5)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
          模特展示 (Model)
        </button>
      </div>
    </div>
  );
}

const WorkflowList = () => {
  const { activeTab, openImageViewer } = useApp();
  const { config, presets } = useConfig();
  const {
    viewImages,
    poseImages,
    results,
    isProcessing,
    visualProgress,
    uploadImage,
    uploadPoseImage,
    removeImage,
    removePoseImage,
    generateSingle,
    history
  } = useGeneration();

  // Computed Slots Logic (Moved from App.jsx)
  const VIEW_SLOTS = React.useMemo(() => {
    const activeModel = presets.models?.find(m => m.id === config.modelId);
    const hasTemplate = !!activeModel?.templateImage;

    return [
      { id: 'p_front', label: '正视图 (Front)', type: 'product' },
      { id: 'p_angle', label: '侧角图 (Angle)', type: 'product' },
      { id: 'p_back', label: '后视图 (Back)', type: 'product' },
      { id: 'p_top', label: '俯视图 (Top)', type: 'product' },
      { id: 'p_detail', label: '细节图 (Detail)', type: 'product' },
      { id: 'p_inside', label: '内部结构 (Inside)', type: 'product' },

      { id: 'm_front', label: hasTemplate ? '帽子素材 (输入A)' : '模特-人像 (Input A)', type: 'model' },
      { id: 'm_side', label: hasTemplate ? '帽子素材 (输入B)' : '模特-人像 (Input B)', type: 'model' },
      { id: 'm_pose1', label: hasTemplate ? '帽子素材 (输入C)' : '模特-人像 (Input C)', type: 'model' },
      { id: 'm_pose2', label: hasTemplate ? '帽子素材 (输入D)' : '模特-人像 (Input D)', type: 'model' },
      { id: 'm_pose3', label: hasTemplate ? '帽子素材 (输入E)' : '模特-人像 (Input E)', type: 'model' },
      { id: 'm_back', label: hasTemplate ? '帽子素材 (输入F)' : '模特-背面 (Back Spec)', type: 'model' },
      { id: 'm_back_angle', label: hasTemplate ? '帽子素材 (输入G)' : '模特-背对斜侧 (Back Angle)', type: 'model' },
    ].filter(slot => slot.type === activeTab);
  }, [config.modelId, presets.models, activeTab]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
      {history.length > 0 && (
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded border border-blue-500/30">
            HISTORY (Total Groups: {history.length})
          </div>
          <span className="text-slate-500 text-xs">- Latest generation belongs to Group 1</span>
        </div>
      )}

      {/* Grid Layout Container */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {VIEW_SLOTS.map((slot, idx) => (
          <WorkflowRow
            key={slot.id}
            slot={slot}
            index={idx}
          />
        ))}

        {Object.keys(viewImages).length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-800/20 text-slate-500 gap-4">
            <Sparkles className="w-12 h-12 opacity-20" />
            <p>Start by uploading an image into any slot above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 3. Auth Gate - Shows login page if not authenticated
const AuthGate = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AppContent />;
};

// 4. Main Wrapper
function App() {
  return (
    <GlobalErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <ConfigProvider>
              <GenerationProvider>
                <AuthGate />
              </GenerationProvider>
            </ConfigProvider>
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    </GlobalErrorBoundary>
  );
}

export default App;

