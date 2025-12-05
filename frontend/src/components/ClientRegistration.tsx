import React, { useState, useEffect } from 'react';

import { User, MapPin, Phone, Mail, Building2, AlertTriangle, LayoutGrid, List as ListIcon, Table as TableIcon, Download, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { ClientModal } from './ClientModal';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- SCHEMAS DE VALIDAÇÃO (ZOD) ---
// Schema is now handled internally by ClientModal

// --- MÁSCARAS ---
// Masks are now handled internally by ClientModal

// --- KANBAN COMPONENTS ---
const SortableClientCard = ({ client, onClick }: { client: any, onClick: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: client.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer mb-3">
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-800">{client.name}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${client.type === 'PJ' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{client.type}</span>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-1"><Building2 size={12} /> {client.company || '-'}</div>
                <div className="flex items-center gap-1"><Mail size={12} /> {client.email}</div>
                <div className="flex items-center gap-1"><Phone size={12} /> {client.phone}</div>
            </div>
        </div>
    );
};

export const ClientRegistration: React.FC = () => {
    const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'table'>('list');
    const [successMsg, setSuccessMsg] = useState('');
    const [churnRisks, setChurnRisks] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: apiClient.clients.getClients
    });

    // Fetch Churn Risks
    useEffect(() => {
        const fetchRisks = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/churn/predict`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setChurnRisks(data.risks || []);
                }
            } catch (error) {
                console.error('Erro ao buscar riscos de churn:', error);
            }
        };
        fetchRisks();
    }, []);

    const getClientRisk = (clientId: number) => {
        return churnRisks.find((r: any) => r.client_id === clientId);
    };

    const createMutation = useMutation({
        mutationFn: apiClient.clients.createClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setSuccessMsg('Cliente cadastrado com sucesso!');
            setTimeout(() => setSuccessMsg(''), 3000);
            setIsModalOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiClient.clients.updateClient(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setSuccessMsg('Cliente atualizado com sucesso!');
            setTimeout(() => setSuccessMsg(''), 3000);
            setIsModalOpen(false);
            setSelectedClient(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: apiClient.clients.deleteClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setSuccessMsg('Cliente removido com sucesso!');
            setTimeout(() => setSuccessMsg(''), 3000);
        }
    });

    const handleSaveClient = async (data: any) => {
        try {
            if (selectedClient?.id) {
                await updateMutation.mutateAsync({ id: selectedClient.id, data });
            } else {
                await createMutation.mutateAsync(data);
            }
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
        }
    };

    const handleEdit = (client: any) => {
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const handleNewClient = () => {
        setSelectedClient(null);
        setTimeout(() => setIsModalOpen(true), 10);
    };

    const handleExport = async () => {
        try {
            const blob = await apiClient.clients.exportExcel();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'clientes_export.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erro ao exportar:', error);
            alert('Erro ao exportar dados.');
        }
    };

    const filteredClients = clients.filter((client: any) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Kanban Columns
    const columns = {
        active: filteredClients.filter((c: any) => c.status === 'active' || !c.status),
        inactive: filteredClients.filter((c: any) => c.status === 'inactive'),
        lead: filteredClients.filter((c: any) => c.status === 'lead')
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Header */}
            {successMsg && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[60] flex items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-300">
                    <span className="font-bold">✓</span> {successMsg}
                </div>
            )}
            <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        Gestão de Clientes
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{clients.length}</span>
                    </h2>
                    <p className="text-sm text-gray-500">Gerencie sua base de clientes e leads</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar clientes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                        />
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><ListIcon size={18} /></button>
                        <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><TableIcon size={18} /></button>
                    </div>
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                        <Download size={18} /> Exportar Excel
                    </button>
                    <button onClick={handleNewClient} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-lg shadow-blue-200">
                        <User size={18} /> Novo Cliente
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">Carregando clientes...</div>
                ) : (
                    <>
                        {viewMode === 'kanban' && (
                            <div className="flex gap-6 h-full overflow-x-auto pb-4">
                                {Object.entries(columns).map(([status, items]) => (
                                    <div key={status} className="flex-1 min-w-[300px] bg-gray-100/50 rounded-xl p-4 flex flex-col">
                                        <div className="flex justify-between items-center mb-4 px-2">
                                            <h3 className="font-bold text-gray-700 capitalize">{status === 'lead' ? 'Leads' : status === 'active' ? 'Ativos' : 'Inativos'}</h3>
                                            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">{items.length}</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                            {items.map((client: any) => (
                                                <SortableClientCard key={client.id} client={client} onClick={() => handleEdit(client)} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {viewMode === 'list' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto h-full pb-20 custom-scrollbar">
                                {filteredClients.map((client: any) => {
                                    const risk = getClientRisk(client.id);
                                    return (
                                        <div key={client.id} onClick={() => handleEdit(client)} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
                                            {risk && (
                                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold flex items-center gap-1 z-10">
                                                    <AlertTriangle size={10} /> RISCO {risk.riskScore}%
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">
                                                    {client.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">{client.name}</h3>
                                                    <p className="text-xs text-gray-500">{client.company || 'Sem empresa'}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                                <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> <span className="truncate">{client.email}</span></div>
                                                <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {client.phone}</div>
                                                <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" /> {client.city || '-'}</div>
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{client.status || 'active'}</span>
                                                <span className="text-xs text-gray-400">ID: #{client.id}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {viewMode === 'table' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
                                <div className="overflow-auto flex-1">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                                            <tr>
                                                <th className="p-4 font-bold text-gray-600 text-sm">Nome</th>
                                                <th className="p-4 font-bold text-gray-600 text-sm">Empresa</th>
                                                <th className="p-4 font-bold text-gray-600 text-sm">Email</th>
                                                <th className="p-4 font-bold text-gray-600 text-sm">Telefone</th>
                                                <th className="p-4 font-bold text-gray-600 text-sm">Cidade</th>
                                                <th className="p-4 font-bold text-gray-600 text-sm">Status</th>
                                                <th className="p-4 font-bold text-gray-600 text-sm text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredClients.map((client: any) => (
                                                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-4 font-medium text-gray-800">{client.name}</td>
                                                    <td className="p-4 text-gray-600 text-sm">{client.company || '-'}</td>
                                                    <td className="p-4 text-gray-600 text-sm">{client.email}</td>
                                                    <td className="p-4 text-gray-600 text-sm">{client.phone}</td>
                                                    <td className="p-4 text-gray-600 text-sm">{client.city || '-'}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                            {client.status || 'active'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button onClick={() => handleEdit(client)} className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-3">Editar</button>
                                                        <button onClick={() => handleDelete(client.id)} className="text-red-600 hover:text-red-800 font-medium text-sm">Excluir</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveClient}
                client={selectedClient}
                mode={selectedClient ? 'edit' : 'create'}
            />
        </div>
    );
};