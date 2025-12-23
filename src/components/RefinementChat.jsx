import React, { useState } from 'react';
import { Send, MessageSquare, X, Command } from 'lucide-react';

const RefinementChat = ({ onCommand }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'system', content: '欢迎使用生成后期微调：你可以输入指令，如“让第2组图的颜色更像第1组”。' }
    ]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);

        // Pass command to parent for logic handling
        if (onCommand) {
            onCommand(input);
        }

        setInput('');
    };

    return (
        <div className="fixed bottom-6 right-6 z-[200]">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 shadow-xl shadow-blue-500/20 flex items-center justify-center hover:scale-110 transition-transform group"
                >
                    <MessageSquare className="text-white w-6 h-6 group-hover:animate-pulse" />
                </button>
            ) : (
                <div className="w-80 md:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="p-4 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
                        <div className="flex items-center gap-2 font-medium">
                            <Command className="w-4 h-4 text-blue-400" />
                            <span>生成微调助手 (Refinement)</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 h-64 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-800 text-slate-300 border border-slate-700/50'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 bg-slate-800/50 border-t border-slate-700/50 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="输入微调指令..."
                            className="flex-1 bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors">
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default RefinementChat;
