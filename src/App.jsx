import React, { useState } from 'react';
import UploadZone from './components/UploadZone';
import ResultGallery from './components/ResultGallery';
import ConfigPanel from './components/ConfigPanel';
import RequestInspector from './components/RequestInspector';
import { generateImages } from './services/api';
import { Sparkles, Loader2, Play, Code } from 'lucide-react';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  // Store multiple files for context
  const [referenceImages, setReferenceImages] = useState([]);

  // Inspector State
  const [lastPayload, setLastPayload] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Configuration State
  const [config, setConfig] = useState({
    ethnicity: 'asian',
    gender: 'female',
    scene: '',
    clothing: '',
    hairColor: '',
    description: ''
  });

  const handleGenerate = async () => {
    if (referenceImages.length === 0) {
      setError("请至少上传一张参考图片");
      return;
    }

    setIsProcessing(true);
    setResults(null);
    setError(null);

    try {
      // Pass ALL reference images to API
      const data = await generateImages(referenceImages, config);
      setResults(data.images);
      setLastPayload(data.payload);
    } catch (err) {
      setError("生成失败，请重试");
    } finally {
      setIsProcessing(false);
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
              files={referenceImages}
              onFilesChange={(files) => {
                setReferenceImages(files);
                setResults(null);
                setError(null);
              }}
              isProcessing={isProcessing}
            />
          </div>

          {/* Config Section */}
          <div className="flex-shrink-0">
            <ConfigPanel config={config} setConfig={setConfig} />
          </div>
        </div>

        {/* Right Column: Results + Action */}
        <div className="flex flex-col gap-6 h-full">

          {/* Results Display */}
          <div className="flex-1 bg-slate-900/20 rounded-2xl border border-white/5 p-6 overflow-y-auto custom-scrollbar relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-300">生成结果 (Output Gallery)</h3>
              {lastPayload && (
                <button
                  onClick={() => setIsInspectorOpen(true)}
                  className="flex items-center space-x-2 text-xs text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20"
                >
                  <Code className="w-3 h-3" />
                  <span>查看 API 请求</span>
                </button>
              )}
            </div>
            <ResultGallery results={results} />
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
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  正在生成变体...
                </>
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
