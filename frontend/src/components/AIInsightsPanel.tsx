import React, { useState, useEffect } from 'react';
import {
    Sparkles, Brain, TrendingUp, AlertTriangle, Lightbulb,
    Download, RefreshCw, ChevronRight, CheckCircle, XCircle,
    Database, Search, FileText, Bot, Clock
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';

import { AIProvider, AI_MODELS, OpenAIModel } from '@/constants/aiModels';

interface Insight {
    id: string;
    insight_type: string;
    title: string;
    summary: string;
    full_analysis?: {
        keyFindings: string[];
        opportunities: string[];
        risks: string[];
        recommendations: { action: string; priority: string; impact: string }[];
        metrics: {
            healthScore: number;
            retentionRisk: string;
            growthPotential: string;
        };
    };
    data_sources?: {
        crossover: { totalCustomers: number; journeyStages: number; interactionTypes: number };
        megalev: { projects: number; revenue: number };
    };
    report_url?: string;
    created_at: string;
}

interface AIInsightsPanelProps {
    onClose?: () => void;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ onClose }) => {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [focusArea, setFocusArea] = useState<'all' | 'churn' | 'upsell' | 'engagement'>('all');
    const [error, setError] = useState<string | null>(null);

    // AI Selection State
    const [provider, setProvider] = useState<AIProvider>(AIProvider.OPENAI);
    const [model, setModel] = useState<string>(OpenAIModel.GPT_4O);

    // Update model when provider changes
    useEffect(() => {
        const firstModel = AI_MODELS[provider][0].id;
        setModel(firstModel);
    }, [provider]);

    useEffect(() => {
        fetchRecentInsights();
    }, []);

    const fetchRecentInsights = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/insights/recent?limit=10');
            if (response.data.success) {
                setInsights(response.data.insights);
            }
        } catch (err) {
            console.error('Erro ao buscar insights:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateInsight = async () => {
        setGenerating(true);
        setError(null);
        try {
            const response = await apiClient.post('/insights/customer-journey', {
                focusArea,
                generateReport: true,
                provider, // Send selected provider
                model     // Send selected model
            });
            if (response.data.success) {
                setSelectedInsight(response.data.insight);
                fetchRecentInsights();
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao gerar insight');
        } finally {
            setGenerating(false);
        }
    };

    const viewInsight = async (id: string) => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/insights/${id}`);
            if (response.data.success) {
                setSelectedInsight(response.data.insight);
            }
        } catch (err) {
            console.error('Erro ao carregar insight:', err);
        } finally {
            setLoading(false);
        }
    };

    const getHealthScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        if (score >= 40) return 'text-orange-400';
        return 'text-red-400';
    };

    const getRiskColor = (risk: string) => {
        if (risk === 'baixo') return 'bg-green-500/20 text-green-400';
        if (risk === 'médio') return 'bg-yellow-500/20 text-yellow-400';
        return 'bg-red-500/20 text-red-400';
    };

    const getPotentialColor = (potential: string) => {
        if (potential === 'alto') return 'bg-green-500/20 text-green-400';
        if (potential === 'médio') return 'bg-yellow-500/20 text-yellow-400';
        return 'bg-gray-500/20 text-gray-400';
    };

    return (
        <div className="space-y-6">
            {/* Header with Generate Button */}
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/20 rounded-xl">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Insights com IA</h2>
                            <p className="text-gray-400 text-sm">Análise inteligente da jornada do cliente</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Database className="w-4 h-4" /> Qdrant + Crossover + Megalev
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors"
                                title="Fechar Painel"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Model Selection */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1 ml-1">Provedor IA</label>
                        <div className="relative">
                            <Bot className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <select
                                value={provider}
                                onChange={(e) => setProvider(e.target.value as AIProvider)}
                                className="w-full bg-gray-900/50 border border-gray-700 text-gray-200 text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:border-purple-500/50 transition-colors appearance-none"
                            >
                                <option value={AIProvider.OPENAI}>OpenAI (Padrão)</option>
                                <option value={AIProvider.ANTHROPIC}>Anthropic (Claude)</option>
                                <option value={AIProvider.GEMINI}>Google (Gemini)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1 ml-1">Modelo</label>
                        <div className="relative">
                            <Brain className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-700 text-gray-200 text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:border-purple-500/50 transition-colors appearance-none"
                            >
                                {AI_MODELS[provider].map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Focus Area Selection */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {[
                        { id: 'all', label: 'Visão Geral', icon: TrendingUp },
                        { id: 'churn', label: 'Risco de Churn', icon: AlertTriangle },
                        { id: 'upsell', label: 'Oportunidades', icon: Lightbulb },
                        { id: 'engagement', label: 'Engajamento', icon: Brain }
                    ].map(option => (
                        <button
                            key={option.id}
                            onClick={() => setFocusArea(option.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${focusArea === option.id
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                                }`}
                        >
                            <option.icon className="w-4 h-4" />
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Generate Button */}
                <button
                    onClick={generateInsight}
                    disabled={generating}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {generating ? (
                        <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Analisando dados...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            Gerar Insight com IA
                        </>
                    )}
                </button>

                {error && (
                    <div className="mt-3 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-red-400">Erro na Análise</h4>
                                <p className="text-red-300 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                        {error.includes('status code 500') && (
                            <div className="mt-3 pt-3 border-t border-red-500/20">
                                <p className="text-xs text-red-400 font-mono mb-1">Debug Info:</p>
                                <pre className="text-[10px] bg-black/30 p-2 rounded overflow-auto max-h-32 text-red-300/70 font-mono">
                                    Backend endpoint: /api/insights/customer-journey{'\n'}
                                    Check: ai_insights table exists?{'\n'}
                                    Check: columns in projects table (budget vs total_value)?
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Selected Insight Detail */}
            {selectedInsight && (
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-700">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">{selectedInsight.title}</h3>
                                <p className="text-gray-400 mt-1">{selectedInsight.summary}</p>
                            </div>
                            {selectedInsight.report_url && (
                                <a
                                    href={selectedInsight.report_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Relatório
                                </a>
                            )}
                        </div>

                        {/* Data Sources */}
                        {selectedInsight.data_sources && (
                            <div className="flex gap-4 mt-4 text-xs">
                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full text-blue-400">
                                    <Database className="w-3 h-3" />
                                    Crossover: {selectedInsight.data_sources.crossover?.totalCustomers || 0} clientes
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full text-green-400">
                                    <FileText className="w-3 h-3" />
                                    Megalev: {selectedInsight.data_sources.megalev?.projects || 0} projetos
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 rounded-full text-purple-400">
                                    <Search className="w-3 h-3" />
                                    Qdrant: Contexto semântico
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedInsight.full_analysis && (
                        <div className="p-6 space-y-6">
                            {/* Metrics */}
                            {selectedInsight.full_analysis.metrics && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                                        <div className={`text-3xl font-bold ${getHealthScoreColor(selectedInsight.full_analysis.metrics.healthScore)}`}>
                                            {selectedInsight.full_analysis.metrics.healthScore}
                                        </div>
                                        <div className="text-gray-400 text-sm mt-1">Health Score</div>
                                    </div>
                                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(selectedInsight.full_analysis.metrics.retentionRisk)}`}>
                                            {selectedInsight.full_analysis.metrics.retentionRisk}
                                        </div>
                                        <div className="text-gray-400 text-sm mt-2">Risco de Churn</div>
                                    </div>
                                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPotentialColor(selectedInsight.full_analysis.metrics.growthPotential)}`}>
                                            {selectedInsight.full_analysis.metrics.growthPotential}
                                        </div>
                                        <div className="text-gray-400 text-sm mt-2">Potencial</div>
                                    </div>
                                </div>
                            )}

                            {/* Key Findings */}
                            {selectedInsight.full_analysis.keyFindings?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wide mb-3">
                                        📌 Principais Descobertas
                                    </h4>
                                    <ul className="space-y-2">
                                        {selectedInsight.full_analysis.keyFindings.map((finding, i) => (
                                            <li key={i} className="flex items-start gap-2 text-gray-300">
                                                <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                                {finding}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Opportunities */}
                            {selectedInsight.full_analysis.opportunities?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-green-400 uppercase tracking-wide mb-3">
                                        🚀 Oportunidades
                                    </h4>
                                    <ul className="space-y-2">
                                        {selectedInsight.full_analysis.opportunities.map((opp, i) => (
                                            <li key={i} className="flex items-start gap-2 text-gray-300">
                                                <Lightbulb className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                                {opp}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Risks */}
                            {selectedInsight.full_analysis.risks?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3">
                                        ⚠️ Riscos
                                    </h4>
                                    <ul className="space-y-2">
                                        {selectedInsight.full_analysis.risks.map((risk, i) => (
                                            <li key={i} className="flex items-start gap-2 text-gray-300">
                                                <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                                {risk}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Recommendations */}
                            {selectedInsight.full_analysis.recommendations?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
                                        💡 Recomendações
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedInsight.full_analysis.recommendations.map((rec, i) => (
                                            <div key={i} className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-white">{rec.action}</span>
                                                    <span className={`text-xs px-2 py-1 rounded ${rec.priority === 'alta' ? 'bg-red-500/20 text-red-400' :
                                                        rec.priority === 'média' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-gray-500/20 text-gray-400'
                                                        }`}>
                                                        Prioridade: {rec.priority}
                                                    </span>
                                                </div>
                                                <p className="text-gray-400 text-sm">{rec.impact}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Recent Insights List */}
            <div className="bg-gray-800 rounded-xl border border-gray-700">
                <div className="p-4 border-b border-gray-700">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Insights Recentes
                    </h3>
                </div>

                {loading && !generating ? (
                    <div className="p-8 text-center">
                        <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                    </div>
                ) : insights.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Nenhum insight gerado ainda. Clique em "Gerar Insight com IA" para começar.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700">
                        {insights.map(insight => (
                            <button
                                key={insight.id}
                                onClick={() => viewInsight(insight.id)}
                                className={`w-full p-4 text-left hover:bg-gray-700/50 transition-colors flex items-center justify-between ${selectedInsight?.id === insight.id ? 'bg-gray-700/30' : ''
                                    }`}
                            >
                                <div>
                                    <div className="font-medium text-white">{insight.title}</div>
                                    <div className="text-sm text-gray-400 mt-1 line-clamp-1">{insight.summary}</div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        {new Date(insight.created_at).toLocaleString('pt-BR')}
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIInsightsPanel;
