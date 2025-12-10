import React, { useState, useEffect } from 'react';
import {
    BarChart3, TrendingUp, Table, PieChart, Activity,
    Download, RefreshCw,
    Target, Layers, Database, Factory, ShoppingCart,
    Store, Cpu, Sprout, Car, Sparkles, GitBranch, Clock, Filter
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { formatCurrency, formatNumber } from '../../utils/formatters';

// Segment icons mapping
const SEGMENT_ICONS: Record<string, React.ElementType> = {
    ecommerce: ShoppingCart,
    retail: Store,
    technology: Cpu,
    agriculture: Sprout,
    automotive: Car,
    aesthetics: Sparkles
};

// Analysis type icons
const ANALYSIS_ICONS: Record<string, React.ElementType> = {
    regression: TrendingUp,
    classification: GitBranch,
    clustering: Layers,
    timeseries: Clock
};

interface Segment {
    id: number;
    code: string;
    name_pt: string;
    name_en: string;
    color: string;
    icon: string;
    typical_metrics: string[];
}

interface AnalyticsResult {
    id: string;
    segment_id: number;
    segment_code: string;
    segment_name: string;
    segment_color: string;
    analysis_type: 'regression' | 'classification' | 'clustering' | 'timeseries';
    algorithm: string;
    primary_metric_name: string;
    primary_metric_value: number;
    secondary_metrics: Record<string, number>;
    sample_size: number;
    created_at: string;
    visualization?: any;
}

export const AnalyticsResults: React.FC = () => {
    const [segments, setSegments] = useState<Segment[]>([]);
    const [results, setResults] = useState<AnalyticsResult[]>([]);
    const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
    const [selectedResult, setSelectedResult] = useState<AnalyticsResult | null>(null);
    const [selectedAnalysisType, setSelectedAnalysisType] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts');

    useEffect(() => {
        loadSegments();
    }, []);

    useEffect(() => {
        loadResults();
    }, [selectedSegment, selectedAnalysisType]);

    const loadSegments = async () => {
        try {
            const data = await apiClient.marketAnalysis.getSegments();
            setSegments(data || []);
        } catch (err) {
            console.error('Failed to load segments', err);
        }
    };

    const loadResults = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (selectedSegment) params.segment = selectedSegment;
            if (selectedAnalysisType) params.analysis_type = selectedAnalysisType;

            const data = await apiClient.marketAnalysis.getAnalyticsResults(params);
            setResults(data || []);
            if (data?.length > 0 && !selectedResult) {
                setSelectedResult(data[0]);
            }
        } catch (err) {
            console.error('Failed to load analytics results', err);
        } finally {
            setLoading(false);
        }
    };



    const isMonetaryMetric = (name: string) => {
        const lowerName = name.toLowerCase();
        return ['revenue', 'sales', 'profit', 'cost', 'price', 'ltv', 'cac', 'amount', 'budget'].some(term => lowerName.includes(term));
    };

    const getFormattedMetric = (name: string, value: number) => {
        if (isMonetaryMetric(name)) return formatCurrency(value);
        return formatNumber(value);
    };



    // ... MetricDisplay Component ...





    const getAlgorithmDisplayName = (algorithm: string): string => {
        const names: Record<string, string> = {
            'linear_regression': 'Linear Regression',
            'ridge_regression': 'Ridge Regression',
            'lasso_regression': 'Lasso Regression',
            'random_forest_regressor': 'Random Forest',
            'xgboost_regressor': 'XGBoost',
            'lightgbm_regressor': 'LightGBM',
            'gradient_boosting_regressor': 'Gradient Boosting',
            'logistic_regression': 'Logistic Regression',
            'decision_tree_classifier': 'Decision Tree',
            'random_forest_classifier': 'Random Forest',
            'xgboost_classifier': 'XGBoost',
            'lightgbm_classifier': 'LightGBM',
            'naive_bayes': 'Naive Bayes',
            'svm_classifier': 'SVM',
            'kmeans': 'K-Means',
            'dbscan': 'DBSCAN',
            'hierarchical': 'Hierarchical',
            'prophet': 'Prophet',
            'arima': 'ARIMA',
            'sarima': 'SARIMA',
            'exponential_smoothing': 'Exp. Smoothing'
        };
        return names[algorithm] || algorithm;
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <BarChart3 className="w-7 h-7 text-[#597996]" />
                            Resultados e Análises
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Visualize resultados estatísticos e preditivos por segmento de mercado
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={loadResults}
                            className="px-4 py-2 bg-slate-100 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-200"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Atualizar
                        </button>
                    </div>
                </div>

                {/* Segment Selector */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                    <h3 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                        <Factory className="w-4 h-4" />
                        Segmento de Mercado
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedSegment(null)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${!selectedSegment
                                    ? 'bg-[#597996] text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Todos
                        </button>
                        {segments.map(seg => {
                            const Icon = SEGMENT_ICONS[seg.code] || Database;
                            return (
                                <button
                                    key={seg.code}
                                    onClick={() => setSelectedSegment(seg.code)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all
                                        ${selectedSegment === seg.code
                                            ? 'text-white shadow-md'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    style={selectedSegment === seg.code ? { backgroundColor: seg.color } : {}}
                                >
                                    <Icon className="w-4 h-4" />
                                    {seg.name_pt}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Analysis Type Filter */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                    <h3 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Tipo de Análise
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: null, label: 'Todos', icon: Activity },
                            { key: 'regression', label: 'Regressão', icon: TrendingUp },
                            { key: 'classification', label: 'Classificação', icon: GitBranch },
                            { key: 'clustering', label: 'Clustering', icon: Layers },
                            { key: 'timeseries', label: 'Séries Temporais', icon: Clock }
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                key={key || 'all'}
                                onClick={() => setSelectedAnalysisType(key)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all
                                    ${selectedAnalysisType === key
                                        ? 'bg-[#2c6a6b] text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#597996]" />
                    </div>
                ) : results.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-700 mb-2">Nenhum resultado encontrado</h3>
                        <p className="text-slate-500 mb-4">
                            Execute o script de seed ou crie experimentos para ver resultados aqui.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Results List */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                                <h3 className="font-semibold text-slate-800 mb-4 flex items-center justify-between">
                                    <span>Análises ({results.length})</span>
                                </h3>
                                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                    {results.map(result => {
                                        const Icon = ANALYSIS_ICONS[result.analysis_type] || Activity;
                                        return (
                                            <div
                                                key={result.id}
                                                onClick={() => setSelectedResult(result)}
                                                className={`p-3 rounded-lg cursor-pointer transition-all
                                                    ${selectedResult?.id === result.id
                                                        ? 'bg-[#597996]/10 border border-[#597996]/30'
                                                        : 'hover:bg-slate-50 border border-transparent'}`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div
                                                        className="p-1.5 rounded-lg mt-0.5"
                                                        style={{ backgroundColor: `${result.segment_color}20` }}
                                                    >
                                                        <Icon className="w-4 h-4" style={{ color: result.segment_color }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-slate-800 text-sm truncate">
                                                            {getAlgorithmDisplayName(result.algorithm)}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            {result.segment_name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-medium text-[#2c6a6b]">
                                                                {result.primary_metric_name}: {getFormattedMetric(result.primary_metric_name, result.primary_metric_value)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Results Detail */}
                        <div className="lg:col-span-3">
                            {selectedResult ? (
                                <div className="space-y-6">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <SummaryCard
                                            icon={<Database className="w-5 h-5" />}
                                            label="Segmento"
                                            value={selectedResult.segment_name}
                                            color={selectedResult.segment_color}
                                        />
                                        <SummaryCard
                                            icon={<Activity className="w-5 h-5" />}
                                            label="Algoritmo"
                                            value={getAlgorithmDisplayName(selectedResult.algorithm)}
                                            color="#597996"
                                        />
                                        <SummaryCard
                                            icon={<Target className="w-5 h-5" />}
                                            label={selectedResult.primary_metric_name}
                                            value={getFormattedMetric(selectedResult.primary_metric_name, selectedResult.primary_metric_value)}
                                            color="#2c6a6b"
                                        />
                                        <SummaryCard
                                            icon={<Layers className="w-5 h-5" />}
                                            label="Amostras"
                                            value={selectedResult.sample_size?.toLocaleString() || 'N/A'}
                                            color="#597996"
                                        />
                                    </div>

                                    {/* View Toggle */}
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-slate-800">
                                            {getAlgorithmDisplayName(selectedResult.algorithm)} - {selectedResult.analysis_type}
                                        </h3>
                                        <div className="flex bg-slate-100 rounded-lg p-1">
                                            <button
                                                onClick={() => setViewMode('charts')}
                                                className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 transition-colors
                                                    ${viewMode === 'charts' ? 'bg-white shadow text-[#597996]' : 'text-slate-500'}`}
                                            >
                                                <PieChart className="w-4 h-4" />
                                                Gráficos
                                            </button>
                                            <button
                                                onClick={() => setViewMode('table')}
                                                className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 transition-colors
                                                    ${viewMode === 'table' ? 'bg-white shadow text-[#597996]' : 'text-slate-500'}`}
                                            >
                                                <Table className="w-4 h-4" />
                                                Tabelas
                                            </button>
                                        </div>
                                    </div>

                                    {/* Secondary Metrics */}
                                    {selectedResult.secondary_metrics && Object.keys(selectedResult.secondary_metrics).length > 0 && (
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-[#597996]" />
                                                Métricas Secundárias
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {Object.entries(selectedResult.secondary_metrics).map(([key, value]) => (
                                                    <MetricDisplay key={key} name={key} value={value as number} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Visualization Content */}
                                    {viewMode === 'charts' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Algorithm-specific visualizations */}
                                            {selectedResult.analysis_type === 'regression' && selectedResult.visualization && (
                                                <>
                                                    <RegressionScatterChart data={selectedResult.visualization.scatter_data} />
                                                    <CoefficientChart data={selectedResult.visualization.coefficient_chart} />
                                                </>
                                            )}

                                            {selectedResult.analysis_type === 'classification' && selectedResult.visualization && (
                                                <>
                                                    <ConfusionMatrixChart data={selectedResult.visualization.confusion_matrix} />
                                                    <ROCCurveChart data={selectedResult.visualization.roc_curve} />
                                                </>
                                            )}

                                            {selectedResult.analysis_type === 'clustering' && selectedResult.visualization && (
                                                <>
                                                    <ClusterScatterChart data={selectedResult.visualization.cluster_scatter} />
                                                    <ClusterSizesChart data={selectedResult.visualization.cluster_sizes} />
                                                </>
                                            )}

                                            {selectedResult.analysis_type === 'timeseries' && selectedResult.visualization && (
                                                <>
                                                    <TimeSeriesChart
                                                        historical={selectedResult.visualization.historical_data}
                                                        forecast={selectedResult.visualization.forecast_data}
                                                    />
                                                </>
                                            )}

                                            {/* Fallback Performance Card */}
                                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                                <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                    <BarChart3 className="w-5 h-5 text-[#2c6a6b]" />
                                                    Desempenho
                                                </h4>
                                                <div className="space-y-4">
                                                    <PerformanceRow
                                                        label={selectedResult.primary_metric_name}
                                                        value={Math.min(selectedResult.primary_metric_value * 100, 100)}
                                                    />
                                                    {selectedResult.secondary_metrics && Object.entries(selectedResult.secondary_metrics).slice(0, 2).map(([key, val]) => (
                                                        <PerformanceRow key={key} label={key} value={Math.min((val as number) * 100, 100)} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Table View */}
                                    {viewMode === 'table' && (
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                                                <h4 className="font-semibold text-slate-800">Dados Estatísticos</h4>
                                                <button className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-200">
                                                    <Download className="w-4 h-4" />
                                                    Exportar CSV
                                                </button>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50">
                                                        <tr>
                                                            <th className="text-left px-4 py-3 font-medium text-slate-600">Métrica</th>
                                                            <th className="text-right px-4 py-3 font-medium text-slate-600">Valor</th>
                                                            <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        <tr className="hover:bg-slate-50">
                                                            <td className="px-4 py-3 font-medium text-slate-800">{selectedResult.primary_metric_name}</td>
                                                            <td className="px-4 py-3 text-right text-slate-600">{getFormattedMetric(selectedResult.primary_metric_name, selectedResult.primary_metric_value)}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                                                                    ✓
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        {selectedResult.secondary_metrics && Object.entries(selectedResult.secondary_metrics).map(([key, value]) => (
                                                            <tr key={key} className="hover:bg-slate-50">
                                                                <td className="px-4 py-3 font-medium text-slate-800">{key}</td>
                                                                <td className="px-4 py-3 text-right text-slate-600">{getFormattedMetric(key, value as number)}</td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                                                                        ✓
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Export Button */}
                                    <div className="flex justify-end gap-3">
                                        <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                                            <Download className="w-4 h-4" />
                                            Exportar Relatório
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                                    <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-slate-700 mb-2">Selecione uma análise</h3>
                                    <p className="text-slate-500">Escolha um resultado à esquerda para visualizar</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper Components
const SummaryCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-2 text-slate-500 mb-2">
            <span style={{ color }}>{icon}</span>
            <span className="text-sm">{label}</span>
        </div>
        <p className="text-lg font-bold text-slate-800 truncate">{value}</p>
    </div>
);



const MetricDisplay: React.FC<{ name: string; value: number }> = ({ name, value }) => {
    const isPercentage = name.includes('accuracy') || name.includes('precision') || name.includes('recall') || name.includes('f1') || name.includes('auc');

    let displayValue = '';
    if (isPercentage && value <= 1) {
        displayValue = `${(value * 100).toFixed(2)}%`;
    } else if (['revenue', 'sales', 'profit', 'cost', 'price', 'ltv', 'cac', 'amount', 'budget'].some(term => name.toLowerCase().includes(term))) {
        displayValue = formatCurrency(value);
    } else {
        displayValue = formatNumber(value);
    }

    return (
        <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{name.replace(/_/g, ' ')}</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{displayValue}</p>
        </div>
    );
};

const PerformanceRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div>
        <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600">{label}</span>
            <span className="font-medium text-slate-800">{value.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
            <div
                className="h-3 rounded-full bg-gradient-to-r from-[#2c6a6b] to-emerald-500"
                style={{ width: `${Math.min(value, 100)}%` }}
            />
        </div>
    </div>
);

// Visualization Components
const RegressionScatterChart: React.FC<{ data: any[] }> = ({ data }) => {
    if (!data || data.length === 0) return null;

    const maxX = Math.max(...data.map(d => d.x));
    const maxY = Math.max(...data.map(d => d.y));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#597996]" />
                Actual vs Predicted
            </h4>
            <div className="relative h-48 border border-slate-200 rounded bg-slate-50">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    {data.slice(0, 50).map((point, i) => (
                        <circle
                            key={i}
                            cx={(point.x / maxX) * 95 + 2.5}
                            cy={100 - ((point.y / maxY) * 95 + 2.5)}
                            r="1.5"
                            fill="#597996"
                            opacity="0.6"
                        />
                    ))}
                    <line x1="0" y1="100" x2="100" y2="0" stroke="#2c6a6b" strokeWidth="0.5" strokeDasharray="2" />
                </svg>
            </div>
        </div>
    );
};

const CoefficientChart: React.FC<{ data: any[] }> = ({ data }) => {
    if (!data || data.length === 0) return null;

    const maxAbs = Math.max(...data.map(d => Math.abs(d.coefficient)));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#2c6a6b]" />
                Coeficientes
            </h4>
            <div className="space-y-3">
                {data.slice(0, 6).map((item, i) => (
                    <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-700 truncate">{item.feature}</span>
                            <span className="text-slate-500">{item.coefficient.toFixed(3)}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 relative">
                            <div
                                className={`h-2 rounded-full ${item.coefficient >= 0 ? 'bg-[#2c6a6b]' : 'bg-red-400'}`}
                                style={{
                                    width: `${(Math.abs(item.coefficient) / maxAbs) * 100}%`,
                                    marginLeft: item.coefficient < 0 ? 'auto' : 0
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ConfusionMatrixChart: React.FC<{ data: any }> = ({ data }) => {
    if (!data || !data.matrix) return null;

    const { labels, matrix } = data;
    const max = Math.max(...matrix.flat());

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-[#597996]" />
                Matriz de Confusão
            </h4>
            <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${labels.length}, 1fr)` }}>
                <div></div>
                {labels.map((l: string, i: number) => (
                    <div key={i} className="text-xs text-center text-slate-500 py-1">{l}</div>
                ))}
                {matrix.map((row: number[], i: number) => (
                    <React.Fragment key={i}>
                        <div className="text-xs text-slate-500 pr-2 flex items-center">{labels[i]}</div>
                        {row.map((val: number, j: number) => (
                            <div
                                key={j}
                                className="aspect-square flex items-center justify-center text-xs font-medium rounded"
                                style={{
                                    backgroundColor: i === j
                                        ? `rgba(44, 106, 107, ${val / max})`
                                        : `rgba(239, 68, 68, ${val / max * 0.5})`,
                                    color: val / max > 0.5 ? 'white' : '#334155'
                                }}
                            >
                                {val}
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

const ROCCurveChart: React.FC<{ data: any[] }> = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#2c6a6b]" />
                Curva ROC
            </h4>
            <div className="relative h-48 border border-slate-200 rounded bg-slate-50">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    <line x1="0" y1="100" x2="100" y2="0" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                    <polyline
                        fill="none"
                        stroke="#2c6a6b"
                        strokeWidth="2"
                        points={data.map(d => `${d.fpr * 100},${100 - d.tpr * 100}`).join(' ')}
                    />
                </svg>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-slate-400">FPR</div>
                <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-slate-400">TPR</div>
            </div>
        </div>
    );
};

const ClusterScatterChart: React.FC<{ data: any[] }> = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#597996]" />
                Distribuição de Clusters
            </h4>
            <div className="relative h-48 border border-slate-200 rounded bg-slate-50">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    {data.slice(0, 200).map((point, i) => (
                        <circle
                            key={i}
                            cx={point.x}
                            cy={100 - point.y}
                            r="2"
                            fill={point.color || '#597996'}
                            opacity="0.7"
                        />
                    ))}
                </svg>
            </div>
        </div>
    );
};

const ClusterSizesChart: React.FC<{ data: any[] }> = ({ data }) => {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data.map(d => d.size));
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#2c6a6b]" />
                Tamanho dos Clusters
            </h4>
            <div className="space-y-3">
                {data.map((cluster, i) => (
                    <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-700">{cluster.label}</span>
                            <span className="text-slate-500">{cluster.size.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3">
                            <div
                                className="h-3 rounded-full"
                                style={{
                                    width: `${(cluster.size / max) * 100}%`,
                                    backgroundColor: colors[i % colors.length]
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TimeSeriesChart: React.FC<{ historical: any[]; forecast: any[] }> = ({ historical, forecast }) => {
    if (!historical || historical.length === 0) return null;

    const allValues = [...historical.map(d => d.value), ...(forecast || []).map(d => d.value)];
    const max = Math.max(...allValues);
    const totalPoints = historical.length + (forecast?.length || 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:col-span-2">
            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#597996]" />
                Série Temporal com Forecast
            </h4>
            <div className="relative h-48 border border-slate-200 rounded bg-slate-50">
                <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                    {/* Historical line */}
                    <polyline
                        fill="none"
                        stroke="#597996"
                        strokeWidth="1.5"
                        points={historical.map((d, i) =>
                            `${(i / totalPoints) * 100},${100 - (d.value / max) * 90}`
                        ).join(' ')}
                    />
                    {/* Forecast line */}
                    {forecast && forecast.length > 0 && (
                        <>
                            <polyline
                                fill="none"
                                stroke="#2c6a6b"
                                strokeWidth="1.5"
                                strokeDasharray="4"
                                points={forecast.map((d, i) =>
                                    `${((historical.length + i) / totalPoints) * 100},${100 - (d.value / max) * 90}`
                                ).join(' ')}
                            />
                            {/* Confidence band */}
                            <path
                                fill="#2c6a6b"
                                opacity="0.1"
                                d={`
                                    M ${(historical.length / totalPoints) * 100} ${100 - (forecast[0].lower / max) * 90}
                                    ${forecast.map((d, i) =>
                                    `L ${((historical.length + i) / totalPoints) * 100} ${100 - (d.lower / max) * 90}`
                                ).join(' ')}
                                    ${forecast.slice().reverse().map((d, i) =>
                                    `L ${((historical.length + forecast.length - 1 - i) / totalPoints) * 100} ${100 - (d.upper / max) * 90}`
                                ).join(' ')}
                                    Z
                                `}
                            />
                        </>
                    )}
                    {/* Dividing line between historical and forecast */}
                    <line
                        x1={(historical.length / totalPoints) * 100}
                        y1="0"
                        x2={(historical.length / totalPoints) * 100}
                        y2="100"
                        stroke="#94a3b8"
                        strokeWidth="0.5"
                        strokeDasharray="2"
                    />
                </svg>
            </div>
            <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 bg-[#597996]" />
                    <span>Histórico</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 bg-[#2c6a6b]" style={{ background: 'repeating-linear-gradient(90deg, #2c6a6b 0, #2c6a6b 4px, transparent 4px, transparent 8px)' }} />
                    <span>Forecast</span>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsResults;
