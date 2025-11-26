
// O conteúdo do arquivo components/Dashboard.tsx foi movido para aqui, com os imports corrigidos para a estrutura `src`.
// Ex: import { KPIS } from '../constants'; se torna import { KPIS } from '@/constants';
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Legend } from 'recharts';
import { KPIS, CLIENTS_LIST, COMPARATIVE_FUNNEL_DATA, DEVICE_DATA } from '@/constants';
import { ArrowUpRight, ArrowDownRight, Info, Users, Smartphone, Monitor, Tablet } from 'lucide-react';
import { Metric } from '@/types';

const DEFAULT_CHART_DATA = [
  { name: 'Seg', revenue: 20000, spend: 12000, google: 8000, meta: 4000 },
  { name: 'Ter', revenue: 15000, spend: 7000, google: 4000, meta: 3000 },
  { name: 'Qua', revenue: 10000, spend: 49000, google: 30000, meta: 19000 },
  { name: 'Qui', revenue: 13900, spend: 19500, google: 10000, meta: 9500 },
  { name: 'Sex', revenue: 9450, spend: 24000, google: 12000, meta: 12000 },
  { name: 'Sab', revenue: 11950, spend: 19000, google: 10000, meta: 9000 },
  { name: 'Dom', revenue: 17450, spend: 21500, google: 11500, meta: 10000 },
];

