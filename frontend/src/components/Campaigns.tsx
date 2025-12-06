import React, { useState, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, DollarSign, MousePointer,
  Eye, Target, Layers, ArrowUpRight, ArrowDownRight, Loader2,
  LayoutGrid, List as ListIcon, Table as TableIcon, FileText, FileSpreadsheet
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { CampaignModal } from './CampaignModal';

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
  created_at: string;
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
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'table'>('table');

  // State for Data
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [platformData, setPlatformData] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // State for Modal
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper Functions
  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  };

  const formatNumber = (value: string | number) => {
    return new Intl.NumberFormat('pt-BR').format(Number(value));
  };

  // Fetch Clients
  useEffect(() => {
    apiClient.clients.getClients()
      .then(data => {
        if (Array.isArray(data)) {
          setClients(data);
        } else {
          setClients([]);
        }
      })
      .catch(err => {
        console.error('Erro ao buscar clientes:', err);
        setClients([]);
      });
  }, []);

  // Fetch Analytics
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await apiClient.campaigns.getCampaignAnalytics(
          selectedClient,
          dateRange.start,
          dateRange.end,
          selectedPlatforms.join(',')
        );

        if (data) {
          setKpis(data.kpis || null);
          setChartData((data.chartData || []).map((item: any) => ({
            ...item,
            spend: Number(item.spend || 0),
            revenue: Number(item.revenue || 0),
            impressions: Number(item.impressions || 0),
            clicks: Number(item.clicks || 0),
            conversions: Number(item.conversions || 0)
          })));
          setPlatformData((data.platformData || []).map((item: any) => ({
            ...item,
            spend: Number(item.spend || 0),
            revenue: Number(item.revenue || 0),
            conversions: Number(item.conversions || 0)
          })));
          setCampaigns(data.campaigns || []);
        }
      } catch (err) {
        console.error('Erro ao buscar analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedClient, selectedPlatforms, dateRange]);

  // Prepare KPIs for AI Insight
  const formattedKPIs = kpis ? [
    { label: 'Investimento Total', value: formatCurrency(kpis.total_spend), trend: 'up', change: 12.5 },
    { label: 'Impressões', value: formatNumber(kpis.total_impressions), trend: 'up', change: 5.2 },
    { label: 'Cliques', value: formatNumber(kpis.total_clicks), trend: 'down', change: -2.1 },
    { label: 'Conversões', value: formatNumber(kpis.total_conversions), trend: 'up', change: 8.4 },
    { label: 'ROAS', value: `${Number(kpis.total_spend) > 0 ? (Number(kpis.total_revenue) / Number(kpis.total_spend)).toFixed(2) : '0.00'}x`, trend: 'up', change: 0.5 }
  ] : [];

  // AI Insight Query
  const { data: aiInsightData, isLoading: isLoadingInsight } = useQuery({
    queryKey: ['aiInsight', selectedClient, selectedPlatforms, dateRange, kpis],
    queryFn: () => apiClient.dashboard.getDashboardInsights(
      formattedKPIs as any,
      selectedClient || 'all',
      selectedPlatforms.length > 1 ? 'all' : selectedPlatforms[0] as any,
      dateRange
    ),
    enabled: !!kpis,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const handleExport = async (type: 'pdf' | 'excel') => {
    try {
      const blob = type === 'pdf'
        ? await apiClient.campaigns.exportPdf(selectedClient)
        : await apiClient.campaigns.exportExcel(selectedClient);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `campaigns_export.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Erro ao exportar arquivo. Tente novamente.');
    }
  };

  const handleCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  if (loading && !kpis) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Group campaigns by status for Kanban
  const campaignsByStatus = {
    active: campaigns.filter(c => c.status === 'active' || c.status === 'enabled'),
    paused: campaigns.filter(c => c.status === 'paused'),
    ended: campaigns.filter(c => c.status === 'ended' || c.status === 'removed')
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header & Analytics Section - No internal scroll, full visibility */}
      <div className="flex-shrink-0 p-4 md:p-8 bg-gray-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Target className="text-blue-600" /> Gestão de Campanhas
            </h1>
            <p className="text-gray-500 mt-1">Acompanhe o desempenho de suas campanhas em tempo real.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
            {/* View Switcher */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} title="Kanban">
                <LayoutGrid size={18} />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} title="Lista">
                <ListIcon size={18} />
              </button>
              <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} title="Tabela">
                <TableIcon size={18} />
              </button>
            </div>

            <div className="h-6 w-px bg-gray-300 mx-1"></div>

            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Todos os Clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>

            <div className="h-6 w-px bg-gray-300 mx-1"></div>

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

            <div className="h-6 w-px bg-gray-300 mx-1"></div>

            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm border border-red-200"
              title="Exportar PDF"
            >
              <FileText size={18} /> PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors font-medium text-sm border border-green-200"
              title="Exportar Excel"
            >
              <FileSpreadsheet size={18} /> XLS
            </button>
          </div>
        </div>

        {/* Platform Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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
            <div className="h-80 w-full min-h-[320px]" style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
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
            <div className="h-80 w-full min-h-[320px]" style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
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
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 pb-8">
        {viewMode === 'kanban' && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-max">
              {/* Active Column */}
              <div className="w-[350px] flex-shrink-0 rounded-xl bg-green-50 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-3 border-b-2 border-green-500 mb-2">
                  <h3 className="font-bold text-gray-700">Ativas</h3>
                  <span className="bg-white px-2 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                    {campaignsByStatus.active.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {campaignsByStatus.active.map(camp => (
                    <CampaignCard
                      key={camp.id}
                      camp={camp}
                      formatCurrency={formatCurrency}
                      formatNumber={formatNumber}
                      onClick={() => handleCampaignClick(camp)}
                    />
                  ))}
                </div>
              </div>

              {/* Paused Column */}
              <div className="w-[350px] flex-shrink-0 rounded-xl bg-yellow-50 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-3 border-b-2 border-yellow-500 mb-2">
                  <h3 className="font-bold text-gray-700">Pausadas</h3>
                  <span className="bg-white px-2 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                    {campaignsByStatus.paused.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {campaignsByStatus.paused.map(camp => (
                    <CampaignCard
                      key={camp.id}
                      camp={camp}
                      formatCurrency={formatCurrency}
                      formatNumber={formatNumber}
                      onClick={() => handleCampaignClick(camp)}
                    />
                  ))}
                </div>
              </div>

              {/* Ended Column */}
              <div className="w-[350px] flex-shrink-0 rounded-xl bg-gray-100 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-3 border-b-2 border-gray-500 mb-2">
                  <h3 className="font-bold text-gray-700">Encerradas</h3>
                  <span className="bg-white px-2 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                    {campaignsByStatus.ended.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {campaignsByStatus.ended.map(camp => (
                    <CampaignCard
                      key={camp.id}
                      camp={camp}
                      formatCurrency={formatCurrency}
                      formatNumber={formatNumber}
                      onClick={() => handleCampaignClick(camp)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-3">
            {campaigns.map(camp => (
              <div
                key={camp.id}
                onClick={() => handleCampaignClick(camp)}
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-12 rounded-full ${camp.status === 'active' ? 'bg-green-500' :
                    camp.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-300'
                    }`}></div>
                  <div>
                    <h4 className="font-bold text-gray-800">{camp.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <span className="capitalize">{camp.platform}</span>
                      <span>•</span>
                      <span>ROAS: {(Number(camp.revenue) / (Number(camp.spend) || 1)).toFixed(2)}x</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Investimento</p>
                    <p className="font-bold text-gray-800">{formatCurrency(camp.spend)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Receita</p>
                    <p className="font-bold text-green-600">{formatCurrency(camp.revenue)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'table' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-w-[1000px]">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600">Campanha</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600">Plataforma</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600">Status</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600 text-right">Investimento</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600 text-right">Impr.</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600 text-right">Cliques</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600 text-right">Conv.</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((camp) => (
                  <tr
                    key={camp.id}
                    onClick={() => handleCampaignClick(camp)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
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
                      <span className={`flex items-center gap-1.5 text-sm font-medium ${camp.status === 'active' ? 'text-green-600' :
                        camp.status === 'paused' ? 'text-yellow-600' : 'text-gray-500'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${camp.status === 'active' ? 'bg-green-600' :
                          camp.status === 'paused' ? 'bg-yellow-600' : 'bg-gray-500'
                          }`}></span> {camp.status}
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
        )}
      </div>

      <CampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaign={selectedCampaign}
        mode={selectedCampaign ? 'edit' : 'create'}
        onSave={(data) => console.log('Save campaign', data)}
      />
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

const CampaignCard = ({ camp, formatCurrency, formatNumber, onClick }: any) => (
  <div
    onClick={onClick}
    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
  >
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-bold text-gray-800 text-sm line-clamp-2">{camp.name}</h4>
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${camp.platform === 'google' ? 'bg-blue-50 text-blue-700' :
        camp.platform === 'meta' ? 'bg-indigo-50 text-indigo-700' :
          'bg-gray-50 text-gray-700'
        }`}>{camp.platform}</span>
    </div>

    <div className="grid grid-cols-2 gap-2 mb-3">
      <div>
        <p className="text-[10px] text-gray-500">Investimento</p>
        <p className="text-xs font-bold text-gray-800">{formatCurrency(camp.spend)}</p>
      </div>
      <div>
        <p className="text-[10px] text-gray-500">Receita</p>
        <p className="text-xs font-bold text-green-600">{formatCurrency(camp.revenue)}</p>
      </div>
    </div>

    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
      <div className="flex items-center gap-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><MousePointer size={10} /> {formatNumber(camp.clicks)}</span>
        <span className="flex items-center gap-1"><Target size={10} /> {formatNumber(camp.conversions)}</span>
      </div>
      <span className={`text-xs font-bold ${Number(camp.revenue) / Number(camp.spend) >= 4 ? 'text-green-600' : 'text-yellow-600'}`}>
        {(Number(camp.revenue) / (Number(camp.spend) || 1)).toFixed(2)}x
      </span>
    </div>
  </div>
);
