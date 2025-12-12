import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminPlans } from './AdminPlans';
import { AdminTenants } from './AdminTenants';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Server,
    Activity,
    Search,
    Edit,
    Trash2,
    CheckCircle,
    AlertTriangle,
    Building,
    LogOut,
    Shield,
    Eye,
    EyeOff,
    Save,
    X,
    MapPin
} from 'lucide-react';

// Schema de Validação
const userSchema = z.object({
    username: z.string().min(3, 'Mínimo de 3 caracteres').optional(),
    firstName: z.string().min(2, 'Nome obrigatório'),
    lastName: z.string().min(2, 'Sobrenome obrigatório'),
    email: z.string().email('Email inválido'),
    password: z.string().optional(),
    newPassword: z.string().optional(),
    phone: z.string().optional(),
    cpf: z.string().optional(),
    role: z.string(),
    status: z.string(),
    tenant_id: z.string().optional(),
    address: z.object({
        street: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        district: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional()
    }).optional()
});

type UserFormData = z.infer<typeof userSchema>;

// Interfaces
interface QueueStats {
    stats: {
        pending: number;
        processing: number;
        completed: number;
        failed: number;
    };
    recentFailures: any[];
}

interface User {
    id: number;
    name: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    email: string;
    role: string;
    status: string;
    plan?: string;
    created_at: string;
    tenant_name?: string;
    tenant_id?: number;
    avatar_url?: string;
    phone?: string;
    cpf?: string;
    address?: any;
}

