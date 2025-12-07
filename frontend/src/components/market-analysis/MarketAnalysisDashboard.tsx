import React, { useState, useEffect } from 'react';
import {
    Database, Cpu, FlaskConical, Target, TrendingUp,
    BarChart3, Clock, CheckCircle, AlertCircle, Eye
} from 'lucide-react';
import { DataUpload } from './DataUpload';
import { TrainingWizard } from './TrainingWizard';
import { ExperimentDetails } from './ExperimentDetails';
import { apiClient } from '../../services/apiClient';

type TabType = 'data' | 'training' | 'experiments' | 'predictions';

interface Experiment {
    id: string;
    name: string;
    algorithm: string;
    task_type: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    metrics?: Record<string, number>;
    created_at: string;
}

const MarketAnalysisDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('data');
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'experiments') {
            loadExperiments();
        }
    }, [activeTab]);

    const loadExperiments = async () => {
        setLoading(true);
        try {
            const data = await apiClient.marketAnalysis.getExperiments();
            setExperiments(data || []);
        } catch (err) {
            console.error('Failed to load experiments', err);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'data' as TabType, label: 'Dados', icon: Database, description: 'Upload e gerenciamento de datasets' },
        { id: 'training' as TabType, label: 'Treinamento', icon: Cpu, description: 'Configurar novo treinamento' },
        { id: 'experiments' as TabType, label: 'Experimentos', icon: FlaskConical, description: 'Histórico e resultados' },
        { id: 'predictions' as TabType, label: 'Predições', icon: Target, description: 'Usar modelos em produção' },
    ];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'running': return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
            case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-yellow-500" />;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // If viewing a specific experiment
    if (selectedExperiment) {
        return (
            <ExperimentDetails
                experimentId={selectedExperiment}
                onBack={() => setSelectedExperiment(null)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <BarChart3 className="w-7 h-7 text-[#597996]" />
                        Análise de Mercado & ML
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Treine modelos de machine learning personalizados para suas análises de marketing
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-4 flex items-center gap-2 border-b-2 transition-all
                                    ${activeTab === tab.id
                                        ? 'border-[#597996] text-[#597996] bg-[#597996]/5'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto">
                {activeTab === 'data' && <DataUpload />}

                {activeTab === 'training' && <TrainingWizard />}

                {activeTab === 'experiments' && (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Experimentos</h2>
                                <p className="text-slate-500">Histórico de treinamentos e seus resultados</p>
                            </div>
                            <button
                                onClick={loadExperiments}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
                            >
                                <Clock className="w-4 h-4" />
                                Atualizar
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#597996]" />
                            </div>
                        ) : experiments.length > 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Nome</th>
                                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Algoritmo</th>
                                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Tipo</th>
                                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Status</th>
                                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Data</th>
                                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {experiments.map(exp => (
                                            <tr key={exp.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-slate-800">{exp.name}</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{exp.algorithm}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                                        {exp.task_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="flex items-center gap-2">
                                                        {getStatusIcon(exp.status)}
                                                        <span className="text-sm text-slate-600 capitalize">{exp.status}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {formatDate(exp.created_at)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => setSelectedExperiment(exp.id)}
                                                        className="p-2 hover:bg-slate-100 rounded-lg text-[#597996] transition-colors"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                                <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-700 mb-2">Nenhum experimento ainda</h3>
                                <p className="text-slate-500 mb-4">Inicie seu primeiro treinamento na aba "Treinamento"</p>
                                <button
                                    onClick={() => setActiveTab('training')}
                                    className="px-4 py-2 bg-[#2c6a6b] text-white rounded-lg hover:bg-[#245858]"
                                >
                                    Criar Experimento
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'predictions' && (
                    <div className="p-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                            <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-700 mb-2">Predições em Produção</h3>
                            <p className="text-slate-500 mb-4">
                                Após treinar e fazer deploy de um modelo, você poderá usá-lo aqui para fazer predições em novos dados.
                            </p>
                            <div className="max-w-md mx-auto text-left mt-8">
                                <h4 className="font-medium text-slate-700 mb-3">Como funciona:</h4>
                                <ol className="space-y-2 text-sm text-slate-600">
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-5 h-5 bg-[#597996] text-white rounded-full flex items-center justify-center text-xs">1</span>
                                        Faça upload de um dataset na aba "Dados"
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-5 h-5 bg-[#597996] text-white rounded-full flex items-center justify-center text-xs">2</span>
                                        Configure e treine um modelo na aba "Treinamento"
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-5 h-5 bg-[#597996] text-white rounded-full flex items-center justify-center text-xs">3</span>
                                        Avalie os resultados em "Experimentos"
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-5 h-5 bg-[#2c6a6b] text-white rounded-full flex items-center justify-center text-xs">4</span>
                                        Faça deploy do modelo para produção
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-5 h-5 bg-[#2c6a6b] text-white rounded-full flex items-center justify-center text-xs">5</span>
                                        Use o modelo aqui para predições!
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketAnalysisDashboard;
