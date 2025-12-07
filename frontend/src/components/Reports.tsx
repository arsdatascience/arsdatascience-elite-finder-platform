
import React, { useState, useMemo } from 'react';
import { Printer, Layout, TrendingUp, Users, PieChart as PieIcon, Download, BarChart2, Activity, DollarSign, Calendar } from 'lucide-react';
import { KPIS, COMPARATIVE_FUNNEL_DATA, CAMPAIGNS_DATA, LEADS_DATA, CLIENTS_LIST } from '../constants';
import { GOOGLE_SEARCH_TERMS, GOOGLE_AUCTION_INSIGHTS, GOOGLE_TOP_ADS, GOOGLE_KEYWORDS, GOOGLE_DEMOGRAPHICS, GOOGLE_DEVICES, META_CAMPAIGNS, META_CREATIVES, META_PLACEMENTS, META_DEMOGRAPHICS, META_REACH_FREQUENCY, CONVERSION_FUNNEL_DETAILED } from '../mocks/reportData';
import { AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, LabelList, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { COMPONENT_VERSIONS } from '../componentVersions';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- GERAÇÃO DE DADOS FINANCEIROS DETERMINÍSTICOS ---
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const RAW_FINANCE_DATA = [
  // 2024
  { name: 'Jan/24', monthIndex: 0, year: 2024, revenue: 42000, spend: 12000 },
  { name: 'Fev/24', monthIndex: 1, year: 2024, revenue: 45000, spend: 15000 },
  { name: 'Mar/24', monthIndex: 2, year: 2024, revenue: 38000, spend: 11000 },
  { name: 'Abr/24', monthIndex: 3, year: 2024, revenue: 52000, spend: 22000 },
  { name: 'Mai/24', monthIndex: 4, year: 2024, revenue: 58000, spend: 25000 },
  { name: 'Jun/24', monthIndex: 5, year: 2024, revenue: 62000, spend: 28000 },
  { name: 'Jul/24', monthIndex: 6, year: 2024, revenue: 65000, spend: 30000 },
  { name: 'Ago/24', monthIndex: 7, year: 2024, revenue: 61000, spend: 29000 },
  { name: 'Set/24', monthIndex: 8, year: 2024, revenue: 75000, spend: 35000 },
  { name: 'Out/24', monthIndex: 9, year: 2024, revenue: 82000, spend: 38000 },
  { name: 'Nov/24', monthIndex: 10, year: 2024, revenue: 95000, spend: 45000 },
  { name: 'Dez/24', monthIndex: 11, year: 2024, revenue: 110000, spend: 50000 },
  // 2025
  { name: 'Jan/25', monthIndex: 0, year: 2025, revenue: 85000, spend: 30000 },
  { name: 'Fev/25', monthIndex: 1, year: 2025, revenue: 88000, spend: 32000 },
  { name: 'Mar/25', monthIndex: 2, year: 2025, revenue: 92000, spend: 33000 },
  { name: 'Abr/25', monthIndex: 3, year: 2025, revenue: 105000, spend: 38000 },
  { name: 'Mai/25', monthIndex: 4, year: 2025, revenue: 115000, spend: 40000 },
  { name: 'Jun/25', monthIndex: 5, year: 2025, revenue: 125000, spend: 42000 },
  { name: 'Jul/25', monthIndex: 6, year: 2025, revenue: 130000, spend: 45000 },
  { name: 'Ago/25', monthIndex: 7, year: 2025, revenue: 128000, spend: 44000 },
  { name: 'Set/25', monthIndex: 8, year: 2025, revenue: 145000, spend: 50000 },
  { name: 'Out/25', monthIndex: 9, year: 2025, revenue: 160000, spend: 55000 },
  { name: 'Nov/25', monthIndex: 10, year: 2025, revenue: 180000, spend: 65000 },
  { name: 'Dez/25', monthIndex: 11, year: 2025, revenue: 200000, spend: 70000 },
];

const COLORS = ['#1e293b', '#475569', '#64748b', '#94a3b8'];

type WidgetType = 'kpis' | 'finance_chart' | 'funnel' | 'distribution' | 'top_campaigns' | 'recent_leads' | 'notes'
  // Google Widgets
  | 'search_terms_table' | 'auction_insights' | 'top_ads' | 'ad_extensions' | 'keyword_performance' | 'demographics_chart' | 'geo_heatmap' | 'device_breakdown' | 'shopping_performance' | 'ga4_behavior' | 'conversion_attribution' | 'conversion_funnel'
  // Meta Widgets
  | 'meta_campaigns_table' | 'reach_frequency' | 'engagement_chart' | 'placements_chart' | 'custom_audiences' | 'creative_performance' | 'format_breakdown' | 'top_creatives' | 'pixel_events' | 'catalog_sales' | 'attribution_model';

interface Widget {
  id: WidgetType;
  label: string;
  category: 'Financeiro' | 'Marketing' | 'Vendas' | 'Geral' | 'Google Ads' | 'Meta Ads';
}

const AVAILABLE_WIDGETS: Widget[] = [
  { id: 'kpis', label: 'Resumo de KPIs', category: 'Financeiro' },
  { id: 'finance_chart', label: 'Evolução Financeira', category: 'Financeiro' },
  { id: 'distribution', label: 'Distribuição de Verba', category: 'Financeiro' },
  { id: 'funnel', label: 'Funil de Conversão', category: 'Marketing' },
  { id: 'conversion_funnel', label: 'Funil Detalhado', category: 'Marketing' },
  { id: 'top_campaigns', label: 'Top Campanhas', category: 'Marketing' },
  { id: 'recent_leads', label: 'Últimos Leads', category: 'Vendas' },
  { id: 'notes', label: 'Observações', category: 'Geral' },

  // Google
  { id: 'search_terms_table', label: 'Termos de Pesquisa', category: 'Google Ads' },
  { id: 'auction_insights', label: 'Leilão', category: 'Google Ads' },
  { id: 'top_ads', label: 'Top Anúncios', category: 'Google Ads' },
  { id: 'keyword_performance', label: 'Palavras-chave', category: 'Google Ads' },
  { id: 'demographics_chart', label: 'Demografia', category: 'Google Ads' },
  { id: 'ad_extensions', label: 'Extensões de Anúncio', category: 'Google Ads' },
  { id: 'geo_heatmap', label: 'Geolocalização', category: 'Google Ads' },
  { id: 'device_breakdown', label: 'Dispositivos', category: 'Google Ads' },
  { id: 'shopping_performance', label: 'Shopping', category: 'Google Ads' },
  { id: 'ga4_behavior', label: 'Comportamento (GA4)', category: 'Google Ads' },
  { id: 'conversion_attribution', label: 'Atribuição', category: 'Google Ads' },

  // Meta
  { id: 'meta_campaigns_table', label: 'Campanhas Meta', category: 'Meta Ads' },
  { id: 'creative_performance', label: 'Criativos', category: 'Meta Ads' },
  { id: 'reach_frequency', label: 'Alcance & Frequência', category: 'Meta Ads' },
  { id: 'placements_chart', label: 'Posicionamentos', category: 'Meta Ads' },
  { id: 'custom_audiences', label: 'Públicos Personal.', category: 'Meta Ads' },
  { id: 'format_breakdown', label: 'Formatos', category: 'Meta Ads' },
  { id: 'top_creatives', label: 'Top Criativos', category: 'Meta Ads' },
  { id: 'pixel_events', label: 'Eventos Pixel', category: 'Meta Ads' },
  { id: 'catalog_sales', label: 'Vendas Catálogo', category: 'Meta Ads' },
  { id: 'attribution_model', label: 'Modelo Atribuição', category: 'Meta Ads' },
  { id: 'engagement_chart', label: 'Engajamento', category: 'Meta Ads' },
];

const PAGE_HEIGHT_LIMIT = 850; // Altura útil estimada por página em pixels

const WIDGET_HEIGHTS: Record<WidgetType, number> = {
  kpis: 600,
  finance_chart: 420,
  distribution: 380,
  funnel: 420,
  conversion_funnel: 400,
  top_campaigns: 400,
  recent_leads: 400,
  notes: 250,
  // Google
  search_terms_table: 500,
  auction_insights: 350,
  top_ads: 400,
  ad_extensions: 300,
  keyword_performance: 450,
  demographics_chart: 350,
  geo_heatmap: 350,
  device_breakdown: 300,
  shopping_performance: 400,
  ga4_behavior: 400,
  conversion_attribution: 350,
  // Meta
  meta_campaigns_table: 450,
  reach_frequency: 350,
  engagement_chart: 350,
  placements_chart: 350,
  custom_audiences: 500,
  creative_performance: 500,
  top_creatives: 500,
  format_breakdown: 350,
  pixel_events: 400,
  catalog_sales: 400,
  attribution_model: 350
};

import { REPORT_TEMPLATES, ReportTemplate } from '../constants/reportTemplates';

export const Reports: React.FC = () => {
  const [selectedWidgets, setSelectedWidgets] = useState<WidgetType[]>(['kpis', 'finance_chart', 'distribution', 'funnel', 'top_campaigns']);
  const [reportTitle, setReportTitle] = useState('Relatório Executivo de Performance');
  const [selectedClientId, setSelectedClientId] = useState<string>(CLIENTS_LIST[1].id);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [startMonth, setStartMonth] = useState<number>(0);
  const [endMonth, setEndMonth] = useState<number>(11);

  // Template State
  const [activePlatform, setActivePlatform] = useState<'google' | 'meta' | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const handleTemplateSelect = (template: ReportTemplate) => {
    setReportTitle(template.title);
    // Ensure we only select widgets that actually exist in AVAILABLE_WIDGETS to avoid crashes types
    // Casting string[] to WidgetType[] safely would be better, but for now assuming template IDs match WidgetTypes
    // In a real scenario, we'd map or filter.
    // Since template widgets are strings, we might need to map them to WidgetType if they are custom.
    // For this MVP, assuming keys match or falling back.
    // Actually, reportTemplates.ts uses generic IDs. Let's filter visible widgets.

    // For now, selecting all template widgets.
    // Note: The template widgets in reportTemplates.ts (e.g. 'search_terms_table') might not exist in Reports.tsx yet. 
    // I need to add them to AVAILABLE_WIDGETS or they won't render. 
    // IMPORTANT: Users asked for templates, but if widgets don't exist, I should map them to existing ones or placeholders.
    // Given the task, I will map them to 'kpis' and 'notes' if missing, but ideally I should add placeholders.

    // Let's filter to only use valid WidgetTypes for now to prevent breaking, 
    // and add new widgets to AVAILABLE_WIDGETS in a subsequent step if needed.
    // Actually, I will just set them and if they don't render, I'll add them to renderWidgetContent.
    setSelectedWidgets(template.widgets as WidgetType[]);
    setSelectedTemplateId(template.id);
  };

  const reportData = useMemo(() => {
    let multiplier = 1;
    let clientName = 'Cliente Selecionado';
    const clientObj = CLIENTS_LIST.find(c => c.id === selectedClientId);
    if (clientObj) clientName = clientObj.name;

    if (selectedClientId === '1') multiplier = 1.5;
    if (selectedClientId === '2') multiplier = 0.1;
    if (selectedClientId === '3') multiplier = 0.4;

    const filteredFinance = RAW_FINANCE_DATA.filter(d => {
      return d.year === selectedYear && d.monthIndex >= startMonth && d.monthIndex <= endMonth;
    }).map(d => ({
      ...d,
      revenue: Math.floor(d.revenue * multiplier),
      spend: Math.floor(d.spend * multiplier)
    }));

    const totalSpend = filteredFinance.reduce((acc, curr) => acc + curr.spend, 0);
    const distributionData = [
      { name: 'Google Ads', value: Math.floor(totalSpend * 0.45) },
      { name: 'Meta Ads', value: Math.floor(totalSpend * 0.35) },
      { name: 'LinkedIn', value: Math.floor(totalSpend * 0.15) },
      { name: 'Outros', value: Math.floor(totalSpend * 0.05) },
    ];

    return {
      clientName,
      kpis: KPIS.map(k => ({
        ...k,
        value: k.label.includes('ROAS')
          ? (parseFloat(k.value.replace('x', '').replace(',', '.')) * (multiplier > 1 ? 1.1 : 0.9)).toFixed(1) + 'x'
          : (parseFloat(k.value.replace(/[^\d,]/g, '').replace('.', '').replace(',', '.')) * multiplier).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        change: Number((k.change * (multiplier > 1 ? 1.2 : 0.8)).toFixed(1))
      })),
      finance: filteredFinance,
      distribution: distributionData,
      funnel: COMPARATIVE_FUNNEL_DATA.map(f => ({
        ...f,
        google: Math.floor(f.google * multiplier),
        meta: Math.floor(f.meta * multiplier)
      })),
      campaigns: CAMPAIGNS_DATA.map(c => ({
        ...c,
        spent: c.spent * multiplier,
        roas: Number((c.roas * (multiplier > 1 ? 1.05 : 0.95)).toFixed(1))
      })),
      leads: LEADS_DATA.map(l => ({
        ...l,
        value: l.value * multiplier
      }))
    };
  }, [selectedClientId, selectedYear, startMonth, endMonth]);

  const toggleWidget = (id: WidgetType) => {
    if (selectedWidgets.includes(id)) {
      setSelectedWidgets(selectedWidgets.filter(w => w !== id));
    } else {
      setSelectedWidgets([...selectedWidgets, id]);
    }
  };

  const handleAction = async (type: 'print' | 'pdf') => {
    const element = document.getElementById('printable-report');
    if (!element) return;

    const originalTitle = document.title;
    document.title = "Gerando Relatório...";

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      if (type === 'print') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write('<html><head><title>Relatório</title></head><body>');
          printWindow.document.write('<img src="' + canvas.toDataURL() + '" style="width:100%;" />');
          printWindow.document.write('</body></html>');
          printWindow.document.close();
          printWindow.print();
        }
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('relatorio_elite.pdf');
      }

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
    } finally {
      document.title = originalTitle;
    }
  };

  const formatCurrency = (val: any) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatK = (val: any) => `R$${(Number(val) / 1000).toFixed(0)} k`;

  const renderWidgetContent = (id: WidgetType) => {
    switch (id) {
      case 'kpis':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
              <Activity size={20} className="text-slate-700" /> Resumo de Performance
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {reportData.kpis.map((kpi, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    {i === 0 ? <DollarSign size={80} /> : i === 1 ? <TrendingUp size={80} /> : <Activity size={80} />}
                  </div>
                  <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-2">{kpi.label}</p>
                  <p className="text-4xl font-black text-gray-900 mb-4 tracking-tight">{kpi.value}</p>
                  <div className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full ${kpi.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {kpi.trend === 'up' ? '▲' : '▼'} {Math.abs(kpi.change)}%
                    <span className="text-gray-400 font-normal ml-1">vs mês anterior</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case 'finance_chart':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
              <BarChart2 size={20} className="text-slate-700" /> Evolução Financeira
            </h3>
            <div className="h-80 border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData.finance} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val: any) => `R$${val / 1000} k`} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [formatCurrency(value), '']}
                  />
                  <Area type="monotone" dataKey="revenue" name="Receita" stroke="#64748b" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" isAnimationActive={false}>
                    <LabelList dataKey="revenue" position="top" formatter={(val: any) => formatK(val)} style={{ fontSize: '10px', fill: '#64748b', fontWeight: 'bold' }} />
                  </Area>
                  <Area type="monotone" dataKey="spend" name="Investimento" stroke="#f43f5e" strokeWidth={2} fill="none" strokeDasharray="5 5" isAnimationActive={false} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        );
      case 'distribution':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
              <PieIcon size={20} className="text-slate-700" /> Distribuição de Verba
            </h3>
            <div className="h-64 border border-gray-100 rounded-xl p-4 bg-white shadow-sm" style={{ minHeight: '256px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={false}
                    label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                  >
                    {reportData.distribution.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        );
      case 'funnel':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Funil de Conversão</h3>
            <div className="h-80 border border-gray-100 rounded-xl p-4 bg-white shadow-sm" style={{ minHeight: '320px' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart layout="vertical" data={reportData.funnel} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} barGap={4}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="stage" type="category" width={80} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#475569' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="google" name="Google Ads" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={false}>
                    <LabelList dataKey="google" position="right" formatter={(val: any) => formatK(val)} style={{ fontSize: '10px', fill: '#64748b', fontWeight: 'bold' }} />
                  </Bar>
                  <Bar dataKey="meta" name="Meta Ads" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={false}>
                    <LabelList dataKey="meta" position="right" formatter={(val: any) => formatK(val)} style={{ fontSize: '10px', fill: '#8b5cf6', fontWeight: 'bold' }} />
                  </Bar>
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        );
      case 'top_campaigns':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Top Campanhas</h3>
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-left text-sm bg-white">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                  <tr>
                    <th className="p-3">Campanha</th>
                    <th className="p-3">Canal</th>
                    <th className="p-3">Investimento</th>
                    <th className="p-3">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.campaigns.slice(0, 5).map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium text-gray-900">{c.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${c.platform === 'google' ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700'}`}>
                          {c.platform.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{formatCurrency(c.spent)}</td>
                      <td className="p-3 font-bold text-green-600">{c.roas}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      case 'recent_leads':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Últimos Leads</h3>
            <div className="space-y-2">
              {reportData.leads.slice(0, 5).map(lead => (
                <div key={lead.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{lead.name}</p>
                      <p className="text-xs text-gray-500">{lead.source}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-900">{formatCurrency(lead.value)}</p>
                    <span className="text-[10px] text-slate-700 font-medium">{lead.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case 'notes':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-200 pb-2">Notas do Consultor</h3>
            <div className="min-h-[120px] bg-yellow-50 border border-yellow-100 rounded-xl p-5 text-sm text-gray-800 leading-relaxed shadow-sm">
              <p className="font-bold mb-2 text-yellow-800">Análise Mensal:</p>
              <p>O desempenho deste mês superou as expectativas, impulsionado principalmente pela campanha de Black Friday no Google Ads. Recomendamos manter o orçamento atual e otimizar os criativos do Meta Ads para o próximo período.</p>
            </div>
          </section>
        );

      // --- CROSS-PLATFORM ---
      case 'conversion_funnel':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
              <TrendingUp size={20} className="text-slate-700" /> Funil Detalhado Cross-Channel
            </h3>
            <div className="h-80 border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CONVERSION_FUNNEL_DETAILED} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }} barSize={30}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="stage" type="category" width={100} tick={{ fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Legend />
                  <Bar dataKey="google" stackId="a" fill="#4285F4" name="Google Ads" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="meta" stackId="a" fill="#C13584" name="Meta Ads" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        );

      // --- GOOGLE ADS WIDGETS ---
      case 'search_terms_table':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Termos de Pesquisa (Top 5)</h3>
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-left text-sm bg-white">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                  <tr>
                    <th className="p-3">Termo</th>
                    <th className="p-3 text-right">Impr.</th>
                    <th className="p-3 text-right">Cliques</th>
                    <th className="p-3 text-right">CTR</th>
                    <th className="p-3 text-right">Conv.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {GOOGLE_SEARCH_TERMS.map((term, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{term.term}</td>
                      <td className="p-3 text-right text-gray-600">{term.impressions}</td>
                      <td className="p-3 text-right text-gray-600">{term.clicks}</td>
                      <td className="p-3 text-right font-bold text-blue-600">{term.ctr}</td>
                      <td className="p-3 text-right text-green-600 font-bold">{term.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      case 'auction_insights':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Informações de Leilão</h3>
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-left text-sm bg-white">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                  <tr>
                    <th className="p-3">Domínio</th>
                    <th className="p-3 text-right">Parc. Impr.</th>
                    <th className="p-3 text-right">Sobreposição</th>
                    <th className="p-3 text-right">Pos. Acima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {GOOGLE_AUCTION_INSIGHTS.map((row, i) => (
                    <tr key={i} className={i === 0 ? "bg-blue-50/50" : "hover:bg-gray-50"}>
                      <td className={`p-3 font-bold ${i === 0 ? 'text-blue-700' : 'text-gray-700'}`}>{row.domain}</td>
                      <td className="p-3 text-right">{row.impressionShare}</td>
                      <td className="p-3 text-right text-gray-500">{row.overlapRate}</td>
                      <td className="p-3 text-right text-gray-500">{row.topOfPageRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      case 'keyword_performance':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Performance de Palavras-chave</h3>
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-left text-sm bg-white">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                  <tr>
                    <th className="p-3">Palavra-chave</th>
                    <th className="p-3">Corresp.</th>
                    <th className="p-3 text-right">Cliques</th>
                    <th className="p-3 text-right">Custo</th>
                    <th className="p-3 text-right">Conv.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {GOOGLE_KEYWORDS.map((kw, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{kw.keyword}</td>
                      <td className="p-3 text-xs text-gray-500">{kw.matchType}</td>
                      <td className="p-3 text-right">{kw.clicks}</td>
                      <td className="p-3 text-right text-gray-600">{formatCurrency(kw.cost)}</td>
                      <td className="p-3 text-right text-green-600 font-bold">{kw.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      case 'demographics_chart':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Perfil Demográfico (Idade)</h3>
            <div className="h-64 border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={GOOGLE_DEMOGRAPHICS} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="ageGroup" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="percentage" name="% Impressões" fill="#4285F4" radius={[4, 4, 0, 0]} barSize={40}>
                    <LabelList dataKey="percentage" position="top" formatter={(val: any) => val + '%'} style={{ fontSize: '10px', fill: '#64748b' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        );
      case 'device_breakdown':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Dispositivos</h3>
            <div className="h-64 border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={GOOGLE_DEVICES}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="clicks"
                  >
                    {GOOGLE_DEVICES.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#4285F4' : index === 1 ? '#34A853' : '#FBBC05'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        );
      // Placeholders for other Google Widgets to avoid crash
      case 'top_ads':
      case 'ad_extensions':
      case 'geo_heatmap':
      case 'shopping_performance':
      case 'ga4_behavior':
      case 'conversion_attribution':
        return (
          <section className="mb-8 opacity-75">
            <h3 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-200 pb-2">{AVAILABLE_WIDGETS.find(w => w.id === id)?.label}</h3>
            <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-gray-400">
              <BarChart2 size={32} className="mb-2" />
              <p className="text-sm">Dados simulados indisponíveis para este widget no momento.</p>
            </div>
          </section>
        );

      // --- META ADS WIDGETS ---
      case 'meta_campaigns_table':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Campanhas Meta Ads</h3>
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-left text-sm bg-white">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                  <tr>
                    <th className="p-3">Campanha</th>
                    <th className="p-3 text-right">Alcance</th>
                    <th className="p-3 text-right">Freq.</th>
                    <th className="p-3 text-right">Compras</th>
                    <th className="p-3 text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {META_CAMPAIGNS.map((camp, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900 text-xs">{camp.name}</td>
                      <td className="p-3 text-right text-gray-600">{camp.reach.toLocaleString()}</td>
                      <td className="p-3 text-right text-gray-500">{camp.frequency}</td>
                      <td className="p-3 text-right text-green-600 font-bold">{camp.purchases}</td>
                      <td className="p-3 text-right font-bold text-blue-600">{camp.roas}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      case 'creative_performance':
      case 'top_creatives':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Top Criativos</h3>
            <div className="grid grid-cols-1 gap-4">
              {META_CREATIVES.map((creative, i) => (
                <div key={i} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                    <img src={creative.thumb} alt={creative.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{creative.name}</p>
                    <p className="text-xs text-gray-500">{creative.type}</p>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">CTR</p>
                      <p className="text-sm font-bold text-blue-600">{creative.ctr}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">ROAS</p>
                      <p className="text-sm font-bold text-green-600">{creative.roas}x</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case 'placements_chart':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Posicionamentos</h3>
            <div className="h-64 border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={META_PLACEMENTS}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="percentage"
                  >
                    {META_PLACEMENTS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        );
      case 'reach_frequency':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Alcance & Frequência (7 Dias)</h3>
            <div className="h-64 border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={META_REACH_FREQUENCY} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Line yAxisId="left" type="monotone" dataKey="reach" name="Alcance" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="frequency" name="Frequência" stroke="#82ca9d" strokeWidth={3} dot={false} />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        );

      // Placeholders for other Meta Widgets
      case 'engagement_chart':
      case 'custom_audiences':
      case 'format_breakdown':
      case 'pixel_events':
      case 'catalog_sales':
      case 'attribution_model':
        return (
          <section className="mb-8 opacity-75">
            <h3 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-200 pb-2">{AVAILABLE_WIDGETS.find(w => w.id === id)?.label}</h3>
            <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-gray-400">
              <BarChart2 size={32} className="mb-2" />
              <p className="text-sm">Dados simulados indisponíveis para este widget no momento.</p>
            </div>
          </section>
        );

      default: return null;
    }
  };

  const widgetChunks = useMemo(() => {
    const chunks: WidgetType[][] = [];
    let currentPage: WidgetType[] = [];
    let currentHeight = 0;

    selectedWidgets.forEach(widget => {
      const height = WIDGET_HEIGHTS[widget] || 300;

      if (currentHeight + height > PAGE_HEIGHT_LIMIT && currentPage.length > 0) {
        chunks.push(currentPage);
        currentPage = [];
        currentHeight = 0;
      }

      currentPage.push(widget);
      currentHeight += height;
    });

    if (currentPage.length > 0) {
      chunks.push(currentPage);
    }

    return chunks;
  }, [selectedWidgets]);

  return (
    <div className="flex flex-col h-full animate-fade-in bg-gray-50/50">
      {/* CONTROLS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 mx-4 mt-4 animate-fade-in-up">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Elite Analytics Hub <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2 align-middle font-normal">{COMPONENT_VERSIONS.Reports}</span></h2>
            <p className="text-sm text-gray-500">Central de Inteligência e Relatórios Executivos</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleAction('print')} className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors" title="Imprimir">
              <Printer size={20} />
            </button>
            <button onClick={() => handleAction('pdf')} className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors" title="Baixar PDF">
              <Download size={20} />
            </button>
          </div>
        </div>

        {/* 1. PLATFORM SELECTOR (TOP LEVEL) */}
        <div className="mb-8">
          <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">1. Escolha a Plataforma</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => { setActivePlatform('google'); setSelectedWidgets(['kpis', 'top_campaigns', 'keyword_performance']); }}
              className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${activePlatform === 'google' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500 ring-offset-2' : 'border-gray-100 hover:border-blue-200 text-gray-600 bg-gray-50'}`}
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center p-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" className="w-full" />
              </div>
              <div className="text-left">
                <span className="block font-bold">Google Ads</span>
                <span className="text-xs opacity-75">Search, Display, Shopping</span>
              </div>
            </button>

            <button
              onClick={() => { setActivePlatform('meta'); setSelectedWidgets(['kpis', 'meta_campaigns_table', 'creative_performance']); }}
              className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${activePlatform === 'meta' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500 ring-offset-2' : 'border-gray-100 hover:border-indigo-200 text-gray-600 bg-gray-50'}`}
            >
              <div className="w-10 h-10 rounded-full bg-[#0668E1] text-white flex items-center justify-center font-bold text-xs p-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5.01 3.69 9.12 8.52 9.88v-6.99H7.9V12.06h2.62V9.8c0-2.61 1.57-4.04 3.9-4.04 1.13 0 2.31.2 2.31.2v2.57h-1.3c-1.29 0-1.69.8-1.69 1.63v1.9h2.87l-.46 2.88h-2.41v6.99c4.83-.76 8.52-4.87 8.52-9.88 0-5.53-4.5-10.02-10-10.02Z" /></svg>
              </div>
              <div className="text-left">
                <span className="block font-bold">Meta Ads</span>
                <span className="text-xs opacity-75">FB, Insta, WhatsApp</span>
              </div>
            </button>

            <button
              onClick={() => { setActivePlatform(null); setSelectedWidgets(['kpis', 'finance_chart', 'distribution']); }}
              className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${activePlatform === null ? 'border-gray-800 bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-2' : 'border-gray-100 hover:border-gray-400 text-gray-600 bg-gray-50'}`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs">
                <Layout size={20} />
              </div>
              <div className="text-left">
                <span className="block font-bold">Visão Geral</span>
                <span className="text-xs opacity-75">Relatório Executivo</span>
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 2. CONFIGURAÇÃO GERAL */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase border-b pb-2 block">2. Configurações</label>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">Título do Relatório</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-slate-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">Cliente</label>
              <div className="relative">
                <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-slate-500 text-sm appearance-none">
                  {CLIENTS_LIST.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Users size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">Período</label>
              <div className="flex gap-2">
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-20 p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none text-sm">
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                </select>
                <div className="flex-1 flex gap-1 items-center bg-gray-50 border border-gray-200 rounded-lg p-1">
                  <select value={startMonth} onChange={(e) => setStartMonth(Number(e.target.value))} className="flex-1 bg-transparent border-none outline-none text-sm p-1">
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <span className="text-gray-400">-</span>
                  <select value={endMonth} onChange={(e) => setEndMonth(Number(e.target.value))} className="flex-1 bg-transparent border-none outline-none text-sm p-1">
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 3. TEMPLATES (Visible only if Platform Selected) */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase border-b pb-2 block">3. Modelos Rápidos</label>
            {!activePlatform ? (
              <p className="text-sm text-gray-400 italic py-2">Selecione Google ou Meta para ver modelos específicos.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {REPORT_TEMPLATES.filter(t => t.platform === activePlatform).map(template => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`text-left p-3 rounded-lg border transition-all hover:bg-gray-50 flex items-center gap-3 ${selectedTemplateId === template.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200'}`}
                    >
                      <div className={`p-1.5 rounded-md ${selectedTemplateId === template.id ? 'bg-white text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <span className={`block text-sm font-bold leading-tight ${selectedTemplateId === template.id ? 'text-primary-900' : 'text-gray-700'}`}>{template.title}</span>
                        <span className="text-[10px] text-gray-500 leading-tight block mt-0.5">{template.description.slice(0, 40)}...</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 4. MÓDULOS (Dynamic Filtering) */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase border-b pb-2 block">4. Conteúdo do Relatório</label>
            <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-1">
              {['Financeiro', 'Marketing', 'Vendas', 'Geral', activePlatform === 'google' ? 'Google Ads' : null, activePlatform === 'meta' ? 'Meta Ads' : null].filter(Boolean).map(category => {
                const widgets = AVAILABLE_WIDGETS.filter(w => w.category === category);
                if (widgets.length === 0) return null;

                return (
                  <div key={category} className="w-full">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 mt-1">{category}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {widgets.map(w => (
                        <button
                          key={w.id}
                          onClick={() => toggleWidget(w.id)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${selectedWidgets.includes(w.id) ? 'bg-slate-800 border-slate-800 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* REPORT PREVIEW */}
      <div id="printable-report" className="flex flex-col items-center pb-10">
        {widgetChunks.map((chunk, pageIndex) => (
          <div key={pageIndex} className="bg-white shadow-2xl mx-auto w-full max-w-[210mm] min-h-[297mm] p-[15mm] mb-8 page-break">

            {/* Header */}
            <header className="flex justify-between items-end border-b-2 border-gray-900 pb-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-900 text-white flex items-center justify-center rounded-xl shadow-lg">
                  <Layout size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-1">{reportTitle}</h1>
                  <p className="text-sm text-gray-500 font-medium">Gerado em {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{reportData.clientName}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full mt-1">
                  <Calendar size={14} />
                  {MONTHS[startMonth]}/{selectedYear} - {MONTHS[endMonth]}/{selectedYear}
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="space-y-8">
              {chunk.map(widgetId => (
                <div key={widgetId} className="break-inside-avoid">
                  {renderWidgetContent(widgetId)}
                </div>
              ))}
            </div>

            {/* Footer */}
            <footer className="mt-auto pt-8 border-t border-gray-100 text-center">
              <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                <span>EliteFinder Intelligence</span>
                <span>Página {pageIndex + 1} de {widgetChunks.length}</span>
                <span>Confidencial</span>
              </div>
            </footer>
          </div>
        ))}
      </div>
    </div>
  );
};
