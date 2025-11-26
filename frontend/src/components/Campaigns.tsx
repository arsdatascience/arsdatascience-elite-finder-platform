import React, { useState, useMemo } from 'react';
import { CLIENTS_LIST } from '@/constants';
import { Play, Pause, Globe, Search, Sparkles, PieChart as PieIcon, BarChart2, Users, AlertCircle } from 'lucide-react';
import { ContentGenerator } from '@/components/ContentGenerator';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, LabelList } from 'recharts';
import { Campaign } from '@/types';
import { COMPONENT_VERSIONS } from '@/componentVersions';

export const Campaigns: React.FC = () => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<'all' | 'google' | 'meta'>('all');
  const [selectedClient, setSelectedClient] = useState(CLIENTS_LIST[1].id);

  const clientCampaigns: Campaign[] = useMemo(() => {
    switch (selectedClient) {
      case '1': // TechCorp (B2B / Enterprise)
        return [
          { id: '101', name: 'SaaS Enterprise - Search Brand', platform: 'google', status: 'active', budget: 45000, spent: 12500, ctr: 5.2, roas: 4.8, conversions: 120 },
          { id: '102', name: 'Lead Gen - LinkedIn/Meta', platform: 'meta', status: 'active', budget: 30000, spent: 15000, ctr: 1.1, roas: 3.2, conversions: 45 },
          { id: '103', name: 'Competidores - Search', platform: 'google', status: 'active', budget: 15000, spent: 8000, ctr: 2.5, roas: 2.1, conversions: 18 },
          { id: '104', name: 'Webinar Q3 - Remarketing', platform: 'meta', status: 'paused', budget: 5000, spent: 4800, ctr: 0.9, roas: 1.5, conversions: 12 },
          { id: '105', name: 'Youtube - Awareness', platform: 'google', status: 'learning', budget: 20000, spent: 2000, ctr: 0.5, roas: 1.1, conversions: 5 },
          { id: '106', name: 'Display - Retargeting', platform: 'google', status: 'active', budget: 8000, spent: 3000, ctr: 0.8, roas: 3.5, conversions: 30 },
        ];
      case '2': // Padaria (Local / B2C)
        return [
          { id: '201', name: 'Promoção Café da Manhã - Raio 2km', platform: 'meta', status: 'active', budget: 800, spent: 250, ctr: 4.8, roas: 8.5, conversions: 150 },
          { id: '202', name: 'Delivery iFood - Search', platform: 'google', status: 'active', budget: 1200, spent: 600, ctr: 6.2, roas: 5.1, conversions: 80 },
          { id: '203', name: 'Instagram Reels - Pães Artesanais', platform: 'meta', status: 'learning', budget: 500, spent: 100, ctr: 2.1, roas: 1.2, conversions: 5 },
        ];
      case '3': // Consultoria (Serviços)
        return [
          { id: '301', name: 'Consultoria Financeira - Search', platform: 'google', status: 'active', budget: 5000, spent: 2500, ctr: 3.1, roas: 4.2, conversions: 25 },
          { id: '302', name: 'Ebook Grátis - Leads', platform: 'meta', status: 'active', budget: 3000, spent: 2800, ctr: 1.5, roas: 2.8, conversions: 110 },
          { id: '303', name: 'Vídeo Depoimentos', platform: 'meta', status: 'paused', budget: 1500, spent: 200, ctr: 0.8, roas: 1.0, conversions: 2 },
          { id: '304', name: 'Agendamento - Google Maps', platform: 'google', status: 'active', budget: 1000, spent: 400, ctr: 4.5, roas: 6.5, conversions: 15 },
        ];
      default: // Visão Global (Mistura)
        return [
          { id: '001', name: 'Campanha Institucional Global', platform: 'google', status: 'active', budget: 100000, spent: 45000, ctr: 2.0, roas: 3.0, conversions: 500 }
        ];
    }
  }, [selectedClient]);

  const filteredCampaigns = useMemo(() => {
    return clientCampaigns.filter(c => platformFilter === 'all' ? true : c.platform === platformFilter);
  }, [clientCampaigns, platformFilter]);

  const BUDGET_DATA = useMemo(() => {
    if (platformFilter === 'all') {
      const googleSpend = filteredCampaigns.filter(c => c.platform === 'google').reduce((acc, curr) => acc + curr.spent, 0);
      const metaSpend = filteredCampaigns.filter(c => c.platform === 'meta').reduce((acc, curr) => acc + curr.spent, 0);

      if (googleSpend === 0 && metaSpend === 0) return [{ name: 'Sem Dados', value: 1, color: '#e5e7eb' }];

      return [
        { name: 'Google Ads', value: googleSpend, color: '#3b82f6' },
        { name: 'Meta Ads', value: metaSpend, color: '#a855f7' },
      ];
    } else {
      const COLORS = platformFilter === 'google'
        ? ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8']
        : ['#a855f7', '#c084fc', '#e9d5ff', '#9333ea', '#7e22ce'];

      return filteredCampaigns.map((c, index) => ({
        name: c.name,
        value: c.spent,
        color: COLORS[index % COLORS.length]
      })).sort((a, b) => b.value - a.value);
    }
  }, [filteredCampaigns, platformFilter]);

  const ROAS_DATA = useMemo(() => {
    return filteredCampaigns
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 6)
      .map(c => ({
        name: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name,
        roas: c.roas,
        platform: c.platform
      }));
  }, [filteredCampaigns]);

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'paused': return 'Pausada';
      case 'learning': return 'Aprendizado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* ... (Todo o JSX do componente Campaigns) ... */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestão de Campanhas <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2 align-middle">{COMPONENT_VERSIONS.Campaigns}</span></h2>
          <p className="text-gray-500 text-sm">Acompanhe e otimize seus investimentos.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Client Selector */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Users size={16} />
            </div>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 shadow-sm outline-none"
            >
              {CLIENTS_LIST.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowGenerator(true)}
              className="flex-1 sm:flex-none bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-200 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Sparkles size={16} />
              Criar Anúncio IA
            </button>
            <button className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap">
              + Nova Campanha
            </button>
          </div>
        </div>
      </div>

      <ContentGenerator
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        defaultType="ad"
        defaultPlatform="google"
      />
      {/* O resto do código JSX aqui */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <PieIcon size={16} className="text-gray-400" />
              Share de Investimento
            </h3>
            <span className="text-xs text-gray-500">{platformFilter === 'all' ? 'Por Plataforma' : 'Por Campanha'}</span>
          </div>
          <div className="flex-1 flex flex-col md:flex-row items-center h-full">
            <div className="w-full md:w-3/5 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={BUDGET_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }: any) => `${name}: ${formatCurrency(value)}`}
                  >
                    {BUDGET_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={1} stroke="#fff" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => formatCurrency(val)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-2/5 pl-0 md:pl-4 space-y-3 mt-4 md:mt-0 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
              {BUDGET_DATA.map(item => (
                <div key={item.name} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center group hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2 text-xs text-gray-600 overflow-hidden">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                    <span className="truncate max-w-[100px] font-medium" title={item.name}>{item.name}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-800">{formatCurrency(item.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <BarChart2 size={16} className="text-gray-400" />
              Top ROAS por Campanha
            </h3>
            <span className="text-xs text-gray-500">Retorno sobre Investimento</span>
          </div>
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ROAS_DATA}
                layout="vertical"
                margin={{ top: 10, right: 60, bottom: 10, left: 10 }}
                barCategoryGap={20}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f3f4f6', radius: 4 }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="roas" barSize={32} radius={[0, 6, 6, 0]}>
                  {ROAS_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.platform === 'google' ? '#3b82f6' : '#a855f7'} />
                  ))}
                  <LabelList
                    dataKey="roas"
                    position="right"
                    formatter={(val: number) => `${val}x`}
                    style={{ fontSize: '12px', fontWeight: 'bold', fill: '#374151' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setPlatformFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${platformFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
        >
          Todas
        </button>
        <button
          onClick={() => setPlatformFilter('google')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${platformFilter === 'google' ? 'bg-blue-100 text-blue-700 border-blue-200 border' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
        >
          <Search size={14} /> Google Ads
        </button>
        <button
          onClick={() => setPlatformFilter('meta')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${platformFilter === 'meta' ? 'bg-purple-100 text-purple-700 border-purple-200 border' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
        >
          <Globe size={14} /> Meta Ads
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome da Campanha</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orçamento / Gasto</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">CTR</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ROAS</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${campaign.platform === 'google' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {campaign.platform === 'google' ? <Search size={16} /> : <Globe size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{campaign.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{campaign.platform} Ads</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'paused' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${campaign.status === 'active' ? 'bg-green-500' :
                        campaign.status === 'paused' ? 'bg-gray-500' : 'bg-yellow-500'
                        }`}></span>
                      {getStatusLabel(campaign.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-medium">{formatCurrency(campaign.spent)} <span className="text-gray-400 text-xs font-normal">/ {formatCurrency(campaign.budget)}</span></div>
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1.5">
                      <div
                        className={`h-1.5 rounded-full ${campaign.platform === 'google' ? 'bg-blue-500' : 'bg-purple-500'}`}
                        style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{campaign.ctr}%</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{campaign.roas}x</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      {campaign.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCampaigns.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400 text-sm flex flex-col items-center gap-2">
                    <AlertCircle size={24} />
                    Nenhuma campanha encontrada para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
