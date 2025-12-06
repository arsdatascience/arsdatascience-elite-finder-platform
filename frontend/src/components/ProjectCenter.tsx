import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import {
    Plus,
    Calendar,
    MoreVertical,
    Briefcase,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import { TaskBoard } from './TaskBoard';

interface Project {
    id: number;
    name: string;
    description: string;
    status: string;
    priority: string;
    start_date: string;
    end_date: string;
    owner_name: string;
    client_name?: string;
    total_tasks: number;
    completed_tasks: number;
}

export const ProjectCenter: React.FC = () => {
    const { user } = useAuth();
    const [view, setView] = useState<'portfolio' | 'details'>('portfolio');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<any[]>([]); // Added clients state
    const [loading, setLoading] = useState(true);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);

    const [templates, setTemplates] = useState<any[]>([]); // Templates state

    // New Project State
    const [newProjectData, setNewProjectData] = useState({
        name: '',
        description: '',
        client_id: '',
        priority: 'medium',
        start_date: '',
        end_date: '',
        budget: '',
        status: 'planning',
        template_id: '' // Added template_id
    });

    // Filters
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchProjects();
        fetchClients();
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const data = await apiClient.templates.list();
            setTemplates(data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const data = await apiClient.projects.list();
            setProjects(data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const data = await apiClient.clients.getClients();
            setClients(data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create Project
            const project = await apiClient.projects.create({
                ...newProjectData,
                budget: newProjectData.budget ? parseFloat(newProjectData.budget) : 0,
                client_id: newProjectData.client_id ? parseInt(newProjectData.client_id) : null
            });

            // 2. Apply Template (if selected)
            if (newProjectData.template_id) {
                await apiClient.templates.applyToProject(project.id.toString(), parseInt(newProjectData.template_id));
            }

            setShowNewProjectModal(false);
            setNewProjectData({
                name: '',
                description: '',
                client_id: '',
                priority: 'medium',
                start_date: '',
                end_date: '',
                budget: '',
                status: 'planning',
                template_id: ''
            });
            fetchProjects();
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Erro ao criar projeto');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenProject = (project: Project) => {
        setSelectedProject(project);
        setView('details');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'planning': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'on_hold': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'completed': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-600';
            case 'high': return 'text-orange-600';
            case 'medium': return 'text-yellow-600';
            case 'low': return 'text-blue-600';
            default: return 'text-gray-500';
        }
    };

    // Calculate progress percentage
    const getProgress = (completed: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
    };

    if (view === 'details' && selectedProject) {
        return (
            <div className="h-full flex flex-col bg-gray-50">
                <button
                    onClick={() => {
                        setSelectedProject(null);
                        setView('portfolio');
                        fetchProjects(); // Refresh on back
                    }}
                    className="flex items-center text-gray-600 hover:text-blue-600 mb-4 px-6 pt-4 transition-colors"
                >
                    <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                    Voltar para Portfolio
                </button>
                <TaskBoard project={selectedProject} />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 text-gray-900 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-blue-600" />
                        Gestão de Projetos e Portfolio
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Gerencie seus projetos, tarefas e equipe em um só lugar.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowNewProjectModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Projeto
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="p-6 pb-2 flex gap-4 overflow-x-auto bg-gray-50">
                {[
                    { id: 'all', label: 'Todos' },
                    { id: 'active', label: 'Ativos' },
                    { id: 'planning', label: 'Planejamento' },
                    { id: 'on_hold', label: 'Em Espera' },
                    { id: 'completed', label: 'Concluídos' }
                ].map(status => (
                    <button
                        key={status.id}
                        onClick={() => setFilterStatus(status.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${filterStatus === status.id
                            ? 'bg-blue-100 border-blue-200 text-blue-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                            }`}
                    >
                        {status.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 border-dashed shadow-sm">
                        <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-800 mb-2">Nenhum projeto encontrado</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-8">
                            Comece criando seu primeiro projeto para organizar tarefas e acompanhar o progresso.
                        </p>
                        <button
                            onClick={() => setShowNewProjectModal(true)}
                            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-colors border border-transparent shadow-lg"
                        >
                            Criar Primeiro Projeto
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {projects
                            .filter(p => filterStatus === 'all' || p.status === filterStatus)
                            .map(project => (
                                <div
                                    key={project.id}
                                    onClick={() => handleOpenProject(project)}
                                    className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-300 transition-all cursor-pointer hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)} capitalize`}>
                                            {
                                                {
                                                    'active': 'Ativo',
                                                    'planning': 'Planejamento',
                                                    'on_hold': 'Em Espera',
                                                    'completed': 'Concluído'
                                                }[project.status] || project.status
                                            }
                                        </span>
                                        <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                        {project.name}
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10">
                                        {project.description || 'Sem descrição definida.'}
                                    </p>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-500">Progresso</span>
                                            <span className="text-gray-800 font-medium">{getProgress(project.completed_tasks, project.total_tasks)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                                                style={{ width: `${getProgress(project.completed_tasks, project.total_tasks)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Sem prazo'}
                                        </div>
                                        <div className={`flex items-center text-xs font-medium ${getPriorityColor(project.priority)} capitalize`}>
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            {
                                                {
                                                    'urgent': 'Urgente',
                                                    'high': 'Alta',
                                                    'medium': 'Média',
                                                    'low': 'Baixa'
                                                }[project.priority] || project.priority
                                            }
                                        </div>
                                    </div>

                                    {project.client_name && (
                                        <div className="absolute bottom-5 right-5 opacity-5 pointer-events-none">
                                            <Briefcase className="w-24 h-24 text-gray-900" />
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Modal de Novo Projeto */}
            {showNewProjectModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10 transition-shadow shadow-sm">
                            <h2 className="text-xl font-bold text-gray-800">Criar Novo Projeto</h2>
                            <button
                                onClick={() => setShowNewProjectModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                            >
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProject} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto *</label>
                                    <input
                                        required
                                        type="text"
                                        value={newProjectData.name}
                                        onChange={e => setNewProjectData({ ...newProjectData, name: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="Ex: Campanha de Verão 2024"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                    <textarea
                                        rows={3}
                                        value={newProjectData.description}
                                        onChange={e => setNewProjectData({ ...newProjectData, description: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="Objetivos e escopo do projeto..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                    <select
                                        value={newProjectData.client_id}
                                        onChange={e => setNewProjectData({ ...newProjectData, client_id: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    >
                                        <option value="">Selecione um cliente (Opcional)</option>
                                        {clients.map((client: any) => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                                    <select
                                        value={newProjectData.priority}
                                        onChange={e => setNewProjectData({ ...newProjectData, priority: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    >
                                        <option value="low">Baixa</option>
                                        <option value="medium">Média</option>
                                        <option value="high">Alta</option>
                                        <option value="urgent">Urgente</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                                    <input
                                        type="date"
                                        value={newProjectData.start_date}
                                        onChange={e => setNewProjectData({ ...newProjectData, start_date: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo Final</label>
                                    <input
                                        type="date"
                                        value={newProjectData.end_date}
                                        onChange={e => setNewProjectData({ ...newProjectData, end_date: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento (R$)</label>
                                    <input
                                        type="number"
                                        value={newProjectData.budget}
                                        onChange={e => setNewProjectData({ ...newProjectData, budget: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Inicial</label>
                                    <select
                                        value={newProjectData.status}
                                        onChange={e => setNewProjectData({ ...newProjectData, status: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    >
                                        <option value="planning">Planejamento</option>
                                        <option value="active">Ativo</option>
                                        <option value="on_hold">Em Espera</option>
                                    </select>
                                </div>
                            </div>

                            {/* Template Section */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-emerald-600" />
                                    Aplicar Modelo (Opcional)
                                </h3>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Selecione um Processo Padrão (SOP)</label>
                                    <select
                                        value={newProjectData.template_id || ''}
                                        onChange={e => setNewProjectData({ ...newProjectData, template_id: e.target.value })}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    >
                                        <option value="">Nenhum (Começar em branco)</option>
                                        {templates.map((t: any) => (
                                            <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Ao selecionar um modelo, as tarefas e prazos serão gerados automaticamente.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowNewProjectModal(false)}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                                >
                                    {loading ? 'Criando...' : 'Criar Projeto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
