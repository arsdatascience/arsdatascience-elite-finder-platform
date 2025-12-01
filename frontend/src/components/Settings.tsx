import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Shield, Globe, CreditCard, LogOut, User, Search, MessageSquare, BrainCircuit, Brain, Eye, EyeOff, Cpu, Check, Plus, LinkIcon, Trash2, Edit2, X, MapPin, Lock } from 'lucide-react';
import { COMPONENT_VERSIONS } from '../componentVersions';
import { useAuth } from '@/contexts/AuthContext';
import { UsageStats } from './UsageStats';
import { AdminPlans } from './AdminPlans';

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
  if (data.newPassword && data.newPassword.length < 8) {
    return false;
  }
  return true;
}, {
  message: "A nova senha deve ter no mínimo 8 caracteres",
  path: ["newPassword"]
});


type MemberFormData = z.infer<typeof memberSchema>;

type SettingsTab = 'profile' | 'integrations' | 'team' | 'billing' | 'notifications' | 'security' | 'subscription' | 'admin';

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
    .substring(0, 15);
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
    .substring(0, 9);
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
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password.split('').sort(() => Math.random() - 0.5).join('');
};




export const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('integrations');

  // --- Estados para Integrações ---
  const [geminiKey, setGeminiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isEditingGemini, setIsEditingGemini] = useState(false);
  const [openAiKey, setOpenAiKey] = useState('');
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [isEditingOpenAi, setIsEditingOpenAi] = useState(false);
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [isEditingAnthropic, setIsEditingAnthropic] = useState(false);

  // Estados para Perfil
  // Estados para Perfil (Removido profileData pois usamos currentUser)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const memberFileInputRef = useRef<HTMLInputElement>(null);

  // Estados para Gestão de Equipe
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Carregar membros do backend
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/team/members`);
        const data = await response.json();
        if (data.success) {
          setTeamMembers(data.members);
        }
      } catch (error) {
        console.error('Erro ao carregar membros:', error);
      }
    };

    if (activeTab === 'team' || activeTab === 'profile') {
      fetchMembers();
    }
  }, [activeTab]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<TeamMember>(INITIAL_MEMBER_STATE);
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [wantsToChangePassword, setWantsToChangePassword] = useState(false);

  // React Hook Form Setup


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

      // Validação de Segurança: Se não for Admin e estiver trocando senha, exigir senha antiga
      if (user?.role !== 'Admin' && isEditingMember && wantsToChangePassword && !data.oldPassword) {
        alert('Por segurança, informe sua senha atual para definir uma nova.');
        return;
      }

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
        const updatedMember = result.member;

        setTeamMembers(prev => prev.map(m => m.id === currentMember.id ? { ...m, ...updatedMember } : m));

        // Se estiver editando o próprio usuário, atualizar o contexto global
        if (user && user.id === currentMember.id) {
          updateUser({
            name: `${updatedMember.firstName} ${updatedMember.lastName}`,
            email: updatedMember.email,
            role: updatedMember.role
          });
        }

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

    } catch (error: any) {
      console.error('Erro ao salvar membro:', error);
      alert('❌ ' + error.message);
    }
  };

  // Carregar chaves salvas do Backend (SaaS Security)
  useEffect(() => {
    const fetchKeys = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}/api-keys`);
        const data = await res.json();
        if (data.success) {
          // Se a chave vier mascarada (sk-...), mantemos. Se o usuário editar, ele vai sobrescrever.
          if (data.keys.gemini) setGeminiKey(data.keys.gemini);
          if (data.keys.openai) setOpenAiKey(data.keys.openai);
          if (data.keys.anthropic) setAnthropicKey(data.keys.anthropic);
        }
      } catch (e) { console.error('Erro ao carregar chaves:', e); }
    };
    fetchKeys();
  }, [user]);

  // --- Handlers de Perfil ---
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      try {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}/avatar`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Falha no upload');

        const data = await response.json();
        if (data.avatarUrl) {
          updateUser({ avatar_url: data.avatarUrl });
          alert('Foto atualizada com sucesso!');
        }
      } catch (error) {
        console.error(error);
        alert('Erro ao atualizar foto.');
      }
    }
  };

  const handleMemberPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentMember.id) {
      try {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${currentMember.id}/avatar`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Falha no upload');

        const data = await response.json();
        if (data.avatarUrl) {
          setCurrentMember(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
          // Se for o usuário logado, atualiza o contexto também
          if (user && user.id === currentMember.id) {
            updateUser({ avatar_url: data.avatarUrl });
          }
        }
      } catch (error) {
        console.error(error);
        alert('Erro ao fazer upload da foto.');
      }
    } else if (file) {
      // Novo membro (ainda sem ID), apenas preview local (não será salvo até criar o membro, mas o backend precisa de ID para upload)
      // Solução: Upload só permitido após criar o membro ou implementar upload temporário.
      // Por enquanto, vamos alertar que precisa salvar primeiro.
      alert('Salve o novo membro antes de adicionar uma foto.');
    }
  };

  // --- Handlers de Equipe ---
  const handleOpenAddMember = () => {
    setCurrentMember(INITIAL_MEMBER_STATE);
    setIsEditingMember(false);
    setIsMemberModalOpen(true);
  };

  const handleEditMember = (member: TeamMember) => {
    // Garantir que todos os campos existam para evitar erros no formulário
    const safeMember = {
      ...INITIAL_MEMBER_STATE,
      ...member,
      address: { ...INITIAL_MEMBER_STATE.address, ...(member.address || {}) },
      permissions: member.permissions || []
    };
    setCurrentMember(safeMember);
    setIsEditingMember(true);
    setIsMemberModalOpen(true);
  };

  const handleDeleteMember = async (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este membro da equipe?')) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/team/members/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setTeamMembers(prev => prev.filter(m => m.id !== id));
          alert('Membro removido com sucesso.');
        } else {
          const data = await response.json();
          alert('Erro ao remover membro: ' + (data.error || 'Erro desconhecido'));
        }
      } catch (error) {
        console.error('Erro ao deletar:', error);
        alert('Erro ao conectar com o servidor.');
      }
    }
  };



  // --- Handlers de Integração (Mantidos da versão anterior) ---
  // --- Handlers de Integração (Atualizados para SaaS) ---
  const saveApiKey = async (provider: string, key: string) => {
    if (!user) return;
    try {
      const body: any = {};
      if (provider === 'gemini') body.gemini_key = key;
      if (provider === 'openai') body.openai_key = key;
      if (provider === 'anthropic') body.anthropic_key = key;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error('Falha ao salvar');

      alert(`Chave da API ${provider} atualizada com segurança!`);
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar chave.');
    }
  };

  const handleSaveGemini = () => {
    saveApiKey('gemini', geminiKey);
    setIsEditingGemini(false);
  };

  const handleSaveOpenAi = () => {
    saveApiKey('openai', openAiKey);
    setIsEditingOpenAi(false);
  };

  const handleSaveAnthropic = () => {
    saveApiKey('anthropic', anthropicKey);
    setIsEditingAnthropic(false);
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair da conta?')) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      // Limpar outros itens se necessário, mas manter as chaves de API pode ser útil ou não, dependendo da regra de negócio.
      // Por segurança, vamos limpar tudo relacionado a sessão.
      window.location.href = '/login';
    }
  };

  const handleSystemCleanup = async () => {
    if (window.confirm('ATENÇÃO: Isso irá resetar todos os dados de clientes e leads do banco de dados local. Deseja continuar?')) {
      // Simulação de limpeza
      alert('Limpeza de sistema simulada com sucesso.');
    }
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
        // Usar usuário do contexto
        const currentUser = user ? {
          ...INITIAL_MEMBER_STATE,
          id: user.id,
          firstName: user.name.split(' ')[0],
          lastName: user.name.split(' ').slice(1).join(' '),
          email: user.email,
          role: user.role,
          avatarUrl: user.avatar_url
        } : INITIAL_MEMBER_STATE;

        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Informações do Perfil</h3>
              <p className="text-sm text-gray-500">Atualize suas informações pessoais e de contato.</p>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <img
                  src={currentUser.avatarUrl || "https://github.com/shadcn.png"}
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
                  value={currentUser.phone || ''}
                  onChange={(e) => {
                    const masked = maskPhone(e.target.value);
                    setTeamMembers(prev => prev.map(m => m.id === currentUser.id ? { ...m, phone: masked } : m));
                  }}
                  maxLength={15}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                <input
                  type="text"
                  value={currentUser.role}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
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

      case 'security':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Segurança</h3>
                <p className="text-sm text-gray-500">Gerencie sua senha e configurações de segurança.</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
              <Shield className="text-blue-600 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-blue-900 text-sm">Autenticação de Dois Fatores (2FA)</h4>
                <p className="text-xs text-blue-700 mt-1">Adicione uma camada extra de segurança à sua conta.</p>
                <button className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wide">Ativar 2FA</button>
              </div>
            </div>

            <form className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual</label>
                <div className="relative">
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                <div className="relative">
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
                <div className="relative">
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>
              <button type="button" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 w-full">
                Atualizar Senha
              </button>
            </form>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Integrações</h3>
              <p className="text-sm text-gray-500">Conecte suas ferramentas favoritas.</p>
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

            {/* Anthropic API */}
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                    <Brain size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Anthropic API (Claude)</h4>
                    <p className="text-xs text-gray-500">Para modelos Claude 3.5 Sonnet e Opus</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingAnthropic(!isEditingAnthropic)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {isEditingAnthropic ? 'Cancelar' : 'Editar'}
                </button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showAnthropicKey ? 'text' : 'password'}
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    disabled={!isEditingAnthropic}
                    placeholder="Cole sua chave da API Anthropic aqui (sk-ant-...)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
                  />
                  <button
                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showAnthropicKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {isEditingAnthropic && (
                  <button
                    onClick={handleSaveAnthropic}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
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
              <div className="flex gap-2">
                <button
                  onClick={handleSystemCleanup}
                  className="px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 flex items-center gap-2"
                  title="Limpar clientes extras e resetar IDs"
                >
                  <Trash2 size={18} />
                  Limpar Banco
                </button>
                <button
                  onClick={handleOpenAddMember}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={18} />
                  Adicionar Membro
                </button>
              </div>
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
                              src={member.avatarUrl || `https://i.pravatar.cc/40?u=${member.email || 'default'}`}
                              alt={member.firstName || 'Unknown'}
                              className="w-10 h-10 rounded-full object-cover"
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

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-2">Área de Demonstração</h4>
              <p className="text-sm text-gray-500 mb-4">Use este botão para gerar dados fictícios de campanhas e testar os gráficos.</p>
              <button
                onClick={async () => {
                  if (confirm('Isso irá apagar dados de campanhas existentes e gerar novos dados aleatórios. Continuar?')) {
                    try {
                      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/seed-campaigns`);
                      const data = await res.json();
                      if (data.success) alert('Dados gerados com sucesso! Recarregue a página de Campanhas.');
                      else alert('Erro: ' + JSON.stringify(data));
                    } catch (e) {
                      alert('Erro ao conectar com servidor.');
                    }
                  }
                }}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium"
              >
                Gerar Dados de Campanha (Seed)
              </button>
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900">Assinatura e Limites</h3>
            <p className="text-sm text-gray-500">Acompanhe o uso do seu plano atual.</p>
            <UsageStats />
          </div>
        );

      case 'admin':
        return <AdminPlans />;

      default:
        return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Sidebar de Configurações */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Configurações</h2>
          <span className="text-xs text-gray-500">v{COMPONENT_VERSIONS.Settings}</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <User size={18} /> Perfil
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'subscription' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <CreditCard size={18} /> Assinatura
          </button>

          <button
            onClick={() => setActiveTab('integrations')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'integrations' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <LinkIcon size={18} /> Integrações
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'team' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <User size={18} /> Equipe
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'security' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Shield size={18} /> Segurança
          </button>

          {user?.role === 'Admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Shield size={18} className="text-purple-600" /> Admin
            </button>
          )}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSystemCleanup}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors mb-2"
          >
            <Trash2 size={18} /> Resetar Sistema
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="p-8 max-w-4xl mx-auto">
          {renderTabContent()}
        </div>
      </div>

      {/* Modal de Membro */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">
                {isEditingMember ? 'Editar Membro' : 'Adicionar Membro'}
              </h3>
              <button onClick={() => setIsMemberModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitMember)} className="p-6 space-y-6">
              {/* Avatar Upload no Modal */}
              <div className="flex justify-center">
                <div className="relative group cursor-pointer" onClick={() => memberFileInputRef.current?.click()}>
                  <img
                    src={currentMember.avatarUrl || "https://github.com/shadcn.png"}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full border-4 border-gray-100 object-cover"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input {...register('firstName')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="João" />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome *</label>
                  <input {...register('lastName')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Silva" />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input {...register('username')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="joaosilva" />
                  {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input {...register('email')} type="email" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="joao@exemplo.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                  <input
                    {...register('phone')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="(11) 99999-9999"
                    onChange={(e) => {
                      e.target.value = maskPhone(e.target.value);
                      setValue('phone', e.target.value);
                    }}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                  <input
                    {...register('cpf')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="000.000.000-00"
                    onChange={(e) => {
                      e.target.value = maskCPF(e.target.value);
                      setValue('cpf', e.target.value);
                    }}
                  />
                  {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                  <select {...register('role')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="Vendedor">Vendedor</option>
                    <option value="Gerente">Gerente</option>
                    <option value="Suporte">Suporte</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Registro</label>
                  <input {...register('registrationDate')} type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

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

              {/* Senha e Segurança */}
              <section className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wider"><Lock size={16} className="text-blue-600" /> Segurança</h4>
                  {isEditingMember && (
                    <button
                      type="button"
                      onClick={() => setWantsToChangePassword(!wantsToChangePassword)}
                      className="text-xs text-blue-600 font-medium hover:underline"
                    >
                      {wantsToChangePassword ? 'Cancelar alteração de senha' : 'Alterar senha'}
                    </button>
                  )}
                </div>

                {(!isEditingMember || wantsToChangePassword) && (
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {isEditingMember && user?.role !== 'Admin' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual (Obrigatório)</label>
                        <input
                          type="password"
                          {...register('oldPassword')}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Sua senha atual"
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                        <button
                          type="button"
                          onClick={() => {
                            const pass = generateSecurePassword();
                            setValue(isEditingMember ? 'newPassword' : 'password', pass);
                            // Forçar atualização visual se necessário, mas o setValue deve cuidar
                            setShowPassword(true);
                          }}
                          className="text-xs text-purple-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <Shield size={12} /> Gerar Senha Forte
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          {...register(isEditingMember ? 'newPassword' : 'password')}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                          placeholder="Mínimo de 8 caracteres"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
                      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>
                  </div>
                )}
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
export default Settings; 