import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus } from '@/types';
import { COMPONENT_VERSIONS } from '@/componentVersions';
import { LEADS_DATA, CLIENTS_LIST } from '@/constants';
import {
  CheckCircle, XCircle, Zap, FileText, Plus, Download, Save,
  MoreVertical, Clock, Tag, Users, Filter, Search, X,
  Phone, Mail, MessageSquare, User, Target, TrendingUp, DollarSign, Calendar
} from 'lucide-react';

const COLUMNS: { id: LeadStatus; label: string; color: string; bgColor: string }[] = [
  { id: LeadStatus.NEW, label: 'Novos Leads', color: 'border-blue-500', bgColor: 'bg-blue-50' },
  { id: LeadStatus.IN_PROGRESS, label: 'Em Atendimento', color: 'border-yellow-500', bgColor: 'bg-yellow-50' },
  { id: LeadStatus.WAITING, label: 'Aguardando', color: 'border-orange-500', bgColor: 'bg-orange-50' },
  { id: LeadStatus.CLOSED_WON, label: 'Venda Realizada', color: 'border-green-500', bgColor: 'bg-green-50' },
  { id: LeadStatus.CLOSED_LOST, label: 'Perdido', color: 'border-gray-500', bgColor: 'bg-gray-50' },
];

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: (leadId: string, updates: Partial<Lead>) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose, onUpdate }) => {
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">{lead.name}</h2>
              <p className="text-blue-100 text-sm">{lead.productInterest}</p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
              {lead.source}
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
              R$ {lead.value.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Ações Rápidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button className="flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg transition-colors">
                  <Phone size={16} />
                  <span className="text-sm font-medium">Ligar</span>
                </button>
                <button className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg transition-colors">
                  <Mail size={16} />
                  <span className="text-sm font-medium">Email</span>
                </button>
                <button className="flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-3 rounded-lg transition-colors">
                  <MessageSquare size={16} />
                  <span className="text-sm font-medium">WhatsApp</span>
                </button>
                <button className="flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-3 rounded-lg transition-colors">
                  <Calendar size={16} />
                  <span className="text-sm font-medium">Agendar</span>
                </button>
              </div>
            </div>

            {/* Lead Info */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Informações</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User size={16} className="text-gray-400" />
                  <span className="text-gray-600">Responsável:</span>
                  <span className="font-medium">{lead.assignedTo}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-gray-600">Último contato:</span>
                  <span className="font-medium">{lead.lastContact}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Target size={16} className="text-gray-400" />
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium capitalize">{lead.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {lead.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
                <button className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-100">
                  + Adicionar
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Timeline de Atividades</h3>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Lead criado</p>
                    <p className="text-xs text-gray-500">Há 2 horas via {lead.source}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Phone size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Primeira ligação realizada</p>
                    <p className="text-xs text-gray-500">Há 1 hora por {lead.assignedTo}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Adicionar Nota</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Digite suas observações sobre este lead..."
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                rows={4}
              />
              <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Salvar Nota
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: any) => void;
}

const NewLeadModal: React.FC<NewLeadModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'manual',
    status: 'new',
    value: '',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      value: Number(formData.value) || 0,
      id: Math.random().toString(36).substr(2, 9), // Temp ID
      lastContact: new Date().toLocaleDateString(),
      assignedTo: 'Você'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Plus size={24} /> Novo Lead Manual
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Nome Completo *</label>
              <input
                required
                type="text"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Empresa</label>
              <input
                type="text"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
                placeholder="Ex: Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Email *</label>
              <input
                required
                type="email"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="joao@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Telefone / WhatsApp</label>
              <input
                type="text"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Origem</label>
              <select
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
              >
                <option value="manual">Manual / Prospecção</option>
                <option value="indication">Indicação</option>
                <option value="event">Evento</option>
                <option value="social">Redes Sociais</option>
                <option value="website">Site / Blog</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Status Inicial</label>
              <select
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="new">Novo Lead</option>
                <option value="in_progress">Em Atendimento</option>
                <option value="waiting">Aguardando</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Valor Potencial (R$)</label>
              <input
                type="number"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.value}
                onChange={e => setFormData({ ...formData, value: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Observações</label>
            <textarea
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Detalhes importantes sobre este lead..."
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-200">
              <Save size={18} /> Salvar Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const FlightControl: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState(CLIENTS_LIST[1].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedValue, setSelectedValue] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);


  // Filter leads
  const filteredLeads = useMemo(() => {
    return localLeads.filter(lead => {
      // Client filter
      if (selectedClient !== 'all') {
        // Example client-specific filtering logic (adjust as needed)
        if (selectedClient === '1' && lead.value <= 5000) return false;
        if (selectedClient === '2' && lead.value >= 3000) return false;
      }

      // Search filter
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Source filter
      if (selectedSource !== 'all' && lead.source !== selectedSource) {
        return false;
      }

      // Value filter
      if (selectedValue === 'low' && lead.value >= 3000) return false;
      if (selectedValue === 'medium' && (lead.value < 3000 || lead.value > 10000)) return false;
      if (selectedValue === 'high' && lead.value <= 10000) return false;

      // Assignee filter
      if (selectedAssignee !== 'all' && lead.assignedTo !== selectedAssignee) {
        return false;
      }

      return true;
    });
  }, [localLeads, selectedClient, searchTerm, selectedSource, selectedValue, selectedAssignee]);

  const handleAddLead = (newLead: any) => {
    setLocalLeads([newLead, ...localLeads]);
  };

  const handleExport = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Empresa', 'Origem', 'Status', 'Valor', 'Data Contato', 'Responsável', 'Interesse Produto', 'Tags'];
    const csvContent = [
      headers.join(','),
      ...filteredLeads.map(lead => [
        `"${lead.name}"`,
        `"${lead.email}"`,
        `"${lead.phone}"`,
        `"${lead.company || ''}"`,
        `"${lead.source}"`,
        `"${lead.status}"`,
        `"${lead.value}"`,
        `"${lead.lastContact}"`,
        `"${lead.assignedTo}"`,
        `"${lead.productInterest || ''}"`,
        `"${lead.tags ? lead.tags.join(';') : ''}"`
      ].map(field => field.replace(/"/g, '""')).join(',')) // Escape double quotes within fields
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLeadsByStatus = (status: LeadStatus) => filteredLeads.filter(l => l.status === status);

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const totalValue = filteredLeads.reduce((sum, lead) => sum + lead.value, 0);
    const wonLeads = filteredLeads.filter(l => l.status === LeadStatus.CLOSED_WON).length;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    return {
      totalLeads,
      totalValue,
      conversionRate,
      avgDealSize: totalLeads > 0 ? totalValue / totalLeads : 0
    };
  }, [filteredLeads]);

  // Drag & Drop handlers
  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (newStatus: LeadStatus) => {
    if (!draggedLead) return;

    setLocalLeads(prev => prev.map(lead =>
      lead.id === draggedLead.id ? { ...lead, status: newStatus } : lead
    ));
    setDraggedLead(null);
  };

  const handleUpdateLead = (leadId: string, updates: Partial<Lead>) => {
    setLocalLeads(prev => prev.map(lead =>
      lead.id === leadId ? { ...lead, ...updates } : lead
    ));
  };

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const sources = Array.from(new Set(LEADS_DATA.map(l => l.source)));
  const assignees = Array.from(new Set(LEADS_DATA.map(l => l.assignedTo)));

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              Controle de Voo <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2 align-middle">{COMPONENT_VERSIONS.FlightControl}</span>
              <span className="text-xs font-normal bg-slate-800 text-white px-2 py-1 rounded animate-pulse">AO VIVO</span>
            </h2>
            <p className="text-gray-500 text-sm">Gestão operacional de leads em tempo real</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
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

            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <button
              onClick={() => setShowNewLeadModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all"
            >
              <Plus size={18} />
              <span>Lead Manual</span>
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Target size={20} className="opacity-80" />
              <TrendingUp size={16} className="opacity-60" />
            </div>
            <p className="text-2xl font-bold">{metrics.totalLeads}</p>
            <p className="text-xs text-blue-100">Total de Leads</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <DollarSign size={20} className="opacity-80" />
              <TrendingUp size={16} className="opacity-60" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</p>
            <p className="text-xs text-green-100">Pipeline Total</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle size={20} className="opacity-80" />
              <TrendingUp size={16} className="opacity-60" />
            </div>
            <p className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
            <p className="text-xs text-purple-100">Taxa de Conversão</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Target size={20} className="opacity-80" />
              <TrendingUp size={16} className="opacity-60" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.avgDealSize)}</p>
            <p className="text-xs text-orange-100">Ticket Médio</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar lead..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Source Filter */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Todas as Fontes</option>
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>

            {/* Value Filter */}
            <select
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Todos os Valores</option>
              <option value="low">Até R$ 3.000</option>
              <option value="medium">R$ 3.000 - R$ 10.000</option>
              <option value="high">Acima de R$ 10.000</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Todos Responsáveis</option>
              {assignees.map(assignee => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSource('all');
                setSelectedValue('all');
                setSelectedAssignee('all');
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <X size={16} />
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full min-w-[1200px] pb-4">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.id)}
              className="flex-1 flex flex-col bg-gray-50 rounded-xl border-2 border-gray-200 min-w-[280px] transition-all hover:border-gray-300"
            >
              <div className={`p-4 border-t-4 ${col.color} ${col.bgColor} rounded-t-xl shadow-sm`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-700">{col.label}</h3>
                  <span className="bg-white text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    {getLeadsByStatus(col.id).length}
                  </span>
                </div>
              </div>
              <div className="flex-1 p-3 overflow-y-auto space-y-3 flight-scroll">
                {getLeadsByStatus(col.id).map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => handleDragStart(lead)}
                    onClick={() => setSelectedLead(lead)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-move group hover:scale-[1.02]"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${lead.source === 'Google Ads' ? 'bg-blue-50 text-blue-600' :
                        lead.source === 'Instagram' ? 'bg-pink-50 text-pink-600' :
                          'bg-green-50 text-green-600'
                        }`}>
                        {lead.source}
                      </span>
                      <button className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{lead.name}</h4>
                    <p className="text-sm text-gray-500 mb-3">{lead.productInterest}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div className="flex items-center text-xs text-gray-400" title="Last Contact">
                        <Clock size={12} className="mr-1" />
                        {lead.lastContact}
                      </div>
                      <div className="font-semibold text-gray-700 text-sm">
                        {formatCurrency(lead.value)}
                      </div>
                    </div>
                    {lead.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {lead.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="flex items-center text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            <Tag size={8} className="mr-1" /> {tag}
                          </span>
                        ))}
                        {lead.tags.length > 2 && (
                          <span className="text-[10px] text-gray-400">+{lead.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {getLeadsByStatus(col.id).length === 0 && (
                  <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm flex-col gap-2 opacity-70">
                    <Filter size={20} />
                    <span>Nenhum lead</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleUpdateLead}
        />
      )}
    </div>
  );
};
