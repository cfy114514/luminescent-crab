import React, { useState, useMemo } from 'react';
import WorkflowRow from './components/WorkflowRow';
import ConfigPanel from './components/ConfigPanel';
import RequestInspector from './components/RequestInspector';
import { Sparkles, Loader2, Play, Settings, Trash2, Package } from 'lucide-react';

import RefinementChat from './components/RefinementChat';
import AdminView from './components/Admin/AdminView';
import ImageViewer from './components/ImageViewer';

// Hooks
import { usePresets } from './hooks/usePresets';
import { useOutfits } from './hooks/useOutfits';
import { useImageGeneration } from './hooks/useImageGeneration';

function App() {
  // 1. Core Config State (UI State)
  const [activeTab, setActiveTab] = useState('product'); // 'product' or 'model'
  const [viewImages, setViewImages] = useState({});
  const [poseImages, setPoseImages] = useState({});
  const [config, setConfig] = useState({
    creativity: 20, // Default to Low Creativity (Strict Mode)
    model: 'gemini-2.5-flash-image', // Default Model
    ethnicity: 'asian',
    gender: 'female',
    categoryId: 'hat', // Default Category
    modelId: '', // Model Identity Preset
    thinkingLevel: 'high',
    imageSize: '2K',
    aspect_ratio: '1:1',
    temperature: 1.0,
    description: '',
  });
  const [slotMetadata, setSlotMetadata] = useState({}); // Custom perspective overrides per slot
  const [styleReferenceImage, setStyleReferenceImage] = useState(null);

  // UI Toggles
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  // 2. Custom Hooks
  const { presets, savePresets } = usePresets();
  const {
    outfitSuggestion,
    isAnalyzing,
    analysisError,
    analysisStatus,
    analyzeStyle
  } = useOutfits();

  const {
    isProcessing,
    results,
    error: genError,
    visualProgress,
    statusMessage: genStatusMessage,
    history,
    lastPayload,
    generateAll,
    generateSingle,
    downloadAll,
    clearAll
  } = useImageGeneration(presets, poseImages, slotMetadata);

  // Derived Status Display
  const displayStatus = isAnalyzing ? analysisStatus : genStatusMessage;
  const displayError = analysisError || genError;

  // 3. Computed Slots
  const VIEW_SLOTS = useMemo(() => {
    // Check if current model has a template
    const activeModel = presets.models?.find(m => m.id === config.modelId);
    const hasTemplate = !!activeModel?.templateImage;

    return [
      // Product Views
      { id: 'p_front', label: '正视图 (Front)', type: 'product' },
      { id: 'p_angle', label: '侧角图 (Angle)', type: 'product' },
      { id: 'p_back', label: '后视图 (Back)', type: 'product' },
      { id: 'p_top', label: '俯视图 (Top)', type: 'product' },
      { id: 'p_detail', label: '细节图 (Detail)', type: 'product' },
      { id: 'p_inside', label: '内部结构 (Inside)', type: 'product' },

      // Model Views (Dynamic)
      { id: 'm_front', label: hasTemplate ? '帽子素材 (输入A)' : '模特-人像 (Input A)', type: 'model' },
      { id: 'm_side', label: hasTemplate ? '帽子素材 (输入B)' : '模特-人像 (Input B)', type: 'model' },
      { id: 'm_pose1', label: hasTemplate ? '帽子素材 (输入C)' : '模特-人像 (Input C)', type: 'model' },
      { id: 'm_pose2', label: hasTemplate ? '帽子素材 (输入D)' : '模特-人像 (Input D)', type: 'model' },
      { id: 'm_pose3', label: hasTemplate ? '帽子素材 (输入E)' : '模特-人像 (Input E)', type: 'model' },
      { id: 'm_back', label: hasTemplate ? '帽子素材 (输入F)' : '模特-背面 (Back Spec)', type: 'model' },
      { id: 'm_back_angle', label: hasTemplate ? '帽子素材 (输入G)' : '模特-背对斜侧 (Back Angle)', type: 'model' },
    ].filter(slot => slot.type === activeTab);
  }, [config.modelId, presets.models, activeTab]);

  // 4. Handlers
  const handleRefinementCommand = async (command) => {
    const match = command.match(/第(\d+)组.*第(\d+)张.*第(\d+)组.*第(\d+)张/);
    if (match) {
      const [_, targetBatchIdx, targetImgIdx, refBatchIdx, refImgIdx] = match.map(Number);
      const targetBatch = history[targetBatchIdx - 1];
      const refBatch = history[refBatchIdx - 1];

      if (targetBatch && refBatch) {
        const targetKeys = Object.keys(targetBatch.images);
        const refKeys = Object.keys(refBatch.images);
        const targetKey = targetKeys[targetImgIdx - 1];
        const refKey = refKeys[refImgIdx - 1];
        const refImgData = refBatch.images[refKey]?.url;

        if (targetKey && refImgData) {
          const base64Data = refImgData.split(',')[1];
          const mimeType = refImgData.split(';')[0].split(':')[1];
          const override = {
            styleReferences: {
              [targetKey]: { data: base64Data, mimeType: mimeType }
            }
          };
          await generateSingle(targetKey, viewImages, config, override);
        }
      }
    } else {
      // Simple refinement
      const lastBatch = history[0];
      if (lastBatch) {
        const firstKey = Object.keys(lastBatch.images)[0];
        if (firstKey) {
          await generateSingle(firstKey, viewImages, config, { customPrompt: command });
        }
      }
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 selection:bg-blue-500/30">
      <RequestInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
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
          onClick={() => setIsAdminMode(true)}
          className="ml-auto p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-purple-400 transition-colors"
          title="Open Admin Dashboard"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Admin View Overlay */}
      {isAdminMode && (
        <div className="fixed inset-0 z-[100] animate-in fade-in duration-300">
          <AdminView
            onBack={() => setIsAdminMode(false)}
            presets={presets}
            setPresets={savePresets}
          />
        </div>
      )}

      {/* Main Split Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)] min-h-[600px]">

        {/* Left Column: Config Panel Only (1/3) */}
        <div className="w-full lg:col-span-1 flex-shrink-0 h-full overflow-y-auto custom-scrollbar lg:sticky lg:top-0 space-y-6">
          <ConfigPanel
            config={config}
            setConfig={setConfig}
            isAnalyzing={isAnalyzing}
            presets={presets}
            savePresets={savePresets}
            styleReferenceImage={styleReferenceImage}
            setStyleReferenceImage={setStyleReferenceImage}
            outfitSuggestion={outfitSuggestion}
            onAnalyzeStyle={() => analyzeStyle(viewImages, styleReferenceImage)}
            onAnalyze={() => { }} // Legacy prop, safe to ignore or remove if unused in ConfigPanel
          />
        </div>

        {/* Right Column: Workflow Rows (2/3) */}
        <div className="lg:col-span-2 flex-1 h-full flex flex-col gap-6">

          {/* Action Bar (Global) */}
          <div className="flex-shrink-0 flex gap-4">
            {/* Clear Button */}
            <button
              onClick={() => clearAll(setViewImages)}
              disabled={isProcessing || Object.keys(viewImages).length === 0}
              className="p-4 rounded-xl font-bold text-lg bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="清空所有 (Clear All)"
            >
              <Trash2 className="w-6 h-6" />
            </button>

            {/* Generate Button */}
            <button
              onClick={() => generateAll(viewImages, config, outfitSuggestion, activeTab)}
              disabled={isProcessing || Object.keys(viewImages).length === 0}
              className={`
                    flex-1 py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-3
                    ${isProcessing || Object.keys(viewImages).length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] hover:shadow-blue-500/25 text-white cursor-pointer'}
                `}
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
              <span>{isProcessing ? `Running... ${displayStatus}` : "全部生成 (Generate All)"}</span>
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

          {/* Tab Switcher */}
          <div className="flex-shrink-0 flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('product')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'product' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              产品抠图 (Product View)
            </button>
            <button
              onClick={() => setActiveTab('model')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'model' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              模特上身 (Model Portrait)
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 space-y-3">
            {history.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded border border-blue-500/30">
                  HISTORY (Total Groups: {history.length})
                </div>
                <span className="text-slate-500 text-xs">- Latest generation belongs to Group 1</span>
              </div>
            )}

            {VIEW_SLOTS.map((slot, idx) => (
              <WorkflowRow
                key={slot.id}
                slot={slot}
                index={idx}
                file={viewImages[slot.id]}
                poseFile={poseImages[slot.id]}
                result={results?.[slot.id]}
                isProcessing={isProcessing}
                progress={visualProgress} // Use interpolated visual progress
                onUpload={(id, file) => setViewImages(prev => ({ ...prev, [id]: file }))}
                onPoseUpload={(id, file) => setPoseImages(prev => ({ ...prev, [id]: file }))}
                onRemove={(id) => setViewImages(prev => {
                  const next = { ...prev };
                  delete next[id];
                  return next;
                })}
                onPoseRemove={(id) => setPoseImages(prev => {
                  const next = { ...prev };
                  delete next[id];
                  return next;
                })}
                onGenerate={(id) => generateSingle(id, viewImages, config)}
                onZoom={(url) => setZoomedImage(url)}
                metadata={slotMetadata[slot.id]}
                onMetadataChange={(id, data) => setSlotMetadata(prev => ({ ...prev, [id]: data }))}
              />
            ))}

            {Object.keys(viewImages).length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-800/20 text-slate-500 gap-4">
                <Sparkles className="w-12 h-12 opacity-20" />
                <p>Start by uploading an image into any slot above.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Refinement Chat Tool */}
      <RefinementChat onCommand={handleRefinementCommand} />

      {/* Image Viewer Lightbox */}
      <ImageViewer
        isOpen={!!zoomedImage}
        imageUrl={zoomedImage}
        onClose={() => setZoomedImage(null)}
      />
    </div>
  );
}

export default App;
