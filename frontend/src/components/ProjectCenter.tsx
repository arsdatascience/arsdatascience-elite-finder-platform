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
    const [loading, setLoading] = useState(true);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);

    // Filters
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchProjects();
    }, []);

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

    const handleOpenProject = (project: Project) => {
        setSelectedProject(project);
        setView('details');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'planning': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'on_hold': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'completed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-400';
            case 'high': return 'text-orange-400';
            case 'medium': return 'text-yellow-400';
            case 'low': return 'text-blue-400';
            default: return 'text-slate-400';
        }
    };

    // Calculate progress percentage
    const getProgress = (completed: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
    };

    if (view === 'details' && selectedProject) {
        return (
            <div className="h-full flex flex-col">
                <button
                    onClick={() => {
                        setSelectedProject(null);
                        setView('portfolio');
                        fetchProjects(); // Refresh on back
                    }}
                    className="flex items-center text-slate-400 hover:text-white mb-4 px-6 pt-4"
                >
                    <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                    Voltar para Portfolio
                </button>
                <TaskBoard project={selectedProject} />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#0f172a] text-white overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]/50 backdrop-blur-sm sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-blue-500" />
                        Gestão de Projetos e Portfolio
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Gerencie seus projetos, tarefas e equipe em um só lugar.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowNewProjectModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-900/50 hover:shadow-blue-900/30"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Projeto
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="p-6 pb-2 flex gap-4 overflow-x-auto">
                {['all', 'active', 'planning', 'on_hold', 'completed'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors capitalize ${filterStatus === status
                            ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                    >
                        {status === 'all' ? 'Todos' : status.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-20 bg-[#1e293b]/30 rounded-3xl border border-slate-800 border-dashed">
                        <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-white mb-2">Nenhum projeto encontrado</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">
                            Comece criando seu primeiro projeto para organizar tarefas e acompanhar o progresso.
                        </p>
                        <button
                            onClick={() => setShowNewProjectModal(true)}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-colors border border-slate-700 hover:border-slate-600"
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
                                    className="group bg-[#1e293b] rounded-2xl border border-slate-800 p-5 hover:border-blue-500/50 transition-all cursor-pointer hover:shadow-xl hover:shadow-blue-900/10 hover:-translate-y-1 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)} capitalize`}>
                                            {project.status.replace('_', ' ')}
                                        </span>
                                        <button className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">
                                        {project.name}
                                    </h3>
                                    <p className="text-slate-400 text-sm mb-6 line-clamp-2 h-10">
                                        {project.description || 'Sem descrição definida.'}
                                    </p>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">Progresso</span>
                                            <span className="text-white font-medium">{getProgress(project.completed_tasks, project.total_tasks)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                                                style={{ width: `${getProgress(project.completed_tasks, project.total_tasks)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                                        <div className="flex items-center text-xs text-slate-500">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Sem prazo'}
                                        </div>
                                        <div className={`flex items-center text-xs font-medium ${getPriorityColor(project.priority)} capitalize`}>
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            {project.priority}
                                        </div>
                                    </div>

                                    {project.client_name && (
                                        <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-10">
                                            <Briefcase className="w-24 h-24" />
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Modal de Novo Projeto (Placeholder - implementar depois) */}
            {showNewProjectModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-700 max-w-md w-full">
                        <h2 className="text-xl font-bold text-white mb-4">Novo Projeto</h2>
                        <p className="text-slate-400 mb-6">Esta funcionalidade será implementada em breve junto com o TaskBoard.</p>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowNewProjectModal(false)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
