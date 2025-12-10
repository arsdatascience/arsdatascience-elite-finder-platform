import React, { useState, useEffect } from 'react';
import { Users, ChevronDown, Check } from 'lucide-react';
import { apiClient } from '@/services/apiClient';

interface Client {
    id: number;
    name: string;
    industry?: string;
}

interface ClientSelectorProps {
    selectedClientId: number | null;
    onSelectClient: (clientId: number | null) => void;
    className?: string;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({ selectedClientId, onSelectClient, className }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                // Assuming this endpoint exists, or we use a similar one from dataController
                const response = await apiClient.get('/clients');
                // Adjust based on actual API response structure (usually response.data or response.data.clients)
                const data = response.data.clients || response.data;
                setClients(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error fetching clients:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    const selectedClient = clients.find(c => c.id === selectedClientId);

    return (
        <div className={`relative ${className || ''}`}>
            <label className="block text-xs text-gray-400 mb-1 ml-1">Cliente Associado</label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-gray-900/50 border border-gray-700 hover:border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 transition-all outline-none focus:border-blue-500/50"
            >
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className={selectedClient ? 'text-white' : 'text-gray-500'}>
                        {selectedClient ? selectedClient.name : 'Selecionar Cliente...'}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    <div className="p-2 space-y-1">
                        <button
                            onClick={() => {
                                onSelectClient(null);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm ${selectedClientId === null ? 'bg-blue-500/10 text-blue-400' : 'text-gray-300 hover:bg-gray-700'
                                }`}
                        >
                            <span>Nenhum (Geral)</span>
                            {selectedClientId === null && <Check className="w-3 h-3 ml-auto" />}
                        </button>

                        {loading && <div className="px-3 py-2 text-xs text-gray-500">Carregando...</div>}

                        {clients.map(client => (
                            <button
                                key={client.id}
                                onClick={() => {
                                    onSelectClient(client.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm ${selectedClientId === client.id ? 'bg-blue-500/10 text-blue-400' : 'text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                <span>{client.name}</span>
                                {selectedClientId === client.id && <Check className="w-3 h-3 ml-auto" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
