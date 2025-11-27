import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Shield, Globe, CreditCard, LogOut, User, Search, MessageSquare, BrainCircuit, Eye, EyeOff, Cpu, Check, Plus, LinkIcon, Trash2, Edit2, X, MapPin, Lock } from 'lucide-react';
import { COMPONENT_VERSIONS } from '../componentVersions';

// Schema de Validação com Zod
const memberSchema = z.object({
  avatarUrl: z.string().optional(),
  username: z.string().min(3, 'Mínimo de 3 caracteres'),
  firstName: z.string().min(2, 'Nome obrigatório'),
  lastName: z.string().min(2, 'Sobrenome obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().optional(), // Opcional ao editar
  oldPassword: z.string().optional(), // Para validar alteração de senha
  newPassword: z.string().optional(), // Nova senha
  phone: z.string().min(14, 'Telefone inválido'), // Ajustado para validar com máscara
  cpf: z.string().min(14, 'CPF inválido'), // Ajustado para validar com máscara
  registrationDate: z.string().min(1, 'Data obrigatória'),
  role: z.string(),
  address: z.object({
    street: z.string().min(1, 'Rua obrigatória'),
    number: z.string().min(1, 'Número obrigatório'),
    complement: z.string().optional(),
    district: z.string().min(1, 'Bairro obrigatório'),
    city: z.string().min(1, 'Cidade obrigatória'),
    state: z.string().length(2, 'UF deve ter 2 letras'),
    zip: z.string().min(9, 'CEP inválido') // Ajustado para validar com máscara
  })
}).refine((data) => {
  // Se estiver alterando senha, validar que ambos os campos foram preenchidos
  if (data.newPassword && !data.oldPassword) {
    return false;
  }
  if (data.newPassword && data.newPassword.length < 8) {
    return false;
  }
  return true;
}, {
  message: "Para alterar senha, informe a senha antiga e uma nova senha com no mínimo 8 caracteres",
  path: ["newPassword"]
});


type MemberFormData = z.infer<typeof memberSchema>;

type SettingsTab = 'profile' | 'integrations' | 'team' | 'billing' | 'notifications';

interface TeamMember {
  id: number;
  avatarUrl?: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cpf: string;
  registrationDate: string;
  role: string;
  status: 'active' | 'inactive';
  address: {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    zip: string;
  };
  permissions: string[];
}

const INITIAL_MEMBER_STATE: TeamMember = {
  id: 0,
  avatarUrl: '',
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  cpf: '',
  registrationDate: new Date().toISOString().split('T')[0], // Data atual como padrão
  role: 'Vendedor',
  status: 'active',
  address: {
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
    zip: ''
  },
  permissions: []
};

// Funções de Máscara
const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substr(0, 15);
};

const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substr(0, 9);
};

// Gerador de Senha Segura
const generateSecurePassword = (): string => {
  const length = 16;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = '';
  // Garantir pelo menos um de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Completar o restante
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Embaralhar a senha
  return password.split('').sort(() => Math.random() - 0.5).join('');
};


