import React, { useState } from 'react';
import WorkflowRow from './components/WorkflowRow';
import ResultGallery from './components/ResultGallery';
import ConfigPanel from './components/ConfigPanel';
import RequestInspector from './components/RequestInspector';
import { generateImages, analyzeImages, mergePrompts, analyzeHatStyleAndSuggestOutfit } from './services/api';
import { Sparkles, Loader2, Play, Code, Settings, Trash2, Package } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import RefinementChat from './components/RefinementChat';
import AdminView from './components/Admin/AdminView';
import ImageViewer from './components/ImageViewer';
import defaultPresets from './config/presets.json';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [visualProgress, setVisualProgress] = useState(0); // Smooth interpolated progress
  const [statusMessage, setStatusMessage] = useState(""); // Granular Status
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null); // Lightbox State

  // Load Presets from LocalStorage or default
  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem('product_ai_presets');
    const initial = saved ? JSON.parse(saved) : defaultPresets;

    // Sync logic: Ensure new default viewpoints/styles/categories are added even if user has saved data
    const syncedViewpoints = [...initial.viewpoints];
    defaultPresets.viewpoints.forEach(dv => {
      if (!syncedViewpoints.find(v => v.id === dv.id)) {
        syncedViewpoints.push(dv);
      }
    });

    // 1. Sync Product Categories (New Feature)
    // Only initialize if 'productCategories' is undefined (first run). 
    // If it exists but is empty (user deleted all), respect that.
    const syncedCategories = initial.productCategories || defaultPresets.productCategories || [];

    // Remove legacy one-off lifestyle attempts to avoid clutter
    const legacyIds = ['model_lifestyle', 'model_lifestyle_walking', 'model_lifestyle_leaning'];
    const finalViewpoints = syncedViewpoints.filter(v => !legacyIds.includes(v.id));

    return {
      ...initial,
      viewpoints: finalViewpoints,
      models: initial.models || [],
      productCategories: syncedCategories
    };
  });

  const handleSavePresets = (newPresets) => {
    try {
      setPresets(newPresets);
      localStorage.setItem('product_ai_presets', JSON.stringify(newPresets));
    } catch (err) {
      console.error("Storage Error:", err);
      if (err.name === 'QuotaExceededError' || err.toString().includes('exceeded')) {
        alert("保存失败：图片太大，超过了浏览器存储限制！\n请尝试压缩图片或使用更小的分辨率（建议 1MB 以内）。\n(Save Failed: Image too large for local storage)");
        // Revert state if needed, or just let the user know their last action wasn't persisted.
      } else {
        alert(`保存失败: ${err.message}`);
      }
    }
  };

  // Store files mapped by view ID: { 'p_front': File, 'm_side': File, ... }
  const [viewImages, setViewImages] = useState({});

  // ... (Progress Interpolation - Unchanged) ...
  React.useEffect(() => {
    let interval;
    if (isProcessing && progress.total > 0) {
      // Calculate real percentage
      const realPercent = (progress.current / progress.total) * 100;

      // Calculate "Next Step" target (fake it 'til you make it)
      // If we are at step 0, aim for 80% of step 1 (approx 15-20% global)
      // If we are at step 1, aim for 80% of step 2...
      const stepSize = 100 / progress.total;
      const targetFakePercent = Math.min(realPercent + (stepSize * 0.8), 99);

      interval = setInterval(() => {
        setVisualProgress(prev => {
          // If we are far behind real status (e.g. jumped from 0 to 1), catch up fast
          if (prev < realPercent) {
            return prev + (realPercent - prev) * 0.2;
          }
          // Otherwise creep slowly towards the fake target
          if (prev < targetFakePercent) {
            return prev + 0.1; // Slow creep
          }
          return prev;
        });
      }, 50); // Update every 50ms
    } else if (!isProcessing) {
      setVisualProgress(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing, progress]);

  // Inspector State
  const [lastPayload, setLastPayload] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const [history, setHistory] = useState([]); // Store generations groups

  const [config, setConfig] = useState({
    creativity: 20, // Default to Low Creativity (Strict Mode)
    model: 'gemini-2.5-flash-image', // Default Model
    ethnicity: 'asian',
    gender: 'female',
    categoryId: 'hat', // Default Category
    modelId: '', // Model Identity Preset
    thinkingLevel: 'high',
    imageSize: '1K',
    aspect_ratio: '1:1',
    temperature: 1.0,
    description: '',
  });

  const [styleReferenceImage, setStyleReferenceImage] = useState(null);
  const [outfitSuggestion, setOutfitSuggestion] = useState(null);

  // Slots Definition with Dynamic Labels
  const VIEW_SLOTS = React.useMemo(() => {
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
      { id: 'm_front', label: hasTemplate ? '帽子素材 (输入A)' : '模特-正面 (Front)', type: 'model' },
      { id: 'm_side', label: hasTemplate ? '帽子素材 (输入B)' : '模特-侧面 (Side)', type: 'model' },
      { id: 'm_back', label: hasTemplate ? '帽子素材 (输入C)' : '模特-背面 (Back)', type: 'model' },
      { id: 'm_pose1', label: hasTemplate ? '帽子素材 (输入D)' : '模特-展示1 (Pose A)', type: 'model' },
      { id: 'm_pose2', label: hasTemplate ? '帽子素材 (输入E)' : '模特-展示2 (Pose B)', type: 'model' },
      { id: 'm_pose3', label: hasTemplate ? '帽子素材 (输入F)' : '模特-展示3 (Pose C)', type: 'model' },
      { id: 'm_back_angle', label: hasTemplate ? '帽子素材 (输入G)' : '模特-背对斜侧 (Back Angle)', type: 'model' },
    ];
  }, [config.modelId, presets.models]);

  // Slot Labels for outfit analysis
  const SLOT_LABELS = {
    'p_front': 'Product Front',
    'p_angle': 'Product Angle',
    'p_back': 'Product Back',
    'p_top': 'Product Top',
    'p_detail': 'Product Detail',
    'p_inside': 'Product Inside',
  };

  /* --- Manual Style Analysis --- */
  const handleAnalyzeStyle = async () => {
    // Collect product images
    const productImages = Object.entries(viewImages)
      .filter(([key]) => key.startsWith('p_'))
      .map(([key, file]) => ({ file, label: SLOT_LABELS[key] || key }));

    if (productImages.length === 0) {
      setError("请先上传至少一张产品图 (Please upload at least one product image)");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setStatusMessage("分析风格中... (Analyzing style...)");

    try {
      const outfitData = await analyzeHatStyleAndSuggestOutfit(
        productImages,
        styleReferenceImage
      );

      setOutfitSuggestion(outfitData);
      console.log("[Manual Style Analysis]", outfitData);
      setStatusMessage("风格分析完成 (Style analysis complete)");

      // Clear status after brief display
      setTimeout(() => setStatusMessage(""), 2000);
    } catch (err) {
      console.error("[Style Analysis Error]:", err);
      setError(`风格分析失败: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* --- Single Generation Logic --- */
  const handleSingleGenerate = async (slotId, overrideConfig = null) => {
    const file = viewImages[slotId];
    if (!file) return;

    // Model Check
    if (slotId.startsWith('m_') && !config.modelId) {
      setError("请先选择一个模特 (Please select a Model Identity)");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStatusMessage(`Generating single view: ${slotId}...`);

    // Prepare Single Map
    const singleMap = { [slotId]: file };
    const finalConfig = overrideConfig ? { ...config, ...overrideConfig } : config;

    try {
      const data = await generateImages(
        singleMap,
        finalConfig,
        (key, resultData, current, total) => {
          setResults(prev => ({ ...prev, [key]: resultData }));
        },
        (status) => setStatusMessage(status),
        presets
      );
      setResults(prev => ({ ...prev, ...data.images }));
    } catch (err) {
      console.error("Single Gen Error:", err);
      setError(`生成失败: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setStatusMessage("");
    }
  };

  const handleClearAll = () => {
    if (window.confirm("确定要清空所有上传的素材和生成结果吗？(Are you sure you want to clear all?)")) {
      setViewImages({});
      setResults({});
      setError(null);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleDownloadAll = async () => {
    if (!results || Object.keys(results).length === 0) return;

    const zip = new JSZip();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const zipFilename = `ProductAI_Set_${timestamp}.zip`;

    const folder = zip.folder("generated_images");

    Object.entries(results).forEach(([id, data]) => {
      if (data && data.url) {
        const imgData = data.url.split(',')[1];
        if (imgData) {
          folder.file(`${id}_${data.label}.png`, imgData, { base64: true });
        }
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, zipFilename);
  };

  const handleGenerate = async () => {
    // Check if at least one file is uploaded
    const inputFiles = Object.values(viewImages);
    if (inputFiles.length === 0) {
      setError("请至少上传一张参考图片 (Please upload at least one image)");
      return;
    }

    // Model Check
    const hasModelImages = Object.keys(viewImages).some(k => k.startsWith('m_'));
    if (hasModelImages && !config.modelId) {
      setError("上传了模特展示图，请先选择一个模特 (Model View detected. Please select a Model Identity)");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Initializing engines...");
    setResults({});

    // Total steps = number of uploaded images
    const totalSteps = inputFiles.length;
    setProgress({ current: 0, total: totalSteps });
    setVisualProgress(0);
    setError(null);

    const finalConfig = { ...config };

    // Inject outfit suggestion if already analyzed
    if (outfitSuggestion) {
      finalConfig.outfitSuggestion = outfitSuggestion.outfit_description;
    }

    try {
      // Pass callback for real-time updates AND Status
      // NOTE: generateImages signature will change to accept (viewImagesMap, config, ...)
      const data = await generateImages(
        viewImages,
        finalConfig,
        (key, resultData, current, total) => {
          setResults(prev => ({ ...prev, [key]: resultData }));
          setProgress({ current, total });
        },
        (status) => {
          setStatusMessage(status); // Real-time text update
        },
        presets
      );

      const newBatch = {
        id: Date.now(),
        images: { ...data.images },
        config: { ...finalConfig }
      };

      setHistory(prev => [newBatch, ...prev]);
      setResults(prev => ({ ...prev, ...data.images }));
      setLastPayload(data.payload);

    } catch (err) {
      console.error("Global Generation Error:", err);
      setError(`生成失败: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
      setStatusMessage("");
    }
  };

  const handleRefinementCommand = async (command) => {
    const match = command.match(/第(\d+)组.*第(\d+)张.*第(\d+)组.*第(\d+)张/);
    if (match) {
      const [_, targetBatchIdx, targetImgIdx, refBatchIdx, refImgIdx] = match.map(Number);

      // Find in history (newest first, so index starts from 0)
      // Usually user counts 1-based, newest to oldest
      const targetBatch = history[targetBatchIdx - 1];
      const refBatch = history[refBatchIdx - 1];

      if (targetBatch && refBatch) {
        const targetKeys = Object.keys(targetBatch.images);
        const refKeys = Object.keys(refBatch.images);

        const targetKey = targetKeys[targetImgIdx - 1];
        const refKey = refKeys[refImgIdx - 1];

        const refImgData = refBatch.images[refKey]?.url;

        if (targetKey && refImgData) {
          // Prepare style reference
          const base64Data = refImgData.split(',')[1];
          const mimeType = refImgData.split(';')[0].split(':')[1];

          const override = {
            styleReferences: {
              [targetKey]: { data: base64Data, mimeType: mimeType }
            }
          };

          await handleSingleGenerate(targetKey, override);
        } else {
          setError("未找到指定的图片索引 (Image index not found)");
        }
      } else {
        setError("未找到指定的批组 (Batch index not found)");
      }
    } else {
      // Simple case: "让这张更自然" -> apply to last generated
      setStatusMessage("正在优化最新生成的图像...");
      const lastBatch = history[0];
      if (lastBatch) {
        const firstKey = Object.keys(lastBatch.images)[0];
        if (firstKey) {
          await handleSingleGenerate(firstKey, { customPrompt: command });
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
            setPresets={handleSavePresets}
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
            onAnalyze={() => { }}
            isAnalyzing={isAnalyzing}
            presets={presets}
            styleReferenceImage={styleReferenceImage}
            setStyleReferenceImage={setStyleReferenceImage}
            outfitSuggestion={outfitSuggestion}
            onAnalyzeStyle={handleAnalyzeStyle}
          />
        </div>

        {/* Right Column: Workflow Rows (2/3) */}
        <div className="lg:col-span-2 flex-1 h-full flex flex-col gap-6">

          {/* Action Bar (Global) */}
          <div className="flex-shrink-0 flex gap-4">
            {/* Clear Button */}
            <button
              onClick={handleClearAll}
              disabled={isProcessing || Object.keys(viewImages).length === 0}
              className="p-4 rounded-xl font-bold text-lg bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="清空所有 (Clear All)"
            >
              <Trash2 className="w-6 h-6" />
            </button>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isProcessing || Object.keys(viewImages).length === 0}
              className={`
                    flex-1 py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-3
                    ${isProcessing || Object.keys(viewImages).length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] hover:shadow-blue-500/25 text-white cursor-pointer'}
                `}
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
              <span>{isProcessing ? "Processing..." : "全部生成 (Generate All)"}</span>
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownloadAll}
              disabled={!results || Object.keys(results).length === 0}
              className="p-4 rounded-xl font-bold text-lg bg-slate-800 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 border border-transparent hover:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="打包下载 (Download All)"
            >
              <Package className="w-6 h-6" />
            </button>

            {error && (
              <div className="px-4 py-2 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-center">
                {error}
              </div>
            )}
          </div>

          {/* Workflow Rows List */}
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
                result={results?.[slot.id]}
                isProcessing={isProcessing}
                onUpload={(id, file) => setViewImages(prev => ({ ...prev, [id]: file }))}
                onRemove={(id) => setViewImages(prev => {
                  const next = { ...prev };
                  delete next[id];
                  return next;
                })}
                onGenerate={handleSingleGenerate}
                onZoom={(url) => setZoomedImage(url)}
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
