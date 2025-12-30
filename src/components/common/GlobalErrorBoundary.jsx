import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-200 p-8 text-center space-y-6">
                    <div className="p-6 rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <AlertTriangle className="w-16 h-16 text-red-500" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tight text-white">Something went wrong</h1>
                        <p className="text-slate-400 max-w-md mx-auto">
                            The application encountered an unexpected error. We've logged this issue.
                        </p>
                    </div>

                    {this.state.error && (
                        <div className="p-4 bg-slate-900 rounded-xl border border-white/5 max-w-2xl w-full overflow-auto text-left font-mono text-xs text-red-300">
                            {this.state.error.toString()}
                        </div>
                    )}

                    <button
                        onClick={this.handleReload}
                        className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
