import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.name || 'component'}:`, error, errorInfo);
    }

    public handleRetry = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center text-center">
                    <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
                    <h3 className="text-lg font-semibold text-red-700">Algo deu errado</h3>
                    <p className="text-sm text-red-600 mb-4 max-w-md">
                        Não foi possível carregar esta seção ({this.props.name || 'desconhecida'}).
                        <br />
                        <span className="text-xs opacity-75 font-mono mt-2 block bg-red-100 p-2 rounded">
                            {this.state.error?.message}
                        </span>
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Recarregar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