const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);

    const [tenants, setTenants] = useState<any[]>([]);
    const [systemUsage, setSystemUsage] = useState<any>(null);

    const ADMIN_TABS = [
        { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
        { id: 'tenants', label: 'Clientes (Tenants)', icon: Building },
        { id: 'users', label: 'Usuários', icon: Users },
        { id: 'plans', label: 'Planos & Limites', icon: CreditCard },
        { id: 'system', label: 'Sistema & Logs', icon: Activity },
    ];

    // Estados para Edição de Usuário
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormData>({
        resolver: zodResolver(userSchema)
    });

    // Fetch Data
    useEffect(() => {
        fetchQueueStats();
        fetchUsers();
        fetchTenants();
    }, []);

    useEffect(() => {
        if (activeTab === 'system') {
            fetchSystemUsage();
        }
    }, [activeTab]);

    const fetchQueueStats = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/queue-status`);
            const data = await res.json();
            if (data.success) setQueueStats(data);
        } catch (error) {
            console.error('Erro ao buscar status da fila:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users?t=${new Date().getTime()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (Array.isArray(data)) {
                setUsers(data);
            } else if (data.members && Array.isArray(data.members)) {
                setUsers(data.members);
            } else if (data.success && Array.isArray(data.data)) {
                setUsers(data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        }
    };

    const fetchTenants = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/tenants`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setTenants(data);
        } catch (error) {
            console.error('Erro ao buscar tenants:', error);
        }
    };

    const fetchSystemUsage = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/usage-stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSystemUsage(data);
        } catch (error) {
            console.error('Erro ao buscar estatísticas de uso:', error);
        }
    };

    const handleEditUser = (user: any) => {
        setEditingUser(user);

        // Determinar nome e sobrenome
        let fName = user.firstName || user.first_name || '';
        let lName = user.lastName || user.last_name || '';

        if (!fName && user.name) {
            fName = user.name.split(' ')[0];
            lName = user.name.split(' ').slice(1).join(' ');
        }

        reset({
            username: user.username || fName.toLowerCase(),
            firstName: fName,
            lastName: lName,
            email: user.email,
            role: user.role,
            status: user.status,
            tenant_id: user.tenant_id ? String(user.tenant_id) : '',
            phone: user.phone || '',
            cpf: user.cpf || '',
            address: user.address || {}
        });
        setIsUserModalOpen(true);
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== id));
            } else {
                alert('Erro ao excluir usuário');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const onSubmitUser = async (data: UserFormData) => {
        try {
            const token = localStorage.getItem('token');
            const url = editingUser
                ? `${import.meta.env.VITE_API_URL}/api/users/${editingUser.id}` // Ajustar endpoint se necessário
                : `${import.meta.env.VITE_API_URL}/api/users`;

            const method = editingUser ? 'PUT' : 'POST';

            // Se for criação, concatenar nome e gerar username
            const payload = {
                ...data,
                name: `${data.firstName} ${data.lastName}`,
                username: data.username || data.email.split('@')[0].toLowerCase() + Math.floor(Math.random() * 1000)
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                fetchUsers();
                setIsUserModalOpen(false);
                setEditingUser(null);
                alert('Usuário salvo com sucesso!');
            } else {
                const err = await res.json();
                alert('Erro: ' + (err.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão');
        }
    };

    // Renderers
    const renderOverview = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
                title="Total Usuários"
                value={users.length.toString()}
                icon={<Users className="w-6 h-6 text-primary-400" />}
                trend="+12% este mês"
            />
            <StatCard
                title="Jobs na Fila"
                value={queueStats?.stats?.pending?.toString() || '0'}
                icon={<Server className="w-6 h-6 text-yellow-400" />}
                subValue={`${queueStats?.stats?.processing || 0} processando`}
            />
            <StatCard
                title="Jobs Concluídos"
                value={queueStats?.stats?.completed?.toString() || '0'}
                icon={<CheckCircle className="w-6 h-6 text-green-400" />}
            />
            <StatCard
                title="Falhas Recentes"
                value={queueStats?.stats?.failed?.toString() || '0'}
                icon={<AlertTriangle className="w-6 h-6 text-red-400" />}
                isAlert={(queueStats?.stats?.failed || 0) > 0}
            />

            {/* Universal AI Control Plane Shortcut */}
            <div
                onClick={() => window.location.href = '/admin/ai-control-plane'}
                className="col-span-1 md:col-span-2 lg:col-span-4 bg-gradient-to-r from-blue-900/50 to-slate-900/50 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-blue-900/30 transition-colors group"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform">
                        <Shield className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Universal AI Control Plane</h3>
                        <p className="text-sm text-slate-400">Manage System Agents, Prompts, and Knowledge Bases</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-blue-400 font-medium">
                    Access Control Plane <Activity className="w-4 h-4" />
                </div>
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Gerenciar Usuários</h3>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar usuário..."
                            className="bg-[#0f172a] border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingUser(null);
                            reset({ role: 'Vendedor', status: 'active' });
                            setIsUserModalOpen(true);
                        }}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        + Novo Usuário
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-[#0f172a] text-slate-200 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Usuário</th>
                            <th className="px-6 py-4">Empresa</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Plano</th>
                            <th className="px-6 py-4">Data Registro</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">
                                    <div>{user.name}</div>
                                    <div className="text-xs text-slate-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-300">
                                    {user.tenant_name || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-primary-500/20 text-primary-400'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {user.status || 'active'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{user.plan || 'Free'}</td>
                                <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleEditUser(user)} className="text-primary-400 hover:text-primary-300 mr-3">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-300">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderSystem = () => (
        <div className="space-y-6">
            {/* Filas de Jobs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-white">Status da Fila de Jobs</h3>
                        <a
                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/admin/queues`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                        >
                            Ver Painel <Activity size={12} />
                        </a>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#0f172a] p-4 rounded-lg">
                            <div className="text-slate-400 text-sm">Pending Jobs</div>
                            <div className="text-2xl font-bold text-yellow-400">{queueStats?.stats?.pending || 0}</div>
                        </div>
                        <div className="bg-[#0f172a] p-4 rounded-lg">
                            <div className="text-slate-400 text-sm">Processing</div>
                            <div className="text-2xl font-bold text-primary-400">{queueStats?.stats?.processing || 0}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Falhas Recentes</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {queueStats?.recentFailures?.map((job: any) => (
                            <div key={job.id} className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <div className="text-red-400 font-medium">{job.type}</div>
                                    <div className="text-xs text-red-300/70">{job.error}</div>
                                </div>
                                <div className="text-xs text-slate-500">
                                    {new Date(job.updated_at).toLocaleString()}
                                </div>
                            </div>
                        ))}
                        {(!queueStats?.recentFailures || queueStats.recentFailures.length === 0) && (
                            <div className="text-slate-500 text-center py-4">Nenhuma falha recente. Sistema saudável! 🚀</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Monitoramento de Uso */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Uso por Tenant */}
                <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Uso por Empresa (Tenant)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-[#0f172a] text-slate-200">
                                <tr>
                                    <th className="p-3">Empresa</th>
                                    <th className="p-3 text-right">Total Posts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {systemUsage?.tenants?.map((t: any) => (
                                    <tr key={t.id}>
                                        <td className="p-3">{t.name}</td>
                                        <td className="p-3 text-right font-bold text-white">{t.total_posts}</td>
                                    </tr>
                                ))}
                                {(!systemUsage?.tenants || systemUsage.tenants.length === 0) && (
                                    <tr><td colSpan={2} className="p-4 text-center text-slate-500">Sem dados de uso.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Usuários */}
                <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Top Usuários (Uso)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-[#0f172a] text-slate-200">
                                <tr>
                                    <th className="p-3">Usuário</th>
                                    <th className="p-3">Empresa</th>
                                    <th className="p-3 text-right">Total Posts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {systemUsage?.users?.map((u: any) => (
                                    <tr key={u.id}>
                                        <td className="p-3">{u.name}</td>
                                        <td className="p-3 text-xs">{u.tenant_name || '-'}</td>
                                        <td className="p-3 text-right font-bold text-white">{u.total_posts}</td>
                                    </tr>
                                ))}
                                {(!systemUsage?.users || systemUsage.users.length === 0) && (
                                    <tr><td colSpan={3} className="p-4 text-center text-slate-500">Sem dados de uso.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row h-full bg-[#0f172a] text-white min-h-screen">
            {/* Mobile Nav */}
            <div className="md:hidden w-full bg-[#1e293b] border-b border-slate-700 overflow-x-auto shrink-0">
                <div className="p-4 border-b border-slate-700">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
                        Admin Panel
                    </h1>
                </div>
                <nav className="flex p-2 gap-2 min-w-max">
                    {ADMIN_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Sidebar Admin (Desktop) */}
            <div className="hidden md:flex w-64 bg-[#1e293b] border-r border-slate-700 flex-col shrink-0">
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
                        Admin Panel
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">SaaS Management</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {ADMIN_TABS.map(tab => (
                        <NavItem
                            key={tab.id}
                            active={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            icon={<tab.icon />}
                            label={tab.label}
                        />
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white">
                        {activeTab === 'overview' && 'Dashboard Overview'}
                        {activeTab === 'tenants' && 'Gestão de Clientes'}
                        {activeTab === 'users' && 'Gestão de Usuários'}
                        {activeTab === 'plans' && 'Planos e Assinaturas'}
                        {activeTab === 'system' && 'Monitoramento do Sistema'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-400">
                            Logado como <span className="text-white font-medium">{user?.name}</span>
                        </div>
                        <img src={user?.avatar_url || "https://github.com/shadcn.png"} alt="Admin" className="w-10 h-10 rounded-full border-2 border-primary-500" />
                        <button
                            onClick={logout}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Sair"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'tenants' && <div className="text-gray-900"><AdminTenants /></div>}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'system' && renderSystem()}
                {activeTab === 'plans' && <div className="text-gray-900"><AdminPlans /></div>}
            </div>

            {/* Modal de Edição de Usuário */}
            {isUserModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto text-gray-900">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                            </h3>
                            <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmitUser)} className="p-6 space-y-8">
                            {/* Informações Pessoais */}
                            <section>
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Users size={16} /> Informações Pessoais
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                                        <input
                                            {...register('firstName')}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-gray-900"
                                            placeholder="Primeiro nome"
                                        />
                                        {errors.firstName && <span className="text-red-500 text-xs">{errors.firstName.message}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome *</label>
                                        <input
                                            {...register('lastName')}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-gray-900"
                                            placeholder="Sobrenome"
                                        />
                                        {errors.lastName && <span className="text-red-500 text-xs">{errors.lastName.message}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                        <input
                                            {...register('username')}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-gray-900"
                                            placeholder="Ex: joaosilva (Opcional)"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                        <input
                                            {...register('email')}
                                            type="email"
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-gray-900"
                                            placeholder="email@empresa.com"
                                        />
                                        {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                        <input
                                            {...register('phone')}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-gray-900"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                                        <input
                                            {...register('cpf')}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-gray-900"
                                            placeholder="000.000.000-00"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Endereço */}
                            <section className="pt-6 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <MapPin size={16} /> Endereço
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                                        <input
                                            {...register('address.zip')}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-gray-900"
                                            placeholder="00000-000"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
                                        <input
                                            {...register('address.street')}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-gray-900"
                                            placeholder="Nome da rua"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                                        <input
                                            {...register('address.number')}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-gray-900"
                                            placeholder="123"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                                        <input
                                            {...register('address.complement')}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-gray-900"
                                            placeholder="Apto 101"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                                        <input
                                            {...register('address.district')}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-gray-900"
                                            placeholder="Bairro"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                                        <input
                                            {...register('address.city')}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-gray-900"
                                            placeholder="Cidade"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                        <input
                                            {...register('address.state')}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-gray-900"
                                            placeholder="UF"
                                            maxLength={2}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Empresa (Tenant) */}
                            <section className="pt-6 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Building size={16} /> Empresa (Tenant)
                                </h4>
                                <div>
                                    <select
                                        {...register('tenant_id')}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-gray-900"
                                    >
                                        <option value="">Sem empresa (Global)</option>
                                        {tenants.map(tenant => (
                                            <option key={tenant.id} value={String(tenant.id)}>{tenant.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </section>

                            {/* Permissões e Segurança */}
                            <section className="pt-6 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Shield size={16} /> Permissões e Segurança
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Função (Role)</label>
                                        <select
                                            {...register('role')}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-gray-900"
                                        >
                                            <option value="Vendedor">Vendedor</option>
                                            <option value="Gerente">Gerente</option>
                                            <option value="Admin">Admin</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            {...register('status')}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-gray-900"
                                        >
                                            <option value="active">Ativo</option>
                                            <option value="inactive">Inativo</option>
                                            <option value="suspended">Suspenso</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial'}
                                        </label>
                                        <div className="relative">
                                            <input
                                                {...register('newPassword')}
                                                type={showPassword ? 'text' : 'password'}
                                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none pr-10 text-gray-900"
                                                placeholder={editingUser ? '••••••••' : 'Senha segura'}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 sticky bottom-0 bg-white pb-2">
                                <button
                                    type="button"
                                    onClick={() => setIsUserModalOpen(false)}
                                    className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Salvar Usuário
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Components
const StatCard = ({ title, value, icon, subValue, trend, isAlert }: any) => (
    <div className={`bg-[#1e293b] p-6 rounded-xl border ${isAlert ? 'border-red-500/50' : 'border-slate-700'} hover:border-primary-500/50 transition-colors`}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <div className="text-slate-400 text-sm font-medium mb-1">{title}</div>
                <div className="text-3xl font-bold text-white">{value}</div>
            </div>
            <div className={`p-3 rounded-lg bg-[#0f172a] ${isAlert ? 'text-red-400' : ''}`}>
                {icon}
            </div>
        </div>
        {(subValue || trend) && (
            <div className="flex items-center text-xs">
                {trend && <span className="text-green-400 font-medium mr-2">{trend}</span>}
                {subValue && <span className="text-slate-500">{subValue}</span>}
            </div>
        )}
    </div>
);

const NavItem = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active
            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
    >
        {React.cloneElement(icon, { className: "w-5 h-5" })}
        <span className="font-medium">{label}</span>
    </button>
);

export default AdminDashboard;
