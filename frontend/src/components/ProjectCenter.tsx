import { useState, useEffect } from 'react';
import { Plus, Layout, Search, MoreHorizontal, ArrowRight, Folder, Trash2 } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { TaskBoard } from './TaskBoard';
import ProjectModal from './ProjectModal';
import { Project } from '../types';

export const ProjectCenter = () => {
    const [view, setView] = useState<'portfolio' | 'details'>('portfolio');
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [showEditProjectModal, setShowEditProjectModal] = useState(false);

    // Filter states
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Metadata
    const [clients, setClients] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]); // Users for TaskBoard

    useEffect(() => {
        fetchProjects();
        fetchClients();
        fetchUsers();
    }, []);

    const fetchProjects = async () => {
        try {
            const data = await apiClient.projects.list();
            setProjects(data);
        } catch (error) {
            console.error('Error fetching projects:', error);
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

    const fetchUsers = async () => {
        try {
            const response = await apiClient.users.getTeamMembers();
            // Check structure: backend returns { success: true, members: [...] }
            setUsers(response.members || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        }
    };

    const handleSaveProject = async (projectData: Partial<Project>) => {
        try {
            if (projectData.id) {
                // Edit
                await apiClient.projects.update(projectData.id, projectData);
                fetchProjects();
            } else {
                // Create
                const newProject = await apiClient.projects.create(projectData);
                // Automatically open the new project
                if (newProject) {
                    setSelectedProject(newProject);
                    setView('details');
                }
                fetchProjects();
            }
            setShowNewProjectModal(false);
            setShowEditProjectModal(false);
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Erro ao salvar projeto');
        }
    };

    const handleDeleteProject = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
        try {
            await apiClient.projects.delete(id);
            setProjects(prev => prev.filter(p => p.id !== id));
            // If we were in details view of the deleted project, go back
            if (selectedProject?.id === id) {
                setView('portfolio');
                setSelectedProject(null);
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Erro ao excluir projeto');
        }
    };

    const filteredProjects = projects.filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.client_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'planning': return 'bg-primary-100 text-primary-700';
            case 'completed': return 'bg-gray-100 text-gray-700';
            case 'on_hold': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Em Andamento';
            case 'planning': return 'Planejamento';
            case 'completed': return 'Concluído';
            case 'on_hold': return 'Em Espera';
            default: return status;
        }
    };

    if (view === 'details' && selectedProject) {
        return (
            <div className="h-full flex flex-col bg-gray-50">
                <button
                    onClick={() => {
                        setSelectedProject(null);
                        setView('portfolio');
                        fetchProjects();
                    }}
                    className="flex items-center text-gray-600 hover:text-primary-600 mb-4 px-6 pt-4 transition-colors"
                >
                    <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                    Voltar para Portfolio
                </button>
                <TaskBoard
                    project={selectedProject}
                    users={users}
                    onDeleteProject={() => handleDeleteProject(selectedProject.id)}
                    onAdd={() => alert('Use o botão Nova Tarefa no board')}
                />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 text-gray-900 overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 flex justify-between items-center bg-white border-b border-gray-200 sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">
                        Projetos
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gerencie seu portfólio e campanhas</p>
                </div>
                <button
                    onClick={() => setShowNewProjectModal(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all hover:shadow-md font-medium"
                >
                    <Plus className="w-5 h-5" /> Novo Projeto
                </button>
            </div>

            {/* Filters */}
            <div className="px-8 py-6 space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar projetos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 transition-colors"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'active', 'planning', 'completed', 'on_hold'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                {status === 'all' ? 'Todos' : getStatusLabel(status)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="flex-1 overflow-y-auto px-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => {
                                setSelectedProject(project);
                                setView('details');
                            }}
                            className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-400 hover:shadow-lg transition-all cursor-pointer flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status || 'planning')}`}>
                                    {getStatusLabel(project.status || 'planning')}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteProject(project.id);
                                        }}
                                        className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                                        title="Excluir Projeto"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedProject(project);
                                            setShowEditProjectModal(true);
                                        }}
                                        className="text-gray-400 hover:text-primary-600 p-1 rounded-md hover:bg-primary-50 transition-colors"
                                        title="Editar Projeto"
                                    >
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-lg text-gray-900 mb-2 truncate group-hover:text-primary-600 transition-colors">
                                {project.name}
                            </h3>

                            <div className="flex items-center text-sm text-gray-500 mb-4">
                                <Folder className="w-4 h-4 mr-2" />
                                <span className="truncate">{project.client_name || 'Sem cliente'}</span>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                                <span>R$ {Number(project.budget || 0).toLocaleString('pt-BR')}</span>
                                {/* Add more quick stats here if needed */}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredProjects.length === 0 && (
                    <div className="text-center py-20">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Layout className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Nenhum projeto encontrado</h3>
                        <p className="text-gray-500 mt-1">Tente ajustar seus filtros ou crie um novo projeto.</p>
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            <ProjectModal
                isOpen={showNewProjectModal}
                onClose={() => setShowNewProjectModal(false)}
                onSave={handleSaveProject}
                clients={clients}
                users={users}
            />

            {/* Edit Project Modal */}
            {showEditProjectModal && selectedProject && (
                <ProjectModal
                    isOpen={showEditProjectModal}
                    onClose={() => setShowEditProjectModal(false)}
                    onSave={handleSaveProject}
                    project={selectedProject}
                    clients={clients}
                    users={users}
                />
            )}
        </div>
    );
};
