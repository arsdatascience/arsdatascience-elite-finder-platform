import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, BarChart3, Target, TrendingUp, Activity,
    Layers, Clock, CheckCircle, Download, RefreshCw
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface Experiment {
    id: string;
    name: string;
    dataset_id: string;
    dataset_name?: string;
    algorithm: string;
    task_type: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    target_column: string;
    feature_columns: string[];
    hyperparameters: Record<string, any>;
    metrics?: {
        accuracy?: number;
        precision?: number;
        recall?: number;
        f1_score?: number;
        r2?: number;
        rmse?: number;
        mae?: number;
        mape?: number;
    };
    feature_importance?: { feature: string; importance: number }[];
    training_duration?: number;
    created_at: string;
    completed_at?: string;
    is_deployed?: boolean;
}

interface ExperimentDetailsProps {
    experimentId: string;
    onBack: () => void;
}

export const ExperimentDetails: React.FC<ExperimentDetailsProps> = ({ experimentId, onBack }) => {
    const [experiment, setExperiment] = useState<Experiment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadExperiment();
    }, [experimentId]);

    const loadExperiment = async () => {
        setLoading(true);
        try {
            const data = await apiClient.marketAnalysis.getExperiments();
            const exp = (data || []).find((e: Experiment) => e.id === experimentId);
            setExperiment(exp || null);
        } catch (err) {
            console.error('Falha ao carregar experimento', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '--';
        if (seconds < 60) return `${seconds}s`;
        return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '--';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            running: 'bg-blue-100 text-blue-700',
            completed: 'bg-emerald-100 text-emerald-700',
            failed: 'bg-red-100 text-red-700',
        };
        const labels: Record<string, string> = {
            pending: 'Pendente',
            running: 'Treinando',
            completed: 'Concluído',
            failed: 'Falhou',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-slate-100'}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <RefreshCw className="w-8 h-8 text-[#597996] animate-spin" />
            </div>
        );
    }

    if (!experiment) {
        return (
            <div className="text-center py-12 text-slate-500">
                Experimento não encontrado
            </div>
        );
    }

    const isRegression = experiment.task_type === 'regression';
    const metrics = experiment.metrics || {};

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">{experiment.name}</h1>
                            <p className="text-slate-500 flex items-center gap-2">
                                {experiment.algorithm} • {experiment.dataset_name || experiment.dataset_id}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {getStatusBadge(experiment.status)}
                        <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Exportar
                        </button>
                    </div>
                </div>

                {/* Status Running */}
                {experiment.status === 'running' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-4">
                        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                        <div>
                            <p className="font-medium text-blue-800">Treinamento em andamento</p>
                            <p className="text-sm text-blue-600">Isso pode levar alguns minutos. Atualize para verificar o progresso.</p>
                        </div>
                        <button
                            onClick={loadExperiment}
                            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Atualizar
                        </button>
                    </div>
                )}

                {/* Metrics Cards */}
                {experiment.status === 'completed' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {isRegression ? (
                            <>
                                <MetricCard icon={<Target className="w-5 h-5" />} label="R²" value={metrics.r2?.toFixed(4) || '--'} color="#597996" />
                                <MetricCard icon={<Activity className="w-5 h-5" />} label="RMSE" value={metrics.rmse?.toFixed(4) || '--'} color="#2c6a6b" />
                                <MetricCard icon={<TrendingUp className="w-5 h-5" />} label="MAE" value={metrics.mae?.toFixed(4) || '--'} color="#597996" />
                                <MetricCard icon={<BarChart3 className="w-5 h-5" />} label="MAPE" value={metrics.mape ? `${(metrics.mape * 100).toFixed(2)}%` : '--'} color="#2c6a6b" />
                            </>
                        ) : (
                            <>
                                <MetricCard icon={<Target className="w-5 h-5" />} label="Accuracy" value={metrics.accuracy ? `${(metrics.accuracy * 100).toFixed(2)}%` : '--'} color="#597996" />
                                <MetricCard icon={<CheckCircle className="w-5 h-5" />} label="Precision" value={metrics.precision ? `${(metrics.precision * 100).toFixed(2)}%` : '--'} color="#2c6a6b" />
                                <MetricCard icon={<Activity className="w-5 h-5" />} label="Recall" value={metrics.recall ? `${(metrics.recall * 100).toFixed(2)}%` : '--'} color="#597996" />
                                <MetricCard icon={<TrendingUp className="w-5 h-5" />} label="F1 Score" value={metrics.f1_score ? `${(metrics.f1_score * 100).toFixed(2)}%` : '--'} color="#2c6a6b" />
                            </>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Feature Importance */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-[#597996]" />
                            Feature Importance
                        </h3>
                        {experiment.feature_importance && experiment.feature_importance.length > 0 ? (
                            <div className="space-y-3">
                                {experiment.feature_importance
                                    .sort((a, b) => b.importance - a.importance)
                                    .slice(0, 10)
                                    .map((fi, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-slate-700">{fi.feature}</span>
                                                <span className="text-slate-500">{(fi.importance * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full bg-gradient-to-r from-[#597996] to-[#2c6a6b]"
                                                    style={{ width: `${fi.importance * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                {experiment.status === 'completed'
                                    ? 'Feature importance não disponível para este algoritmo'
                                    : 'Disponível após o treinamento'}
                            </div>
                        )}
                    </div>

                    {/* Training Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-[#2c6a6b]" />
                            Informações do Treinamento
                        </h3>
                        <div className="space-y-3">
                            <InfoRow label="Algoritmo" value={experiment.algorithm} />
                            <InfoRow label="Tipo" value={experiment.task_type} />
                            <InfoRow label="Target" value={experiment.target_column} />
                            <InfoRow label="Features" value={`${experiment.feature_columns?.length || 0} colunas`} />
                            <InfoRow label="Iniciado em" value={formatDate(experiment.created_at)} />
                            <InfoRow label="Concluído em" value={formatDate(experiment.completed_at)} />
                            <InfoRow label="Duração" value={formatDuration(experiment.training_duration)} />
                        </div>

                        {experiment.hyperparameters && Object.keys(experiment.hyperparameters).length > 0 && (
                            <div className="mt-6 pt-4 border-t border-slate-200">
                                <h4 className="text-sm font-medium text-slate-700 mb-3">Hiperparâmetros</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(experiment.hyperparameters).map(([key, value]) => (
                                        <div key={key} className="text-sm">
                                            <span className="text-slate-500">{key}:</span>{' '}
                                            <span className="font-medium text-slate-700">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {experiment.status === 'completed' && (
                    <div className="mt-6 flex justify-end gap-3">
                        <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                            Comparar com Outros
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    await apiClient.marketAnalysis.deployModel(experiment.id);
                                    alert('Modelo deployado com sucesso!');
                                    loadExperiment();
                                } catch (err) {
                                    alert('Erro ao fazer deploy do modelo');
                                }
                            }}
                            className={`px-4 py-2 rounded-lg text-white ${experiment.is_deployed
                                ? 'bg-emerald-600 cursor-default'
                                : 'bg-[#2c6a6b] hover:bg-[#245858]'
                                }`}
                            disabled={experiment.is_deployed}
                        >
                            {experiment.is_deployed ? '✓ Em Produção' : 'Deploy para Produção'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-2 text-slate-500 mb-2">
            <span style={{ color }}>{icon}</span>
            <span className="text-sm">{label}</span>
        </div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-slate-700">{value}</span>
    </div>
);

export default ExperimentDetails;
