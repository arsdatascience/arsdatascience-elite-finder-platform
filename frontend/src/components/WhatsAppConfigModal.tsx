import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle, AlertCircle, Smartphone, Globe } from 'lucide-react';

interface WhatsAppConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const WhatsAppConfigModal: React.FC<WhatsAppConfigModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'evolution' | 'official'>('evolution');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Evolution API State
    const [evolutionConfig, setEvolutionConfig] = useState({
        baseUrl: '',
        instanceName: '',
        apiKey: ''
    });

    // Official API State
    const [officialConfig, setOfficialConfig] = useState({
        phoneNumberId: '',
        accessToken: '',
        verifyToken: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchConfig();
        }
    }, [isOpen]);

    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/integrations/whatsapp`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.platform === 'evolution_api') {
                    setActiveTab('evolution');
                    setEvolutionConfig({
                        baseUrl: data.config.baseUrl || '',
                        instanceName: data.config.instanceName || '',
                        apiKey: data.access_token || '' // We might not get the full token back for security, but let's assume we do or leave blank
                    });
                } else if (data.platform === 'whatsapp') {
                    setActiveTab('official');
                    setOfficialConfig({
                        phoneNumberId: data.config.phone_number_id || '',
                        accessToken: data.access_token || '',
                        verifyToken: data.config.verify_token || ''
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching config", err);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const payload = activeTab === 'evolution'
                ? {
                    platform: 'evolution_api',
                    config: {
                        baseUrl: evolutionConfig.baseUrl,
                        instanceName: evolutionConfig.instanceName
                    },
                    access_token: evolutionConfig.apiKey
                }
                : {
                    platform: 'whatsapp',
                    config: {
                        phone_number_id: officialConfig.phoneNumberId,
                        verify_token: officialConfig.verifyToken
                    },
                    access_token: officialConfig.accessToken
                };

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/integrations/whatsapp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccess('Configuração salva com sucesso!');
                setTimeout(onClose, 1500);
            } else {
                setError('Erro ao salvar configuração.');
            }
        } catch (err) {
            setError('Erro de conexão.');
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Tem certeza que deseja desconectar? Isso irá parar a integração.')) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/integrations/whatsapp`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setSuccess('Desconectado com sucesso!');
                setEvolutionConfig({ baseUrl: '', instanceName: '', apiKey: '' });
                setOfficialConfig({ phoneNumberId: '', accessToken: '', verifyToken: '' });
                setTimeout(onClose, 1500);
            } else {
                setError('Erro ao desconectar.');
            }
        } catch (err) {
            setError('Erro de conexão ao desconectar.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Smartphone size={24} /> Configuração WhatsApp
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-lg">
                        <button
                            onClick={() => setActiveTab('evolution')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'evolution' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Globe size={16} /> Evolution API
                        </button>
                        <button
                            onClick={() => setActiveTab('official')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'official' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Smartphone size={16} /> API Oficial
                        </button>
                    </div>

                    {/* Evolution Form */}
                    {activeTab === 'evolution' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">URL da API (Base URL)</label>
                                <input
                                    type="text"
                                    value={evolutionConfig.baseUrl}
                                    onChange={e => setEvolutionConfig({ ...evolutionConfig, baseUrl: e.target.value })}
                                    placeholder="https://api.evolution.com"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Nome da Instância</label>
                                <input
                                    type="text"
                                    value={evolutionConfig.instanceName}
                                    onChange={e => setEvolutionConfig({ ...evolutionConfig, instanceName: e.target.value })}
                                    placeholder="minha-instancia"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">API Key (Global ou da Instância)</label>
                                <input
                                    type="password"
                                    value={evolutionConfig.apiKey}
                                    onChange={e => setEvolutionConfig({ ...evolutionConfig, apiKey: e.target.value })}
                                    placeholder="••••••••••••••••"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Official Form */}
                    {activeTab === 'official' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Phone Number ID</label>
                                <input
                                    type="text"
                                    value={officialConfig.phoneNumberId}
                                    onChange={e => setOfficialConfig({ ...officialConfig, phoneNumberId: e.target.value })}
                                    placeholder="1234567890"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Access Token (Permanente)</label>
                                <input
                                    type="password"
                                    value={officialConfig.accessToken}
                                    onChange={e => setOfficialConfig({ ...officialConfig, accessToken: e.target.value })}
                                    placeholder="EAAG..."
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Verify Token (Webhook)</label>
                                <input
                                    type="text"
                                    value={officialConfig.verifyToken}
                                    onChange={e => setOfficialConfig({ ...officialConfig, verifyToken: e.target.value })}
                                    placeholder="meu_token_secreto"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Status Messages */}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg flex items-center gap-2 text-sm">
                            <CheckCircle size={16} /> {success}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <button
                            onClick={handleDisconnect}
                            disabled={loading}
                            className="text-red-500 hover:text-red-700 text-sm font-medium underline px-2 disabled:opacity-50"
                        >
                            Desconectar
                        </button>

                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-green-200 disabled:opacity-70"
                            >
                                {loading ? 'Salvando...' : (
                                    <>
                                        <Save size={18} /> Salvar Configuração
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
