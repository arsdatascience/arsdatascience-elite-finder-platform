import React, { useState, useEffect } from 'react';
import {
    Trophy, BarChart3, GitCompare, Filter, TrendingUp,
    Clock, CheckCircle, X, ArrowUpDown
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface Experiment {
    id: string;
    name: string;
    algorithm: string;
    task_type: string;
    status: string;
    metrics?: {
        accuracy?: number;
        f1_score?: number;
        r2?: number;
        rmse?: number;
    };
    created_at: string;
}

interface ModelComparisonProps {
    onSelectExperiment?: (id: string) => void;
}

export const ModelComparison: React.FC<ModelComparisonProps> = ({ onSelectExperiment }) => {
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
    const [filterType, setFilterType] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'date' | 'metric'>('date');

    useEffect(() => {
        loadExperiments();
    }, []);

    const loadExperiments = async () => {
        setLoading(true);
        try {
            const data = await apiClient.marketAnalysis.getExperiments();
            setExperiments((data || []).filter((e: Experiment) => e.status === 'completed'));
        } catch (err) {
            console.error('Failed to load experiments', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedForCompare.includes(id)) {
            setSelectedForCompare(prev => prev.filter(x => x !== id));
        } else if (selectedForCompare.length < 3) {
            setSelectedForCompare(prev => [...prev, id]);
        }
    };

    const getMainMetric = (exp: Experiment): number => {
        if (!exp.metrics) return 0;
        if (exp.task_type === 'regression') {
            return exp.metrics.r2 || 0;
        }
        return exp.metrics.accuracy || exp.metrics.f1_score || 0;
    };

    const getMainMetricLabel = (exp: Experiment): string => {
        if (exp.task_type === 'regression') return 'R²';
        return 'Accuracy';
    };

    const formatMetric = (value: number, isPercentage: boolean = false): string => {
        if (isPercentage) return `${(value * 100).toFixed(2)}%`;
        return value.toFixed(4);
    };

    const filteredExperiments = experiments
        .filter(exp => !filterType || exp.task_type === filterType)
        .sort((a, b) => {
            if (sortBy === 'metric') {
                return getMainMetric(b) - getMainMetric(a);
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

    const selectedExperiments = experiments.filter(e => selectedForCompare.includes(e.id));

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-[#597996]" />
                        Leaderboard de Modelos
                    </h2>
                    <p className="text-slate-500">Compare e ranqueie seus modelos treinados</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterType || ''}
                        onChange={(e) => setFilterType(e.target.value || null)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                        <option value="">Todos os tipos</option>
                        <option value="classification">Classificação</option>
                        <option value="regression">Regressão</option>
                        <option value="clustering">Clustering</option>
                    </select>
                    <button
                        onClick={() => setSortBy(sortBy === 'date' ? 'metric' : 'date')}
                        className="px-3 py-2 bg-slate-100 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-200"
                    >
                        <ArrowUpDown className="w-4 h-4" />
                        {sortBy === 'date' ? 'Ordenar por Métrica' : 'Ordenar por Data'}
                    </button>
                </div>
            </div>

            {/* Comparison Panel (when models selected) */}
            {selectedForCompare.length > 0 && (
                <div className="bg-[#597996]/10 border border-[#597996]/30 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <GitCompare className="w-5 h-5 text-[#597996]" />
                            Comparando {selectedForCompare.length} modelo(s)
                        </h3>
                        <button
                            onClick={() => setSelectedForCompare([])}
                            className="text-sm text-slate-500 hover:text-slate-700"
                        >
                            Limpar seleção
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedExperiments.map((exp, idx) => (
                            <div key={exp.id} className="bg-white rounded-lg p-4 border border-slate-200">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-lg font-bold text-[#597996]">#{idx + 1}</span>
                                    <button
                                        onClick={() => toggleSelect(exp.id)}
                                        className="p-1 hover:bg-slate-100 rounded"
                                    >
                                        <X className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                                <h4 className="font-medium text-slate-800 mb-1">{exp.name}</h4>
                                <p className="text-sm text-slate-500 mb-3">{exp.algorithm}</p>

                                <div className="space-y-2">
                                    {exp.metrics && Object.entries(exp.metrics).map(([key, value]) => (
                                        <div key={key} className="flex justify-between text-sm">
                                            <span className="text-slate-500">{key}</span>
                                            <span className="font-medium text-slate-700">
                                                {typeof value === 'number' ? formatMetric(value, key !== 'rmse' && key !== 'mae' && key !== 'r2') : '--'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Leaderboard Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#597996]" />
                </div>
            ) : filteredExperiments.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="w-12 px-4 py-3"></th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Rank</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Modelo</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Algoritmo</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Tipo</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Métrica Principal</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Data</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredExperiments.map((exp, idx) => {
                                const isSelected = selectedForCompare.includes(exp.id);
                                const mainMetric = getMainMetric(exp);
                                const isRegression = exp.task_type === 'regression';

                                return (
                                    <tr
                                        key={exp.id}
                                        className={`hover:bg-slate-50 cursor-pointer ${isSelected ? 'bg-[#597996]/5' : ''}`}
                                        onClick={() => onSelectExperiment?.(exp.id)}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    toggleSelect(exp.id);
                                                }}
                                                disabled={!isSelected && selectedForCompare.length >= 3}
                                                className="w-4 h-4 rounded text-[#597996] focus:ring-[#597996]"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                                ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    idx === 1 ? 'bg-slate-200 text-slate-600' :
                                                        idx === 2 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
                                            >
                                                {idx + 1}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-slate-800">{exp.name}</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{exp.algorithm}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                                {exp.task_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-500">{getMainMetricLabel(exp)}:</span>
                                                <span className="font-bold text-slate-800">
                                                    {formatMetric(mainMetric, !isRegression)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500">
                                            {new Date(exp.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">Nenhum modelo concluído</h3>
                    <p className="text-slate-500">Treine modelos para ver o ranking aqui</p>
                </div>
            )}
        </div>
    );
};

export default ModelComparison;
