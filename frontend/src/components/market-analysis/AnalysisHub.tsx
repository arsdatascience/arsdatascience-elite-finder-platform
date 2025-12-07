import React, { useState } from 'react';
import {
    TrendingUp, Users, AlertTriangle, DollarSign, Instagram, Video,
    Target, BarChart3, ShoppingCart, Heart, Layers, Clock,
    Activity, PieChart, RefreshCw, ArrowRight, Search, Sparkles,
    Wallet, Package, Receipt, UserCheck, ThumbsUp, GitBranch,
    Percent, Award, Building, Calendar, Zap, Settings, Brain
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

// Analysis categories
const CATEGORIES = [
    { id: 'core', name: 'Core Analytics', icon: Brain, color: '#8B5CF6' },
    { id: 'social', name: 'Social Media', icon: Instagram, color: '#E1306C' },
    { id: 'financial', name: 'Financeiro', icon: Wallet, color: '#10B981' },
    { id: 'training', name: 'Custom Training', icon: Settings, color: '#F59E0B' },
    { id: 'advanced', name: 'Avançado', icon: Sparkles, color: '#3B82F6' }
];

// All 35 analyses
const ANALYSES = {
    core: [
        { id: 'sales-forecast', name: 'Sales Forecast', icon: TrendingUp, desc: 'Previsão de vendas' },
        { id: 'churn-prediction', name: 'Churn Prediction', icon: AlertTriangle, desc: 'Previsão de churn' },
        { id: 'customer-segmentation', name: 'Customer Segmentation', icon: Users, desc: 'Segmentação de clientes' },
        { id: 'trend-analysis', name: 'Trend Analysis', icon: Activity, desc: 'Análise de tendências' },
        { id: 'anomaly-detection', name: 'Anomaly Detection', icon: AlertTriangle, desc: 'Detecção de anomalias' },
        { id: 'marketing-roi', name: 'Marketing ROI', icon: DollarSign, desc: 'ROI de marketing' }
    ],
    social: [
        { id: 'instagram-performance', name: 'Instagram', icon: Instagram, desc: 'Performance Instagram' },
        { id: 'tiktok-performance', name: 'TikTok', icon: Video, desc: 'Performance TikTok' },
        { id: 'social-comparison', name: 'Social Comparison', icon: BarChart3, desc: 'Comparar plataformas' },
        { id: 'influencer-roi', name: 'Influencer ROI', icon: Award, desc: 'ROI de influencers' }
    ],
    financial: [
        { id: 'cashflow-forecast', name: 'Cashflow Forecast', icon: Wallet, desc: 'Previsão de caixa' },
        { id: 'profitability', name: 'Profitability', icon: PieChart, desc: 'Análise de lucratividade' },
        { id: 'revenue-scenarios', name: 'Revenue Scenarios', icon: GitBranch, desc: 'Cenários de receita' }
    ],
    training: [
        { id: 'train/regression', name: 'Regression', icon: TrendingUp, desc: 'Treinar modelo de regressão' },
        { id: 'train/classification', name: 'Classification', icon: Layers, desc: 'Treinar classificador' },
        { id: 'train/clustering', name: 'Clustering', icon: Users, desc: 'Treinar clustering' },
        { id: 'train/timeseries', name: 'Time Series', icon: Clock, desc: 'Treinar série temporal' }
    ],
    advanced: [
        { id: 'lead-forecast', name: 'Lead Forecast', icon: Target, desc: 'Previsão de leads' },
        { id: 'budget-optimization', name: 'Budget Optimization', icon: DollarSign, desc: 'Otimização de budget' },
        { id: 'inventory-optimization', name: 'Inventory', icon: Package, desc: 'Otimização de estoque' },
        { id: 'demand-forecast', name: 'Demand Forecast', icon: TrendingUp, desc: 'Previsão de demanda' },
        { id: 'return-analysis', name: 'Return Analysis', icon: Receipt, desc: 'Análise de devoluções' },
        { id: 'ltv-prediction', name: 'LTV Prediction', icon: Heart, desc: 'Previsão de LTV' },
        { id: 'rfm-analysis', name: 'RFM Analysis', icon: Layers, desc: 'Análise RFM' },
        { id: 'purchase-propensity', name: 'Purchase Propensity', icon: ShoppingCart, desc: 'Propensão de compra' },
        { id: 'satisfaction-trends', name: 'Satisfaction', icon: ThumbsUp, desc: 'Tendências de satisfação' },
        { id: 'funnel-optimization', name: 'Funnel', icon: GitBranch, desc: 'Otimização de funil' },
        { id: 'cart-abandonment', name: 'Cart Abandonment', icon: ShoppingCart, desc: 'Abandono de carrinho' },
        { id: 'ab-test', name: 'A/B Test', icon: Percent, desc: 'Análise de teste A/B' },
        { id: 'market-benchmark', name: 'Benchmark', icon: Award, desc: 'Benchmark de mercado' },
        { id: 'competitor-analysis', name: 'Competitor', icon: Building, desc: 'Análise competitiva' },
        { id: 'seasonality-forecast', name: 'Seasonality', icon: Calendar, desc: 'Previsão de sazonalidade' },
        { id: 'event-impact', name: 'Event Impact', icon: Zap, desc: 'Impacto de eventos' },
        { id: 'scenario-simulator', name: 'Scenario Simulator', icon: Settings, desc: 'Simulador de cenários' },
        { id: 'time-series-prophet', name: 'Prophet Forecast', icon: Clock, desc: 'Forecast com Prophet' }
    ]
};

interface AnalysisResult {
    success: boolean;
    analysis_type: string;
    [key: string]: any;
}

export const AnalysisHub: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState('core');
    const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [clientId, setClientId] = useState('1');
    const [params, setParams] = useState<Record<string, any>>({});

    const runAnalysis = async () => {
        if (!selectedAnalysis) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await apiClient.marketAnalysis.predict(selectedAnalysis, {
                client_id: parseInt(clientId),
                ...params
            });
            setResult(response);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    const renderParamInput = (analysisId: string) => {
        const commonParams = (
            <div className="space-y-3">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Client ID</label>
                    <input
                        type="number"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Dias Históricos</label>
                    <input
                        type="number"
                        value={params.historical_days || 90}
                        onChange={(e) => setParams({ ...params, historical_days: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                </div>
            </div>
        );

        if (analysisId.includes('forecast') || analysisId.includes('prophet')) {
            return (
                <>
                    {commonParams}
                    <div className="mt-3">
                        <label className="block text-sm text-gray-400 mb-1">Dias de Previsão</label>
                        <input
                            type="number"
                            value={params.forecast_days || params.forecast_periods || 30}
                            onChange={(e) => setParams({ ...params, forecast_days: parseInt(e.target.value), forecast_periods: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        />
                    </div>
                </>
            );
        }

        if (analysisId === 'budget-optimization') {
            return (
                <>
                    {commonParams}
                    <div className="mt-3">
                        <label className="block text-sm text-gray-400 mb-1">Budget Total (R$)</label>
                        <input
                            type="number"
                            value={params.total_budget || 10000}
                            onChange={(e) => setParams({ ...params, total_budget: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        />
                    </div>
                </>
            );
        }

        if (analysisId === 'trend-analysis') {
            return (
                <>
                    {commonParams}
                    <div className="mt-3">
                        <label className="block text-sm text-gray-400 mb-1">Métrica</label>
                        <select
                            value={params.metric || 'revenue'}
                            onChange={(e) => setParams({ ...params, metric: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        >
                            <option value="revenue">Revenue</option>
                            <option value="orders">Orders</option>
                            <option value="visits">Visits</option>
                            <option value="conversion_rate">Conversion Rate</option>
                        </select>
                    </div>
                </>
            );
        }

        if (analysisId === 'customer-segmentation' || analysisId === 'train/clustering') {
            return (
                <>
                    {commonParams}
                    <div className="mt-3">
                        <label className="block text-sm text-gray-400 mb-1">Número de Clusters</label>
                        <input
                            type="number"
                            value={params.n_clusters || 5}
                            onChange={(e) => setParams({ ...params, n_clusters: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        />
                    </div>
                </>
            );
        }

        return commonParams;
    };

    const renderResult = () => {
        if (!result) return null;

        return (
            <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-white font-medium">{result.analysis_type}</span>
                </div>

                <pre className="text-xs text-gray-300 overflow-auto max-h-96 bg-gray-950 p-3 rounded">
                    {JSON.stringify(result, null, 2)}
                </pre>
            </div>
        );
    };

    const currentCategory = CATEGORIES.find(c => c.id === selectedCategory);
    const analyses = ANALYSES[selectedCategory as keyof typeof ANALYSES] || [];

    return (
        <div className="p-6 bg-gray-950 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Analysis Hub</h1>
                    <p className="text-gray-400">35 análises de ML disponíveis</p>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        const isActive = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => { setSelectedCategory(cat.id); setSelectedAnalysis(null); setResult(null); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${isActive
                                        ? 'text-white'
                                        : 'bg-gray-800 text-gray-400 hover:text-white'
                                    }`}
                                style={isActive ? { backgroundColor: cat.color } : undefined}
                            >
                                <Icon size={16} />
                                {cat.name}
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Analysis Cards */}
                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {analyses.map(analysis => {
                                const Icon = analysis.icon;
                                const isSelected = selectedAnalysis === analysis.id;
                                return (
                                    <button
                                        key={analysis.id}
                                        onClick={() => { setSelectedAnalysis(analysis.id); setResult(null); setError(null); }}
                                        className={`p-4 rounded-lg border text-left transition-all ${isSelected
                                                ? 'border-violet-500 bg-violet-500/10'
                                                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                            }`}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                                            style={{ backgroundColor: currentCategory?.color + '20' }}
                                        >
                                            <Icon size={20} style={{ color: currentCategory?.color }} />
                                        </div>
                                        <h3 className="text-white font-medium text-sm">{analysis.name}</h3>
                                        <p className="text-gray-500 text-xs mt-1">{analysis.desc}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Config & Run Panel */}
                    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 h-fit">
                        {selectedAnalysis ? (
                            <>
                                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                                    <Settings size={16} />
                                    Configurar Análise
                                </h3>

                                {renderParamInput(selectedAnalysis)}

                                <button
                                    onClick={runAnalysis}
                                    disabled={loading}
                                    className="w-full mt-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                                    style={{ backgroundColor: currentCategory?.color }}
                                >
                                    {loading ? (
                                        <RefreshCw size={18} className="animate-spin text-white" />
                                    ) : (
                                        <>
                                            <ArrowRight size={18} className="text-white" />
                                            <span className="text-white">Executar</span>
                                        </>
                                    )}
                                </button>

                                {error && (
                                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {renderResult()}
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Search size={32} className="mx-auto mb-3 opacity-50" />
                                <p>Selecione uma análise</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisHub;
