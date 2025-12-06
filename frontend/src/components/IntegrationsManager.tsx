import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { RefreshCw, Trash2, CheckCircle, AlertTriangle, Facebook, Calendar, Linkedin, Share2, Youtube, MonitorPlay, Target } from 'lucide-react';

// You might need to adjust this URL based on your setup
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface Integration {
    id: number;
    provider: string;
    account_name: string;
    created_at: string;
    updated_at: string;
}

const IntegrationsManager: React.FC = () => {
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Check for success/error URL params after redirect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
            setStatusMessage({ type: 'success', text: `Conectado com sucesso ao ${params.get('provider')}!` });
        } else if (params.get('error')) {
            setStatusMessage({ type: 'error', text: 'Falha na conexão. Tente novamente.' });
        }

        // Clean URL
        if (params.get('success') || params.get('error')) {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const { data: integrations, refetch } = useQuery({
        queryKey: ['integrations'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${BACKEND_URL}/api/oauth/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data as Integration[];
        }
    });

    const handleConnect = async (provider: string) => {
        try {
            const token = localStorage.getItem('token');
            // Assuming we use client ID 1 for now or get it from token context in backend
            const res = await axios.get(`${BACKEND_URL}/api/oauth/init?provider=${provider}&clientId=1`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.href = res.data.url;
        } catch (error) {
            console.error('Failed to init auth', error);
            setStatusMessage({ type: 'error', text: 'Erro ao iniciar conexão.' });
        }
    };

    const handleDisconnect = async (id: number) => {
        if (!confirm('Tem certeza que deseja desconectar? Os relatórios pararão de funcionar.')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${BACKEND_URL}/api/oauth/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            refetch();
            setStatusMessage({ type: 'success', text: 'Desconectado com sucesso.' });
        } catch (error) {
            console.error(error);
            setStatusMessage({ type: 'error', text: 'Erro ao desconectar.' });
        }
    };

    const getIcon = (provider: string) => {
        switch (provider) {
            case 'facebook': return <Facebook className="w-5 h-5" />;
            case 'google': return <Target className="w-5 h-5" />; // Using Target for Google Ads
            case 'linkedin': return <Linkedin className="w-5 h-5" />;
            default: return <Share2 className="w-5 h-5" />;
        }
    };

    const getProviderName = (provider: string) => {
        switch (provider) {
            case 'facebook': return 'Meta Ads (Facebook/Instagram)';
            case 'google': return 'Google Ads / Analytics';
            case 'linkedin': return 'LinkedIn Ads';
            default: return provider;
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary-600" />
                Conexões de Marketing
            </h2>

            {statusMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {statusMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    {statusMessage.text}
                </div>
            )}

            <div className="space-y-4">
                {/* Available Connections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-xl p-4 flex flex-col items-center text-center hover:border-blue-300 transition-colors">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                            <Facebook />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">Meta Ads</h3>
                        <p className="text-xs text-gray-500 mb-3">Instagram & Facebook</p>
                        {integrations?.find(i => i.provider === 'facebook') ? (
                            <button disabled className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold w-full cursor-not-allowed">
                                Conectado
                            </button>
                        ) : (
                            <button onClick={() => handleConnect('facebook')} className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold hover:bg-blue-700 w-full transition-colors">
                                Conectar
                            </button>
                        )}
                    </div>

                    <div className="border border-gray-200 rounded-xl p-4 flex flex-col items-center text-center hover:border-amber-300 transition-colors">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-3">
                            <Target />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">Google Ads</h3>
                        <p className="text-xs text-gray-500 mb-3">Search, YouTube, Display</p>
                        {integrations?.find(i => i.provider === 'google') ? (
                            <button disabled className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold w-full cursor-not-allowed">
                                Conectado
                            </button>
                        ) : (
                            <button onClick={() => handleConnect('google')} className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold hover:bg-blue-700 w-full transition-colors">
                                Conectar
                            </button>
                        )}
                    </div>
                </div>

                {/* Active Integrations List */}
                {integrations && integrations.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Conexões Ativas</h3>
                        <div className="space-y-2">
                            {integrations.map(integration => (
                                <div key={integration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="text-gray-600">
                                            {getIcon(integration.provider)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{getProviderName(integration.provider)}</p>
                                            <p className="text-xs text-gray-500">Conta: {integration.account_name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDisconnect(integration.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                        title="Desconectar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IntegrationsManager;
