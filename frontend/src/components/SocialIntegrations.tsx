import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, ExternalLink, Users, Plus, Trash2, Zap } from 'lucide-react';

// Ícones SVG manuais (removidos do lucide-react em versões recentes)
const Instagram = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
);
const Facebook = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
);
const Linkedin = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
);
const Twitter = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
);

interface SocialAccount {
    id: string;
    platform: string;
    external_account_id?: string;
    account_name?: string; // e.g. "Padaria do João"
    connected: boolean;
    metrics?: {
        followers?: number;
        engagement?: number;
        posts?: number;
    };
}

export const SocialIntegrations: React.FC = () => {
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
    const [n8nUrl, setN8nUrl] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    // TODO: Get real client ID from auth context
    const CLIENT_ID = '1';

    // Load accounts from backend
    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            // In a real scenario, fetch from API
            // const res = await fetch(`${API_URL}/api/clients/${CLIENT_ID}/social-accounts`);
            // const data = await res.json();

            // Mock data for demonstration if API fails or is empty
            const mockAccounts: SocialAccount[] = [
                { id: '1', platform: 'instagram', account_name: 'Loja Principal', connected: true, metrics: { followers: 1250, engagement: 4.5, posts: 120 } },
                { id: '2', platform: 'facebook', account_name: 'Página Oficial', connected: true, metrics: { followers: 5000, engagement: 2.1, posts: 340 } }
            ];

            // Try to fetch real data, fallback to mock
            try {
                const res = await fetch(`${API_URL}/api/clients/${CLIENT_ID}/social-accounts`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.accounts.length > 0) {
                        // Map backend format to frontend interface if needed
                        setAccounts(data.accounts.map((acc: any) => ({
                            id: acc.id,
                            platform: acc.platform,
                            account_name: acc.external_account_id || 'Conta Sem Nome', // Backend might need to store name
                            connected: acc.connected,
                            metrics: { followers: 0, engagement: 0, posts: 0 } // Placeholder metrics
                        })));
                    } else {
                        setAccounts(mockAccounts);
                    }
                } else {
                    setAccounts(mockAccounts);
                }
            } catch (e) {
                console.warn('Backend fetch failed, using mock data', e);
                setAccounts(mockAccounts);
            }

        } catch (error) {
            console.error('Error loading accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPlatformInfo = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'instagram':
                return { name: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-600', bgColor: 'bg-pink-50', textColor: 'text-pink-600', borderColor: 'border-pink-200' };
            case 'facebook':
                return { name: 'Facebook', icon: Facebook, color: 'from-blue-500 to-blue-700', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200' };
            case 'linkedin':
                return { name: 'LinkedIn', icon: Linkedin, color: 'from-indigo-500 to-blue-600', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600', borderColor: 'border-indigo-200' };
            case 'twitter':
                return { name: 'Twitter', icon: Twitter, color: 'from-sky-400 to-blue-500', bgColor: 'bg-sky-50', textColor: 'text-sky-600', borderColor: 'border-sky-200' };
            default:
                return { name: platform, icon: ExternalLink, color: 'from-gray-500 to-gray-700', bgColor: 'bg-gray-50', textColor: 'text-gray-600', borderColor: 'border-gray-200' };
        }
    };

    const handleConnectNew = async (platform: string) => {
        setConnectingPlatform(platform);

        try {
            // Check backend health
            try {
                const health = await fetch(`${API_URL}/api/health`);
                if (!health.ok) throw new Error('Backend offline');
            } catch (e) {
                alert('⚠️ Backend não acessível. Verifique a conexão.');
                setConnectingPlatform(null);
                return;
            }

            const confirmMsg = `Você será redirecionado para conectar uma NOVA conta do ${platform}.\n\n` +
                `Isso permite gerenciar múltiplas contas (ex: várias páginas do Facebook ou perfis do Instagram).\n\n` +
                `Continuar?`;

            if (!confirm(confirmMsg)) {
                setConnectingPlatform(null);
                return;
            }

            let authUrl = '';
            switch (platform) {
                case 'instagram':
                case 'facebook': authUrl = `${API_URL}/api/auth/meta`; break;
                case 'linkedin': authUrl = `${API_URL}/api/auth/linkedin`; break;
                case 'twitter': authUrl = `${API_URL}/api/auth/twitter`; break;
            }

            window.location.href = authUrl;

        } catch (error) {
            console.error('Connection error:', error);
            setConnectingPlatform(null);
        }
    };

    const handleDisconnect = async (accountId: string, platform: string) => {
        if (!confirm(`Tem certeza que deseja remover esta conta do ${platform}?`)) return;

        try {
            // Optimistic update
            setAccounts(prev => prev.filter(a => a.id !== accountId));

            await fetch(`${API_URL}/api/social-accounts/${accountId}`, { method: 'DELETE' });
        } catch (error) {
            console.error('Error disconnecting:', error);
            alert('Erro ao desconectar conta.');
            fetchAccounts(); // Revert on error
        }
    };

    const handleSaveN8n = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/integrations/n8n`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ webhookUrl: n8nUrl })
            });
            if (res.ok) {
                alert('Configuração salva com sucesso!');
            } else {
                alert('Erro ao salvar configuração.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão.');
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Gerenciamento de Contas Sociais</h2>
                <p className="text-gray-600">Conecte múltiplas contas para gerenciar todas as suas redes em um só lugar.</p>
            </div>

            {/* Add New Account Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Adicionar Nova Conta
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['instagram', 'facebook', 'linkedin', 'twitter'].map(platform => {
                        const info = getPlatformInfo(platform);
                        const Icon = info.icon;
                        const isConnecting = connectingPlatform === platform;

                        return (
                            <button
                                key={platform}
                                onClick={() => handleConnectNew(platform)}
                                disabled={isConnecting}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group ${isConnecting ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${info.color} flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform`}>
                                    {isConnecting ? <Loader2 className="animate-spin" size={20} /> : <Icon size={20} />}
                                </div>
                                <span className="font-medium text-gray-700 group-hover:text-blue-700">{info.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Connected Accounts List */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Contas Conectadas ({accounts.length})
                </h3>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">Nenhuma conta conectada ainda.</p>
                        <p className="text-sm text-gray-400 mt-1">Use os botões acima para adicionar sua primeira conta.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {accounts.map(account => {
                            const info = getPlatformInfo(account.platform);
                            const Icon = info.icon;

                            return (
                                <div key={account.id} className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${info.borderColor}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center text-white`}>
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{account.account_name || info.name}</h4>
                                                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit mt-1">
                                                    <CheckCircle size={10} />
                                                    Conectado
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDisconnect(account.id, account.platform)}
                                            className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                                            title="Remover conta"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    {/* Metrics Preview */}
                                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 mb-3">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500">Seguidores</p>
                                            <p className="font-semibold text-gray-800">{account.metrics?.followers?.toLocaleString() || '-'}</p>
                                        </div>
                                        <div className="text-center border-l border-gray-100">
                                            <p className="text-xs text-gray-500">Engajamento</p>
                                            <p className="font-semibold text-gray-800">{account.metrics?.engagement || '-'}%</p>
                                        </div>
                                        <div className="text-center border-l border-gray-100">
                                            <p className="text-xs text-gray-500">Posts</p>
                                            <p className="font-semibold text-gray-800">{account.metrics?.posts || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className={`flex-1 py-1.5 text-sm font-medium rounded-lg ${info.bgColor} ${info.textColor} hover:opacity-80 transition-opacity`}>
                                            Ver Relatórios
                                        </button>
                                        <button className="flex-1 py-1.5 text-sm font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                                            Configurações
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* N8N Integration */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-600" />
                    Automação (n8n)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Configure a URL do Webhook do n8n para receber eventos de leads (criação e atualização).
                </p>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={n8nUrl}
                        onChange={(e) => setN8nUrl(e.target.value)}
                        placeholder="https://seu-n8n.com/webhook/..."
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        onClick={handleSaveN8n}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                        Salvar
                    </button>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">Sobre a conexão segura (OAuth)</p>
                    <p>
                        Para garantir a segurança dos seus dados e evitar bloqueios, utilizamos a conexão oficial de cada plataforma.
                        Isso permite que você conecte múltiplas contas sem compartilhar suas senhas diretamente conosco.
                    </p>
                </div>
            </div>
        </div>
    );
};