export const Dashboard: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'google' | 'meta'>('all');
  const [currentKPIs, setCurrentKPIs] = useState<Metric[]>(KPIS);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    let baseKPIs = [...KPIS];
    let processedData = DEFAULT_CHART_DATA.map(d => ({
      ...d,
      google_spend: d.google,
      meta_spend: d.meta,
      total_spend: d.spend,
      google_revenue: d.revenue * 0.6,
      meta_revenue: d.revenue * 0.4,
      total_revenue: d.revenue
    }));

    if (selectedClient === '1') { // TechCorp
      baseKPIs = [
        { label: 'Faturamento Total', value: 'R$ 450.000,00', change: 5.2, trend: 'up' },
        { label: 'Investimento Ads', value: 'R$ 80.000,00', change: 1.1, trend: 'up' },
        { label: 'ROAS', value: '5.6x', change: 4.1, trend: 'up' },
        { label: 'CPA Médio', value: 'R$ 120,00', change: -2.0, trend: 'down' },
      ];
      processedData = processedData.map(d => ({
        ...d,
        total_revenue: d.total_revenue * 1.2,
        google_spend: d.google_spend * 1.1,
        meta_spend: d.meta_spend * 1.1,
        google_revenue: d.google_revenue * 1.2,
        meta_revenue: d.meta_revenue * 1.2
      }));
    } else if (selectedClient === '2') { // Padaria
      baseKPIs = [
        { label: 'Faturamento Total', value: 'R$ 25.000,00', change: -1.5, trend: 'down' },
        { label: 'Investimento Ads', value: 'R$ 5.000,00', change: 0.0, trend: 'neutral' },
        { label: 'ROAS', value: '5.0x', change: -2.1, trend: 'down' },
        { label: 'CPA Médio', value: 'R$ 15,00', change: 5.2, trend: 'up' },
      ];
      processedData = processedData.map(d => ({
        ...d,
        total_revenue: d.total_revenue * 0.1,
        google_spend: d.google_spend * 0.1,
        meta_spend: d.meta_spend * 0.1,
        google_revenue: d.google_revenue * 0.1,
        meta_revenue: d.meta_revenue * 0.1
      }));
    }

    if (selectedPlatform === 'google') {
      setCurrentKPIs([
        { ...baseKPIs[0], value: 'R$ ' + (parseFloat(baseKPIs[0].value.replace(/[^\d,]/g, '').replace(',', '.')) * 0.6).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
        { ...baseKPIs[1], value: 'R$ ' + (parseFloat(baseKPIs[1].value.replace(/[^\d,]/g, '').replace(',', '.')) * 0.55).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
        { ...baseKPIs[2], value: '6.1x' },
        { ...baseKPIs[3], value: 'R$ 85,00' },
      ]);
    } else if (selectedPlatform === 'meta') {
      setCurrentKPIs([
        { ...baseKPIs[0], value: 'R$ ' + (parseFloat(baseKPIs[0].value.replace(/[^\d,]/g, '').replace(',', '.')) * 0.4).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
        { ...baseKPIs[1], value: 'R$ ' + (parseFloat(baseKPIs[1].value.replace(/[^\d,]/g, '').replace(',', '.')) * 0.45).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
        { ...baseKPIs[2], value: '4.2x' },
        { ...baseKPIs[3], value: 'R$ 45,00' },
      ]);
    } else {
      setCurrentKPIs(baseKPIs);
    }

    setChartData(processedData);

  }, [selectedClient, selectedPlatform]);

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
    <div className="space-y-6 animate-fade-in">
      {/* Conteúdo do Dashboard como estava, mas com os imports corrigidos */}
      {/* ... (todo o JSX do Dashboard.tsx) ... */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestão de Campanhas <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2 align-middle">v1.0</span></h2>
          <p className="text-gray-500 text-sm">Visão estratégica de performance e ROI.</p>
        </div>

        <div className="flex flex-col gap-3">
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
                {CLIENTS_LIST.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            {/* Seletor de Período */}
            <select className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm">
              <option>Últimos 7 Dias</option>
              <option>Últimos 30 Dias</option>
              <option>Este Trimestre</option>
            </select>
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
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentKPIs.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
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
          </div>
        ))}
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Revenue Chart (Area) - Takes 2 Columns */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                />
                <Legend verticalAlign="top" height={36} />

                {/* Lógica Condicional de Exibição */}
                {selectedPlatform === 'all' ? (
                  <>
                    <Area type="monotone" dataKey="google_spend" name="Google Invest." stroke="#3b82f6" fill="url(#colorGoogle)" stackId="1" />
                    <Area type="monotone" dataKey="meta_spend" name="Meta Invest." stroke="#a855f7" fill="url(#colorMeta)" stackId="1" />
                    <Area type="monotone" dataKey="total_revenue" name="Receita Total" stroke="#10b981" fill="none" strokeWidth={3} />
                  </>
                ) : selectedPlatform === 'google' ? (
                  <>
                    <Area type="monotone" dataKey="google_spend" name="Investimento Google" stroke="#3b82f6" fill="url(#colorGoogle)" />
                    <Area type="monotone" dataKey="google_revenue" name="Receita Atribuída" stroke="#10b981" fill="none" strokeWidth={3} />
                  </>
                ) : (
                  <>
                    <Area type="monotone" dataKey="meta_spend" name="Investimento Meta" stroke="#a855f7" fill="url(#colorMeta)" />
                    <Area type="monotone" dataKey="meta_revenue" name="Receita Atribuída" stroke="#10b981" fill="none" strokeWidth={3} />
                  </>
                )}

              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* UPDATED: Modern Comparative Funnel (Bar Chart) with Fixed Labels */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
                data={COMPARATIVE_FUNNEL_DATA}
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
                    formatter={(val: number) => val >= 1000 ? (val / 1000).toFixed(1) + 'k' : String(val)}
                    style={{ fontSize: '10px', fontWeight: 'bold', fill: '#3b82f6' }}
                  />
                </Bar>
                <Bar dataKey="meta" name="Meta Ads" fill="#a855f7" barSize={16} radius={[0, 4, 4, 0]}>
                  <LabelList
                    dataKey="meta"
                    position="right"
                    formatter={(val: number) => val >= 1000 ? (val / 1000).toFixed(1) + 'k' : String(val)}
                    style={{ fontSize: '10px', fontWeight: 'bold', fill: '#a855f7' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Devices Pie Chart Modernized - Takes 2 Columns */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Dispositivos & Tecnologia</h3>

          <div className="flex flex-col md:flex-row items-center gap-8 h-72">
            {/* Chart Side */}
            <div className="w-full md:w-1/2 h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={DEVICE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    cornerRadius={8}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {DEVICE_DATA.map((entry, index) => (
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
              {DEVICE_DATA.map((entry, index) => (
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
        </div>

        {/* Conversion Source Breakdown - Takes 1 Column */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Origem das Conversões</h3>
          <div className="space-y-6">
            {[
              { label: 'Google Ads', val: 45, color: 'bg-blue-500' },
              { label: 'Meta Ads', val: 32, color: 'bg-purple-500' },
              { label: 'Busca Orgânica', val: 15, color: 'bg-green-500' },
              { label: 'Direto/Indicação', val: 8, color: 'bg-yellow-500' }
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold text-gray-900">{item.val}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className={`${item.color} h-2.5 rounded-full shadow-sm`} style={{ width: `${item.val}%` }}></div>
                </div>
              </div>
            ))}
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
        </div>
      </div>
    </div>
  );
};
