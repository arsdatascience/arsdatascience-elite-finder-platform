import React, { useState, useEffect } from 'react';
import {
    DollarSign, Plus,
    ArrowUpCircle, ArrowDownCircle, Edit2,
    BarChart3, Wallet, Tag, FileText, Loader2, Users
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

interface Transaction {
    id: number;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    category_name: string;
    category_color: string;
    supplier_name?: string;
    client_name?: string;
    notes?: string;
}

interface Category {
    id: number;
    name: string;
    type: 'income' | 'expense';
    color: string;
}

interface Client {
    id: number;
    name: string;
}

interface DashboardData {
    summary: {
        total_income: number;
        total_expense: number;
        pending_income: number;
        pending_expense: number;
    };
    cashFlow: { day: string; income: number; expense: number }[];
    categoryExpenses: { name: string; value: number; color: string }[];
    clientExpenses: { name: string; value: number }[];
}

interface NewTransactionState {
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category_id: string;
    client_id: string;
    date: string;
    status: 'pending' | 'paid';
}

export const FinancialModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'settings'>('dashboard');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filtros
    const [selectedClient, setSelectedClient] = useState<string>('');
    // const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const [categories, setCategories] = useState<Category[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    const [newTransaction, setNewTransaction] = useState<NewTransactionState>({
        description: '',
        amount: 0,
        type: 'expense',
        category_id: '',
        client_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'paid'
    });

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState({
        name: '',
        type: 'expense' as 'income' | 'expense',
        color: '#ef4444'
    });

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchDashboard(),
                fetchCategories(),
                fetchClients(),
                activeTab === 'transactions' ? fetchTransactions() : Promise.resolve()
            ]);
            setLoading(false);
        };
        loadData();
    }, [activeTab, selectedClient]); // Recarrega quando muda a aba ou o cliente selecionado

    const fetchDashboard = async () => {
        const token = localStorage.getItem('token');
        try {
            let url = `${import.meta.env.VITE_API_URL}/api/financial/dashboard`;
            if (selectedClient) {
                url += `?client_id=${selectedClient}`;
            }
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setDashboardData(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchTransactions = async () => {
        const token = localStorage.getItem('token');
        try {
            let url = `${import.meta.env.VITE_API_URL}/api/financial/transactions`;
            if (selectedClient) {
                url += `?client_id=${selectedClient}`;
            }
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setTransactions(data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchCategories = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/financial/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setCategories(data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchClients = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/financial/clients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setClients(data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveTransaction = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/financial/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newTransaction)
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchTransactions();
                fetchDashboard();
                setNewTransaction({
                    description: '',
                    amount: 0,
                    type: 'expense',
                    category_id: '',
                    client_id: '',
                    date: new Date().toISOString().split('T')[0],
                    status: 'paid'
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveCategory = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/financial/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newCategory)
            });
            if (res.ok) {
                setIsCategoryModalOpen(false);
                fetchCategories();
                setNewCategory({ name: '', type: 'expense', color: '#ef4444' });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const exportToPDF = () => {
        alert("Para habilitar a exportação, instale: npm install jspdf jspdf-autotable");
    };

    if (loading && !dashboardData && transactions.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Wallet className="text-blue-600" /> Gestão Financeira
                    </h1>
                    <p className="text-slate-500">Controle completo de receitas, despesas e fluxo de caixa.</p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    {/* Filtro de Cliente */}
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                        <Users size={16} className="text-slate-500" />
                        <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className="bg-transparent text-slate-600 text-sm focus:outline-none min-w-[150px]"
                        >
                            <option value="">Todos os Clientes</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <BarChart3 size={16} className="inline mr-2" /> Visão Geral
                        </button>
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'transactions' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <DollarSign size={16} className="inline mr-2" /> Transações
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Tag size={16} className="inline mr-2" /> Categorias
                        </button>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            {activeTab === 'dashboard' && dashboardData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Receita Total (Pago)</p>
                                    <h3 className="text-2xl font-bold text-green-600">{formatCurrency(dashboardData.summary.total_income)}</h3>
                                </div>
                                <div className="p-2 bg-green-50 rounded-lg text-green-600"><ArrowUpCircle size={24} /></div>
                            </div>
                            <p className="text-xs text-slate-400">Pendente: {formatCurrency(dashboardData.summary.pending_income)}</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Despesa Total (Pago)</p>
                                    <h3 className="text-2xl font-bold text-red-600">{formatCurrency(dashboardData.summary.total_expense)}</h3>
                                </div>
                                <div className="p-2 bg-red-50 rounded-lg text-red-600"><ArrowDownCircle size={24} /></div>
                            </div>
                            <p className="text-xs text-slate-400">Pendente: {formatCurrency(dashboardData.summary.pending_expense)}</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Saldo (Caixa)</p>
                                    <h3 className={`text-2xl font-bold ${dashboardData.summary.total_income - dashboardData.summary.total_expense >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                        {formatCurrency(dashboardData.summary.total_income - dashboardData.summary.total_expense)}
                                    </h3>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Wallet size={24} /></div>
                            </div>
                            <p className="text-xs text-slate-400">Lucratividade: {dashboardData.summary.total_income > 0 ? ((dashboardData.summary.total_income - dashboardData.summary.total_expense) / dashboardData.summary.total_income * 100).toFixed(1) : 0}%</p>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Fluxo de Caixa */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Fluxo de Caixa (Diário)</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dashboardData.cashFlow}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="day" tick={{ fontSize: 12 }} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })} />
                                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `R$${val / 1000}k`} />
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="income" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Despesas por Categoria */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Despesas por Categoria</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dashboardData.categoryExpenses}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {dashboardData.categoryExpenses.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || '#cbd5e1'} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Despesas por Cliente (Novo) */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Despesas por Cliente</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dashboardData.clientExpenses} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis type="number" tickFormatter={(val) => `R$${val / 1000}k`} />
                                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        />
                                        <Bar dataKey="value" name="Despesas" fill="#f97316" radius={[0, 4, 4, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Transactions List */}
            {activeTab === 'transactions' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800">Histórico de Transações</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={exportToPDF}
                                className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                            >
                                <FileText size={18} /> Exportar PDF
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} /> Nova Transação
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Descrição</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Categoria</th>
                                    <th className="p-4">Valor</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {transactions.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="p-4 font-medium text-slate-900">{t.description}</td>
                                        <td className="p-4 text-slate-600">{t.client_name || '-'}</td>
                                        <td className="p-4">
                                            <span
                                                className="px-2 py-1 rounded text-xs font-bold text-white"
                                                style={{ backgroundColor: t.category_color || '#cbd5e1' }}
                                            >
                                                {t.category_name}
                                            </span>
                                        </td>
                                        <td className={`p-4 font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold capitalize
                                ${t.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                    t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        t.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                                                }`}
                                            >
                                                {t.status === 'paid' ? 'Pago' : t.status === 'pending' ? 'Pendente' : t.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="text-slate-400 hover:text-blue-600 p-1"><Edit2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500">
                                            Nenhuma transação encontrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Settings Tab - Gerenciar Categorias */}
            {activeTab === 'settings' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Plano de Contas</h3>
                            <p className="text-sm text-slate-500">Gerencie as categorias de receitas e despesas.</p>
                        </div>
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Plus size={18} /> Nova Categoria
                        </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Receitas */}
                        <div>
                            <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <ArrowUpCircle className="text-green-500" size={20} /> Categorias de Receita
                            </h4>
                            <div className="space-y-2">
                                {categories.filter(c => c.type === 'income').map(c => (
                                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }}></div>
                                            <span className="font-medium text-slate-700">{c.name}</span>
                                        </div>
                                        <button className="text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                                    </div>
                                ))}
                                {categories.filter(c => c.type === 'income').length === 0 && (
                                    <p className="text-sm text-slate-400 italic">Nenhuma categoria cadastrada.</p>
                                )}
                            </div>
                        </div>

                        {/* Despesas */}
                        <div>
                            <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <ArrowDownCircle className="text-red-500" size={20} /> Categorias de Despesa
                            </h4>
                            <div className="space-y-2">
                                {categories.filter(c => c.type === 'expense').map(c => (
                                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }}></div>
                                            <span className="font-medium text-slate-700">{c.name}</span>
                                        </div>
                                        <button className="text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                                    </div>
                                ))}
                                {categories.filter(c => c.type === 'expense').length === 0 && (
                                    <p className="text-sm text-slate-400 italic">Nenhuma categoria cadastrada.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Nova Transação */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Nova Transação</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                                <input
                                    value={newTransaction.description}
                                    onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                    placeholder="Ex: Pagamento Google Ads"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        value={newTransaction.amount}
                                        onChange={e => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                                    <input
                                        type="date"
                                        value={newTransaction.date}
                                        onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                    <select
                                        value={newTransaction.type}
                                        onChange={e => setNewTransaction({ ...newTransaction, type: e.target.value as 'income' | 'expense' })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                    >
                                        <option value="income">Receita</option>
                                        <option value="expense">Despesa</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select
                                        value={newTransaction.status}
                                        onChange={e => setNewTransaction({ ...newTransaction, status: e.target.value as 'paid' | 'pending' })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                    >
                                        <option value="paid">Pago</option>
                                        <option value="pending">Pendente</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                    <select
                                        value={newTransaction.category_id}
                                        onChange={e => setNewTransaction({ ...newTransaction, category_id: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                    >
                                        <option value="">Selecione...</option>
                                        {categories
                                            .filter(c => c.type === newTransaction.type)
                                            .map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Cliente (Opcional)</label>
                                    <select
                                        value={newTransaction.client_id}
                                        onChange={e => setNewTransaction({ ...newTransaction, client_id: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                    >
                                        <option value="">Selecione...</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveTransaction}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Salvar Transação
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Nova Categoria */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Nova Categoria</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Categoria</label>
                                <input
                                    value={newCategory.name}
                                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                    placeholder="Ex: Consultoria, Marketing..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                <select
                                    value={newCategory.type}
                                    onChange={e => setNewCategory({ ...newCategory, type: e.target.value as 'income' | 'expense' })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                >
                                    <option value="income">Receita</option>
                                    <option value="expense">Despesa</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cor</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#64748b'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setNewCategory({ ...newCategory, color })}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${newCategory.color === color ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveCategory}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
