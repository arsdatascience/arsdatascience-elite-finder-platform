import React, { useState, useEffect } from 'react';
import {
    Wallet, TrendingUp, TrendingDown, Calendar, Download, Filter,
    Plus, Search, Trash2, Edit2, X, Check, ChevronDown, ChevronUp,
    ArrowUpCircle, ArrowDownCircle, DollarSign, BarChart3, Tag, Users,
    Loader2
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Transaction {
    id: string;
    description: string;
    amount: number | string;
    type: 'income' | 'expense';
    category_id: number;
    category_name: string;
    category_color: string;
    client_id?: number;
    client_name?: string;
    date: string;
    status: 'paid' | 'pending' | 'overdue' | 'cancelled';
    payment_method?: string;
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

const FinancialModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'settings'>('dashboard');
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    // Filtros
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    });
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // Modal e Edição
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newTransaction, setNewTransaction] = useState({
        description: '',
        amount: 0,
        type: 'expense' as 'income' | 'expense',
        category_id: '',
        client_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'paid'
    });

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
    const [newCategory, setNewCategory] = useState({
        name: '',
        type: 'expense' as 'income' | 'expense',
        color: '#ef4444'
    });

    useEffect(() => {
        fetchDashboard();
        fetchTransactions();
        fetchCategories();
        fetchClients();
    }, [dateRange, selectedClient, selectedCategory]);

    useEffect(() => {
        if (dashboardData || transactions.length > 0) {
            setLoading(false);
        }
    }, [dashboardData, transactions]);

    const fetchDashboard = async () => {
        const token = localStorage.getItem('token');
        try {
            const params = new URLSearchParams();
            if (selectedClient) params.append('client_id', selectedClient);
            if (selectedCategory) params.append('category_id', selectedCategory);
            if (dateRange.start) params.append('startDate', dateRange.start);
            if (dateRange.end) params.append('endDate', dateRange.end);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/financial/dashboard?${params.toString()}`, {
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
            const params = new URLSearchParams();
            if (selectedClient) params.append('client_id', selectedClient);
            if (selectedCategory) params.append('category_id', selectedCategory);
            if (dateRange.start) params.append('startDate', dateRange.start);
            if (dateRange.end) params.append('endDate', dateRange.end);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/financial/transactions?${params.toString()}`, {
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

    const handleEditTransaction = (transaction: Transaction) => {
        setEditingId(transaction.id);
        setNewTransaction({
            description: transaction.description,
            amount: Number(transaction.amount),
            type: transaction.type,
            category_id: transaction.category_id ? String(transaction.category_id) : '',
            client_id: transaction.client_id ? String(transaction.client_id) : '',
            date: transaction.date.split('T')[0],
            status: transaction.status === 'overdue' || transaction.status === 'cancelled' ? 'pending' : transaction.status
        });
        setIsModalOpen(true);
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategoryId(category.id);
        setNewCategory({
            name: category.name,
            type: category.type,
            color: category.color
        });
        setIsCategoryModalOpen(true);
    };

    const handleSaveTransaction = async () => {
        const token = localStorage.getItem('token');
        try {
            const url = editingId
                ? `${import.meta.env.VITE_API_URL}/api/financial/transactions/${editingId}`
                : `${import.meta.env.VITE_API_URL}/api/financial/transactions`;

            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newTransaction)
            });
            if (res.ok) {
                setIsModalOpen(false);
                setEditingId(null);
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
            const url = editingCategoryId
                ? `${import.meta.env.VITE_API_URL}/api/financial/categories/${editingCategoryId}`
                : `${import.meta.env.VITE_API_URL}/api/financial/categories`;

            const method = editingCategoryId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newCategory)
            });
            if (res.ok) {
                setIsCategoryModalOpen(false);
                setEditingCategoryId(null);
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

    const exportDashboardToPDF = async () => {
        const element = document.getElementById('financial-dashboard-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#f8fafc' // bg-slate-50
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`relatorio-financeiro-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Erro ao gerar PDF. Tente novamente.");
        }
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
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Wallet className="text-blue-600" /> Gestão Financeira <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">v3.0</span>
                    </h1>
                    <p className="text-slate-500">Controle completo de receitas, despesas e fluxo de caixa.</p>
                </div>

                <div className="flex flex-wrap gap-2 items-center w-full xl:w-auto">
                    {/* Filtros */}
                    <div className="flex flex-wrap gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 px-2 border-r border-slate-200">
                            <Calendar size={16} className="text-slate-400" />
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                onClick={(e) => e.currentTarget.showPicker()}
                                className="text-xs text-slate-600 focus:outline-none cursor-pointer min-w-[110px]"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                onClick={(e) => e.currentTarget.showPicker()}
                                className="text-xs text-slate-600 focus:outline-none cursor-pointer min-w-[110px]"
                            />
                        </div>

                        <div className="flex items-center gap-2 px-2 border-r border-slate-200">
                            <Users size={16} className="text-slate-400" />
                            <select
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className="bg-transparent text-slate-600 text-xs focus:outline-none min-w-[100px]"
                            >
                                <option value="">Todos Clientes</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-2">
                            <Filter size={16} className="text-slate-400" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-transparent text-slate-600 text-xs focus:outline-none min-w-[100px]"
                            >
                                <option value="">Todas Categorias</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <BarChart3 size={14} className="inline mr-1" /> Visão Geral
                        </button>
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${activeTab === 'transactions' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <DollarSign size={14} className="inline mr-1" /> Transações
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Tag size={14} className="inline mr-1" /> Categorias
                        </button>
                    </div>

                    {/* Export Button (Only visible on dashboard) */}
                    {activeTab === 'dashboard' && (
                        <button
                            onClick={exportDashboardToPDF}
                            className="bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2 text-xs font-medium shadow-sm"
                        >
                            <Download size={14} /> PDF
                        </button>
                    )}
                </div>
            </div>

            {/* Dashboard Content */}
            {activeTab === 'dashboard' && dashboardData && (
                <div id="financial-dashboard-content" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-2">
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

                    {/* Charts Column - Stacked Vertical Layout */}
                    <div className="grid grid-cols-1 gap-6">

                        {/* 1. Despesas por Cliente */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Despesas por Cliente</h3>
                            <div style={{ width: '100%', height: 320, minWidth: 0 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={dashboardData.clientExpenses && dashboardData.clientExpenses.length > 0 ? dashboardData.clientExpenses : [{ name: 'Sem dados', value: 0 }]}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis type="number" tickFormatter={(val) => `R$${val / 1000}k`} />
                                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        />
                                        <Bar dataKey="value" name="Despesas" radius={[0, 4, 4, 0]} barSize={30}>
                                            {
                                                (dashboardData.clientExpenses && dashboardData.clientExpenses.length > 0 ? dashboardData.clientExpenses : [{ name: 'Sem dados', value: 0 }]).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#6366f1', '#14b8a6'][index % 10]} />
                                                ))
                                            }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. Despesas por Categoria */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Despesas por Categoria</h3>
                            <div style={{ width: '100%', height: 400, minWidth: 0 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dashboardData.categoryExpenses && dashboardData.categoryExpenses.length > 0 ? dashboardData.categoryExpenses.map(d => ({ ...d, value: Number(d.value) })) : [{ name: 'Sem dados', value: 1, color: '#e2e8f0' }]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="name"
                                        >
                                            {(dashboardData.categoryExpenses && dashboardData.categoryExpenses.length > 0 ? dashboardData.categoryExpenses : [{ name: 'Sem dados', value: 1, color: '#e2e8f0' }]).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || '#cbd5e1'} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => typeof value === 'number' ? formatCurrency(value) : value} />
                                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 3. Fluxo de Caixa (Diário) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Fluxo de Caixa (Diário)</h3>
                            <div style={{ width: '100%', height: 320, minWidth: 0 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dashboardData.cashFlow && dashboardData.cashFlow.length > 0 ? dashboardData.cashFlow.map(d => ({ ...d, income: Number(d.income), expense: Number(d.expense) })) : [{ day: new Date().toISOString(), income: 0, expense: 0 }]}>
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
                                onClick={() => {
                                    setEditingId(null);
                                    setNewTransaction({
                                        description: '',
                                        amount: 0,
                                        type: 'expense',
                                        category_id: '',
                                        client_id: '',
                                        date: new Date().toISOString().split('T')[0],
                                        status: 'paid'
                                    });
                                    setIsModalOpen(true);
                                }}
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
                                            <button
                                                onClick={() => handleEditTransaction(t)}
                                                className="text-slate-400 hover:text-blue-600 p-1"
                                            >
                                                <Edit2 size={16} />
                                            </button>
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
                            onClick={() => {
                                setEditingCategoryId(null);
                                setNewCategory({ name: '', type: 'expense', color: '#ef4444' });
                                setIsCategoryModalOpen(true);
                            }}
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
                                        <button
                                            onClick={() => handleEditCategory(c)}
                                            className="text-slate-400 hover:text-blue-600"
                                        >
                                            <Edit2 size={16} />
                                        </button>
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
                                        <button
                                            onClick={() => handleEditCategory(c)}
                                            className="text-slate-400 hover:text-blue-600"
                                        >
                                            <Edit2 size={16} />
                                        </button>
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

            {/* Modal de Transação */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">
                                {editingId ? 'Editar Transação' : 'Nova Transação'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                                        className={`p-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${newTransaction.type === 'income' ? 'bg-green-50 border-green-200 text-green-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <ArrowUpCircle size={16} /> Receita
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                                        className={`p-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${newTransaction.type === 'expense' ? 'bg-red-50 border-red-200 text-red-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <ArrowDownCircle size={16} /> Despesa
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    value={newTransaction.description}
                                    onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="Ex: Consultoria de Marketing"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newTransaction.amount}
                                        onChange={e => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) })}
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Data</label>
                                    <input
                                        type="date"
                                        value={newTransaction.date}
                                        onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Categoria</label>
                                <select
                                    value={newTransaction.category_id}
                                    onChange={e => setNewTransaction({ ...newTransaction, category_id: e.target.value })}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="">Selecione...</option>
                                    {categories.filter(c => c.type === newTransaction.type).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Cliente (Opcional)</label>
                                <select
                                    value={newTransaction.client_id}
                                    onChange={e => setNewTransaction({ ...newTransaction, client_id: e.target.value })}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="">Selecione...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={newTransaction.status}
                                    onChange={e => setNewTransaction({ ...newTransaction, status: e.target.value as any })}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="paid">Pago</option>
                                    <option value="pending">Pendente</option>
                                </select>
                            </div>

                            <button
                                onClick={handleSaveTransaction}
                                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-2"
                            >
                                Salvar Transação
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Categoria */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">
                                {editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}
                            </h3>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewCategory({ ...newCategory, type: 'income' })}
                                        className={`p-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${newCategory.type === 'income' ? 'bg-green-50 border-green-200 text-green-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <ArrowUpCircle size={16} /> Receita
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewCategory({ ...newCategory, type: 'expense' })}
                                        className={`p-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${newCategory.type === 'expense' ? 'bg-red-50 border-red-200 text-red-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <ArrowDownCircle size={16} /> Despesa
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Nome da Categoria</label>
                                <input
                                    type="text"
                                    value={newCategory.name}
                                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="Ex: Marketing, Vendas, etc."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Cor</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'].map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setNewCategory({ ...newCategory, color })}
                                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${newCategory.color === color ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleSaveCategory}
                                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-2"
                            >
                                Salvar Categoria
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialModule;
