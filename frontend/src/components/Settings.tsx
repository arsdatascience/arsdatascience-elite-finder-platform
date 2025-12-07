import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Shield, Globe, CreditCard, LogOut, User, Search, MessageSquare, BrainCircuit, Brain, Eye, EyeOff, Cpu, Check, Plus, LinkIcon, Trash2, Edit2, X, MapPin, Lock, Mail, Send, TestTube, AlertCircle, CheckCircle } from 'lucide-react';
import { COMPONENT_VERSIONS } from '../componentVersions';
import { useAuth } from '@/contexts/AuthContext';
import { UsageStats } from './UsageStats';
import { AdminPlans } from './AdminPlans';
import IntegrationsManager from './IntegrationsManager';

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

type SettingsTab = 'profile' | 'integrations' | 'team' | 'billing' | 'notifications' | 'security' | 'subscription' | 'admin' | 'email';

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

  // Estados para Email SMTP (suporta múltiplos)
  interface EmailConfigType {
    id?: number;
    name: string;
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPassword: string;
    smtpFrom: string;
    smtpFromName: string;
    smtpSecure: boolean;
    isDefault: boolean;
    useFor: string;
  }
  const emptyEmailConfig: EmailConfigType = {
    name: '',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
    smtpFromName: '',
    smtpSecure: true,
    isDefault: false,
    useFor: 'all'
  };
  const [emailConfigs, setEmailConfigs] = useState<EmailConfigType[]>([]);
  const [currentEmailConfig, setCurrentEmailConfig] = useState<EmailConfigType>(emptyEmailConfig);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isEditingEmailConfig, setIsEditingEmailConfig] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [emailTestStatus, setEmailTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [emailTestMessage, setEmailTestMessage] = useState('');

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

    // Carregar configs de email
    if (activeTab === 'email' && user) {
      const fetchEmailConfigs = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/email/config?userId=${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setEmailConfigs(data.configs || []);
          }
        } catch (error) {
          console.error('Erro ao carregar configs de email:', error);
        }
      };
      fetchEmailConfigs();
    }
  }, [activeTab, user]);
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



  // Real Integrations Data (Mockado para UI)
  const [integrations] = useState([
    { id: 1, dbId: 1, name: 'Google Ads', platform: 'google_ads', status: 'connected', icon: Search, lastSync: '10 min atrás' },
    { id: 2, dbId: 2, name: 'Meta Ads', platform: 'meta_ads', status: 'connected', icon: Globe, lastSync: '1 hora atrás' },
    { id: 3, dbId: 3, name: 'WhatsApp Business', platform: 'whatsapp', status: 'disconnected', icon: MessageSquare, lastSync: '-' },
  ]);

  const SETTINGS_TABS = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'subscription', label: 'Planos e Limites', icon: CreditCard },
    { id: 'integrations', label: 'Integrações', icon: LinkIcon },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'team', label: 'Equipe', icon: User },
    { id: 'security', label: 'Segurança', icon: Shield },
  ];

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
                  className="w-24 h-24 rounded-full border-4 border-primary-100 object-cover group-hover:opacity-80 transition-opacity"
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
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={currentUser.email}
                  onChange={(e) => setTeamMembers(prev => prev.map(m => m.id === currentUser.id ? { ...m, email: e.target.value } : m))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
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

            <div className="p-4 bg-blue-50 border border-primary-100 rounded-lg flex items-start gap-3">
              <Shield className="text-primary-600 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-primary-900 text-sm">Autenticação de Dois Fatores (2FA)</h4>
                <p className="text-xs text-primary-700 mt-1">Adicione uma camada extra de segurança à sua conta.</p>
                <button className="mt-2 text-xs font-bold text-primary-600 hover:text-blue-800 uppercase tracking-wide">Ativar 2FA</button>
              </div>
            </div>

            <form className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual</label>
                <div className="relative">
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

      case 'email':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Configurações de Email</h3>
                <p className="text-sm text-gray-500">Gerencie múltiplos servidores SMTP para diferentes tipos de envio.</p>
              </div>
              <button
                onClick={() => {
                  setCurrentEmailConfig(emptyEmailConfig);
                  setIsEditingEmailConfig(false);
                  setIsEmailModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={16} />
                Adicionar Email
              </button>
            </div>

            {/* Status Card */}
            {emailTestStatus !== 'idle' && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${emailTestStatus === 'success' ? 'bg-green-50 border border-green-200' :
                emailTestStatus === 'error' ? 'bg-red-50 border border-red-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                {emailTestStatus === 'testing' && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />}
                {emailTestStatus === 'success' && <CheckCircle className="text-green-600" size={20} />}
                {emailTestStatus === 'error' && <AlertCircle className="text-red-600" size={20} />}
                <div>
                  <h4 className={`font-bold text-sm ${emailTestStatus === 'success' ? 'text-green-800' :
                    emailTestStatus === 'error' ? 'text-red-800' : 'text-blue-800'
                    }`}>
                    {emailTestStatus === 'testing' ? 'Testando conexão...' :
                      emailTestStatus === 'success' ? 'Conexão estabelecida!' : 'Erro na conexão'}
                  </h4>
                  <p className="text-xs mt-1">{emailTestMessage}</p>
                </div>
              </div>
            )}

            {/* Email Configs List */}
            <div className="space-y-4">
              {emailConfigs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Mail size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Nenhuma configuração de email cadastrada.</p>
                  <p className="text-sm text-gray-400 mt-1">Clique em "Adicionar Email" para configurar seu primeiro SMTP.</p>
                </div>
              ) : (
                emailConfigs.map((config) => (
                  <div key={config.id} className={`border rounded-xl p-5 ${config.isDefault ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.isDefault ? 'bg-blue-600' : 'bg-gray-400'}`}>
                          <Mail size={20} className="text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 flex items-center gap-2">
                            {config.name || 'Sem nome'}
                            {config.isDefault && (
                              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Padrão</span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-500">{config.smtpHost}:{config.smtpPort}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!config.isDefault && (
                          <button
                            onClick={async () => {
                              try {
                                await fetch(`${import.meta.env.VITE_API_URL}/api/email/config/${config.id}/default`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId: user?.id })
                                });
                                setEmailConfigs(prev => prev.map(c => ({ ...c, isDefault: c.id === config.id })));
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            Definir Padrão
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setCurrentEmailConfig(config);
                            setIsEditingEmailConfig(true);
                            setIsEmailModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('Tem certeza que deseja remover esta configuração?')) {
                              try {
                                await fetch(`${import.meta.env.VITE_API_URL}/api/email/config/${config.id}?userId=${user?.id}`, {
                                  method: 'DELETE'
                                });
                                setEmailConfigs(prev => prev.filter(c => c.id !== config.id));
                              } catch (err) {
                                console.error(err);
                              }
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span>Usuário: {config.smtpUser}</span>
                      <span>De: {config.smtpFrom || config.smtpUser}</span>
                      <span className={`px-2 py-0.5 rounded-full ${config.useFor === 'all' ? 'bg-gray-100' : 'bg-purple-100 text-purple-700'}`}>
                        {config.useFor === 'all' ? 'Todos os envios' :
                          config.useFor === 'alerts' ? 'Alertas' :
                            config.useFor === 'reports' ? 'Relatórios' : 'Marketing'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Info Card */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-bold text-amber-800 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                Dica para Gmail
              </h4>
              <p className="text-xs text-amber-700 mt-1">
                Para usar o Gmail como SMTP, você precisa criar uma "Senha de App" nas configurações de segurança da sua conta Google.
                Use smtp.gmail.com, porta 587, e a senha de app gerada (não sua senha normal).
              </p>
            </div>

            {/* Email Config Modal */}
            {isEmailModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Mail size={24} className="text-blue-600" />
                      {isEditingEmailConfig ? 'Editar Configuração SMTP' : 'Nova Configuração SMTP'}
                    </h3>
                    <button onClick={() => setIsEmailModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Configuração</label>
                        <input
                          type="text"
                          value={currentEmailConfig.name}
                          onChange={(e) => setCurrentEmailConfig(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Gmail Principal, Alertas, Marketing"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Host SMTP</label>
                        <input
                          type="text"
                          value={currentEmailConfig.smtpHost}
                          onChange={(e) => setCurrentEmailConfig(prev => ({ ...prev, smtpHost: e.target.value }))}
                          placeholder="smtp.gmail.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Porta</label>
                        <input
                          type="text"
                          value={currentEmailConfig.smtpPort}
                          onChange={(e) => setCurrentEmailConfig(prev => ({ ...prev, smtpPort: e.target.value }))}
                          placeholder="587"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Usuário/Email</label>
                        <input
                          type="email"
                          value={currentEmailConfig.smtpUser}
                          onChange={(e) => setCurrentEmailConfig(prev => ({ ...prev, smtpUser: e.target.value }))}
                          placeholder="seu-email@gmail.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Senha/App Password</label>
                        <div className="relative">
                          <input
                            type={showSmtpPassword ? 'text' : 'password'}
                            value={currentEmailConfig.smtpPassword}
                            onChange={(e) => setCurrentEmailConfig(prev => ({ ...prev, smtpPassword: e.target.value }))}
                            placeholder="••••••••••••••••"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showSmtpPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Remetente</label>
                        <input
                          type="email"
                          value={currentEmailConfig.smtpFrom}
                          onChange={(e) => setCurrentEmailConfig(prev => ({ ...prev, smtpFrom: e.target.value }))}
                          placeholder="noreply@suaempresa.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome Remetente</label>
                        <input
                          type="text"
                          value={currentEmailConfig.smtpFromName}
                          onChange={(e) => setCurrentEmailConfig(prev => ({ ...prev, smtpFromName: e.target.value }))}
                          placeholder="Elite Finder"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Usar para</label>
                        <select
                          value={currentEmailConfig.useFor}
                          onChange={(e) => setCurrentEmailConfig(prev => ({ ...prev, useFor: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">Todos os envios</option>
                          <option value="alerts">Apenas Alertas</option>
                          <option value="reports">Apenas Relatórios</option>
                          <option value="marketing">Apenas Marketing</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentEmailConfig.smtpSecure}
                          onChange={(e) => setCurrentEmailConfig(prev => ({ ...prev, smtpSecure: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Usar TLS/SSL</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentEmailConfig.isDefault}
                          onChange={(e) => setCurrentEmailConfig(prev => ({ ...prev, isDefault: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Definir como padrão</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between gap-3 mt-8 pt-4 border-t">
                    <button
                      onClick={async () => {
                        setEmailTestStatus('testing');
                        setEmailTestMessage('Enviando email de teste...');
                        try {
                          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/email/test`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(currentEmailConfig)
                          });
                          const data = await res.json();
                          if (data.success) {
                            setEmailTestStatus('success');
                            setEmailTestMessage('Email de teste enviado! Verifique sua caixa.');
                          } else {
                            setEmailTestStatus('error');
                            setEmailTestMessage(data.error || 'Falha ao enviar email de teste.');
                          }
                        } catch (err: any) {
                          setEmailTestStatus('error');
                          setEmailTestMessage(err.message || 'Erro de conexão.');
                        }
                        setTimeout(() => setEmailTestStatus('idle'), 5000);
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                    >
                      <Send size={16} />
                      Testar Conexão
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsEmailModalOpen(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/email/config`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...currentEmailConfig, userId: user?.id })
                            });
                            if (res.ok) {
                              alert('Configuração salva com sucesso!');
                              setIsEmailModalOpen(false);
                              // Reload configs
                              const configRes = await fetch(`${import.meta.env.VITE_API_URL}/api/email/config?userId=${user?.id}`);
                              const data = await configRes.json();
                              if (data.success) setEmailConfigs(data.configs);
                            } else {
                              const data = await res.json();
                              alert('Erro: ' + (data.error || 'Falha ao salvar'));
                            }
                          } catch (err) {
                            alert('Erro ao salvar configuração.');
                          }
                        }}
                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Save size={16} />
                        {isEditingEmailConfig ? 'Atualizar' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
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
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
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
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
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

            {/* Lista de Integrações Nativas */}
            <div className="mt-8">
              <IntegrationsManager />
            </div>

            {/* Lista de Integrações Mock (Legado - Mantido se necessário) */}
            {/* <div className="grid grid-cols-1 gap-4"> */}

          </div >
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
                  onClick={handleOpenAddMember}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
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
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
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
                            className="text-primary-600 hover:text-primary-900 mr-3"
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
            <div className="border-2 border-primary-200 bg-primary-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Plano Pro</h4>
                  <p className="text-sm text-gray-600">Renovação automática em 15 de Dezembro de 2025</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">R$ 997</div>
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
            <h3 className="text-lg font-bold text-gray-900">Planos e Limites</h3>
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
    <div className="flex flex-col md:flex-row h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Mobile Nav */}
      <div className="md:hidden w-full bg-gray-50 border-b border-gray-200 overflow-x-auto shrink-0">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Configurações</h2>
          <span className="text-xs text-gray-500">v{COMPONENT_VERSIONS.Settings}</span>
        </div>
        <nav className="flex p-2 gap-2 min-w-max">
          {SETTINGS_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-primary-600 shadow-sm border border-primary-100' : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
          {user?.role === 'Admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'admin' ? 'bg-white text-primary-600 shadow-sm border border-primary-100' : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
            >
              <Shield size={16} className="text-purple-600" />
              Admin
            </button>
          )}
        </nav>
      </div>

      {/* Sidebar de Configurações (Desktop) */}
      <div className="hidden md:flex w-64 bg-gray-50 border-r border-gray-200 flex-col shrink-0">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Configurações</h2>
          <span className="text-xs text-gray-500">v{COMPONENT_VERSIONS.Settings}</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {SETTINGS_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}

          {user?.role === 'Admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'admin' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Shield size={18} className="text-purple-600" /> Admin
            </button>
          )}
        </nav>
        <div className="p-4 border-t border-gray-200">
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
                  <input {...register('firstName')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="João" />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome *</label>
                  <input {...register('lastName')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Silva" />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input {...register('username')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="joaosilva" />
                  {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input {...register('email')} type="email" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="joao@exemplo.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                  <input
                    {...register('phone')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
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
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
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
                  <select {...register('role')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                    <option value="Vendedor">Vendedor</option>
                    <option value="Gerente">Gerente</option>
                    <option value="Suporte">Suporte</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Registro</label>
                  <input {...register('registrationDate')} type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>

              {/* Endereço */}
              <section>
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                  <MapPin size={16} className="text-primary-600" /> Endereço
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
                  <Lock size={16} className="text-primary-600" /> Permissões e Acesso
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
                          <input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" defaultChecked={currentMember.role === 'Admin'} />
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
                  <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wider"><Lock size={16} className="text-primary-600" /> Segurança</h4>
                  {isEditingMember && (
                    <button
                      type="button"
                      onClick={() => setWantsToChangePassword(!wantsToChangePassword)}
                      className="text-xs text-primary-600 font-medium hover:underline"
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
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
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
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none pr-10"
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
                <button type="submit" className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 shadow-lg shadow-primary-200">
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