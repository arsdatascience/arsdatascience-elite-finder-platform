import React, { useState, useEffect } from 'react';
import {
    User, Mail, Phone, Calendar, ArrowLeft, Network,
    MessageSquare, MousePointer, ShoppingCart, Clock, Shield
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';

interface Props {
    customerId: string;
    onBack: () => void;
}

export const CustomerJourneyDetails: React.FC<Props> = ({ customerId, onBack }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetails();
    }, [customerId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/customers/unified/${customerId}`);
            if (response.data.success) {
                setData(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch details', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-400">Carregando perfil unificado...</div>;
    if (!data) return <div className="p-10 text-center text-red-400">Cliente não encontrado.</div>;

    const { customer, identityGraph, timeline, journeys } = data;

    const getIconForType = (type: string) => {
        switch (type) {
            case 'email': return <Mail className="w-4 h-4" />;
            case 'phone': return <Phone className="w-4 h-4" />;
            case 'cookie': return <MousePointer className="w-4 h-4" />;
            default: return <User className="w-4 h-4" />;
        }
    };

    const getIconForInteraction = (type: string) => {
        if (type.includes('email')) return <Mail className="w-5 h-5 text-blue-400" />;
        if (type.includes('page')) return <MousePointer className="w-5 h-5 text-purple-400" />;
        if (type.includes('purchase')) return <ShoppingCart className="w-5 h-5 text-green-400" />;
        return <MessageSquare className="w-5 h-5 text-gray-400" />;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center gap-4 bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                <button onClick={onBack} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 transition">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                    {customer.name?.charAt(0) || 'U'}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">{customer.name || 'Cliente Desconhecido'}</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Cliente desde {new Date(customer.created_at).toLocaleDateString()}</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 border border-blue-500/30 text-xs font-semibold uppercase">
                            {customer.current_stage || 'Awareness'}
                        </span>
                    </div>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-sm text-gray-400">Lifetime Value</div>
                    <div className="text-3xl font-bold text-green-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(customer.lifetime_value || 0)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN: Identity & Profile */}
                <div className="space-y-6">
                    {/* Identity Graph Card */}
                    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Network className="w-5 h-5 text-purple-400" /> Identity Graph
                        </h3>
                        <div className="space-y-3">
                            {identityGraph.map((id: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-purple-500/30 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
                                            {getIconForType(id.identifier_type)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{id.identifier_value}</div>
                                            <div className="text-xs text-gray-500 capitalize">{id.identifier_type}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-green-400 font-mono">{(id.confidence_score * 100).toFixed(0)}% conf.</span>
                                        <span className="text-[10px] text-gray-600">{id.source}</span>
                                    </div>
                                </div>
                            ))}
                            {identityGraph.length === 0 && <p className="text-gray-500 italic text-sm">Nenhum identificador adicional vinculado.</p>}
                        </div>
                    </div>

                    {/* AI Profile Analysis */}
                    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-xl border border-indigo-500/20 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-400" /> Analise de Perfil
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Probabilidade de Churn</span>
                                <span className="text-red-400 font-bold">{((customer.churn_probability || 0) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-1.5">
                                <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(customer.churn_probability || 0) * 100}%` }}></div>
                            </div>

                            <div className="pt-4 flex justify-between text-sm">
                                <span className="text-gray-400">Engajamento Score</span>
                                <span className="text-blue-400 font-bold">{customer.engagement_score || 0}/100</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-1.5">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${customer.engagement_score || 0}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CENTER/RIGHT: Timeline */}
                <div className="lg:col-span-2 bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" /> Timeline de Interações
                    </h3>

                    <div className="relative border-l-2 border-gray-700 ml-3 space-y-8 pl-8 py-2">
                        {timeline.map((interaction: any, i: number) => (
                            <div key={i} className="relative">
                                {/* Dot on timeline */}
                                <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-gray-900 border-2 border-gray-600 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                </div>

                                <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 hover:border-gray-600 transition group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {getIconForInteraction(interaction.interaction_type)}
                                            <span className="font-semibold text-white capitalize">
                                                {interaction.interaction_type.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(interaction.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-sm mb-2">{interaction.details?.subject || interaction.details?.url || 'Interação registrada'}</p>

                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 border border-gray-700">
                                            Channel: {interaction.channel}
                                        </span>
                                        {interaction.sentiment_score && (
                                            <span className={`px-2 py-0.5 rounded text-[10px] border ${interaction.sentiment_score > 0.5 ? 'bg-green-900/30 text-green-400 border-green-900' : 'bg-red-900/30 text-red-400 border-red-900'
                                                }`}>
                                                Sentiment: {interaction.sentiment_score.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {timeline.length === 0 && (
                            <div className="text-gray-500 italic ml-2">Nenhuma interação registrada recentemente.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
