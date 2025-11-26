
import React, { useState, useMemo } from 'react';
import { Printer, Layout, TrendingUp, Users, PieChart as PieIcon, Download, BarChart2, Activity, DollarSign, Calendar } from 'lucide-react';
import { KPIS, COMPARATIVE_FUNNEL_DATA, CAMPAIGNS_DATA, LEADS_DATA, CLIENTS_LIST } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, LabelList, Legend } from 'recharts';
import { COMPONENT_VERSIONS } from '../componentVersions';

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

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

type WidgetType = 'kpis' | 'finance_chart' | 'funnel' | 'distribution' | 'top_campaigns' | 'recent_leads' | 'notes';

interface Widget {
  id: WidgetType;
  label: string;
  category: 'Financeiro' | 'Marketing' | 'Vendas' | 'Geral';
}

const AVAILABLE_WIDGETS: Widget[] = [
  { id: 'kpis', label: 'Resumo de KPIs', category: 'Financeiro' },
  { id: 'finance_chart', label: 'Evolução Financeira', category: 'Financeiro' },
  { id: 'distribution', label: 'Distribuição de Verba', category: 'Financeiro' },
  { id: 'funnel', label: 'Funil de Conversão', category: 'Marketing' },
  { id: 'top_campaigns', label: 'Top Campanhas', category: 'Marketing' },
  { id: 'recent_leads', label: 'Últimos Leads', category: 'Vendas' },
  { id: 'notes', label: 'Observações', category: 'Geral' },
];

const ITEMS_PER_PAGE = 3; // Ajustado para layout mais espaçoso

export const Reports: React.FC = () => {
  const [selectedWidgets, setSelectedWidgets] = useState<WidgetType[]>(['kpis', 'finance_chart', 'distribution', 'funnel', 'top_campaigns']);
  const [reportTitle, setReportTitle] = useState('Relatório Executivo de Performance');
  const [selectedClientId, setSelectedClientId] = useState<string>(CLIENTS_LIST[1].id);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [startMonth, setStartMonth] = useState<number>(0);
  const [endMonth, setEndMonth] = useState<number>(11);

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

  const handleAction = (type: 'print' | 'pdf') => {
    const printContent = document.getElementById('printable-report');
    if (!printContent) return;

    // Criar um iframe oculto ou nova janela para impressão limpa
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    if (!printWindow) {
      alert('Por favor, permita popups para imprimir o relatório.');
      return;
    }

    // Coletar estilos atuais
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('');

    const title = `${reportData.clientName} - Relatório ${selectedYear}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          ${styles}
          <style>
            body { 
              background: white; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
              margin: 0;
              padding: 0;
            }
            /* Resetar margens e paddings do container principal para impressão */
            #print-root {
              width: 100%;
            }
            /* Ajuste da classe de quebra de página */
            .page-break { 
              page-break-after: always; 
              break-after: page;
              display: block;
              min-height: 297mm; /* Garantir altura A4 */
              height: auto;
              margin-bottom: 0;
              padding: 15mm; /* Restaurar padding se necessário */
            }
            /* Garantir que gráficos apareçam */
            .recharts-wrapper { width: 100% !important; height: 100% !important; }
            svg { overflow: visible !important; }
            
            /* Ocultar elementos desnecessários se houver */
            .print\\:hidden { display: none !important; }
          </style>
        </head>
        <body>
          <div id="print-root">
            ${printContent.innerHTML}
          </div>
          <script>
            // Aguardar carregamento de imagens/fontes antes de imprimir
            window.onload = () => {
              setTimeout(() => {
                window.print();
                // window.close();
              }, 1500); // Um pouco mais de tempo para garantir renderização dos gráficos
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const formatCurrency = (val: any) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatK = (val: any) => `R$${(Number(val) / 1000).toFixed(0)} k`;

  const renderWidgetContent = (id: WidgetType) => {
    switch (id) {
      case 'kpis':
        return (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
              <Activity size={20} className="text-blue-600" /> Resumo de Performance
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {reportData.kpis.map((kpi, i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                    {i === 0 ? <DollarSign size={40} /> : i === 1 ? <TrendingUp size={40} /> : <Activity size={40} />}
                  </div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">{kpi.label}</p>
                  <p className="text-2xl font-black text-gray-900 mb-2">{kpi.value}</p>
                  <div className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${kpi.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
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
              <BarChart2 size={20} className="text-indigo-600" /> Evolução Financeira
            </h3>
            <div className="h-80 border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData.finance} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val: any) => `R$${val / 1000} k`} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [formatCurrency(value), '']}
                  />
                  <Area type="monotone" dataKey="revenue" name="Receita" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)">
                    <LabelList dataKey="revenue" position="top" formatter={(val: any) => formatK(val)} style={{ fontSize: '10px', fill: '#3b82f6', fontWeight: 'bold' }} />
                  </Area>
                  <Area type="monotone" dataKey="spend" name="Investimento" stroke="#f43f5e" strokeWidth={2} fill="none" strokeDasharray="5 5" />
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
              <PieIcon size={20} className="text-purple-600" /> Distribuição de Verba
            </h3>
            <div className="h-64 border border-gray-100 rounded-xl p-4 bg-white shadow-sm flex items-center justify-center">
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
            <div className="h-80 border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={reportData.funnel} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} barGap={4}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="stage" type="category" width={80} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#475569' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="google" name="Google Ads" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                    <LabelList dataKey="google" position="right" formatter={(val: any) => formatK(val)} style={{ fontSize: '10px', fill: '#3b82f6', fontWeight: 'bold' }} />
                  </Bar>
                  <Bar dataKey="meta" name="Meta Ads" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20}>
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
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${c.platform === 'google' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
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
                    <span className="text-[10px] text-blue-600 font-medium">{lead.status}</span>
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
      default: return null;
    }
  };

  const widgetChunks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < selectedWidgets.length; i += ITEMS_PER_PAGE) {
      chunks.push(selectedWidgets.slice(i, i + ITEMS_PER_PAGE));
    }
    return chunks;
  }, [selectedWidgets]);

  return (
    <div className="flex flex-col h-full animate-fade-in bg-gray-50/50">
      {/* CONTROLS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 mx-4 mt-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Elite Analytics Hub <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2 align-middle font-normal">{COMPONENT_VERSIONS.Reports}</span></h2>
            <p className="text-sm text-gray-500">Central de Inteligência e Relatórios Executivos</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleAction('print')} className="px-4 py-2 rounded-lg border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all">
              <Printer size={18} /> Imprimir
            </button>
            <button onClick={() => handleAction('pdf')} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all">
              <Download size={18} /> Exportar PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Título do Relatório</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Cliente</label>
            <div className="relative">
              <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-indigo-500">
                {CLIENTS_LIST.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Users size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Período</label>
            <div className="flex gap-2">
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-20 p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none">
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </select>
              <select value={startMonth} onChange={(e) => setStartMonth(Number(e.target.value))} className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none">
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <span className="self-center text-gray-400">-</span>
              <select value={endMonth} onChange={(e) => setEndMonth(Number(e.target.value))} className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none">
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Módulos</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_WIDGETS.map(w => (
                <button
                  key={w.id}
                  onClick={() => toggleWidget(w.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedWidgets.includes(w.id) ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* REPORT PAGES - ID ADICIONADO AQUI */}
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
