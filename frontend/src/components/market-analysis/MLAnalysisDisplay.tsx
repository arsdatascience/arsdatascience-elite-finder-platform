import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import {
    BarChart3,
    TrendingUp,
    AlertTriangle,
    Users,
    DollarSign,
    Instagram,
    Loader2,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface MLAnalysisData {
    intent: string;
    intentDescription: string;
    response: string;
    data: any;
    phone?: string;
    sessionId?: string;
}

interface MLAnalysisDisplayProps {
    sessionId?: string;
    socket?: Socket;
    onAnalysisComplete?: (data: MLAnalysisData) => void;
}

// Intent to icon mapping
const intentIcons: Record<string, any> = {
    sales_forecast: TrendingUp,
    instagram_analysis: Instagram,
    tiktok_analysis: BarChart3,
    anomaly_detection: AlertTriangle,
    dashboard_summary: BarChart3,
    marketing_roi: DollarSign,
    customer_segmentation: Users,
    churn_prediction: AlertTriangle
};

// Intent to color mapping
const intentColors: Record<string, string> = {
    sales_forecast: 'text-blue-500 bg-blue-50',
    instagram_analysis: 'text-pink-500 bg-pink-50',
    tiktok_analysis: 'text-purple-500 bg-purple-50',
    anomaly_detection: 'text-orange-500 bg-orange-50',
    dashboard_summary: 'text-green-500 bg-green-50',
    marketing_roi: 'text-emerald-500 bg-emerald-50',
    customer_segmentation: 'text-indigo-500 bg-indigo-50',
    churn_prediction: 'text-red-500 bg-red-50'
};

export function MLAnalysisDisplay({ socket, onAnalysisComplete }: MLAnalysisDisplayProps) {
    const [analysis, setAnalysis] = useState<MLAnalysisData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        const socketInstance = socket || (typeof window !== 'undefined' ? (window as any).socket : null);

        if (!socketInstance) {
            console.warn('Socket not available for MLAnalysisDisplay');
            return;
        }

        // Listen for ML analysis complete events
        const handleComplete = (data: MLAnalysisData) => {
            console.log('ML Analysis Complete:', data);
            setAnalysis(data);
            setLoading(false);
            setError(null);


            if (onAnalysisComplete) {
                onAnalysisComplete(data);
            }
        };

        // Listen for ML analysis error events
        const handleError = (data: { intent: string; error: string }) => {
            console.error('ML Analysis Error:', data);
            setError(data.error);
            setLoading(false);
        };

        // Listen for loading state
        const handleLoading = () => {
            setLoading(true);
            setError(null);
        };

        socketInstance.on('ml-analysis-complete', handleComplete);
        socketInstance.on('ml-analysis-error', handleError);
        socketInstance.on('ml-analysis-loading', handleLoading);

        return () => {
            socketInstance.off('ml-analysis-complete', handleComplete);
            socketInstance.off('ml-analysis-error', handleError);
            socketInstance.off('ml-analysis-loading', handleLoading);
        };
    }, [socket, onAnalysisComplete]);

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 animate-pulse">
                <div className="flex-shrink-0">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">Analisando dados com IA...</p>
                    <p className="text-xs text-blue-600 mt-1">Isso pode levar alguns segundos</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">Erro na análise</p>
                        <p className="text-sm text-red-600 mt-1 whitespace-pre-wrap">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Empty state
    if (!analysis) {
        return null;
    }

    const IconComponent = intentIcons[analysis.intent] || BarChart3;
    const colorClass = intentColors[analysis.intent] || 'text-gray-500 bg-gray-50';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className={`px-4 py-3 flex items-center gap-3 ${colorClass.split(' ')[1]}`}>
                <div className={`p-2 rounded-lg ${colorClass}`}>
                    <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                        {analysis.intentDescription}
                    </h3>
                    <p className="text-xs text-gray-500">
                        Análise gerada por IA
                    </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans bg-transparent p-0 m-0 overflow-visible">
                        {analysis.response}
                    </pre>
                </div>
            </div>

            {/* Data visualization (if available) */}
            {analysis.data?.chart_data && (
                <div className="px-4 pb-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-2">Dados do período</p>
                        <div className="grid grid-cols-3 gap-3">
                            {analysis.data.chart_data.map((item: any, index: number) => (
                                <div key={index} className="text-center p-2 bg-white rounded-lg shadow-sm">
                                    <p className="text-xs text-gray-500">{item.date}</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {item.reach ? item.reach.toLocaleString() : formatCurrency(item.revenue)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Insights (if available) */}
            {analysis.data?.insights && analysis.data.insights.length > 0 && (
                <div className="px-4 pb-4">
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 border border-amber-100">
                        <p className="text-xs font-medium text-amber-800 mb-2">💡 Insights</p>
                        <ul className="space-y-1">
                            {analysis.data.insights.slice(0, 3).map((insight: string, index: number) => (
                                <li key={index} className="text-xs text-amber-700 flex items-start gap-2">
                                    <span>•</span>
                                    <span>{insight}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

// Compact version for chat integration
export function MLAnalysisMessage({ data }: { data: MLAnalysisData }) {
    const IconComponent = intentIcons[data.intent] || BarChart3;
    const colorClass = intentColors[data.intent] || 'text-gray-500 bg-gray-50';

    return (
        <div className="inline-block max-w-md bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className={`px-3 py-2 flex items-center gap-2 ${colorClass.split(' ')[1]}`}>
                <IconComponent className={`w-4 h-4 ${colorClass.split(' ')[0]}`} />
                <span className="text-xs font-medium text-gray-700">{data.intentDescription}</span>
            </div>
            <div className="p-3">
                <pre className="whitespace-pre-wrap text-xs text-gray-700 font-sans">
                    {data.response}
                </pre>
            </div>
        </div>
    );
}

export default MLAnalysisDisplay;
