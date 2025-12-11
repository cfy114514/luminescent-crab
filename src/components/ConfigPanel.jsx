import React from 'react';
import { motion } from 'framer-motion';
import { User2, MapPin, Shirt, Palette } from 'lucide-react';

const ConfigPanel = ({ config, setConfig }) => {
    const handleChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="w-full glass-panel rounded-2xl p-6 space-y-6 mt-6">
            <h3 className="text-xl font-semibold text-white flex items-center mb-4">
                <span className="w-1 h-6 bg-purple-500 rounded-full mr-3" />
                参数设置
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ethnicity */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-400 flex items-center gap-2">
                        <User2 className="w-4 h-4" /> 模特人种
                    </label>
                    <select
                        value={config.ethnicity}
                        onChange={(e) => handleChange('ethnicity', e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    >
                        <option value="asian">亚洲 (Asian)</option>
                        <option value="caucasian">欧美 (Caucasian)</option>
                        <option value="african">非洲 (African)</option>
                        <option value="latino">拉丁 (Latino)</option>
                        <option value="middle_eastern">中东 (Middle Eastern)</option>
                    </select>
                </div>

                {/* Gender */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-400 flex items-center gap-2">
                        <User2 className="w-4 h-4" /> 性别
                    </label>
                    <select
                        value={config.gender}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    >
                        <option value="female">女性 (Female)</option>
                        <option value="male">男性 (Male)</option>
                    </select>
                </div>
            </div>

            {/* Scene */}
            <div className="space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> 场景 / 背景
                </label>
                <input
                    type="text"
                    value={config.scene}
                    onChange={(e) => handleChange('scene', e.target.value)}
                    placeholder="例如：现代客厅，阳光沙滩..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                />
            </div>

            {/* Clothing */}
            <div className="space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                    <Shirt className="w-4 h-4" /> 服装风格
                </label>
                <input
                    type="text"
                    value={config.clothing}
                    onChange={(e) => handleChange('clothing', e.target.value)}
                    placeholder="例如：休闲牛仔，正式西装..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                />
            </div>

            {/* Feature Description */}
            <div className="space-y-2">
                <label className="text-sm text-yellow-500/80 flex items-center gap-2 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> 产品特征描述 (关键)
                </label>
                <textarea
                    value={config.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="例如：Logo位于左侧（非居中），帽檐左边比右边宽..."
                    rows={3}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-yellow-500/30 outline-none transition-all resize-none text-sm"
                />
                <p className="text-xs text-slate-500">* 用于纠正AI对非对称设计的偏差，请详细描述。</p>
            </div>

            {/* Hair Color */}
            <div className="space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                    <Palette className="w-4 h-4" /> 发色
                </label>
                <input
                    type="text"
                    value={config.hairColor}
                    onChange={(e) => handleChange('hairColor', e.target.value)}
                    placeholder="例如：深棕色，金发..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                />
            </div>
        </div>
    );
};

export default ConfigPanel;
