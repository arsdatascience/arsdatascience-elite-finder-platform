

import React, { useState } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Legend } from 'recharts';
import { CLIENTS_LIST, KPIS, COMPARATIVE_FUNNEL_DATA, DEVICE_DATA } from '../constants';
import { ArrowUpRight, ArrowDownRight, Info, Users, Smartphone, Monitor, Tablet, Loader2 } from 'lucide-react';
import { COMPONENT_VERSIONS } from '../componentVersions';
import { motion, Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

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
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'google' | 'meta'>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

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

  const formatK = (val: number) => {
    if (val >= 1000) return `R$${(val / 1000).toFixed(1)}k`;
    return String(val);
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
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-64 pl-10 p-2.5 shadow-sm"
              >
                <option value="all">Todos os Clientes (Visão Global)</option>
                {clients.filter((c: any) => c.id !== 'all').map((client: any) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            {/* Seletor de Período */}
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
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${selectedPlatform === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Unificado
            </button>
            <button
              onClick={() => setSelectedPlatform('google')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${selectedPlatform === 'google' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> Google Ads
            </button>
            <button
              onClick={() => setSelectedPlatform('meta')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${selectedPlatform === 'meta' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <div className="w-2 h-2 rounded-full bg-purple-500"></div> Meta Ads
            </button>
          </div>
        </motion.div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingKPIs ? (
          Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-32 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ))
        ) : (
          currentKPIs.map((kpi, idx) => (
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
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedPlatform === 'all' ? 'Evolução: Google vs Meta vs Receita' :
                selectedPlatform === 'google' ? 'Performance Google Ads' : 'Performance Meta Ads'}
            </h3>
            <Info className="w-5 h-5 text-gray-400 cursor-pointer hover:text-blue-500" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
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
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
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
            <div className="w-full md:w-1/2 h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    cornerRadius={8}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }: any) => `${name}: ${value}%`}
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

        {/* Conversion Source Breakdown - Takes 1 Column */}
        <motion.div variants={itemVariants} className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Origem das Conversões</h3>
          <div className="space-y-6">
            {conversionSources.length > 0 ? conversionSources.map((item: any) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold text-gray-900">{item.val}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className={`${item.color} h-2.5 rounded-full shadow-sm`} style={{ width: `${item.val}%` }}></div>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-4">Sem dados de conversão</div>
            )}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800 font-medium">💡 Insight da IA</p>
            <p className="text-xs text-blue-600 mt-1">
              {selectedClient === '1'
                ? "TechCorp: O CPM do Meta Ads subiu 15%. Considere realocar 20% do budget para Google Display."
                : selectedClient === '2'
                  ? "Padaria do João: Campanhas locais no Instagram (Raio 2km) estão com ROAS de 8x."
                  : "ROAS geral estável. Oportunidade de escalar campanhas de vídeo no Youtube."}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
