import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Users, Plus, Search, MoreVertical, Phone, Mail,
  CheckCircle, TrendingUp, Target, Loader2, DollarSign,
  LayoutGrid, List as ListIcon, Table as TableIcon, Filter, MessageCircle, User,
  FileText, FileSpreadsheet
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import socketService from '@/services/socket';
import { Lead, LeadStatus } from '@/types';
import { COMPONENT_VERSIONS } from '@/componentVersions';
import { LeadModal } from './LeadModal';

// --- Configuration ---
const COLUMNS = [
  { id: LeadStatus.NEW, label: 'Novos Leads', color: 'border-blue-500', bgColor: 'bg-blue-50' },
  { id: LeadStatus.IN_PROGRESS, label: 'Em Atendimento', color: 'border-yellow-500', bgColor: 'bg-yellow-50' },
  { id: LeadStatus.WAITING, label: 'Aguardando', color: 'border-orange-500', bgColor: 'bg-orange-50' },
  { id: LeadStatus.CLOSED_WON, label: 'Fechado', color: 'border-green-500', bgColor: 'bg-green-50' },
  { id: LeadStatus.CLOSED_LOST, label: 'Perdido', color: 'border-red-500', bgColor: 'bg-red-50' }
];

// --- Droppable Column Component ---
const DroppableColumn = ({ column, leads, children }: { column: any, leads: Lead[], children: React.ReactNode }) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-[270px] flex-shrink-0 rounded-xl ${column.bgColor} p-4 flex flex-col gap-3`}
    >
      <div className={`flex items-center justify-between pb-3 border-b-2 ${column.color} mb-2`}>
        <h3 className="font-bold text-gray-700">{column.label}</h3>
        <span className="bg-white px-2 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm">
          {leads.length}
        </span>
      </div>
      {children}
    </div>
  );
};

// --- Sortable Item Component ---
const SortableItem = ({ lead, onClick, onQuickAction }: { lead: Lead, onClick: () => void, onQuickAction: (action: string, lead: Lead) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: lead.id, data: { type: 'Lead', lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-500 opacity-50 h-[150px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-move transition-all relative"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-gray-800 line-clamp-1 text-sm">{lead.name}</h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="text-gray-400 hover:text-blue-600 transition-all p-1 hover:bg-blue-50 rounded"
          title="Editar Lead"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Mail size={12} />
          <span className="truncate">{lead.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Phone size={12} />
          <span>{lead.phone}</span>
        </div>
        {lead.assignedTo && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <User size={12} />
            <span>{lead.assignedTo}</span>
          </div>
        )}
      </div>

      {/* Quick Actions - Always Visible */}
      <div className="flex justify-center gap-2 py-2 border-t border-gray-50 mt-2">
        <button onClick={(e) => { e.stopPropagation(); onQuickAction('whatsapp', lead); }} className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200" title="WhatsApp">
          <MessageCircle size={14} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onQuickAction('email', lead); }} className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200" title="Email">
          <Mail size={14} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onQuickAction('call', lead); }} className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200" title="Ligar">
          <Phone size={14} />
        </button>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {lead.source}
        </span>
        <span className="text-xs font-bold text-green-600">
          {formatCurrency(lead.value)}
        </span>
      </div>

      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {lead.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
              {tag}
            </span>
          ))}
          {lead.tags.length > 3 && (
            <span className="text-[10px] text-gray-400 px-1">+{lead.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
export const FlightControl: React.FC = () => {
  // --- State ---
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'table'>('kanban');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');

  const [clients, setClients] = useState<any[]>([]);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragStatus, setActiveDragStatus] = useState<LeadStatus | null>(null);

  // --- Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- Data Fetching ---
  useEffect(() => {
    fetchLeads();
    fetchClients();

    // Socket Integration
    const socket = socketService.connect();

    const handleUpdate = (data: any) => {
      console.log('🔄 Real-time update received:', data);
      fetchLeads();
    };

    socket.on('sales_coaching_update', handleUpdate);
    socket.on('lead_update', handleUpdate);

    return () => {
      socket.off('sales_coaching_update', handleUpdate);
      socket.off('lead_update', handleUpdate);
    };
  }, [selectedClient]);

  const fetchLeads = async () => {
    try {
      if (leads.length === 0) setLoading(true);
      const data = await apiClient.leads.getLeads(selectedClient !== 'all' ? selectedClient : undefined);
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await apiClient.clients.getClients();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // --- Handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveDragId(active.id as string);
    const lead = leads.find(l => l.id === active.id);
    if (lead) {
      setActiveDragStatus(lead.status);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveALead = active.data.current?.type === 'Lead';
    if (!isActiveALead) return;

    const activeLead = leads.find(l => l.id === activeId);
    if (!activeLead) return;

    const isOverColumn = COLUMNS.some(col => col.id === overId);
    const isOverLead = active.data.current?.type === 'Lead' && over.data.current?.type === 'Lead';

    let newStatus: LeadStatus | null = null;

    if (isOverColumn) {
      newStatus = overId as LeadStatus;
    } else if (isOverLead) {
      const overLead = leads.find(l => l.id === overId);
      if (overLead) {
        newStatus = overLead.status;
      }
    }

    if (newStatus && newStatus !== activeLead.status) {
      setLeads((prev) => {
        return prev.map(l =>
          l.id === activeId ? { ...l, status: newStatus! } : l
        );
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setActiveDragStatus(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const lead = leads.find(l => l.id === activeId);
    if (!lead) return;

    const isColumn = COLUMNS.some(col => col.id === overId);
    let newStatus = lead.status;

    if (isColumn) {
      newStatus = overId as LeadStatus;
    } else {
      const overLead = leads.find(l => l.id === overId);
      if (overLead) {
        newStatus = overLead.status;
      }
    }

    console.log('DragEnd:', { activeId, activeDragStatus, newStatus });

    if (activeDragStatus && newStatus !== activeDragStatus) {
      try {
        console.log('Sending update to backend...');
        await apiClient.leads.updateLeadStatus(activeId, newStatus);
        console.log('Update success!');
      } catch (error) {
        console.error('Error updating status:', error);
        fetchLeads();
      }
    }
  };

  const handleAddLead = async (leadData: any) => {
    try {
      await apiClient.leads.createLead(leadData);
      fetchLeads();
      setShowNewLeadModal(false);
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  };

  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      await apiClient.leads.updateLead(id, updates);
      fetchLeads();
      setSelectedLead(null);
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleQuickAction = (action: string, lead: Lead) => {
    switch (action) {
      case 'whatsapp':
        window.open(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:${lead.email}`;
        break;
      case 'call':
        window.location.href = `tel:${lead.phone}`;
        break;
    }
  };

  const handleExport = async (type: 'pdf' | 'excel') => {
    try {
      const blob = type === 'pdf'
        ? await apiClient.leads.exportPdf(selectedClient)
        : await apiClient.leads.exportExcel(selectedClient);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads_export.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Erro ao exportar arquivo. Tente novamente.');
    }
  };

  // --- Filtering Logic ---
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSource = selectedSource === 'all' || lead.source === selectedSource;
    const matchesAssignee = selectedAssignee === 'all' || lead.assignedTo === selectedAssignee;
    const matchesMin = !minValue || lead.value >= parseFloat(minValue);
    const matchesMax = !maxValue || lead.value <= parseFloat(maxValue);

    const leadDate = new Date(lead.lastContact || new Date().toISOString());
    const matchesStart = !startDate || leadDate >= new Date(startDate);
    const matchesEnd = !endDate || leadDate <= new Date(endDate + 'T23:59:59');

    return matchesSearch && matchesSource && matchesAssignee && matchesMin && matchesMax && matchesStart && matchesEnd;
  });

  const getLeadsByStatus = (status: string) => filteredLeads.filter(l => l.status === status);

  // --- Metrics ---
  const metrics = {
    totalLeads: leads.length,
    totalValue: leads.reduce((acc, curr) => acc + curr.value, 0),
    conversionRate: leads.length > 0
      ? (leads.filter(l => l.status === LeadStatus.CLOSED_WON).length / leads.length) * 100
      : 0,
    avgDealSize: leads.length > 0
      ? leads.reduce((acc, curr) => acc + curr.value, 0) / leads.length
      : 0
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const DEFAULT_SOURCES = [
    'Google Ads', 'Meta Ads', 'Instagram', 'Facebook', 'LinkedIn',
    'TikTok', 'YouTube', 'Email Marketing', 'WhatsApp', 'Site/Blog',
    'Indicação', 'Evento', 'Outbound', 'Parceria', 'Outros'
  ];

  const uniqueSources = Array.from(new Set(leads.map(l => l.source).filter(Boolean)));
  const sources = Array.from(new Set([...DEFAULT_SOURCES, ...uniqueSources])).sort();
  const assignees = Array.from(new Set(leads.map(l => l.assignedTo).filter(Boolean)));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 p-4 md:p-8 bg-gray-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="text-blue-600" /> Controle de Voo
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2 align-middle">{COMPONENT_VERSIONS.FlightControl}</span>
            </h1>
            <p className="text-gray-500 mt-1">Gestão operacional de leads em tempo real</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
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
              <option value="all">Todos os Clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>

            <button
              onClick={() => setShowNewLeadModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all text-sm"
            >
              <Plus size={16} /> Novo Lead
            </button>

            <div className="h-6 w-px bg-gray-300 mx-1"></div>

            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm border border-red-200"
              title="Exportar PDF"
            >
              <FileText size={18} /> Exportar PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors font-medium text-sm border border-green-200"
              title="Exportar Excel"
            >
              <FileSpreadsheet size={18} /> Exportar XLS
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-50"><Target size={20} className="text-blue-600" /></div>
              <TrendingUp size={16} className="text-green-500" />
            </div>
            <p className="text-sm text-gray-500">Total de Leads</p>
            <h3 className="text-2xl font-bold text-gray-800">{metrics.totalLeads}</h3>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-green-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-green-50"><DollarSign size={20} className="text-green-600" /></div>
              <TrendingUp size={16} className="text-green-500" />
            </div>
            <p className="text-sm text-gray-500">Pipeline Total</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(metrics.totalValue)}</h3>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-purple-50"><CheckCircle size={20} className="text-purple-600" /></div>
              <TrendingUp size={16} className="text-green-500" />
            </div>
            <p className="text-sm text-gray-500">Taxa de Conversão</p>
            <h3 className="text-2xl font-bold text-gray-800">{metrics.conversionRate.toFixed(1)}%</h3>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-orange-50"><DollarSign size={20} className="text-orange-600" /></div>
              <TrendingUp size={16} className="text-green-500" />
            </div>
            <p className="text-sm text-gray-500">Ticket Médio</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(metrics.avgDealSize)}</h3>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
            >
              <option value="all">Origem: Todas</option>
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>

            <select
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
            >
              <option value="all">Responsável: Todos</option>
              {assignees.map(assignee => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-4 items-center border-t border-gray-100 pt-4">
            <span className="text-sm font-medium text-gray-500 flex items-center gap-1"><Filter size={14} /> Filtros Avançados:</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-24">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                <input
                  type="number"
                  placeholder="Min"
                  className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                />
              </div>
              <span className="text-gray-400">-</span>
              <div className="relative w-24">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                />
              </div>
            </div>
            {(searchTerm || selectedSource !== 'all' || selectedAssignee !== 'all' || startDate || endDate || minValue || maxValue) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSource('all');
                  setSelectedAssignee('all');
                  setStartDate('');
                  setEndDate('');
                  setMinValue('');
                  setMaxValue('');
                }}
                className="text-xs text-red-500 hover:text-red-700 font-medium ml-auto"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto pb-[300px]">
        {viewMode === 'kanban' && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-x-auto px-4 md:px-8 pb-4 min-h-[800px]">
              <div className="flex gap-6 min-w-max">
                {COLUMNS.map(column => (
                  <DroppableColumn key={column.id} column={column} leads={getLeadsByStatus(column.id)}>
                    <SortableContext
                      items={getLeadsByStatus(column.id).map(l => l.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex-1 flex flex-col gap-3 min-h-[100px]">
                        {getLeadsByStatus(column.id).map(lead => (
                          <SortableItem
                            key={lead.id}
                            lead={lead}
                            onClick={() => setSelectedLead(lead)}
                            onQuickAction={handleQuickAction}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DroppableColumn>
                ))}
              </div>
            </div>

            <DragOverlay>
              {activeDragId ? (
                <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-blue-500 rotate-2 scale-105 w-[300px]">
                  <h4 className="font-bold text-gray-800">{leads.find(l => l.id === activeDragId)?.name}</h4>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {viewMode === 'list' && (
          <div className="px-4 md:px-8 pb-4">
            <div className="max-w-4xl mx-auto space-y-3">
              {filteredLeads.map(lead => (
                <div key={lead.id} onClick={() => setSelectedLead(lead)} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded-full ${lead.status === LeadStatus.NEW ? 'bg-blue-500' :
                      lead.status === LeadStatus.CLOSED_WON ? 'bg-green-500' :
                        lead.status === LeadStatus.CLOSED_LOST ? 'bg-red-500' : 'bg-gray-300'
                      }`}></div>
                    <div>
                      <h4 className="font-bold text-gray-800">{lead.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Mail size={14} /> {lead.email}</span>
                        <span className="flex items-center gap-1"><Phone size={14} /> {lead.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">{lead.source}</span>
                    <span className="font-bold text-green-600">{formatCurrency(lead.value)}</span>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleQuickAction('whatsapp', lead); }} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><MessageCircle size={18} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleQuickAction('call', lead); }} className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"><Phone size={18} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'table' && (
          <div className="px-4 md:px-8 pb-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-w-[1000px]">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-bold text-gray-600 text-sm">Nome</th>
                    <th className="p-4 font-bold text-gray-600 text-sm">Email</th>
                    <th className="p-4 font-bold text-gray-600 text-sm">Origem</th>
                    <th className="p-4 font-bold text-gray-600 text-sm">Responsável</th>
                    <th className="p-4 font-bold text-gray-600 text-sm">Status</th>
                    <th className="p-4 font-bold text-gray-600 text-sm">Valor</th>
                    <th className="p-4 font-bold text-gray-600 text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map(lead => (
                    <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-800">{lead.name}</td>
                      <td className="p-4 text-gray-600 text-sm">{lead.email}</td>
                      <td className="p-4 text-gray-600 text-sm">{lead.source}</td>
                      <td className="p-4 text-gray-600 text-sm">{lead.assignedTo || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${lead.status === LeadStatus.NEW ? 'bg-blue-100 text-blue-700' :
                          lead.status === LeadStatus.CLOSED_WON ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-green-600">{formatCurrency(lead.value)}</td>
                      <td className="p-4">
                        <button onClick={() => setSelectedLead(lead)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedLead && (
          <LeadModal
            isOpen={!!selectedLead}
            onClose={() => setSelectedLead(null)}
            lead={selectedLead}
            onSave={(data) => handleUpdateLead(selectedLead.id, data)}
            mode="edit"
          />
        )}

        <LeadModal
          isOpen={showNewLeadModal}
          onClose={() => setShowNewLeadModal(false)}
          onSave={handleAddLead}
          mode="create"
        />
      </div>
    </div>
  );
};