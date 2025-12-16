import React, { useState } from 'react';
import UploadZone from './components/UploadZone';
import ResultGallery from './components/ResultGallery';
import ConfigPanel from './components/ConfigPanel';
import RequestInspector from './components/RequestInspector';
import { generateImages, analyzeImages } from './services/api';
import { Sparkles, Loader2, Play, Code } from 'lucide-react';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [visualProgress, setVisualProgress] = useState(0); // Smooth interpolated progress
  const [statusMessage, setStatusMessage] = useState(""); // Granular Status

  // Store multiple files for context
  const [referenceImages, setReferenceImages] = useState([]);

  // Mock Progress Interpolation
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

  const [config, setConfig] = useState({
    model: 'gemini-2.5-flash-image', // Default Model
    ethnicity: 'asian',
    gender: 'female',
    scene: '',
    clothing: '',
    hairColor: '',
    description: '',
    includeProductViews: true, // Default: Generate Spec
    includeModelView: true,     // Default: Generate Model
    viewSelection: {
      front: true,
      angle_front: true,
      back: true,
      top: true,
      inside: true,
      detail: true
    },
    modelViewSelection: {
      model_front: true,
      model_angle: true,
      model_side: true,
      model_back: true,
      model_lifestyle: true
    }
  });

  const handleAnalyze = async () => {
    if (referenceImages.length === 0) {
      setError("请先上传参考图片");
      return;
    }

    setIsAnalyzing(true);
    setStatusMessage("AI is reading topology...");
    setError(null);
    try {
      const analysisText = await analyzeImages(referenceImages);
      setConfig(prev => ({
        ...prev,
        description: analysisText
      }));
    } catch (err) {
      console.error("Analysis Error:", err);
      setError(`分析失败: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
      setStatusMessage("");
    }
  };

  const handleGenerate = async () => {
    if (referenceImages.length === 0) {
      setError("请至少上传一张参考图片");
      return;
    }

    if (!config.includeProductViews && !config.includeModelView) {
      setError("请至少选择一种生成类型（产品套图 或 模特展示）");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Initializing engines...");
    setResults({});
    setProgress({ current: 0, total: 1 }); // Start with dummy total to trigger UI
    setVisualProgress(0);
    setError(null);

    try {
      // Pass callback for real-time updates AND Status
      const data = await generateImages(
        referenceImages,
        config,
        (key, resultData, current, total) => {
          setResults(prev => ({ ...prev, [key]: resultData }));
          setProgress({ current, total });
        },
        (status) => {
          setStatusMessage(status); // Real-time text update
        }
      );

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
          ProductAI 智能图生图
        </span>
      </header>

      {/* Main Split Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)] min-h-[600px]">

        {/* Left Column: Input + Config */}
        <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">

          {/* Upload Section */}
          <div className="flex-1 min-h-[300px]">
            <UploadZone
              images={referenceImages}
              onImagesChange={(newImages) => {
                setReferenceImages(newImages);
                setResults(null);
                setError(null);
              }}
              isProcessing={isProcessing}
            />
          </div>

          {/* Config Section */}
          <div className="flex-shrink-0">
            <ConfigPanel
              config={config}
              setConfig={setConfig}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
          </div>
        </div>

        {/* Right Column: Results + Action */}
        <div className="flex flex-col gap-6 h-full">

          {/* Results Display */}
          <div className="flex-1 bg-slate-900/20 rounded-2xl border border-white/5 p-6 overflow-y-auto custom-scrollbar relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-300">生成结果 (Output Gallery)</h3>
              <div className="flex items-center gap-3">
                {isProcessing && progress.total > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${visualProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-blue-400 font-mono">
                      {Math.round(visualProgress)}%
                    </span>
                  </div>
                )}
                {lastPayload && (
                  <button
                    onClick={() => setIsInspectorOpen(true)}
                    className="flex items-center space-x-2 text-xs text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20"
                  >
                    <Code className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <ResultGallery results={results} config={config} />
          </div>

          {/* Action Button */}
          <div className="flex-shrink-0">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isProcessing || referenceImages.length === 0}
              className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-3
                ${isProcessing || referenceImages.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] hover:shadow-blue-500/25 text-white cursor-pointer'}
              `}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">{statusMessage || "Processing..."}</span>
                  </div>
                  {progress.total > 0 && (
                    <span className="text-[10px] opacity-50 mt-1 font-mono tracking-widest">
                      {/* Optional: Add a subtle loading bar inside the button too or just text */}
                      PROCESSING {progress.current}/{progress.total}
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-current" />
                  开始生成 (Generate)
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
