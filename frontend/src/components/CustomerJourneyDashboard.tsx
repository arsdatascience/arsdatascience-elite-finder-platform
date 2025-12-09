import React, { useState, useEffect } from 'react';
import {
    Users, TrendingUp, Heart, DollarSign, Target, Activity,
    Smile, ThumbsUp, PieChart, BarChart3, ArrowUp, ArrowDown,
    RefreshCw, ChevronRight, Star, UserCheck, Clock, Zap,
    Award, AlertTriangle, CheckCircle, XCircle, Search, Sparkles, List
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { AIInsightsPanel } from './AIInsightsPanel';
import { CustomerJourneyList } from './CustomerJourneyList';
import { CustomerJourneyDetails } from './CustomerJourneyDetails';

interface KPIData {
    nps: {
        score: number | null;
        responses: number;
        promoters: number;
        passives: number;
        detractors: number;
        benchmark: number;
    };
    csat: {
        score: string | null;
        percent: number | null;
        responses: number;
        benchmark: number;
    };
    retention: {
        rate: number;
        currentClients: number;
        benchmark: number;
    };
    mrr: number;
    profitMargin: number;
    clv: number;
    cac: number;
    ltvCacRatio: string;
    revenue: number;
    expenses: number;
    profit: number;
    journeyDistribution: Array<{ current_stage: string; count: number }>;
    employeeHappiness: string | null;
    happinessResponses: number;
}

const CustomerJourneyDashboard: React.FC = () => {
    const [kpis, setKpis] = useState<KPIData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'satisfaction' | 'financial' | 'journey' | 'team' | 'insights' | 'list'>('journey');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    useEffect(() => {
        fetchKPIs();
    }, []);

    const fetchKPIs = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/kpis/dashboard'); // Helper method usage
            // Fallback for types since generic get returns AxiosResponse
            if (response.data.success) {
                setKpis(response.data.kpis);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // If a customer is selected, show details view instead of dashboard
    if (selectedCustomerId) {
        return <CustomerJourneyDetails customerId={selectedCustomerId} onBack={() => setSelectedCustomerId(null)} />;
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getStageInfo = (stage: string) => {
        const info: Record<string, { color: string; gradient: string; icon: React.ReactNode; label: string }> = {
            awareness: {
                color: 'blue',
                gradient: 'from-blue-600 to-blue-800',
                icon: <Target className="w-5 h-5" />,
                label: 'Conscientização'
            },
            consideration: {
                color: 'yellow',
                gradient: 'from-yellow-600 to-yellow-800',
                icon: <Search className="w-5 h-5" />,
                label: 'Consideração'
            },
            decision: {
                color: 'orange',
                gradient: 'from-orange-600 to-orange-800',
                icon: <CheckCircle className="w-5 h-5" />,
                label: 'Decisão'
            },
            retention: {
                color: 'green',
                gradient: 'from-green-600 to-green-800',
                icon: <Heart className="w-5 h-5" />,
                label: 'Retenção'
            }
        };
        return info[stage] || info.awareness;
    };

    const sections = [
        { id: 'satisfaction' as const, label: 'Satisfação', icon: ThumbsUp, color: 'from-purple-600 to-purple-800' },
        { id: 'financial' as const, label: 'Financeiro', icon: DollarSign, color: 'from-green-600 to-green-800' },
        { id: 'journey' as const, label: 'Jornada', icon: TrendingUp, color: 'from-blue-600 to-blue-800' },
        { id: 'list' as const, label: 'Explorar', icon: List, color: 'from-gray-600 to-gray-800' },
        { id: 'team' as const, label: 'Equipe', icon: Users, color: 'from-amber-600 to-amber-800' },
        { id: 'insights' as const, label: 'Insights IA', icon: Sparkles, color: 'from-pink-600 to-purple-600' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-400">Carregando KPIs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 p-6 space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <Heart className="w-8 h-8 text-pink-500" />
                    Jornada do Cliente
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    KPIs de Relacionamento, Satisfação, Saúde Financeira e Bem-estar da Equipe
                </p>
            </div>

            {/* Section Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {sections.map((section) => {
                    const Icon = section.icon;
                    const isSelected = activeSection === section.id;

                    return (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`p-4 rounded-xl border transition-all ${isSelected
                                ? `bg-gradient-to-br ${section.color} border-transparent shadow-lg scale-105`
                                : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                                }`}
                        >
                            <Icon className={`w-6 h-6 mb-2 mx-auto ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                            <span className={`font-semibold block ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                {section.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Satisfaction Section */}
            {activeSection === 'satisfaction' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <ThumbsUp className="w-6 h-6 text-purple-400" />
                        Relacionamento & Satisfação
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* NPS Card */}
                        <div className="bg-gradient-to-br from-purple-900/80 to-purple-800/50 rounded-2xl p-6 border border-purple-500/30 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <span className="text-purple-300 text-sm font-medium">Net Promoter Score</span>
                                    <p className="text-xs text-purple-400/70 mt-1">Lealdade do cliente</p>
                                </div>
                                <div className="p-3 bg-purple-500/20 rounded-xl">
                                    <Star className="w-6 h-6 text-purple-400" />
                                </div>
                            </div>
                            <div className="text-5xl font-bold text-white mb-4">
                                {kpis?.nps.score ?? '--'}
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                {(kpis?.nps.score ?? 0) >= (kpis?.nps.benchmark ?? 50) ? (
                                    <span className="flex items-center gap-1 text-green-400 text-sm">
                                        <ArrowUp className="w-4 h-4" /> Acima do benchmark
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-red-400 text-sm">
                                        <ArrowDown className="w-4 h-4" /> Abaixo do benchmark
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-green-500/20 rounded-lg p-2 text-center">
                                    <div className="text-green-400 font-bold">{kpis?.nps.promoters || 0}</div>
                                    <div className="text-xs text-green-400/70">Promotores</div>
                                </div>
                                <div className="bg-yellow-500/20 rounded-lg p-2 text-center">
                                    <div className="text-yellow-400 font-bold">{kpis?.nps.passives || 0}</div>
                                    <div className="text-xs text-yellow-400/70">Passivos</div>
                                </div>
                                <div className="bg-red-500/20 rounded-lg p-2 text-center">
                                    <div className="text-red-400 font-bold">{kpis?.nps.detractors || 0}</div>
                                    <div className="text-xs text-red-400/70">Detratores</div>
                                </div>
                            </div>
                        </div>

                        {/* CSAT Card */}
                        <div className="bg-gradient-to-br from-emerald-900/80 to-emerald-800/50 rounded-2xl p-6 border border-emerald-500/30 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <span className="text-emerald-300 text-sm font-medium">Satisfação (CSAT)</span>
                                    <p className="text-xs text-emerald-400/70 mt-1">Meta: {kpis?.csat.benchmark}%+</p>
                                </div>
                                <div className="p-3 bg-emerald-500/20 rounded-xl">
                                    <ThumbsUp className="w-6 h-6 text-emerald-400" />
                                </div>
                            </div>
                            <div className="text-5xl font-bold text-white mb-4">
                                {kpis?.csat.percent ?? '--'}%
                            </div>
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-emerald-300">Progresso</span>
                                    <span className="text-emerald-400">{kpis?.csat.percent || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(kpis?.csat.percent ?? 0, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">{kpis?.csat.responses || 0} respostas</span>
                                <span className="text-emerald-400">Nota: {kpis?.csat.score || '--'}/5</span>
                            </div>
                        </div>

                        {/* Retention Card */}
                        <div className="bg-gradient-to-br from-blue-900/80 to-blue-800/50 rounded-2xl p-6 border border-blue-500/30 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <span className="text-blue-300 text-sm font-medium">Taxa de Retenção</span>
                                    <p className="text-xs text-blue-400/70 mt-1">Benchmark: {kpis?.retention.benchmark}%+</p>
                                </div>
                                <div className="p-3 bg-blue-500/20 rounded-xl">
                                    <UserCheck className="w-6 h-6 text-blue-400" />
                                </div>
                            </div>
                            <div className="text-5xl font-bold text-white mb-4">
                                {kpis?.retention.rate ?? '--'}%
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Clientes ativos</span>
                                    <span className="text-blue-400 font-semibold">{kpis?.retention.currentClients || 0}</span>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <p className="text-xs text-blue-300">
                                        💡 Custa <span className="font-bold text-white">5x mais</span> adquirir um novo cliente do que reter um existente
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Financial Section */}
            {activeSection === 'financial' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-green-400" />
                        Saúde Financeira
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* MRR Card */}
                        <div className="bg-gradient-to-br from-green-900/80 to-green-800/50 rounded-2xl p-6 border border-green-500/30 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-green-300 text-sm font-medium">Receita Mensal (MRR)</span>
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-green-400" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-white mb-2">
                                {formatCurrency(kpis?.mrr ?? 0)}
                            </div>
                            <p className="text-sm text-green-400 flex items-center gap-1">
                                <Zap className="w-4 h-4" /> "Batimento cardíaco" da agência
                            </p>
                        </div>

                        {/* Profit Margin Card */}
                        <div className="bg-gradient-to-br from-cyan-900/80 to-cyan-800/50 rounded-2xl p-6 border border-cyan-500/30 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-cyan-300 text-sm font-medium">Margem de Lucro</span>
                                <div className="p-2 bg-cyan-500/20 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-white mb-2">
                                {kpis?.profitMargin ?? 0}%
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full"
                                    style={{ width: `${Math.min(kpis?.profitMargin ?? 0, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* CLV Card */}
                        <div className="bg-gradient-to-br from-pink-900/80 to-pink-800/50 rounded-2xl p-6 border border-pink-500/30 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-pink-300 text-sm font-medium">Lifetime Value (CLV)</span>
                                <div className="p-2 bg-pink-500/20 rounded-lg">
                                    <Heart className="w-5 h-5 text-pink-400" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-white mb-2">
                                {formatCurrency(kpis?.clv ?? 0)}
                            </div>
                            <p className="text-sm text-pink-400">
                                LTV/CAC: <span className="font-bold">{kpis?.ltvCacRatio ?? '--'}x</span>
                            </p>
                        </div>

                        {/* Profit Card */}
                        <div className="bg-gradient-to-br from-amber-900/80 to-amber-800/50 rounded-2xl p-6 border border-amber-500/30 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-amber-300 text-sm font-medium">Lucro do Mês</span>
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <Award className="w-5 h-5 text-amber-400" />
                                </div>
                            </div>
                            <div className={`text-3xl font-bold mb-2 ${(kpis?.profit ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(kpis?.profit ?? 0)}
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-400">
                                <span>Receita: {formatCurrency(kpis?.revenue ?? 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4">Resumo Financeiro</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                <span className="text-green-400 text-sm">Receita Total</span>
                                <div className="text-2xl font-bold text-white mt-1">{formatCurrency(kpis?.revenue ?? 0)}</div>
                            </div>
                            <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                                <span className="text-red-400 text-sm">Despesas Total</span>
                                <div className="text-2xl font-bold text-white mt-1">{formatCurrency(kpis?.expenses ?? 0)}</div>
                            </div>
                            <div className={`p-4 rounded-xl border ${(kpis?.profit ?? 0) >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                <span className={`text-sm ${(kpis?.profit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>Resultado</span>
                                <div className={`text-2xl font-bold mt-1 ${(kpis?.profit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {formatCurrency(kpis?.profit ?? 0)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Journey Section */}
            {activeSection === 'journey' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-blue-400" />
                        Funil da Jornada do Cliente
                    </h2>

                    {/* Journey Funnel */}
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {['awareness', 'consideration', 'decision', 'retention'].map((stage, idx) => {
                                const stageInfo = getStageInfo(stage);
                                const stageData = kpis?.journeyDistribution?.find(s => s.current_stage === stage);
                                const count = stageData?.count ?? 0;

                                return (
                                    <div key={stage} className="relative">
                                        <div className={`bg-gradient-to-br ${stageInfo.gradient} rounded-2xl p-6 text-center border border-white/10`}>
                                            <div className="p-3 bg-white/10 rounded-xl w-fit mx-auto mb-3">
                                                {stageInfo.icon}
                                            </div>
                                            <div className="text-4xl font-bold text-white mb-2">{count}</div>
                                            <div className="text-sm text-white/80">{stageInfo.label}</div>
                                        </div>
                                        {idx < 3 && (
                                            <div className="hidden md:flex absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                                                <ChevronRight className="w-6 h-6 text-gray-500" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Journey Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/30 rounded-xl p-5 border border-blue-500/20">
                            <Target className="w-6 h-6 text-blue-400 mb-3" />
                            <h3 className="font-semibold text-white mb-2">Retenção é 5x mais barato</h3>
                            <p className="text-sm text-gray-400">
                                Custa 5x mais adquirir um novo cliente do que reter um existente.
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/30 rounded-xl p-5 border border-purple-500/20">
                            <BarChart3 className="w-6 h-6 text-purple-400 mb-3" />
                            <h3 className="font-semibold text-white mb-2">75% = Benchmark de Retenção</h3>
                            <p className="text-sm text-gray-400">
                                Taxa acima de 75% indica estabilidade de receita saudável.
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 rounded-xl p-5 border border-emerald-500/20">
                            <Clock className="w-6 h-6 text-emerald-400 mb-3" />
                            <h3 className="font-semibold text-white mb-2">Rastreie o ciclo completo</h3>
                            <p className="text-sm text-gray-400">
                                Meça satisfação ao longo de todo o projeto, não só ao final.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Section */}
            {activeSection === 'team' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-amber-400" />
                        Saúde da Equipe
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Employee Happiness Card */}
                        <div className="bg-gradient-to-br from-amber-900/80 to-amber-800/50 rounded-2xl p-8 border border-amber-500/30 shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <span className="text-amber-300 text-lg font-medium">Felicidade da Equipe</span>
                                    <p className="text-sm text-amber-400/70 mt-1">Pesquisa semanal</p>
                                </div>
                                <div className="p-4 bg-amber-500/20 rounded-2xl">
                                    <Smile className="w-8 h-8 text-amber-400" />
                                </div>
                            </div>
                            <div className="text-6xl font-bold text-white mb-4">
                                {kpis?.employeeHappiness ?? '--'}<span className="text-2xl text-amber-400">/10</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">{kpis?.happinessResponses || 0} respostas esta semana</span>
                            </div>
                        </div>

                        {/* Team Insights */}
                        <div className="space-y-4">
                            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-red-500/20 rounded-xl">
                                        <AlertTriangle className="w-6 h-6 text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">Alto turnover = 5x mais custos</h3>
                                        <p className="text-sm text-gray-400">
                                            Turnover alto aumenta custos de treinamento, diminui moral e aumenta probabilidade de churn de clientes.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-green-500/20 rounded-xl">
                                        <CheckCircle className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">Check-ins frequentes</h3>
                                        <p className="text-sm text-gray-400">
                                            Converse com funcionários frequentemente — semanalmente se possível.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-purple-500/20 rounded-xl">
                                        <Activity className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">Indicador crítico</h3>
                                        <p className="text-sm text-gray-400">
                                            Felicidade dos funcionários é um indicador enorme da saúde geral da agência.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Insights Section */}
            {activeSection === 'insights' && (
                <div className="animate-in fade-in duration-300">
                    <AIInsightsPanel />
                </div>
            )}

            {/* List Section */}
            {activeSection === 'list' && (
                <CustomerJourneyList onSelectCustomer={(id) => setSelectedCustomerId(id)} />
            )}

            {/* Refresh Button */}
            <div className="flex justify-center pt-4">
                <button
                    onClick={fetchKPIs}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl hover:opacity-90 transition shadow-lg"
                >
                    <RefreshCw className="w-5 h-5" />
                    Atualizar Dados
                </button>
            </div>
        </div>
    );
};

export default CustomerJourneyDashboard;
