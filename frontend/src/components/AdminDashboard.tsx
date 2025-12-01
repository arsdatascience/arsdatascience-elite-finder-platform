import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminPlans } from './AdminPlans';
import { AdminTenants } from './AdminTenants';
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
    Building
} from 'lucide-react';

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
    email: string;
    role: string;
    status: string;
    plan?: string;
    created_at: string;
}

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);

    // Fetch Data
    useEffect(() => {
        fetchQueueStats();
        fetchUsers();
    }, []);

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
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
            const data = await res.json();
            if (Array.isArray(data)) setUsers(data);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        }
    };

    // Renderers
    const renderOverview = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
                title="Total Usuários"
                value={users.length.toString()}
                icon={<Users className="w-6 h-6 text-blue-400" />}
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
        </div>
    );

    const renderUsers = () => (
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Gerenciar Usuários</h3>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar usuário..."
                        className="bg-[#0f172a] border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-[#0f172a] text-slate-200 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Usuário</th>
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
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
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
                                    <button className="text-blue-400 hover:text-blue-300 mr-3"><Edit className="w-4 h-4" /></button>
                                    <button className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
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
            <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Status da Fila de Jobs</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0f172a] p-4 rounded-lg">
                        <div className="text-slate-400 text-sm">Pending Jobs</div>
                        <div className="text-2xl font-bold text-yellow-400">{queueStats?.stats?.pending || 0}</div>
                    </div>
                    <div className="bg-[#0f172a] p-4 rounded-lg">
                        <div className="text-slate-400 text-sm">Processing</div>
                        <div className="text-2xl font-bold text-blue-400">{queueStats?.stats?.processing || 0}</div>
                    </div>
                </div>
            </div>

            <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Falhas Recentes</h3>
                <div className="space-y-3">
                    {queueStats?.recentFailures.map(job => (
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
    );

    return (
        <div className="flex h-full bg-[#0f172a] text-white min-h-screen">
            {/* Sidebar Admin */}
            <div className="w-64 bg-[#1e293b] border-r border-slate-700 flex flex-col">
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Admin Panel
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">SaaS Management</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard />} label="Visão Geral" />
                    <NavItem active={activeTab === 'tenants'} onClick={() => setActiveTab('tenants')} icon={<Building />} label="Clientes (Tenants)" />
                    <NavItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users />} label="Usuários" />
                    <NavItem active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} icon={<CreditCard />} label="Planos & Limites" />
                    <NavItem active={activeTab === 'system'} onClick={() => setActiveTab('system')} icon={<Activity />} label="Sistema & Logs" />
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
                        <img src={user?.avatar_url || "https://github.com/shadcn.png"} alt="Admin" className="w-10 h-10 rounded-full border-2 border-blue-500" />
                    </div>
                </header>

                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'tenants' && <div className="text-gray-900"><AdminTenants /></div>}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'system' && renderSystem()}
                {activeTab === 'plans' && <div className="text-gray-900"><AdminPlans /></div>}
            </div>
        </div>
    );
};

// Helper Components
const StatCard = ({ title, value, icon, subValue, trend, isAlert }: any) => (
    <div className={`bg-[#1e293b] p-6 rounded-xl border ${isAlert ? 'border-red-500/50' : 'border-slate-700'} hover:border-blue-500/50 transition-colors`}>
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
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
    >
        {React.cloneElement(icon, { className: "w-5 h-5" })}
        <span className="font-medium">{label}</span>
    </button>
);

export default AdminDashboard;