export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('integrations');

  // --- Estados para Integrações ---
  const [geminiKey, setGeminiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isEditingGemini, setIsEditingGemini] = useState(false);
  const [openAiKey, setOpenAiKey] = useState('');
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [isEditingOpenAi, setIsEditingOpenAi] = useState(false);

  // Estados para Perfil
  const [profileData, setProfileData] = useState({
    name: 'Denis May',
    email: 'denismay@arsdatascience.com.br',
    phone: '(11) 98765-4321',
    company: 'ARS Data Science',
    role: 'CEO & Founder',
    avatarUrl: 'https://i.pravatar.cc/100?u=denis'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const memberFileInputRef = useRef<HTMLInputElement>(null);

  // Estados para Gestão de Equipe
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: 1,
      username: 'denismay',
      firstName: 'Denis',
      lastName: 'May',
      email: 'denismay@arsdatascience.com.br',
      phone: '(11) 99999-9999',
      cpf: '000.000.000-00',
      registrationDate: '2024-01-01',
      role: 'Admin',
      status: 'active',
      address: { street: 'Av. Paulista', number: '1000', complement: 'Sala 100', district: 'Bela Vista', city: 'São Paulo', state: 'SP', zip: '01310-100' },
      permissions: ['all']
    },
    {
      id: 2,
      username: 'sarahsales',
      firstName: 'Sarah',
      lastName: 'Sales',
      email: 'sarah@elite.com',
      phone: '(11) 88888-8888',
      cpf: '111.111.111-11',
      registrationDate: '2024-02-15',
      role: 'Vendedor',
      status: 'active',
      address: { street: 'Rua Augusta', number: '500', complement: '', district: 'Consolação', city: 'São Paulo', state: 'SP', zip: '01305-000' },
      permissions: ['manage_leads', 'view_dashboard']
    },
  ]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<TeamMember>(INITIAL_MEMBER_STATE);
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [wantsToChangePassword, setWantsToChangePassword] = useState(false);

  // React Hook Form Setup
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: INITIAL_MEMBER_STATE
  });

  // Reset form when modal opens or member changes
  useEffect(() => {
    if (isMemberModalOpen) {
      reset(currentMember);
    }
  }, [isMemberModalOpen, currentMember, reset]);

  const onSubmitMember = async (data: MemberFormData) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      if (isEditingMember) {
        // Atualizar membro existente
        const response = await fetch(`${apiUrl}/api/team/members/${currentMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            avatarUrl: currentMember.avatarUrl,
            status: 'active'
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar membro');
        }

        const result = await response.json();
        setTeamMembers(prev => prev.map(m => m.id === currentMember.id ? { ...m, ...data } : m));
        alert('✅ Membro atualizado com sucesso!');
      } else {
        // Criar novo membro
        const response = await fetch(`${apiUrl}/api/team/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            status: 'active'
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar membro');
        }

        const result = await response.json();
        const newMember = { ...data, id: result.member.id, status: 'active' as const, permissions: [] };
        setTeamMembers(prev => [...prev, newMember]);
        alert('✅ Membro adicionado com sucesso! Senha: ' + data.password);
      }

      setIsMemberModalOpen(false);
      setShowPassword(false);
    } catch (error: any) {
      console.error('Erro ao salvar membro:', error);
      alert('❌ ' + error.message);
    }
  };

  // Carregar chaves salvas
  useEffect(() => {
    setGeminiKey(localStorage.getItem('gemini_api_key') || '');
    setOpenAiKey(localStorage.getItem('openai_api_key') || '');
  }, []);

  // --- Handlers de Perfil ---
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileData(prev => ({ ...prev, avatarUrl: imageUrl }));
      // Aqui você implementaria o upload real para o backend
      alert('Foto atualizada com sucesso! (Simulação)');
    }
  };

  const handleMemberPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCurrentMember(prev => ({ ...prev, avatarUrl: imageUrl }));
    }
  };

  // --- Handlers de Equipe ---
  const handleOpenAddMember = () => {
    setCurrentMember(INITIAL_MEMBER_STATE);
    setIsEditingMember(false);
    setIsMemberModalOpen(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setCurrentMember(member);
    setIsEditingMember(true);
    setIsMemberModalOpen(true);
  };

  const handleDeleteMember = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este membro da equipe?')) {
      setTeamMembers(prev => prev.filter(m => m.id !== id));
    }
  };



  // --- Handlers de Integração (Mantidos da versão anterior) ---
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

  // Real Integrations Data (Mockado para UI)
  const [integrations] = useState([
    { id: 1, dbId: 1, name: 'Google Ads', platform: 'google_ads', status: 'connected', icon: Search, lastSync: '10 min atrás' },
    { id: 2, dbId: 2, name: 'Meta Ads', platform: 'meta_ads', status: 'connected', icon: Globe, lastSync: '1 hora atrás' },
    { id: 3, dbId: 3, name: 'WhatsApp Business', platform: 'whatsapp', status: 'disconnected', icon: MessageSquare, lastSync: '-' },
  ]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        // Simulando que o usuário logado é o primeiro da lista de membros (ou um estado de user context)
        // Na prática, você buscaria isso de um contexto de autenticação
        const currentUser = teamMembers.find(m => m.id === 1) || teamMembers[0];

        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Informações do Perfil</h3>
              <p className="text-sm text-gray-500">Atualize suas informações pessoais e de contato.</p>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <img
                  src={profileData.avatarUrl} // Mantendo o estado local de avatar para preview imediato
                  alt="Avatar"
                  className="w-24 h-24 rounded-full border-4 border-blue-100 object-cover group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 text-white p-1 rounded-full">
                    <Edit2 size={16} />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{currentUser.firstName} {currentUser.lastName}</h4>
                <p className="text-sm text-gray-500">{currentUser.role}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Alterar foto
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={`${currentUser.firstName} ${currentUser.lastName}`}
                  // Em um cenário real, você separaria firstName/lastName no onChange ou teria campos separados
                  // Para simplificar e atender ao pedido de "Nome Completo", vamos permitir editar o nome de exibição no profileData ou atualizar o currentUser
                  onChange={(e) => {
                    const parts = e.target.value.split(' ');
                    const firstName = parts[0];
                    const lastName = parts.slice(1).join(' ');
                    setTeamMembers(prev => prev.map(m => m.id === currentUser.id ? { ...m, firstName, lastName } : m));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={currentUser.email}
                  onChange={(e) => setTeamMembers(prev => prev.map(m => m.id === currentUser.id ? { ...m, email: e.target.value } : m))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                <input
                  type="tel"
                  value={currentUser.phone}
                  onChange={(e) => setTeamMembers(prev => prev.map(m => m.id === currentUser.id ? { ...m, phone: e.target.value } : m))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                <input
                  type="text"
                  value={profileData.company} // Empresa ainda vem de profileData pois não está no TeamMember type explicitamente, mas poderia estar
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
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

            {/* Lista de Integrações */}
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
                        <p className="text-xs text-gray-500 mt-0.5">Última sincronização: {integ.lastSync}</p>
                      </div>
                    </div>
                    <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${isConnected ? 'bg-white border-red-200 text-red-600 hover:bg-red-50' : 'bg-blue-600 border-transparent text-white hover:bg-blue-700 shadow-sm'}`}>
                      {isConnected ? 'Desconectar' : 'Conectar Agora'}
                    </button>
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
              <button
                onClick={handleOpenAddMember}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={18} />
                Adicionar Membro
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
                  {teamMembers.map(member => {
                    const isInvalid = !member.email || !member.username;
                    return (
                      <tr key={member.id} className={`hover:bg-gray-50 ${isInvalid ? 'bg-red-50 border-l-4 border-red-500' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={`https://i.pravatar.cc/40?u=${member.email || 'default'}`}
                              alt={member.firstName || 'Unknown'}
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {member.firstName} {member.lastName}
                                {isInvalid && <span className="text-xs text-red-600 font-bold ml-2">(Registro Inválido - Exclua este item)</span>}
                              </div>
                              <div className="text-sm text-gray-500">{member.email || 'Sem email'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {member.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditMember(member)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Plano e Faturamento</h3>
              <p className="text-sm text-gray-500">Gerencie seu plano, pagamentos e histórico de faturas.</p>
            </div>
            {/* Conteúdo de Billing mantido simplificado para focar nas mudanças solicitadas */}
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
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in relative">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Configurações <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2 align-middle">{COMPONENT_VERSIONS.Settings}</span></h2>
        <p className="text-sm text-gray-500">Gerencie sua conta, integrações e preferências do sistema.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-2 space-y-1">
            <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <User size={18} /> Perfil
            </button>
            <button onClick={() => setActiveTab('integrations')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'integrations' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <LinkIcon size={18} /> Integrações
            </button>
            <button onClick={() => setActiveTab('team')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'team' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Shield size={18} /> Equipe e Permissões
            </button>
            <button onClick={() => setActiveTab('billing')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'billing' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
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

      {/* MODAL DE MEMBRO */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">{isEditingMember ? 'Editar Membro' : 'Adicionar Novo Membro'}</h3>
              <button onClick={() => setIsMemberModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>



            <form onSubmit={handleSubmit(onSubmitMember)} className="p-6 space-y-8">
              {/* Foto do Membro */}
              <div className="flex justify-center">
                <div className="relative group cursor-pointer" onClick={() => memberFileInputRef.current?.click()}>
                  <img
                    src={currentMember.avatarUrl || `https://i.pravatar.cc/150?u=${currentMember.email}`}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full border-4 border-blue-100 object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit2 className="text-white" size={20} />
                  </div>
                  <input
                    type="file"
                    ref={memberFileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleMemberPhotoUpload}
                  />
                </div>
              </div>

              {/* Dados Pessoais */}
              <section>
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                  <User size={16} className="text-blue-600" /> Dados Pessoais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                    <input {...register('username')} className={`w-full p-2 border rounded-lg ${errors.username ? 'border-red-500' : ''}`} />
                    {errors.username && <span className="text-xs text-red-500">{errors.username.message}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                    <input {...register('firstName')} className={`w-full p-2 border rounded-lg ${errors.firstName ? 'border-red-500' : ''}`} />
                    {errors.firstName && <span className="text-xs text-red-500">{errors.firstName.message}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sobrenome</label>
                    <input {...register('lastName')} className={`w-full p-2 border rounded-lg ${errors.lastName ? 'border-red-500' : ''}`} />
                    {errors.lastName && <span className="text-xs text-red-500">{errors.lastName.message}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">E-mail</label>
                    <input {...register('email')} className={`w-full p-2 border rounded-lg ${errors.email ? 'border-red-500' : ''}`} />
                    {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                  </div>
                  {/* Senha - Condicional: obrigatória ao criar, opcional ao editar */}
                  {!isEditingMember ? (
                    // CRIANDO NOVO MEMBRO: Senha obrigatória
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Senha *</label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            {...register('password', { required: 'Senha obrigatória ao criar usuário' })}
                            type={showPassword ? 'text' : 'password'}
                            className={`w-full p-2 pr-10 border rounded-lg ${errors.password ? 'border-red-500' : ''}`}
                            placeholder="Mínimo 8 caracteres"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newPassword = generateSecurePassword();
                            setValue('password', newPassword);
                            setShowPassword(true);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-xs whitespace-nowrap flex items-center gap-2"
                        >
                          <Shield size={16} /> Gerar Senha
                        </button>
                      </div>
                      {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
                    </div>
                  ) : (
                    // EDITANDO MEMBRO: Opção de alterar senha
                    <div className="md:col-span-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <Lock size={16} className="text-orange-600" /> Alteração de Senha
                        </h5>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={wantsToChangePassword}
                            onChange={(e) => {
                              setWantsToChangePassword(e.target.checked);
                              if (!e.target.checked) {
                                setValue('oldPassword', '');
                                setValue('newPassword', '');
                              }
                            }}
                            className="rounded text-blue-600"
                          />
                          <span className="text-xs text-gray-600">Alterar senha</span>
                        </label>
                      </div>

                      {wantsToChangePassword && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Senha Antiga *</label>
                            <input
                              {...register('oldPassword')}
                              type="password"
                              className={`w-full p-2 border rounded-lg ${errors.oldPassword ? 'border-red-500' : ''}`}
                              placeholder="Digite a senha atual"
                            />
                            {errors.oldPassword && <span className="text-xs text-red-500">{errors.oldPassword.message}</span>}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nova Senha *</label>
                            <div className="flex gap-2">
                              <input
                                {...register('newPassword')}
                                type={showPassword ? 'text' : 'password'}
                                className={`flex-1 p-2 border rounded-lg ${errors.newPassword ? 'border-red-500' : ''}`}
                                placeholder="Mínimo 8 caracteres"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const pwd = generateSecurePassword();
                                  setValue('newPassword', pwd);
                                  setShowPassword(true);
                                }}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs"
                                title="Gerar senha segura"
                              >
                                <Shield size={16} />
                              </button>
                            </div>
                            {errors.newPassword && <span className="text-xs text-red-500">{errors.newPassword.message}</span>}
                          </div>
                        </div>
                      )}

                      {!wantsToChangePassword && (
                        <p className="text-xs text-gray-500 italic">Marque a opção acima para alterar a senha</p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      {...register('phone')}
                      onChange={(e) => {
                        e.target.value = maskPhone(e.target.value);
                        register('phone').onChange(e);
                      }}
                      className={`w-full p-2 border rounded-lg ${errors.phone ? 'border-red-500' : ''}`}
                    />
                    {errors.phone && <span className="text-xs text-red-500">{errors.phone.message}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">CPF</label>
                    <input
                      {...register('cpf')}
                      onChange={(e) => {
                        e.target.value = maskCPF(e.target.value);
                        register('cpf').onChange(e);
                      }}
                      className={`w-full p-2 border rounded-lg ${errors.cpf ? 'border-red-500' : ''}`}
                    />
                    {errors.cpf && <span className="text-xs text-red-500">{errors.cpf.message}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Data de Cadastro</label>
                    <input type="date" {...register('registrationDate')} className={`w-full p-2 border rounded-lg ${errors.registrationDate ? 'border-red-500' : ''}`} />
                    {errors.registrationDate && <span className="text-xs text-red-500">{errors.registrationDate.message}</span>}
                  </div>
                </div>
              </section>

              {/* Endereço */}
              <section>
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                  <MapPin size={16} className="text-blue-600" /> Endereço
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rua/Avenida</label>
                    <input {...register('address.street')} className={`w-full p-2 border rounded-lg ${errors.address?.street ? 'border-red-500' : ''}`} />
                    {errors.address?.street && <span className="text-xs text-red-500">{errors.address.street.message}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Número</label>
                    <input {...register('address.number')} className={`w-full p-2 border rounded-lg ${errors.address?.number ? 'border-red-500' : ''}`} />
                    {errors.address?.number && <span className="text-xs text-red-500">{errors.address.number.message}</span>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Complemento</label>
                    <input {...register('address.complement')} className="w-full p-2 border rounded-lg" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bairro</label>
                    <input {...register('address.district')} className={`w-full p-2 border rounded-lg ${errors.address?.district ? 'border-red-500' : ''}`} />
                    {errors.address?.district && <span className="text-xs text-red-500">{errors.address.district.message}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Cidade</label>
                    <input {...register('address.city')} className={`w-full p-2 border rounded-lg ${errors.address?.city ? 'border-red-500' : ''}`} />
                    {errors.address?.city && <span className="text-xs text-red-500">{errors.address.city.message}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">UF</label>
                    <input {...register('address.state')} maxLength={2} className={`w-full p-2 border rounded-lg ${errors.address?.state ? 'border-red-500' : ''}`} />
                    {errors.address?.state && <span className="text-xs text-red-500">{errors.address.state.message}</span>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">CEP</label>
                    <input
                      {...register('address.zip')}
                      onChange={(e) => {
                        e.target.value = maskCEP(e.target.value);
                        register('address.zip').onChange(e);
                      }}
                      className={`w-full p-2 border rounded-lg ${errors.address?.zip ? 'border-red-500' : ''}`}
                    />
                    {errors.address?.zip && <span className="text-xs text-red-500">{errors.address.zip.message}</span>}
                  </div>
                </div>
              </section>

              {/* Permissões */}
              <section>
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                  <Lock size={16} className="text-blue-600" /> Permissões e Acesso
                </h4>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Função do Sistema (Role)</label>
                    <select {...register('role')} className="w-full p-2.5 border border-gray-300 rounded-lg bg-white">
                      <option value="Admin">Admin (Acesso Total)</option>
                      <option value="Vendedor">Vendedor (Leads e CRM)</option>
                      <option value="Editor">Editor (Marketing e Conteúdo)</option>
                      <option value="Viewer">Visualizador (Apenas Relatórios)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium uppercase">Permissões Granulares</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['Visualizar Dashboard', 'Gerenciar Campanhas', 'Gerenciar Leads', 'Exportar Relatórios', 'Configurações do Sistema', 'Gerenciar Equipe'].map((perm, idx) => (
                        <label key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" defaultChecked={currentMember.role === 'Admin'} />
                          {perm}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsMemberModalOpen(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">
                  {isEditingMember ? 'Salvar Alterações' : 'Adicionar Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
