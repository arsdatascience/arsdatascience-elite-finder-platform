import React, { useState, useEffect } from 'react';
import { User, Lock, CreditCard, Link as LinkIcon, Shield, LogOut, Check, AlertCircle, Plus, Trash2, RefreshCw, Eye, EyeOff, BrainCircuit, Save, Server, Cpu, Search, Globe, MessageSquare, Mail, Phone, MapPin, Calendar } from 'lucide-react';

type SettingsTab = 'profile' | 'integrations' | 'team' | 'billing' | 'notifications';

interface CustomApi {
  id: string;
  name: string;
  key: string;
  addedAt: string;
}

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('integrations');

  // --- Estados para Integrações ---

  // 1. Estado da API Gemini
  const [geminiKey, setGeminiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isEditingGemini, setIsEditingGemini] = useState(false);

  // 2. Estado da API OpenAI
  const [openAiKey, setOpenAiKey] = useState('');
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [isEditingOpenAi, setIsEditingOpenAi] = useState(false);

  // Estado para Novas APIs
  const [customApis, setCustomApis] = useState<CustomApi[]>([]);
  const [newApiName, setNewApiName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');

  // Estados para Perfil
  const [profileData, setProfileData] = useState({
    name: 'Denis May',
    email: 'denismay@arsdatascience.com.br',
    phone: '(11) 98765-4321',
    company: 'ARS Data Science',
    role: 'CEO & Founder'
  });

  // Carregar chaves salvas
  useEffect(() => {
    setGeminiKey(localStorage.getItem('gemini_api_key') || '');
    setOpenAiKey(localStorage.getItem('openai_api_key') || '');
  }, []);

  const handleSaveGemini = () => {
    localStorage.setItem('gemini_api_key', geminiKey);
    setIsEditingGemini(false);
    alert('Chave da API Gemini atualizada com sucesso!');
  };

  const handleSaveOpenAi = () => {
    localStorage.setItem('openai_api_key', openAiKey);
    setIsEditingOpenAi(false);
    alert('Chave da API OpenAI atualizada com sucesso!');
  };

  const handleAddCustomApi = () => {
    if (!newApiName || !newApiKey) return;
    const newApi: CustomApi = {
      id: Date.now().toString(),
      name: newApiName,
      key: newApiKey,
      addedAt: new Date().toLocaleDateString()
    };
    setCustomApis([...customApis, newApi]);
    setNewApiName('');
    setNewApiKey('');
  };

  const handleDeleteCustomApi = (id: string) => {
    setCustomApis(customApis.filter(api => api.id !== id));
  };

  // Real Integrations Data
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/integrations?user_id=1`);
      const data = await response.json();

      // Map database data to UI format
      const mappedIntegrations = data.map((integ: any) => ({
        id: integ.id,
        dbId: integ.id,
        name: getPlatformName(integ.platform),
        platform: integ.platform,
        status: integ.status,
        icon: getPlatformIcon(integ.platform),
        lastSync: integ.last_sync ? formatLastSync(integ.last_sync) : '-'
      }));

      setIntegrations(mappedIntegrations);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      // Fallback to mock data
      setIntegrations([
        { id: 1, dbId: 1, name: 'Google Ads', platform: 'google_ads', status: 'connected', icon: Search, lastSync: '10 min atrás' },
        { id: 2, dbId: 2, name: 'Meta Ads (Facebook/Instagram)', platform: 'meta_ads', status: 'connected', icon: Globe, lastSync: '1 hora atrás' },
        { id: 3, dbId: 3, name: 'WhatsApp Business API', platform: 'whatsapp', status: 'disconnected', icon: MessageSquare, lastSync: '-' },
      ]);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      'google_ads': 'Google Ads',
      'meta_ads': 'Meta Ads (Facebook/Instagram)',
      'whatsapp': 'WhatsApp Business API'
    };
    return names[platform] || platform;
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, any> = {
      'google_ads': Search,
      'meta_ads': Globe,
      'whatsapp': MessageSquare
    };
    return icons[platform] || Globe;
  };

  const formatLastSync = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
  };

  const handleConnectPlatform = async (integration: any) => {
    if (integration.platform === 'whatsapp') {
      // For WhatsApp, show setup modal
      const phoneNumberId = prompt('Digite o Phone Number ID do WhatsApp Business:');
      const accessToken = prompt('Digite o Access Token:');

      if (!phoneNumberId || !accessToken) return;

      try {
        const response = await fetch(`${API_URL}/api/integrations/whatsapp/setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 1,
            phone_number_id: phoneNumberId,
            access_token: accessToken,
            verify_token: 'elite_finder_verify_token'
          })
        });

        if (response.ok) {
          alert('WhatsApp conectado com sucesso!');
          fetchIntegrations();
        } else {
          alert('Erro ao conectar WhatsApp');
        }
      } catch (error) {
        console.error('Error connecting WhatsApp:', error);
        alert('Erro ao conectar WhatsApp');
      }
    } else {
      // For Google Ads and Meta Ads, redirect to OAuth
      const authUrls: Record<string, string> = {
        'google_ads': `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=${window.location.origin}/auth/google-ads/callback&response_type=code&scope=https://www.googleapis.com/auth/adwords&state=1`,
        'meta_ads': `https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_APP_ID&redirect_uri=${window.location.origin}/auth/meta-ads/callback&state=1&scope=ads_management,ads_read`
      };

      alert(`Em produção, você seria redirecionado para autenticação OAuth.\n\nPor enquanto, a integração será simulada.`);

      // Simulate connection
      try {
        const response = await fetch(`${API_URL}/api/integrations/${integration.dbId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'connected', access_token: 'simulated_token' })
        });

        if (response.ok) {
          fetchIntegrations();
        }
      } catch (error) {
        console.error('Error connecting platform:', error);
      }
    }
  };

  const handleDisconnectPlatform = async (integration: any) => {
    if (!confirm(`Tem certeza que deseja desconectar ${integration.name}?`)) return;

    try {
      const response = await fetch(`${API_URL}/api/integrations/${integration.dbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'disconnected', access_token: null })
      });

      if (response.ok) {
        alert(`${integration.name} desconectado com sucesso!`);
        fetchIntegrations();
      } else {
        alert('Erro ao desconectar');
      }
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      alert('Erro ao desconectar');
    }
  };

  const handleSyncPlatform = async (integration: any) => {
    try {
      const response = await fetch(`${API_URL}/api/integrations/${integration.dbId}/sync`, {
        method: 'POST'
      });

      if (response.ok) {
        alert(`${integration.name} sincronizado com sucesso!`);
        fetchIntegrations();
      } else {
        alert('Erro ao sincronizar');
      }
    } catch (error) {
      console.error('Error syncing platform:', error);
      alert('Erro ao sincronizar');
    }
  };

  // Mock Data for Team
  const [teamMembers] = useState([
    { id: 1, name: 'Denis May', email: 'denismay@arsdatascience.com.br', role: 'Admin', status: 'active' },
    { id: 2, name: 'Sarah Sales', email: 'sarah@elite.com', role: 'Vendedor', status: 'active' },
    { id: 3, name: 'Mike Marketing', email: 'mike@elite.com', role: 'Editor', status: 'inactive' },
  ]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Informações do Perfil</h3>
              <p className="text-sm text-gray-500">Atualize suas informações pessoais e de contato.</p>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src="https://i.pravatar.cc/100?u=denis"
                  alt="Avatar"
                  className="w-24 h-24 rounded-full border-4 border-blue-100"
                />
                <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                  <User size={16} />
                </button>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{profileData.name}</h4>
                <p className="text-sm text-gray-500">{profileData.role}</p>
                <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Alterar foto
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                <input
                  type="text"
                  value={profileData.company}
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Save size={16} />
                Salvar Alterações
              </button>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Chaves de API</h3>
              <p className="text-sm text-gray-500">Configure suas chaves de API para serviços de IA.</p>
            </div>

            {/* Gemini API */}
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <BrainCircuit size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Google Gemini API</h4>
                    <p className="text-xs text-gray-500">Para análise de chat e geração de conteúdo</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingGemini(!isEditingGemini)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {isEditingGemini ? 'Cancelar' : 'Editar'}
                </button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    disabled={!isEditingGemini}
                    placeholder="Cole sua chave da API Gemini aqui"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
                  />
                  <button
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showGeminiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {isEditingGemini && (
                  <button
                    onClick={handleSaveGemini}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <Save size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* OpenAI API */}
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <Cpu size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">OpenAI API</h4>
                    <p className="text-xs text-gray-500">Para recursos avançados de IA</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingOpenAi(!isEditingOpenAi)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {isEditingOpenAi ? 'Cancelar' : 'Editar'}
                </button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showOpenAiKey ? 'text' : 'password'}
                    value={openAiKey}
                    onChange={(e) => setOpenAiKey(e.target.value)}
                    disabled={!isEditingOpenAi}
                    placeholder="Cole sua chave da API OpenAI aqui"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-50"
                  />
                  <button
                    onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showOpenAiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {isEditingOpenAi && (
                  <button
                    onClick={handleSaveOpenAi}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Save size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* --- LISTA DE INTEGRAÇÕES PADRÃO --- */}
            <div className="grid grid-cols-1 gap-4">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-2">Plataformas Nativas</h4>
              {integrations.map(integ => {
                const Icon = integ.icon;
                const isConnected = integ.status === 'connected';

                return (
                  <div key={integ.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${isConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900">{integ.name}</h4>
                          {isConnected && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                              <Check size={10} /> Conectado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Última sincronização: {integ.lastSync}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConnected && (
                        <button
                          onClick={() => handleSyncPlatform(integ)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sincronizar Agora"
                        >
                          <RefreshCw size={18} />
                        </button>
                      )}

                      <button
                        onClick={() => isConnected ? handleDisconnectPlatform(integ) : handleConnectPlatform(integ)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${isConnected
                            ? 'bg-white border-red-200 text-red-600 hover:bg-red-50'
                            : 'bg-blue-600 border-transparent text-white hover:bg-blue-700 shadow-sm'
                          }`}
                      >
                        {isConnected ? 'Desconectar' : 'Conectar Agora'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Equipe e Permissões</h3>
                <p className="text-sm text-gray-500">Gerencie os membros da sua equipe e suas permissões.</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Plus size={18} />
                Convidar Membro
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamMembers.map(member => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={`https://i.pravatar.cc/40?u=${member.email}`}
                            alt={member.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {member.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Editar</button>
                        <button className="text-red-600 hover:text-red-900">Remover</button>
                      </td>
                    </tr >
                  ))}
                </tbody >
              </table >
            </div >
          </div >
        );

      case 'billing':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Plano e Faturamento</h3>
              <p className="text-sm text-gray-500">Gerencie seu plano, pagamentos e histórico de faturas.</p>
            </div>

            {/* Plano Atual */}
            <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Plano Pro</h4>
                  <p className="text-sm text-gray-600">Renovação automática em 15 de Dezembro de 2025</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">R$ 497</div>
                  <div className="text-sm text-gray-600">/mês</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Atualizar Plano
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancelar Assinatura
                </button>
              </div>
            </div>

            {/* Método de Pagamento */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h4 className="font-bold text-gray-900 mb-4">Método de Pagamento</h4>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white font-bold text-xs">
                    VISA
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">•••• •••• •••• 4242</div>
                    <div className="text-sm text-gray-500">Expira em 12/2026</div>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Alterar
                </button>
              </div>
            </div>

            {/* Histórico de Faturas */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h4 className="font-bold text-gray-900">Histórico de Faturas</h4>
              </div>
              <div className="divide-y divide-gray-200">
                {[
                  { date: '01 Nov 2025', amount: 'R$ 497,00', status: 'Pago', invoice: '#INV-2025-11' },
                  { date: '01 Out 2025', amount: 'R$ 497,00', status: 'Pago', invoice: '#INV-2025-10' },
                  { date: '01 Set 2025', amount: 'R$ 497,00', status: 'Pago', invoice: '#INV-2025-09' },
                ].map((item, idx) => (
                  <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <Calendar size={20} className="text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">{item.invoice}</div>
                        <div className="text-sm text-gray-500">{item.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="font-medium text-gray-900">{item.amount}</div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        {item.status}
                      </span>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Configurações</h2>
        <p className="text-sm text-gray-500">Gerencie sua conta, integrações e preferências do sistema.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-2 space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <User size={18} /> Perfil
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'integrations' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <LinkIcon size={18} /> Integrações
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'team' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Shield size={18} /> Equipe e Permissões
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'billing' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <CreditCard size={18} /> Faturamento
            </button>
            <div className="h-px bg-gray-200 my-2 mx-2"></div>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors">
              <LogOut size={18} /> Sair da Conta
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
