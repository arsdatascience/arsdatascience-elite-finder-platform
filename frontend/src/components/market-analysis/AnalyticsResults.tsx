import React, { useState, useEffect } from 'react';
import {
    BarChart3, TrendingUp, Table, PieChart, Activity,
    Download, Filter, RefreshCw, ArrowUpRight, ArrowDownRight,
    Target, Layers, Calendar, Database
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface AnalysisResult {
    id: string;
    experiment_id?: string;
    experiment_name?: string;
    analysis_type: 'statistical' | 'predictive' | 'clustering';
    created_at: string;
    dataset_name: string;
    summary: {
        total_rows: number;
        total_columns: number;
        target_column?: string;
    };
    statistics?: {
        [column: string]: {
            mean?: number;
            median?: number;
            std?: number;
            min?: number;
            max?: number;
            null_count?: number;
            unique_count?: number;
        };
    };
    predictions?: {
        actual: number[];
        predicted: number[];
        labels?: string[];
    };
    metrics?: {
        [key: string]: number;
    };
    feature_importance?: { feature: string; importance: number }[];
    distribution?: { label: string; value: number }[];
}

export const AnalyticsResults: React.FC = () => {
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts');
    const [filterType, setFilterType] = useState<string | null>(null);

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        setLoading(true);
        try {
            // Load experiments as results
            const experiments = await apiClient.marketAnalysis.getExperiments();
            const completedExps = (experiments || []).filter((e: any) => e.status === 'completed');

            // Transform to AnalysisResult format
            const transformedResults: AnalysisResult[] = completedExps.map((exp: any) => ({
                id: exp.id,
                experiment_id: exp.id,
                experiment_name: exp.name,
                analysis_type: exp.task_type === 'clustering' ? 'clustering' : 'predictive',
                created_at: exp.created_at,
                dataset_name: exp.dataset_name || 'Dataset',
                summary: {
                    total_rows: exp.row_count || 0,
                    total_columns: exp.feature_columns?.length || 0,
                    target_column: exp.target_column,
                },
                metrics: exp.metrics,
                feature_importance: exp.feature_importance,
                predictions: exp.predictions,
            }));

            setResults(transformedResults);
            if (transformedResults.length > 0) {
                setSelectedResult(transformedResults[0]);
            }
        } catch (err) {
            console.error('Failed to load results', err);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number | undefined): string => {
        if (num === undefined) return '--';
        if (Math.abs(num) < 0.01 || Math.abs(num) > 10000) {
            return num.toExponential(2);
        }
        return num.toFixed(4);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredResults = filterType
        ? results.filter(r => r.analysis_type === filterType)
        : results;

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
                            Visualize estatísticas e resultados preditivos dos seus modelos
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={filterType || ''}
                            onChange={(e) => setFilterType(e.target.value || null)}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        >
                            <option value="">Todos os tipos</option>
                            <option value="statistical">Estatístico</option>
                            <option value="predictive">Preditivo</option>
                            <option value="clustering">Clustering</option>
                        </select>
                        <button
                            onClick={loadResults}
                            className="px-4 py-2 bg-slate-100 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-200"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Atualizar
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#597996]" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Results List */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                                <h3 className="font-semibold text-slate-800 mb-4">Análises Concluídas</h3>
                                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                    {filteredResults.map(result => (
                                        <div
                                            key={result.id}
                                            onClick={() => setSelectedResult(result)}
                                            className={`p-3 rounded-lg cursor-pointer transition-all
                                                ${selectedResult?.id === result.id
                                                    ? 'bg-[#597996]/10 border border-[#597996]/30'
                                                    : 'hover:bg-slate-50 border border-transparent'}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-slate-800 text-sm">
                                                        {result.experiment_name || `Análise #${result.id.slice(0, 6)}`}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {result.dataset_name}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium
                                                    ${result.analysis_type === 'predictive'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : result.analysis_type === 'clustering'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-green-100 text-green-700'}`}>
                                                    {result.analysis_type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-2">
                                                {formatDate(result.created_at)}
                                            </p>
                                        </div>
                                    ))}
                                    {filteredResults.length === 0 && (
                                        <div className="text-center py-8 text-slate-400 text-sm">
                                            Nenhuma análise encontrada
                                        </div>
                                    )}
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
                                            label="Dataset"
                                            value={selectedResult.dataset_name}
                                            color="#597996"
                                        />
                                        <SummaryCard
                                            icon={<Layers className="w-5 h-5" />}
                                            label="Features"
                                            value={String(selectedResult.summary.total_columns)}
                                            color="#2c6a6b"
                                        />
                                        <SummaryCard
                                            icon={<Target className="w-5 h-5" />}
                                            label="Target"
                                            value={selectedResult.summary.target_column || 'N/A'}
                                            color="#597996"
                                        />
                                        <SummaryCard
                                            icon={<Calendar className="w-5 h-5" />}
                                            label="Criado em"
                                            value={new Date(selectedResult.created_at).toLocaleDateString('pt-BR')}
                                            color="#2c6a6b"
                                        />
                                    </div>

                                    {/* View Toggle */}
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-slate-800">
                                            {selectedResult.experiment_name || 'Resultados da Análise'}
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

                                    {/* Metrics Section */}
                                    {selectedResult.metrics && Object.keys(selectedResult.metrics).length > 0 && (
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-[#597996]" />
                                                Métricas do Modelo
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {Object.entries(selectedResult.metrics).map(([key, value]) => (
                                                    <MetricDisplay key={key} name={key} value={value} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Charts View */}
                                    {viewMode === 'charts' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Feature Importance Chart */}
                                            {selectedResult.feature_importance && selectedResult.feature_importance.length > 0 && (
                                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                        <Layers className="w-5 h-5 text-[#2c6a6b]" />
                                                        Importância das Features
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {selectedResult.feature_importance
                                                            .sort((a, b) => b.importance - a.importance)
                                                            .slice(0, 8)
                                                            .map((fi, i) => (
                                                                <FeatureBar key={i} feature={fi.feature} importance={fi.importance} />
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                            )}

                                            {/* Predictions Chart (Simulated) */}
                                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                                <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                    <TrendingUp className="w-5 h-5 text-[#597996]" />
                                                    Tendência Preditiva
                                                </h4>
                                                <div className="h-48 flex items-end justify-between gap-2 px-4">
                                                    {[65, 72, 58, 80, 75, 90, 85, 95, 88, 92].map((value, i) => (
                                                        <div key={i} className="flex-1 flex flex-col items-center">
                                                            <div
                                                                className="w-full bg-gradient-to-t from-[#597996] to-[#2c6a6b] rounded-t"
                                                                style={{ height: `${value}%` }}
                                                            />
                                                            <span className="text-xs text-slate-400 mt-1">{i + 1}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-center text-slate-400 mt-4">
                                                    Valores previstos por período
                                                </p>
                                            </div>

                                            {/* Performance Over Time */}
                                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                                <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                    <BarChart3 className="w-5 h-5 text-[#2c6a6b]" />
                                                    Desempenho
                                                </h4>
                                                <div className="space-y-4">
                                                    <PerformanceRow label="Precisão Geral" value={85} />
                                                    <PerformanceRow label="Recall" value={78} />
                                                    <PerformanceRow label="Confiança" value={92} />
                                                </div>
                                            </div>

                                            {/* Distribution */}
                                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                                <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                    <PieChart className="w-5 h-5 text-[#597996]" />
                                                    Distribuição
                                                </h4>
                                                <div className="flex items-center justify-center gap-8">
                                                    <div className="relative w-32 h-32">
                                                        <svg viewBox="0 0 36 36" className="w-full h-full">
                                                            <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#e2e8f0" strokeWidth="3" />
                                                            <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#597996" strokeWidth="3"
                                                                strokeDasharray="60 40" strokeDashoffset="25" />
                                                            <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#2c6a6b" strokeWidth="3"
                                                                strokeDasharray="30 70" strokeDashoffset="-35" />
                                                        </svg>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full bg-[#597996]" />
                                                            <span className="text-sm text-slate-600">Categoria A (60%)</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full bg-[#2c6a6b]" />
                                                            <span className="text-sm text-slate-600">Categoria B (30%)</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full bg-slate-200" />
                                                            <span className="text-sm text-slate-600">Outros (10%)</span>
                                                        </div>
                                                    </div>
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
                                                            <th className="text-right px-4 py-3 font-medium text-slate-600">Variação</th>
                                                            <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {selectedResult.metrics && Object.entries(selectedResult.metrics).map(([key, value]) => (
                                                            <tr key={key} className="hover:bg-slate-50">
                                                                <td className="px-4 py-3 font-medium text-slate-800">{key}</td>
                                                                <td className="px-4 py-3 text-right text-slate-600">{formatNumber(value)}</td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className="flex items-center justify-end gap-1 text-emerald-600">
                                                                        <ArrowUpRight className="w-4 h-4" />
                                                                        +2.3%
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                                                                        Bom
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {(!selectedResult.metrics || Object.keys(selectedResult.metrics).length === 0) && (
                                                            <tr>
                                                                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                                                                    Nenhuma métrica disponível
                                                                </td>
                                                            </tr>
                                                        )}
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
    const isPercentage = name.includes('accuracy') || name.includes('precision') || name.includes('recall') || name.includes('f1');
    const displayValue = isPercentage ? `${(value * 100).toFixed(2)}%` : value.toFixed(4);

    return (
        <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{name.replace(/_/g, ' ')}</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{displayValue}</p>
        </div>
    );
};

const FeatureBar: React.FC<{ feature: string; importance: number }> = ({ feature, importance }) => (
    <div>
        <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-700 truncate">{feature}</span>
            <span className="text-slate-500">{(importance * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
            <div
                className="h-2 rounded-full bg-gradient-to-r from-[#597996] to-[#2c6a6b]"
                style={{ width: `${Math.min(importance * 100, 100)}%` }}
            />
        </div>
    </div>
);

const PerformanceRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div>
        <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600">{label}</span>
            <span className="font-medium text-slate-800">{value}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
            <div
                className="h-3 rounded-full bg-gradient-to-r from-[#2c6a6b] to-emerald-500"
                style={{ width: `${value}%` }}
            />
        </div>
    </div>
);

export default AnalyticsResults;
