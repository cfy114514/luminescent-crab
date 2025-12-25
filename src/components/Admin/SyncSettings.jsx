import React, { useState } from 'react';
import { Download, Upload, Copy, Check, Save } from 'lucide-react';

const SyncSettings = ({ presets, onSave }) => {
    const [jsonText, setJsonText] = useState('');
    const [copied, setCopied] = useState(false);
    const [status, setStatus] = useState('');

    const handleExport = () => {
        const data = JSON.stringify(presets, null, 2);
        setJsonText(data);
        setStatus('已生成当前预设的 JSON 副本。');
    };

    const handleImport = () => {
        if (!jsonText) return;
        try {
            const newPresets = JSON.parse(jsonText);
            // Basic validation
            if (!newPresets.models || !newPresets.productCategories) {
                throw new Error('无效的预设格式');
            }
            onSave(newPresets);
            setStatus('✅ 导入成功！预设已保存到本地存储。');
        } catch (err) {
            setStatus('❌ 导入失败：' + err.message);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(jsonText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8">
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                <h2 className="text-xl font-bold text-blue-400 mb-2">同步与数据管理 (Sync & Merge)</h2>
                <p className="text-sm text-slate-400">
                    由于浏览器限制，不同端口(Port)或地址的预设无法互通。你可以通过导出/导入功能在此合并数据，或者将 JSON 发送给 AI 助手直接更新项目源代码。
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Column */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="font-bold flex items-center gap-2">
                        <Download className="w-5 h-5 text-purple-400" /> 导出数据
                    </h3>
                    <p className="text-xs text-slate-500">将当前浏览器中的预设导出为文本，用于合并或备份。</p>
                    <button
                        onClick={handleExport}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold transition-all"
                    >
                        生成导出数据
                    </button>
                </div>

                {/* Import Column */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="font-bold flex items-center gap-2">
                        <Upload className="w-5 h-5 text-green-400" /> 导入/合并
                    </h3>
                    <p className="text-xs text-slate-500">将其他端口导出的数据粘贴到下方并点击导入。</p>
                    <button
                        onClick={handleImport}
                        className="w-full py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-sm font-bold transition-all"
                    >
                        执行导入覆盖
                    </button>
                </div>
            </div>

            {/* JSON Area */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-400">JSON 数据区</label>
                    {jsonText && (
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300"
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? '已复制' : '复制到剪贴板'}
                        </button>
                    )}
                </div>
                <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder='在此粘贴 JSON 数据...'
                    className="w-full h-80 bg-black/40 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-400 focus:border-purple-500/50 outline-none transition-all"
                />

                {status && (
                    <div className={`p-4 rounded-lg text-sm font-bold ${status.includes('✅') ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {status}
                    </div>
                )}
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 p-6 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Save className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                    <h4 className="font-bold text-purple-300">永久同步到项目代码？</h4>
                    <p className="text-xs text-slate-400">将上方的 JSON 内容复制并发送给 Antigravity 助手，我可以直接更新项目的 presets.json 文件，实现全端口永久统一。</p>
                </div>
            </div>
        </div>
    );
};

export default SyncSettings;
