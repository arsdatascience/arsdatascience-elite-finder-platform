import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lead, LeadStatus } from '@/types';
import { COMPONENT_VERSIONS } from '@/componentVersions';
import {
  CheckCircle, Plus, Download, Save,
  MoreVertical, Tag, Users, Search, X,
  Phone, Mail, MessageSquare, Target, TrendingUp, DollarSign, Calendar
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import socketService from '@/services/socket';

// Animation Variants matching Dashboard
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

const COLUMNS: { id: LeadStatus; label: string; color: string; bgColor: string }[] = [
  { id: LeadStatus.NEW, label: 'Novos Leads', color: 'border-blue-500', bgColor: 'bg-blue-50' },
  { id: LeadStatus.IN_PROGRESS, label: 'Em Atendimento', color: 'border-yellow-500', bgColor: 'bg-yellow-50' },
  { id: LeadStatus.WAITING, label: 'Aguardando', color: 'border-orange-500', bgColor: 'bg-orange-50' },
  { id: LeadStatus.CLOSED_WON, label: 'Fechado', color: 'border-green-500', bgColor: 'bg-green-50' },
  { id: LeadStatus.CLOSED_LOST, label: 'Perdido', color: 'border-red-500', bgColor: 'bg-red-50' }
];
const SUGGESTED_TAGS = ["Quente", "Interessado", "Reunião Agendada", "Sem Resposta", "Cliente Antigo", "Indicação"];

interface LeadModalProps {
  lead?: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  mode: 'create' | 'edit';
}

const LeadModal: React.FC<LeadModalProps> = ({ lead, isOpen, onClose, onSave, mode }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    company: '',
    email: '',
    phone: '',
    value: 0,
    source: 'manual',
    status: LeadStatus.NEW,
    notes: '',
    tags: [],
    productInterest: 'Geral',
    assignedTo: 'Você'
  });

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (mode === 'edit' && lead) {
      setFormData({
        ...lead,
        tags: lead.tags || [],
        notes: lead.notes || ''
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        value: 0,
        source: 'manual',
        status: LeadStatus.NEW,
        notes: '',
        tags: [],
        productInterest: 'Geral',
        assignedTo: 'Você'
      });
    }
  }, [lead, mode, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof Lead, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleAddTag = (tagToAdd?: string) => {
    const tag = tagToAdd || newTag;
    if (!tag.trim()) return;
    const currentTags = formData.tags || [];
    if (!currentTags.includes(tag)) {
      handleInputChange('tags', [...currentTags, tag]);
    }
    setNewTag('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = formData.tags || [];
    handleInputChange('tags', currentTags.filter(t => t !== tagToRemove));
  };

  const handleQuickAction = (action: 'call' | 'email' | 'whatsapp' | 'schedule') => {
    switch (action) {
      case 'call':
        if (!formData.phone) return alert('Telefone não informado');
        window.location.href = `tel:${formData.phone}`;
        break;
      case 'email':
        if (!formData.email) return alert('Email não informado');
        window.location.href = `mailto:${formData.email}`;
        break;
      case 'whatsapp':
        if (!formData.phone) return alert('Telefone não informado');
        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (cleanPhone) window.open(`https://wa.me/55${cleanPhone}`, '_blank');
        else alert('Telefone inválido');
        break;
      case 'schedule':
        navigate('/social-calendar', { state: { leadToSchedule: formData } });
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1 mr-4">
              <h2 className="text-2xl font-bold mb-1">
                {mode === 'create' ? 'Novo Lead' : formData.name}
              </h2>
              {mode === 'edit' && formData.company && (
                <p className="text-blue-100 text-lg">{formData.company}</p>
              )}
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Ações Rápidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button type="button" onClick={() => handleQuickAction('call')} className="flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg transition-colors">
                  <Phone size={16} /> <span className="text-sm font-medium">Ligar</span>
                </button>
                <button type="button" onClick={() => handleQuickAction('email')} className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg transition-colors">
                  <Mail size={16} /> <span className="text-sm font-medium">Email</span>
                </button>
                <button type="button" onClick={() => handleQuickAction('whatsapp')} className="flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-3 rounded-lg transition-colors">
                  <MessageSquare size={16} /> <span className="text-sm font-medium">WhatsApp</span>
                </button>
                <button type="button" onClick={() => handleQuickAction('schedule')} className="flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-3 rounded-lg transition-colors">
                  <Calendar size={16} /> <span className="text-sm font-medium">Agendar</span>
                </button>
              </div>
            </div>

            {/* General Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase border-b pb-2">Informações Gerais</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                <input
                  required
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Empresa</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.company}
                  onChange={e => handleInputChange('company', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Telefone</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>

            {/* Deal Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase border-b pb-2">Detalhes do Negócio</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.status}
                  onChange={e => handleInputChange('status', e.target.value)}
                >
                  <option value="NEW">Novo Lead</option>
                  <option value="IN_PROGRESS">Em Atendimento</option>
                  <option value="WAITING">Aguardando</option>
                  <option value="CLOSED_WON">Venda Realizada</option>
                  <option value="CLOSED_LOST">Perdido</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Valor (R$)</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.value}
                  onChange={e => handleInputChange('value', Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Origem</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.source}
                  onChange={e => handleInputChange('source', e.target.value)}
                >
                  <option value="manual">Manual / Prospecção</option>
                  <option value="indication">Indicação</option>
                  <option value="social">Redes Sociais</option>
                  <option value="website">Site / Blog</option>
                  <option value="ads">Google / Meta Ads</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Responsável</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.assignedTo}
                  onChange={e => handleInputChange('assignedTo', e.target.value)}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="md:col-span-2 space-y-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase border-b pb-2">Tags</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags?.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 group">
                    <Tag size={12} />
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 text-gray-400 hover:text-red-500">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>

              {isAddingTag ? (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Nova tag..."
                      autoFocus
                    />
                    <button type="button" onClick={() => handleAddTag()} className="text-blue-600 hover:text-blue-800"><CheckCircle size={16} /></button>
                    <button type="button" onClick={() => setIsAddingTag(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_TAGS.filter(t => !formData.tags?.includes(t)).map(tag => (
                      <button type="button" key={tag} onClick={() => handleAddTag(tag)} className="text-xs bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 px-2 py-1 rounded-md transition-all shadow-sm">
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setIsAddingTag(true)} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors">
                  + Adicionar Tag
                </button>
              )}
            </div>

            {/* Notes */}
            <div className="md:col-span-2 space-y-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase border-b pb-2">Notas e Observações</h3>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Detalhes importantes sobre este lead..."
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-32"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-200">
              <Save size={18} /> {mode === 'create' ? 'Criar Lead' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const FlightControl: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedValue, setSelectedValue] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [localLeads, setLocalLeads] = useState<Lead[]>([]);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);



  useEffect(() => {
    // Connect Socket
    socketService.connect();

    // Listen for lead updates
    socketService.on('lead_updated', (updatedLead: any) => {
      console.log('Lead updated via socket:', updatedLead);
      setLocalLeads(prev => {
        const exists = prev.find(l => l.id === updatedLead.id);
        if (exists) {
          return prev.map(l => l.id === updatedLead.id ? {
            ...l,
            status: (updatedLead.status || 'NEW').toUpperCase() as LeadStatus,
            value: Number(updatedLead.value),
            notes: updatedLead.notes,
            lastContact: new Date(updatedLead.updated_at || updatedLead.created_at).toLocaleDateString()
          } : l);
        } else {
          // New lead (optional, if we emit lead_created too)
          return prev;
        }
      });
    });

    // Fetch Clients
    fetch(`${import.meta.env.VITE_API_URL}/api/clients`)
      .then(res => res.json())
      .then(data => setClients(data))
      .catch(err => console.error('Erro ao buscar clientes:', err));

    fetchLeads();

    return () => {
      socketService.off('lead_updated');
      socketService.disconnect();
    };
  }, []);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const adaptedLeads: Lead[] = data.map((l: any) => ({
          id: l.id,
          name: l.name,
          email: l.email,
          phone: l.phone,
          company: l.company,
          source: l.source,
          status: (l.status || 'NEW').toUpperCase() as LeadStatus,
          value: Number(l.value),
          notes: l.notes,
          assignedTo: l.assigned_to || 'Não atribuído',
          lastContact: new Date(l.updated_at || l.created_at).toLocaleDateString(),
          productInterest: 'Geral',
          tags: [],
          clientId: l.client_id
        }));
        setLocalLeads(adaptedLeads);
      }
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
    }
  };


  // Filter leads
  const filteredLeads = useMemo(() => {
    return localLeads.filter(lead => {
      // Client filter
      if (selectedClient !== 'all') {
        if (lead.clientId !== Number(selectedClient)) return false;
      }

      // Search filter
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
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

  const handleAddLead = async (newLead: any) => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...newLead,
        status: newLead.status.toLowerCase()
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedLead = await res.json();
        const adapted: Lead = {
          id: savedLead.id,
          name: savedLead.name,
          email: savedLead.email,
          phone: savedLead.phone,
          company: savedLead.company,
          source: savedLead.source,
          status: (savedLead.status || 'NEW').toUpperCase() as LeadStatus,
          value: Number(savedLead.value),
          notes: savedLead.notes,
          assignedTo: 'Você',
          lastContact: new Date().toLocaleDateString(),
          productInterest: 'Geral',
          tags: []
        };
        setLocalLeads([adapted, ...localLeads]);
      } else {
        alert('Erro ao criar lead');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão');
    }
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

  const handleDrop = async (newStatus: LeadStatus) => {
    if (!draggedLead) return;

    // Otimistic Update
    const oldLeads = [...localLeads];
    setLocalLeads(prev => prev.map(lead =>
      lead.id === draggedLead.id ? { ...lead, status: newStatus } : lead
    ));
    setDraggedLead(null);

    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL}/api/leads/${draggedLead.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus.toLowerCase() })
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setLocalLeads(oldLeads); // Revert
      alert('Erro ao atualizar status');
    }
  };

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    // Otimistic Update
    setLocalLeads(prev => prev.map(lead =>
      lead.id === leadId ? { ...lead, ...updates } : lead
    ));

    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL}/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      alert('Erro ao salvar alterações');
    }
  };

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const sources = Array.from(new Set(localLeads.map(l => l.source)));
  const assignees = Array.from(new Set(localLeads.map(l => l.assignedTo)));



  return (
    <>
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              Controle de Voo <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2 align-middle">{COMPONENT_VERSIONS.FlightControl}</span>
              <span className="text-xs font-normal bg-slate-800 text-white px-2 py-1 rounded animate-pulse">AO VIVO</span>
            </h2>
            <p className="text-gray-500 text-sm">Gestão operacional de leads em tempo real</p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Users size={16} />
              </div>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 shadow-sm outline-none"
              >
                <option value="all">Todos os Clientes</option>
                {clients.map((client: any) => (
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
          </motion.div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg transform hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between mb-2">
              <Target size={20} className="opacity-80" />
              <TrendingUp size={16} className="opacity-60" />
            </div>
            <p className="text-2xl font-bold">{metrics.totalLeads}</p>
            <p className="text-xs text-blue-100">Total de Leads</p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg transform hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between mb-2">
              <DollarSign size={20} className="opacity-80" />
              <TrendingUp size={16} className="opacity-60" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</p>
            <p className="text-xs text-green-100">Pipeline Total</p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg transform hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle size={20} className="opacity-80" />
              <TrendingUp size={16} className="opacity-60" />
            </div>
            <p className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
            <p className="text-xs text-purple-100">Taxa de Conversão</p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-xl shadow-lg transform hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between mb-2">
              <DollarSign size={20} className="opacity-80" />
              <TrendingUp size={16} className="opacity-60" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.avgDealSize)}</p>
            <p className="text-xs text-orange-100">Ticket Médio</p>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
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
        </motion.div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-6 min-h-[600px]">
          {COLUMNS.map(column => (
            <div
              key={column.id}
              className={`flex-1 min-w-[300px] rounded-xl ${column.bgColor} p-4 flex flex-col gap-3`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              <div className={`flex items-center justify-between pb-3 border-b-2 ${column.color} mb-2`}>
                <h3 className="font-bold text-gray-700">{column.label}</h3>
                <span className="bg-white px-2 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                  {getLeadsByStatus(column.id).length}
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-3">
                {getLeadsByStatus(column.id).map(lead => (
                  <motion.div
                    key={lead.id}
                    layoutId={lead.id}
                    draggable
                    onDragStart={() => handleDragStart(lead)}
                    onClick={() => setSelectedLead(lead)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-all group relative"
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
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

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
    </>
  );
};
