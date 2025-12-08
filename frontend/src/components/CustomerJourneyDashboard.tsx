import React, { useState, useEffect } from 'react';
import {
    Users, TrendingUp, Heart, DollarSign, Target, Activity,
    Smile, ThumbsUp, PieChart, BarChart3, ArrowUp, ArrowDown,
    RefreshCw, ChevronRight, Star, UserCheck, Clock
} from 'lucide-react';
import { useApiClient } from '../hooks/useApiClient';

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
    const api = useApiClient();
    const [kpis, setKpis] = useState<KPIData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchKPIs();
    }, []);

    const fetchKPIs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/kpis/dashboard');
            if (response.data.success) {
                setKpis(response.data.kpis);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getStageColor = (stage: string) => {
        const colors: Record<string, string> = {
            awareness: 'bg-blue-500',
            consideration: 'bg-yellow-500',
            decision: 'bg-orange-500',
            retention: 'bg-green-500'
        };
        return colors[stage] || 'bg-gray-500';
    };

    const getStageLabel = (stage: string) => {
        const labels: Record<string, string> = {
            awareness: 'Conscientização',
            consideration: 'Consideração',
            decision: 'Decisão',
            retention: 'Retenção'
        };
        return labels[stage] || stage;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Jornada do Cliente</h1>
                    <p className="text-gray-400">KPIs de Relacionamento, Satisfação e Saúde Financeira</p>
                </div>
                <button
                    onClick={fetchKPIs}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition"
                >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                </button>
            </div>

            {/* Relationship & Satisfaction KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* NPS Card */}
                <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-5 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-purple-300">Net Promoter Score</span>
                        <Star className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">
                        {kpis?.nps.score ?? '--'}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        {(kpis?.nps.score ?? 0) >= (kpis?.nps.benchmark ?? 50) ? (
                            <ArrowUp className="w-3 h-3 text-green-400" />
                        ) : (
                            <ArrowDown className="w-3 h-3 text-red-400" />
                        )}
                        <span className="text-gray-400">Benchmark: {kpis?.nps.benchmark}</span>
                    </div>
                    <div className="mt-3 flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                            {kpis?.nps.promoters} Promotores
                        </span>
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">
                            {kpis?.nps.detractors} Detratores
                        </span>
                    </div>
                </div>

                {/* CSAT Card */}
                <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 rounded-xl p-5 border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-emerald-300">Satisfação (CSAT)</span>
                        <ThumbsUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">
                        {kpis?.csat.percent ?? '--'}%
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        {(kpis?.csat.percent ?? 0) >= (kpis?.csat.benchmark ?? 80) ? (
                            <ArrowUp className="w-3 h-3 text-green-400" />
                        ) : (
                            <ArrowDown className="w-3 h-3 text-red-400" />
                        )}
                        <span className="text-gray-400">Meta: {kpis?.csat.benchmark}%</span>
                    </div>
                    <div className="mt-3 text-xs text-gray-400">
                        {kpis?.csat.responses || 0} respostas • Nota média: {kpis?.csat.score || '--'}
                    </div>
                </div>

                {/* Retention Card */}
                <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-5 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-blue-300">Taxa de Retenção</span>
                        <UserCheck className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">
                        {kpis?.retention.rate ?? '--'}%
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        {(kpis?.retention.rate ?? 0) >= (kpis?.retention.benchmark ?? 75) ? (
                            <ArrowUp className="w-3 h-3 text-green-400" />
                        ) : (
                            <ArrowDown className="w-3 h-3 text-red-400" />
                        )}
                        <span className="text-gray-400">Benchmark: {kpis?.retention.benchmark}%</span>
                    </div>
                    <div className="mt-3 text-xs text-gray-400">
                        {kpis?.retention.currentClients || 0} clientes ativos
                    </div>
                </div>

                {/* Employee Happiness Card */}
                <div className="bg-gradient-to-br from-amber-900/50 to-amber-800/30 rounded-xl p-5 border border-amber-500/20">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-amber-300">Felicidade da Equipe</span>
                        <Smile className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">
                        {kpis?.employeeHappiness ?? '--'}/10
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        <span className="text-gray-400">
                            {kpis?.happinessResponses || 0} respostas esta semana
                        </span>
                    </div>
                    <div className="mt-3 text-xs text-amber-400">
                        ⚡ Alto turnover = 5x mais custos
                    </div>
                </div>
            </div>

            {/* Financial Health KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* MRR Card */}
                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-400">Receita Mensal (MRR)</span>
                        <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {formatCurrency(kpis?.mrr ?? 0)}
                    </div>
                    <div className="mt-2 text-xs text-green-400">
                        💓 "Batimento cardíaco" da agência
                    </div>
                </div>

                {/* Profit Margin Card */}
                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-400">Margem de Lucro</span>
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {kpis?.profitMargin ?? 0}%
                    </div>
                    <div className="mt-2">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-emerald-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(kpis?.profitMargin ?? 0, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* CLV Card */}
                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-400">Lifetime Value (CLV)</span>
                        <Heart className="w-5 h-5 text-pink-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {formatCurrency(kpis?.clv ?? 0)}
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                        LTV/CAC: {kpis?.ltvCacRatio ?? '--'}x
                    </div>
                </div>

                {/* Profit Card */}
                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-400">Lucro do Mês</span>
                        <Activity className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className={`text-2xl font-bold ${(kpis?.profit ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(kpis?.profit ?? 0)}
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                        Receita: {formatCurrency(kpis?.revenue ?? 0)}
                    </div>
                </div>
            </div>

            {/* Customer Journey Funnel */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    Funil da Jornada do Cliente
                </h2>

                <div className="grid grid-cols-4 gap-4">
                    {['awareness', 'consideration', 'decision', 'retention'].map((stage) => {
                        const stageData = kpis?.journeyDistribution?.find(s => s.current_stage === stage);
                        const count = stageData?.count ?? 0;

                        return (
                            <div key={stage} className="text-center">
                                <div className={`w-full h-2 ${getStageColor(stage)} rounded-full mb-2`} />
                                <div className="text-2xl font-bold text-white">{count}</div>
                                <div className="text-sm text-gray-400">{getStageLabel(stage)}</div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
                    <ChevronRight className="w-4 h-4" />
                    <span>Fluxo: Conscientização → Consideração → Decisão → Retenção</span>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 rounded-xl p-4 border border-blue-500/20">
                    <div className="flex items-start gap-3">
                        <Target className="w-6 h-6 text-blue-400 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-white">Retenção é 5x mais barato</h3>
                            <p className="text-sm text-gray-400">
                                Custa 5x mais adquirir um novo cliente do que reter um existente.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 rounded-xl p-4 border border-purple-500/20">
                    <div className="flex items-start gap-3">
                        <BarChart3 className="w-6 h-6 text-purple-400 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-white">75% = Benchmark de Retenção</h3>
                            <p className="text-sm text-gray-400">
                                Taxa acima de 75% indica estabilidade de receita saudável.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 rounded-xl p-4 border border-emerald-500/20">
                    <div className="flex items-start gap-3">
                        <Clock className="w-6 h-6 text-emerald-400 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-white">Rastreie o ciclo completo</h3>
                            <p className="text-sm text-gray-400">
                                Meça satisfação ao longo de todo o projeto, não só ao final.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerJourneyDashboard;
