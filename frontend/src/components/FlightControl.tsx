import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Filter, Plus, Search, MoreVertical, Phone, Mail,
  Calendar, DollarSign, Tag, AlertCircle, CheckCircle,
  Clock, ArrowRight, TrendingUp, Target, Download
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
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

export const FlightControl: React.FC = () => {
  // --- State ---
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedValue, setSelectedValue] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [clients, setClients] = useState<any[]>([]);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    fetchLeads();
    fetchClients();
  }, [selectedClient]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
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
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    const updatedLeads = leads.map(lead => {
      if (lead.id === draggableId) {
        return { ...lead, status: destination.droppableId as LeadStatus };
      }
      return lead;
    });

    setLeads(updatedLeads);

    try {
      await apiClient.leads.updateLeadStatus(draggableId, destination.droppableId);
    } catch (error) {
      console.error('Error updating lead status:', error);
      fetchLeads(); // Revert on error
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

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Nome,Email,Telefone,Status,Valor,Origem\n"
      + leads.map(l => `${l.name},${l.email},${l.phone},${l.status},${l.value},${l.source}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leads_export.csv");
    document.body.appendChild(link);
    link.click();
  };

  // --- Filtering ---
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = selectedSource === 'all' || lead.source === selectedSource;
    const matchesAssignee = selectedAssignee === 'all' || lead.assignedTo === selectedAssignee;

    let matchesValue = true;
    if (selectedValue === 'high') matchesValue = lead.value > 10000;
    if (selectedValue === 'medium') matchesValue = lead.value >= 3000 && lead.value <= 10000;
    if (selectedValue === 'low') matchesValue = lead.value < 3000;

    return matchesSearch && matchesSource && matchesValue && matchesAssignee;
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

  const sources = Array.from(new Set(leads.map(l => l.source)));
  const assignees = Array.from(new Set(leads.map(l => l.assignedTo).filter(Boolean)));

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-blue-600" /> Controle de Voo
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2 align-middle">{COMPONENT_VERSIONS.FlightControl}</span>
          </h1>
          <p className="text-gray-500 mt-1">Gestão operacional de leads em tempo real</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <div className="relative">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <option value="all">Todos os Clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-1"></div>

          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
          >
            <Download size={16} /> Exportar
          </button>
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all text-sm"
          >
            <Plus size={16} /> Novo Lead
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8">
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
          <option value="all">Todas as Origens</option>
          {sources.map(source => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>
        <select
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedValue}
          onChange={(e) => setSelectedValue(e.target.value)}
        >
          <option value="all">Qualquer Valor</option>
          <option value="high">Alto Ticket ({'>'} 10k)</option>
          <option value="medium">Médio (3k - 10k)</option>
          <option value="low">Baixo ({'<'} 3k)</option>
        </select>
        <select
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
        >
          <option value="all">Todos Responsáveis</option>
          {assignees.map(assignee => (
            <option key={assignee} value={assignee}>{assignee}</option>
          ))}
        </select>
      </div>

      {/* Kanban Board */}
      <div className="w-full overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max pb-4 px-1">
          <DragDropContext onDragEnd={handleDragEnd}>
            {COLUMNS.map(column => (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`w-[320px] flex-shrink-0 rounded-xl ${column.bgColor} p-4 flex flex-col gap-3 min-h-[600px] border border-transparent ${snapshot.isDraggingOver ? 'border-blue-300 shadow-md' : ''} transition-all`}
                  >
                    <div className={`flex items-center justify-between pb-3 border-b-2 ${column.color} mb-2`}>
                      <h3 className="font-bold text-gray-700">{column.label}</h3>
                      <span className="bg-white px-2 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                        {getLeadsByStatus(column.id).length}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col gap-3">
                      {getLeadsByStatus(column.id).map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedLead(lead)}
                              style={{ ...provided.draggableProps.style }}
                              className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-all group relative ${snapshot.isDragging ? 'shadow-lg rotate-2 scale-105 z-50' : ''}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-800 line-clamp-1">{lead.name}</h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLead(lead);
                                  }}
                                  className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical size={14} />
                                </button>
                              </div>

                              <div className="space-y-2 mb-3">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Mail size={12} />
                                  <span className="truncate">{lead.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Phone size={12} />
                                  <span>{lead.phone}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {lead.source}
                                </span>
                                <span className="text-sm font-bold text-green-600">
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
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </DragDropContext>
        </div>
      </div>

      {/* Modals */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={(updates) => handleUpdateLead(selectedLead.id, updates)}
          mode="edit"
        />
      )}

      {showNewLeadModal && (
        <LeadModal
          isOpen={showNewLeadModal}
          onClose={() => setShowNewLeadModal(false)}
          onSave={handleAddLead}
          mode="create"
        />
      )}
    </div>
  );
};
