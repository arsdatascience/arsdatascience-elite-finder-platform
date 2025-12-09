import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, User, Calendar, MapPin, Mail, Phone, ArrowLeft, ArrowRight } from 'lucide-react';
import { apiClient } from '@/services/apiClient';

interface Props {
    onSelectCustomer: (id: string) => void;
}

export const CustomerJourneyList: React.FC<Props> = ({ onSelectCustomer }) => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [stage, setStage] = useState('all');
    const [clientId, setClientId] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [clients, setClients] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [page, search, stage, clientId, startDate, endDate]);

    const fetchClients = async () => {
        try {
            const response = await apiClient.clients.getClients();
            // Assuming response is { success: true, clients: [...] } or just array
            const clientList = Array.isArray(response) ? response : (response.clients || []);
            setClients(clientList);
        } catch (error) {
            console.error('Failed to fetch clients', error);
        }
    };

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/customers/unified', {
                params: { page, limit: 10, search, stage, clientId, startDate, endDate }
            });
            if (response.data.success) {
                setCustomers(response.data.customers);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch customers', error);
        } finally {
            setLoading(false);
        }
    };

    const getStageColor = (stage: string) => {
        const map: any = {
            'awareness': 'bg-blue-100 text-blue-800',
            'consideration': 'bg-yellow-100 text-yellow-800',
            'decision': 'bg-orange-100 text-orange-800',
            'retention': 'bg-green-100 text-green-800'
        };
        return map[stage] || 'bg-gray-100 text-gray-800';
    };

    const translateStage = (stage: string) => {
        const map: any = {
            'awareness': 'Conscientização',
            'consideration': 'Consideração',
            'decision': 'Decisão',
            'retention': 'Retenção'
        };
        return map[stage] || stage;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary outline-none max-w-[200px]"
                    >
                        <option value="all">Todas as Contas</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-white text-sm py-2 px-1 outline-none w-[110px]"
                            placeholder="Início"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-white text-sm py-2 px-1 outline-none w-[110px]"
                            placeholder="Fim"
                        />
                    </div>

                    <select
                        value={stage}
                        onChange={(e) => setStage(e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary outline-none"
                    >
                        <option value="all">Todas as etapas</option>
                        <option value="awareness">Conscientização</option>
                        <option value="consideration">Consideração</option>
                        <option value="decision">Decisão</option>
                        <option value="retention">Retenção</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900/50 text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Contatos</th>
                                <th className="px-6 py-4">Etapa Atual</th>
                                <th className="px-6 py-4">LTV Estimado</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="px-6 py-4">
                                            <div className="h-6 bg-gray-700/50 rounded animate-pulse"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : customers.length > 0 ? (
                                customers.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold">
                                                    {c.name?.charAt(0) || <User className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{c.name || 'Desconhecido'}</div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> Criado em {new Date(c.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 space-y-1">
                                            {c.email && (
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <Mail className="w-3 h-3 text-gray-500" /> {c.email}
                                                </div>
                                            )}
                                            {(c.phone || c.whatsapp_number) && (
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <Phone className="w-3 h-3 text-gray-500" /> {c.whatsapp_number || c.phone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStageColor(c.current_stage)}`}>
                                                {translateStage(c.current_stage)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">
                                            {c.lifetime_value
                                                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.lifetime_value)
                                                : '--'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => onSelectCustomer(c.id)}
                                                className="p-2 hover:bg-gray-700 rounded-lg text-primary hover:text-primary-400 transition"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Nenhum cliente encontrado com os filtros selecionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-gray-700 flex items-center justify-between">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-600"
                        >
                            <ArrowLeft className="w-4 h-4" /> Anterior
                        </button>
                        <span className="text-sm text-gray-400">
                            Página {page} de {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={page === pagination.totalPages}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-600"
                        >
                            Próxima <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
