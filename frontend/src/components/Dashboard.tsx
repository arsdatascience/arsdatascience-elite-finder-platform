import React, { useState } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Legend } from 'recharts';
import { CLIENTS_LIST, KPIS, COMPARATIVE_FUNNEL_DATA, DEVICE_DATA } from '../constants';
import { ArrowUpRight, ArrowDownRight, Info, Users, Smartphone, Monitor, Tablet, Loader2, LayoutGrid, List as ListIcon, Table as TableIcon, FileText, FileSpreadsheet, Target, DollarSign, Eye, MousePointer, TrendingUp, Layers } from 'lucide-react';
import { COMPONENT_VERSIONS } from '../componentVersions';
import { motion, Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { ChurnRiskWidget } from './ChurnRiskWidget';
import { CampaignModal } from './CampaignModal';
import { formatCurrency, formatNumber } from '../utils/formatters';

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

// Variantes de animação
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

export const Dashboard: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'google' | 'meta'>('all'); // Used for Global/Financial
  const [activeTab, setActiveTab] = useState<'overview' | 'strategic' | 'financial'>('overview');
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'table'>('table'); // For Strategic View
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['google', 'meta', 'youtube', 'linkedin']); // For Strategic/Campagins
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Campaign Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Additional State from Campaigns.tsx (if needed locally, though react-query handles most)
  // We'll use a new query for detailed campaign analytics
  const { data: campaignAnalytics, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['campaignAnalytics', selectedClient, dateRange, selectedPlatforms],
    queryFn: async () => {
      // Should adapt to accept 'all' or numeric ID
      const clientParam = selectedClient === 'all' ? '' : selectedClient;
      return apiClient.campaigns.getCampaignAnalytics(
        clientParam,
        dateRange.start,
        dateRange.end,
        selectedPlatforms.join(',')
      );
    },
    enabled: activeTab !== 'overview' // Only fetch when not in overview to save resources? Or always? Let's fetch when needed.
  });

  const campaigns: Campaign[] = campaignAnalytics?.campaigns || [];
  const kpis = campaignAnalytics?.kpis || null;
  const financialChartData = (campaignAnalytics?.chartData || []).map((item: any) => ({
    ...item,
    spend: Number(item.spend || 0),
    revenue: Number(item.revenue || 0),
    impressions: Number(item.impressions || 0),
    clicks: Number(item.clicks || 0),
    conversions: Number(item.conversions || 0)
  }));
  const platformData = (campaignAnalytics?.platformData || []).map((item: any) => ({
    ...item,
    spend: Number(item.spend || 0),
    revenue: Number(item.revenue || 0),
    conversions: Number(item.conversions || 0)
  }));

  const handleCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleExport = async (type: 'pdf' | 'excel') => {
    try {
      const clientParam = selectedClient === 'all' ? '' : selectedClient;
      const blob = type === 'pdf'
        ? await apiClient.campaigns.exportPdf(clientParam)
        : await apiClient.campaigns.exportExcel(clientParam);

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

  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  // Group campaigns by status for Kanban
  const campaignsByStatus = {
    active: campaigns.filter(c => c.status === 'active' || c.status === 'enabled'),
    paused: campaigns.filter(c => c.status === 'paused'),
    ended: campaigns.filter(c => c.status === 'ended' || c.status === 'removed')
  };

  // React Query Hooks
  const { data: clients = CLIENTS_LIST } = useQuery({
    queryKey: ['clients'],
    queryFn: apiClient.clients.getClients,
    initialData: CLIENTS_LIST
  });

  const { data: currentKPIs = KPIS, isLoading: isLoadingKPIs } = useQuery({
    queryKey: ['kpis', selectedClient, selectedPlatform, dateRange],
    queryFn: () => apiClient.dashboard.getKPIs(selectedClient, selectedPlatform, dateRange.start, dateRange.end),
  });

  const { data: chartData = [], isLoading: isLoadingChart } = useQuery({
    queryKey: ['chartData', selectedClient, dateRange],
    queryFn: () => apiClient.dashboard.getChartData(selectedClient, dateRange.start, dateRange.end),
  });

  const { data: funnelData = COMPARATIVE_FUNNEL_DATA } = useQuery({
    queryKey: ['funnelData', selectedClient, dateRange],
    queryFn: () => apiClient.dashboard.getFunnelData(selectedClient, dateRange.start, dateRange.end),
  });

  const { data: deviceData = DEVICE_DATA } = useQuery({
    queryKey: ['deviceData', selectedClient, dateRange],
    queryFn: () => apiClient.dashboard.getDeviceData(selectedClient, dateRange.start, dateRange.end),
  });

  const { data: conversionSources = [] } = useQuery({
    queryKey: ['conversionSources', selectedClient, dateRange],
    queryFn: () => apiClient.dashboard.getConversionSources(selectedClient, dateRange.start, dateRange.end),
  });

  // New AI Insight Query
  const { data: aiInsightData, isLoading: isLoadingInsight } = useQuery({
    queryKey: ['aiInsight', selectedClient, selectedPlatform, dateRange, currentKPIs],
    queryFn: () => apiClient.dashboard.getDashboardInsights(currentKPIs, selectedClient, selectedPlatform, dateRange),
    enabled: !!currentKPIs && currentKPIs.length > 0,
    staleTime: 1000 * 60 * 5 // Cache for 5 minutes
  });

  const formatK = (val: number) => {
    if (val >= 1000) return `R$ ${(val / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
    return `R$ ${val.toLocaleString('pt-BR')}`;
  };

  const getDeviceIcon = (name: string) => {
    switch (name) {
      case 'Mobile': return <Smartphone size={18} />;
      case 'Desktop': return <Monitor size={18} />;
      case 'Tablet': return <Tablet size={18} />;
      default: return <Smartphone size={18} />;
    }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold text-gray-800">Gestão de Campanhas <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2 align-middle">{COMPONENT_VERSIONS.Dashboard}</span></h2>
          <p className="text-gray-500 text-sm">Visão estratégica de performance e ROI.</p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Seletor de Cliente */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="text-gray-400" size={18} />
              </div>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full sm:w-64 pl-10 p-2.5 shadow-sm"
              >
                <option value="all">Todos os Clientes (Visão Global)</option>
                {clients.filter((c: any) => c.id !== 'all').map((client: any) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            {/* Seletor de Período */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-300 shadow-sm">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-2 py-1.5 text-sm border-none focus:ring-0 text-gray-700 bg-transparent outline-none"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-2 py-1.5 text-sm border-none focus:ring-0 text-gray-700 bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Filtro de Plataforma (Abas) */}
          <div className="bg-gray-100 p-1 rounded-lg flex self-start sm:self-end">
            <button
              onClick={() => setSelectedPlatform('all')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${selectedPlatform === 'all' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Unificado
            </button>
            <button
              onClick={() => setSelectedPlatform('google')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${selectedPlatform === 'google' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> Google Ads
            </button>
            <button
              onClick={() => setSelectedPlatform('meta')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${selectedPlatform === 'meta' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <div className="w-2 h-2 rounded-full bg-purple-500"></div> Meta Ads
            </button>
          </div>
        </motion.div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('strategic')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'strategic' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Gestão Estratégica
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'financial' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Visão Financeira
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoadingKPIs ? (
              Array(4).fill(0).map((_, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-32 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
              ))
            ) : (
              currentKPIs.map((kpi: any, idx: number) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
                    <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${kpi.trend === 'up' ? 'bg-green-100 text-green-700' :
                      kpi.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {kpi.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> :
                        kpi.trend === 'down' ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                      {Math.abs(kpi.change)}%
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mt-4">{kpi.value}</h3>
                </motion.div>
              ))
            )}
          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Revenue Chart (Area) - Takes 2 Columns */}
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative min-h-[400px]">
              {isLoadingChart && (
                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                </div>
              )}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedPlatform === 'all' ? 'Evolução: Google vs Meta vs Receita' :
                    selectedPlatform === 'google' ? 'Performance Google Ads' : 'Performance Meta Ads'}
                </h3>
                <Info className="w-5 h-5 text-gray-400 cursor-pointer hover:text-primary-500" />
              </div>
              <div className="h-80" style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGoogle" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={formatK} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']}
                    />
                    <Legend verticalAlign="top" height={36} />

                    {/* Lógica Condicional de Exibição */}
                    {selectedPlatform === 'all' ? (
                      <>
                        <Area type="monotone" dataKey="google_spend" name="Google Invest." stroke="#3b82f6" fill="url(#colorGoogle)" stackId="1">
                          <LabelList dataKey="google_spend" position="top" formatter={(val: any) => formatK(Number(val))} style={{ fontSize: '10px', fill: '#3b82f6', fontWeight: 'bold' }} />
                        </Area>
                        <Area type="monotone" dataKey="meta_spend" name="Meta Invest." stroke="#a855f7" fill="url(#colorMeta)" stackId="1">
                          <LabelList dataKey="meta_spend" position="top" formatter={(val: any) => formatK(Number(val))} style={{ fontSize: '10px', fill: '#a855f7', fontWeight: 'bold' }} />
                        </Area>
                        <Area type="monotone" dataKey="total_revenue" name="Receita Total" stroke="#10b981" fill="none" strokeWidth={3}>
                          <LabelList dataKey="total_revenue" position="top" formatter={(val: any) => formatK(Number(val))} style={{ fontSize: '10px', fill: '#10b981', fontWeight: 'bold' }} />
                        </Area>
                      </>
                    ) : selectedPlatform === 'google' ? (
                      <>
                        <Area type="monotone" dataKey="google_spend" name="Investimento Google" stroke="#3b82f6" fill="url(#colorGoogle)">
                          <LabelList dataKey="google_spend" position="top" formatter={(val: any) => formatK(Number(val))} style={{ fontSize: '10px', fill: '#3b82f6', fontWeight: 'bold' }} />
                        </Area>
                        <Area type="monotone" dataKey="google_revenue" name="Receita Atribuída" stroke="#10b981" fill="none" strokeWidth={3}>
                          <LabelList dataKey="google_revenue" position="top" formatter={(val: any) => formatK(Number(val))} style={{ fontSize: '10px', fill: '#10b981', fontWeight: 'bold' }} />
                        </Area>
                      </>
                    ) : (
                      <>
                        <Area type="monotone" dataKey="meta_spend" name="Investimento Meta" stroke="#a855f7" fill="url(#colorMeta)">
                          <LabelList dataKey="meta_spend" position="top" formatter={(val: any) => formatK(Number(val))} style={{ fontSize: '10px', fill: '#a855f7', fontWeight: 'bold' }} />
                        </Area>
                        <Area type="monotone" dataKey="meta_revenue" name="Receita Atribuída" stroke="#10b981" fill="none" strokeWidth={3}>
                          <LabelList dataKey="meta_revenue" position="top" formatter={(val: any) => formatK(Number(val))} style={{ fontSize: '10px', fill: '#10b981', fontWeight: 'bold' }} />
                        </Area>
                      </>
                    )}

                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* UPDATED: Modern Comparative Funnel (Bar Chart) with Fixed Labels */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Funil de Conversão</h3>
                <div className="flex gap-2 text-xs font-medium">
                  <span className="flex items-center gap-1 text-gray-600"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Google</span>
                  <span className="flex items-center gap-1 text-gray-600"><div className="w-2 h-2 rounded-full bg-purple-500"></div>Meta</span>
                </div>
              </div>
              <div className="h-80" style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart
                    layout="vertical"
                    data={funnelData}
                    margin={{ top: 5, right: 50, left: 30, bottom: 5 }}
                    barGap={4}
                  >
                    <XAxis type="number" hide />
                    <YAxis dataKey="stage" type="category" width={70} tick={{ fontSize: 11, fontWeight: '600', fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="google" name="Google Ads" fill="#3b82f6" barSize={16} radius={[0, 4, 4, 0]}>
                      <LabelList
                        dataKey="google"
                        position="right"
                        formatter={(val: any) => Number(val) >= 1000 ? (Number(val) / 1000).toFixed(1) + 'k' : String(val)}
                        style={{ fontSize: '10px', fontWeight: 'bold', fill: '#3b82f6' }}
                      />
                    </Bar>
                    <Bar dataKey="meta" name="Meta Ads" fill="#a855f7" barSize={16} radius={[0, 4, 4, 0]}>
                      <LabelList
                        dataKey="meta"
                        position="right"
                        formatter={(val: any) => Number(val) >= 1000 ? (Number(val) / 1000).toFixed(1) + 'k' : String(val)}
                        style={{ fontSize: '10px', fontWeight: 'bold', fill: '#a855f7' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Devices Pie Chart Modernized - Takes 2 Columns */}
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Dispositivos & Tecnologia</h3>

              <div className="flex flex-col md:flex-row items-center gap-8 h-72">
                {/* Chart Side */}
                <div className="w-full md:w-1/2 h-full relative" style={{ width: '100%', height: 288 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        cornerRadius={8}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {deviceData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-800">100%</span>
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Tráfego</span>
                  </div>
                </div>

                {/* Custom Legend/Stats Side */}
                <div className="w-full md:w-1/2 space-y-4 pr-8">
                  {deviceData.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between group p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-default">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg text-white shadow-sm`} style={{ backgroundColor: entry.color }}>
                          {getDeviceIcon(entry.name)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{entry.name}</p>
                          <p className="text-xs text-gray-400">Tráfego Identificado</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold" style={{ color: entry.color }}>{entry.value}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Conversion Source Breakdown (Share por Plataforma) - Takes 1 Column */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-w-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Share por Plataforma</h3>
              <div className="w-full relative" style={{ width: '100%', height: 300 }}>
                {conversionSources.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={conversionSources}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="val"
                        nameKey="label"
                      >
                        {conversionSources.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color.replace('bg-', '').replace('-500', '') === 'blue' ? '#3b82f6' :
                            entry.color.replace('bg-', '').replace('-500', '') === 'purple' ? '#a855f7' :
                              entry.color.replace('bg-', '').replace('-500', '') === 'green' ? '#10b981' :
                                entry.color.replace('bg-', '').replace('-500', '') === 'yellow' ? '#f59e0b' : '#6b7280'} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`${value}%`, 'Share']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    Sem dados disponíveis
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Insights & Churn Section (New Row) */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Insight */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[300px] flex flex-col">
              <p className="text-sm text-primary-800 font-medium flex items-center gap-2 mb-3">
                <Users size={18} /> Insight Estratégico da IA
              </p>
              <div className="p-4 bg-primary-50 rounded-lg border border-primary-100 flex-1 overflow-y-auto max-h-[400px]">
                <p className="text-sm text-primary-600 whitespace-pre-wrap">
                  {isLoadingInsight ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analisando dados de conversão...
                    </span>
                  ) : (
                    aiInsightData?.insight || "Nenhum insight disponível no momento."
                  )}
                </p>
              </div>
            </div>

            {/* Churn Widget */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <ChurnRiskWidget />
            </div>
          </motion.div>
        </div>
      )}

      {/* Strategic View */}
      {activeTab === 'strategic' && (
        <div className="space-y-6 animate-fade-in">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`} title="Kanban">
                <LayoutGrid size={18} />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`} title="Lista">
                <ListIcon size={18} />
              </button>
              <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`} title="Tabela">
                <TableIcon size={18} />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {['google', 'meta', 'youtube', 'linkedin'].map(platform => (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${selectedPlatforms.includes(platform)
                    ? platform === 'google' ? 'bg-primary-100 text-primary-700 border-primary-200 border' :
                      platform === 'meta' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 border' :
                        platform === 'youtube' ? 'bg-red-100 text-red-700 border-red-200 border' :
                          'bg-cyan-100 text-cyan-700 border-cyan-200 border'
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedPlatforms.includes(platform) ? 'bg-current' : 'bg-gray-300'}`}></div>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)} Args
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {viewMode === 'kanban' && (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-6 min-w-max">
                <div className="w-[350px] flex-shrink-0 rounded-xl bg-green-50 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-green-500 mb-2">
                    <h3 className="font-bold text-gray-700">Ativas</h3>
                    <span className="bg-white px-2 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm">{campaignsByStatus.active.length}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {campaignsByStatus.active.map(camp => (
                      <CampaignCard key={camp.id} camp={camp} formatCurrency={formatCurrency} formatNumber={formatNumber} onClick={() => handleCampaignClick(camp)} />
                    ))}
                  </div>
                </div>
                <div className="w-[350px] flex-shrink-0 rounded-xl bg-yellow-50 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-yellow-500 mb-2">
                    <h3 className="font-bold text-gray-700">Pausadas</h3>
                    <span className="bg-white px-2 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm">{campaignsByStatus.paused.length}</span>
                  </div>
                  {campaignsByStatus.paused.map(camp => (
                    <CampaignCard key={camp.id} camp={camp} formatCurrency={formatCurrency} formatNumber={formatNumber} onClick={() => handleCampaignClick(camp)} />
                  ))}
                </div>
                <div className="w-[350px] flex-shrink-0 rounded-xl bg-gray-100 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-gray-500 mb-2">
                    <h3 className="font-bold text-gray-700">Encerradas</h3>
                    <span className="bg-white px-2 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm">{campaignsByStatus.ended.length}</span>
                  </div>
                  {campaignsByStatus.ended.map(camp => (
                    <CampaignCard key={camp.id} camp={camp} formatCurrency={formatCurrency} formatNumber={formatNumber} onClick={() => handleCampaignClick(camp)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="space-y-3">
              {campaigns.map(camp => (
                <CampaignCard key={camp.id} camp={camp} formatCurrency={formatCurrency} formatNumber={formatNumber} onClick={() => handleCampaignClick(camp)} />
              ))}
            </div>
          )}

          {viewMode === 'table' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-sm text-gray-600">Campanha</th>
                    <th className="px-6 py-4 font-semibold text-sm text-gray-600">Plataforma</th>
                    <th className="px-6 py-4 font-semibold text-sm text-gray-600">Status</th>
                    <th className="px-6 py-4 font-semibold text-sm text-gray-600 text-right">Inv.</th>
                    <th className="px-6 py-4 font-semibold text-sm text-gray-600 text-right">Rec.</th>
                    <th className="px-6 py-4 font-semibold text-sm text-gray-600 text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} onClick={() => handleCampaignClick(camp)} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 font-medium text-gray-900">{camp.name}</td>
                      <td className="px-6 py-4 capitalize">{camp.platform}</td>
                      <td className="px-6 py-4 capitalize">{camp.status}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(camp.spend)}</td>
                      <td className="px-6 py-4 text-right text-green-600">{formatCurrency(camp.revenue)}</td>
                      <td className="px-6 py-4 text-right font-bold">{(Number(camp.revenue) / (Number(camp.spend) || 1)).toFixed(2)}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Financial View */}
      {activeTab === 'financial' && (
        <div className="space-y-6 animate-fade-in">
          {/* Detailed Charts from Campaigns (reusing similar structure but focused on financials) */}
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm border border-red-200"
            >
              <FileText size={18} /> Exportar PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors font-medium text-sm border border-green-200"
            >
              <FileSpreadsheet size={18} /> Exportar XLS
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-gray-400" /> Fluxo de Caixa (Investimento vs Receita)
            </h3>
            <div className="h-80 w-full" style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialChartData}>
                  <defs>
                    <linearGradient id="colorSpendFin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRevenueFin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(value: any) => [`R$ ${Number(value || 0).toFixed(2)}`, '']} />
                  <Legend />
                  <Area type="monotone" dataKey="spend" name="Investimento" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpendFin)" />
                  <Area type="monotone" dataKey="revenue" name="Receita" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenueFin)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platform Share Pie */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><Layers size={20} className="text-gray-400" /> Share de Investimento</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={platformData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="spend" nameKey="platform">
                      {platformData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: any) => `R$ ${Number(value || 0).toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Platform Revenue Pie */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><DollarSign size={20} className="text-gray-400" /> Share de Receita</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={platformData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="revenue" nameKey="platform">
                      {platformData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: any) => `R$ ${Number(value || 0).toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      <CampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaign={selectedCampaign}
        mode={selectedCampaign ? 'edit' : 'create'}
        onSave={(data) => console.log('Save campaign', data)}
      />
    </motion.div>

  )
}



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
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${camp.platform === 'google' ? 'bg-primary-50 text-primary-700' :
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
