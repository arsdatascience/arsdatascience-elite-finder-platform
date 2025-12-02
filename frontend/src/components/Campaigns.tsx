import React, { useState, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  Download, TrendingUp, DollarSign, MousePointer,
  Eye, Target, Layers, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

interface Campaign {
  id: number;
  name: string;
  platform: string;
  status: string;
  spend: string;
  impressions: string;
  clicks: string;
  conversions: string;
  revenue: string;
}

interface KPI {
  total_spend: string;
  total_impressions: string;
  total_clicks: string;
  total_conversions: string;
  total_revenue: string;
}

export const Campaigns: React.FC = () => {
  // State for Filters
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['google', 'meta', 'youtube', 'linkedin']);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // State for Data
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [platformData, setPlatformData] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // Fetch Clients
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/clients`)
      .then(res => res.json())
      .then(data => {
        setClients(data);
        // if (data.length > 0) setSelectedClient(data[0].id); // Removido para padrão ser Todos
      })
      .catch(err => console.error('Erro ao buscar clientes:', err));
  }, []);

  // Fetch Analytics
  useEffect(() => {
    // if (!selectedClient) return; // Removido para permitir busca global

    setLoading(true);
    const queryParams = new URLSearchParams({
      clientId: selectedClient,
      startDate: dateRange.start,
      endDate: dateRange.end,
      platforms: selectedPlatforms.join(',')
    });

    fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/analytics?${queryParams}`)
      .then(res => res.json())
      .then(data => {
        setKpis(data.kpis);
        setChartData(data.chartData.map((item: any) => ({
          ...item,
          spend: Number(item.spend),
          revenue: Number(item.revenue),
          impressions: Number(item.impressions),
          clicks: Number(item.clicks),
          conversions: Number(item.conversions)
        })));
        setPlatformData(data.platformData.map((item: any) => ({
          ...item,
          spend: Number(item.spend),
          revenue: Number(item.revenue),
          conversions: Number(item.conversions)
        })));
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Target className="text-blue-600" /> Gestão de Campanhas
          </h1>
          <p className="text-gray-500 mt-1">Acompanhe o desempenho de suas campanhas em tempo real.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          {/* Client Selector */}
          <div className="relative">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <option value="">Todos os Clientes (Visão Global)</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-1"></div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Platform Filters */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {['google', 'meta', 'youtube', 'linkedin'].map(platform => (
          <button
            key={platform}
            onClick={() => togglePlatform(platform)}
            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${selectedPlatforms.includes(platform)
              ? platform === 'google' ? 'bg-blue-100 text-blue-700 border-blue-200 border' :
                platform === 'meta' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 border' :
                  platform === 'youtube' ? 'bg-red-100 text-red-700 border-red-200 border' :
                    'bg-cyan-100 text-cyan-700 border-cyan-200 border'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            <div className={`w-2 h-2 rounded-full ${selectedPlatforms.includes(platform) ? 'bg-current' : 'bg-gray-300'}`}></div>
            {platform.charAt(0).toUpperCase() + platform.slice(1)} Ads
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <KpiCard
          title="Investimento Total"
          value={formatCurrency(kpis?.total_spend || 0)}
          icon={<DollarSign size={20} className="text-blue-600" />}
          trend="+12.5%"
          trendUp={true}
          color="blue"
        />
        <KpiCard
          title="Impressões"
          value={formatNumber(kpis?.total_impressions || 0)}
          icon={<Eye size={20} className="text-purple-600" />}
          trend="+5.2%"
          trendUp={true}
          color="purple"
        />
        <KpiCard
          title="Cliques"
          value={formatNumber(kpis?.total_clicks || 0)}
          icon={<MousePointer size={20} className="text-orange-600" />}
          trend="-2.1%"
          trendUp={false}
          color="orange"
        />
        <KpiCard
          title="Conversões"
          value={formatNumber(kpis?.total_conversions || 0)}
          icon={<Target size={20} className="text-green-600" />}
          trend="+8.4%"
          trendUp={true}
          color="green"
        />
        <KpiCard
          title="ROAS Médio"
          value={`${Number(kpis?.total_spend) > 0 ? (Number(kpis?.total_revenue) / Number(kpis?.total_spend)).toFixed(2) : '0.00'}x`}
          icon={<TrendingUp size={20} className="text-indigo-600" />}
          trend="+0.5x"
          trendUp={true}
          color="indigo"
        />
      </div>

      {/* AI Insight Section */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Layers size={100} className="text-blue-600" />
        </div>
        <div className="relative z-10">
          <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" /> Análise Estratégica da IA
          </h3>
          <div className="text-sm text-blue-800 leading-relaxed">
            {isLoadingInsight ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analisando performance das campanhas e gerando insights...</span>
              </div>
            ) : (
              aiInsightData?.insight || "Aguardando dados suficientes para gerar insights estratégicos."
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-gray-400" /> Evolução de Investimento vs. Receita
          </h3>
          <div className="h-80 w-full min-h-[320px]">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(val) => `R$ ${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: any) => [`R$ ${Number(value || 0).toFixed(2)}`, '']}
                />
                <Legend />
                <Area type="monotone" dataKey="spend" name="Investimento" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
                <Area type="monotone" dataKey="revenue" name="Receita" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Layers size={20} className="text-gray-400" /> Share por Plataforma
          </h3>
          <div className="h-80 w-full min-h-[320px]">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="spend"
                  nameKey="platform"
                  label={({ cx, cy, midAngle, outerRadius, percent, name }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 25;
                    const angle = (midAngle || 0);
                    const x = cx + radius * Math.cos(-angle * RADIAN);
                    const y = cy + radius * Math.sin(-angle * RADIAN);
                    return (
                      <text x={x} y={y} fill="#374151" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight="bold">
                        {`${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      </text>
                    );
                  }}
                >
                  {platformData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `R$ ${Number(value || 0).toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Detalhamento de Campanhas</h3>
          <button className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700">
            <Download size={16} /> Exportar Relatório
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Campanha</th>
                <th className="px-6 py-4 font-semibold">Plataforma</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Investimento</th>
                <th className="px-6 py-4 font-semibold text-right">Impr.</th>
                <th className="px-6 py-4 font-semibold text-right">Cliques</th>
                <th className="px-6 py-4 font-semibold text-right">Conv.</th>
                <th className="px-6 py-4 font-semibold text-right">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{camp.name}</div>
                    <div className="text-xs text-gray-400">ID: {camp.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${camp.platform === 'google' ? 'bg-blue-50 text-blue-700' :
                      camp.platform === 'meta' ? 'bg-indigo-50 text-indigo-700' :
                        camp.platform === 'youtube' ? 'bg-red-50 text-red-700' :
                          'bg-cyan-50 text-cyan-700'
                      }`}>
                      {camp.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> Ativa
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(camp.spend)}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{formatNumber(camp.impressions)}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{formatNumber(camp.clicks)}</td>
                  <td className="px-6 py-4 text-right font-medium text-blue-600">{formatNumber(camp.conversions)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${Number(camp.revenue) / Number(camp.spend) >= 4 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {(Number(camp.revenue) / (Number(camp.spend) || 1)).toFixed(2)}x
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon, trend, trendUp, color }: any) => (
  <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-${color}-500`}>
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2 rounded-lg bg-${color}-50`}>
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
        {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trend}
      </div>
    </div>
    <p className="text-sm text-gray-500 mb-1">{title}</p>
    <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
  </div>
);
