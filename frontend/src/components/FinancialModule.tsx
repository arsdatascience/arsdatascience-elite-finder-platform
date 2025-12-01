// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

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
    notes?: string;
}

interface DashboardData {
    summary: {
        total_income: number;
        total_expense: number;
        pending_income: number;
        pending_expense: number;
    };
    cashFlow: any[];
    categoryExpenses: any[];
}

export const FinancialModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'settings'>('dashboard');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filtros
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Novo estado para criação
    const [categories, setCategories] = useState<any[]>([]);
    const [newTransaction, setNewTransaction] = useState({
        description: '',
        amount: 0,
        type: 'expense',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'paid'
    });

    useEffect(() => {
        fetchDashboard();
        fetchCategories();
        if (activeTab === 'transactions') fetchTransactions();
    }, [activeTab, dateRange]);

    const fetchDashboard = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/financial/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setDashboardData(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/financial/transactions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setTransactions(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
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
                    date: new Date().toISOString().split('T')[0],
                    status: 'paid'
                });
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
        // const doc = new jsPDF();
        // ... (código comentado)
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Wallet className="text-blue-600" /> Gestão Financeira
                    </h1>
                    <p className="text-slate-500">Controle completo de receitas, despesas e fluxo de caixa.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                        <BarChart3 size={18} className="inline mr-2" /> Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'transactions' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                        <DollarSign size={18} className="inline mr-2" /> Transações
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                        <Tag size={18} className="inline mr-2" /> Categorias
                    </button>
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
                                        <td colSpan={6} className="p-8 text-center text-slate-500">
                                            Nenhuma transação encontrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Placeholder for Settings */}
            {activeTab === 'settings' && (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                    <Tag size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">Gerenciar Categorias</h3>
                    <p className="text-slate-500 mb-6">Configure seu plano de contas e centros de custo.</p>
                    <button className="text-blue-600 font-medium hover:underline">Em breve...</button>
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
                                        onChange={e => setNewTransaction({ ...newTransaction, type: e.target.value as any })}
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
                                        onChange={e => setNewTransaction({ ...newTransaction, status: e.target.value as any })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                    >
                                        <option value="paid">Pago</option>
                                        <option value="pending">Pendente</option>
                                    </select>
                                </div>
                            </div>

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
        </div>
    );
};
