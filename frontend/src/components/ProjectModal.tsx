import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle, Calendar, DollarSign, Target, Users, BarChart2, Layers, FileText, Globe, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { Project } from '../types';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (projectData: Partial<Project>) => Promise<void>;
    project?: Project; // If provided, we are in Edit mode
    clients?: { id: number; name: string }[];
    users?: { id: number; name: string }[];
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave, project, clients = [], users = [] }) => {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState('basic');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Project>>({
        name: '',
        status: 'planning',
        priority: 'medium',
        budget: 0,
        marketing_channels: [],
        key_milestones: [],
        budget_breakdown: {},
        marketing_objectives: '',
        target_audience: '',
        value_proposition: '',
        brand_positioning: '',
        timeline_activities: '',
        dependencies: '',
        team_structure: [],
        tools_platforms: '',
        external_suppliers: '',
        creative_assets: '',
        kpis: '',
        goals: '',
        analysis_tools: '',
        reporting_frequency: '',
        budget_media: 0,
        budget_production: 0,
        budget_contingency: 0,
        risks: '',
        mitigation_plan: '',
        approval_status: 'pending',
        creative_brief_link: '',
        assets_link: '',
    });

    useEffect(() => {
        if (project) {
            setFormData({
                ...project,
                marketing_channels: typeof project.marketing_channels === 'string' ? JSON.parse(project.marketing_channels) : project.marketing_channels || [],
                key_milestones: typeof project.key_milestones === 'string' ? JSON.parse(project.key_milestones) : project.key_milestones || [],
                budget_breakdown: typeof project.budget_breakdown === 'string' ? JSON.parse(project.budget_breakdown) : project.budget_breakdown || {},
                team_structure: typeof project.team_structure === 'string' ? JSON.parse(project.team_structure) : project.team_structure || [],
            });
        } else {
            // Reset for new project
            setFormData({ name: '', status: 'planning', priority: 'medium' });
        }
    }, [project]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error("Failed to save project", error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'basic', label: 'Visão Geral', icon: FileText },
        { id: 'objectives', label: 'Estratégia', icon: Target },
        { id: 'planning', label: 'Planejamento', icon: Calendar },
        { id: 'resources', label: 'Recursos', icon: Users },
        { id: 'budget', label: 'Orçamento', icon: DollarSign },
        { id: 'metrics', label: 'Métricas', icon: BarChart2 },
        { id: 'risks', label: 'Riscos', icon: AlertTriangle },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Layers className="w-6 h-6 text-purple-600" />
                            {project ? 'Editar Projeto' : 'Novo Projeto Estratégico'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Defina o escopo completo, orçamento e estratégia.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Tabs & Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-64 bg-gray-50 border-r border-gray-100 p-4 space-y-2 overflow-y-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Form Content */}
                    <div className="flex-1 overflow-y-auto p-8 bg-white">
                        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

                            {/* BASIC INFO */}
                            {activeTab === 'basic' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Projeto</label>
                                            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Ex: Campanha Black Friday 2024" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                                            <select name="client_id" value={formData.client_id || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                                                <option value="">Selecione um Cliente</option>
                                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Gerente do Projeto</label>
                                            <select name="owner_id" value={formData.owner_id || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                                                <option value="">Selecione o Responsável</option>
                                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                            <select name="status" value={formData.status || 'planning'} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                                                <option value="planning">Planejamento</option>
                                                <option value="active">Em Andamento</option>
                                                <option value="on_hold">Em Espera</option>
                                                <option value="completed">Concluído</option>
                                                <option value="cancelled">Cancelado</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                                            <select name="priority" value={formData.priority || 'medium'} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                                                <option value="low">Baixa</option>
                                                <option value="medium">Média</option>
                                                <option value="high">Alta</option>
                                                <option value="urgent">Urgente</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                                            <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={4} className="w-full px-4 py-2 border rounded-lg" placeholder="Resumo executivo do projeto..." />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STRATEGY */}
                            {activeTab === 'objectives' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Objetivos de Marketing (SMART)</label>
                                        <textarea name="marketing_objectives" value={formData.marketing_objectives || ''} onChange={handleChange} rows={4} className="w-full px-4 py-2 border rounded-lg" placeholder="Específico, Mensurável, Atingível, Relevante, Temporal..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Público Alvo (Personas)</label>
                                        <textarea name="target_audience" value={formData.target_audience || ''} onChange={handleChange} rows={3} className="w-full px-4 py-2 border rounded-lg" placeholder="Quem queremos atingir?" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Proposta de Valor</label>
                                            <textarea name="value_proposition" value={formData.value_proposition || ''} onChange={handleChange} rows={3} className="w-full px-4 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Posicionamento de Marca</label>
                                            <textarea name="brand_positioning" value={formData.brand_positioning || ''} onChange={handleChange} rows={3} className="w-full px-4 py-2 border rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PLANNING */}
                            {activeTab === 'planning' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                                            <input type="date" name="start_date" value={formData.start_date ? new Date(formData.start_date).toISOString().split('T')[0] : ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                                            <input type="date" name="end_date" value={formData.end_date ? new Date(formData.end_date).toISOString().split('T')[0] : ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Cronograma de Atividades (Macro)</label>
                                        <textarea name="timeline_activities" value={formData.timeline_activities || ''} onChange={handleChange} rows={5} className="w-full px-4 py-2 border rounded-lg" placeholder="Semana 1: Planejamento... Semana 2: Produção..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Dependências e Marcos</label>
                                        <textarea name="dependencies" value={formData.dependencies || ''} onChange={handleChange} rows={3} className="w-full px-4 py-2 border rounded-lg" placeholder="O que precisa acontecer antes?" />
                                    </div>
                                </div>
                            )}

                            {/* RESOURCES */}
                            {activeTab === 'resources' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ferramentas e Plataformas</label>
                                        <textarea name="tools_platforms" value={formData.tools_platforms || ''} onChange={handleChange} rows={3} className="w-full px-4 py-2 border rounded-lg" placeholder="CRM, Ferramentas de Email, Ads Manager..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Fornecedores Externos</label>
                                        <textarea name="external_suppliers" value={formData.external_suppliers || ''} onChange={handleChange} rows={3} className="w-full px-4 py-2 border rounded-lg" placeholder="Listar parceiros ou freelancers necessárions" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ativos Criativos Necessários</label>
                                        <textarea name="creative_assets" value={formData.creative_assets || ''} onChange={handleChange} rows={4} className="w-full px-4 py-2 border rounded-lg" placeholder="Vídeos, Banners, Landing Pages, Copy..." />
                                    </div>
                                </div>
                            )}

                            {/* BUDGET */}
                            {activeTab === 'budget' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Orçamento Total (R$)</label>
                                        <input type="number" name="budget" value={formData.budget || 0} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg text-lg font-bold text-green-700" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Mídia Paga</label>
                                            <input type="number" name="budget_media" value={formData.budget_media || 0} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Produção</label>
                                            <input type="number" name="budget_production" value={formData.budget_production || 0} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Contingência</label>
                                            <input type="number" name="budget_contingency" value={formData.budget_contingency || 0} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* METRICS */}
                            {activeTab === 'metrics' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">KPIs Principais</label>
                                        <textarea name="kpis" value={formData.kpis || ''} onChange={handleChange} rows={3} className="w-full px-4 py-2 border rounded-lg" placeholder="CPA, ROI, ROAS, LTV..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Metas Quantificáveis</label>
                                        <textarea name="goals" value={formData.goals || ''} onChange={handleChange} rows={3} className="w-full px-4 py-2 border rounded-lg" placeholder="Atingir 1000 leads, Vender R$ 50k..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ferramentas de Análise</label>
                                        <input type="text" name="analysis_tools" value={formData.analysis_tools || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" placeholder="GA4, Mixpanel, Hotjar..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Frequência de Report</label>
                                        <select name="reporting_frequency" value={formData.reporting_frequency || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                                            <option value="weekly">Semanal</option>
                                            <option value="biweekly">Quinzenal</option>
                                            <option value="monthly">Mensal</option>
                                            <option value="campaign_end">Ao fim da campanha</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* RISKS */}
                            {activeTab === 'risks' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                        <label className="block text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> Riscos Identificados
                                        </label>
                                        <textarea name="risks" value={formData.risks || ''} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-red-500" placeholder="O que pode dar errado?" />
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                        <label className="block text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> Plano de Mitigação
                                        </label>
                                        <textarea name="mitigation_plan" value={formData.mitigation_plan || ''} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-green-500" placeholder="O que faremos se der errado?" />
                                    </div>
                                    <div className="pt-4 border-t">
                                        <h3 className="font-semibold text-gray-700 mb-4">Links e Aprovações</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Link do Briefing</label>
                                                <div className="flex items-center gap-2">
                                                    <LinkIcon className="w-4 h-4 text-gray-400" />
                                                    <input type="text" name="creative_brief_link" value={formData.creative_brief_link || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" placeholder="URL do Doc" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Link dos Assets</label>
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-gray-400" />
                                                    <input type="text" name="assets_link" value={formData.assets_link || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" placeholder="URL da Pasta (Drive/Dropbox)" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        {loading ? 'Salvando...' : (
                            <>
                                <Save className="w-4 h-4" />
                                Salvar Projeto Completo
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ProjectModal;
