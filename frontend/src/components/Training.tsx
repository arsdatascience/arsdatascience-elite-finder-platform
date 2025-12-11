import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Award, Clock, TrendingUp, Video, Users, Briefcase, Plus, Upload, X, FileText } from 'lucide-react';
import { COMPONENT_VERSIONS } from '../componentVersions';

interface TrainingModule {
    id: number;
    title: string;
    description: string;
    category: string;
    duration_minutes: number;
    difficulty: string;
    video_url: string;
    thumbnail_url: string;
    order_index: number;
    audience: 'team' | 'client';
    file_type?: string;
}

interface UserProgress {
    module_id: number;
    progress_percent: number;
    completed: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const Training: React.FC = () => {
    const [modules, setModules] = useState<TrainingModule[]>([]);
    const [progress, setProgress] = useState<UserProgress[]>([]);
    const [loading, setLoading] = useState(true);
    // const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
    const [filter, setFilter] = useState<string>('all'); // 'all', 'completed', 'in_progress', 'not_started'
    const [audienceFilter, setAudienceFilter] = useState<'team' | 'client'>('team');

    // New Module Modal Logic
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newModule, setNewModule] = useState({
        title: '',
        description: '',
        category: 'Geral',
        duration: '15',
        difficulty: 'Iniciante',
        audience: 'team',
        file: null as File | null
    });

    useEffect(() => {
        fetchModules();
        fetchProgress();
    }, []);

    const fetchModules = async () => {
        try {
            const response = await fetch(`${API_URL}/api/training/modules?audience=${audienceFilter}`);
            const data = await response.json();

            // Validate response is an array
            if (!Array.isArray(data)) {
                // If it's the mock fallback or some other format, handle gracefully
                console.warn('Backend returned non-array:', data);
                if (data.success && Array.isArray(data.modules)) {
                    // Legacy format check just in case
                    setModules(data.modules.map((m: any) => ({ ...m, audience: m.audience || 'team' })));
                    return;
                }
                // Fallback to empty if DB is empty
                setModules([]);
            } else {
                const modulesWithAudience = data.map((m: any) => ({ ...m, audience: m.audience || 'team' }));
                setModules(modulesWithAudience);
            }
        } catch (error) {
            console.error('Error fetching modules:', error);
            // If backend fails completely (e.g. during restart), maybe show old mocks?
            // For now, assume empty to avoid confusion.
            setModules([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchProgress = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/training/progress`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setProgress(data);
            }
        } catch (error) {
            console.error('Error fetching progress:', error);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newModule.file || !newModule.title) {
            alert('Por favor, preencha o título e selecione um arquivo.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('title', newModule.title);
        formData.append('description', newModule.description);
        formData.append('category', newModule.category);
        formData.append('duration', newModule.duration);
        formData.append('difficulty', newModule.difficulty);
        formData.append('audience', newModule.audience);
        formData.append('file', newModule.file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/training/modules`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // No Content-Type header when sending FormData! Browser sets it with boundary.
                },
                body: formData
            });

            const result = await res.json();
            if (result.success) {
                alert('Módulo criado com sucesso!');
                setIsUploadModalOpen(false);
                fetchModules(); // Refresh list
                setNewModule({
                    title: '', description: '', category: 'Geral', duration: '15', difficulty: 'Iniciante', audience: 'team', file: null
                });
            } else {
                alert('Erro ao criar módulo: ' + result.error);
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao enviar.');
        } finally {
            setUploading(false);
        }
    };

    const getModuleProgress = (moduleId: number): UserProgress | undefined => {
        return progress.find(p => p.module_id === moduleId);
    };

    const calculateOverallProgress = () => {
        if (modules.length === 0) return 0;
        const completedCount = modules.filter(m => getModuleProgress(m.id)?.completed).length;
        return Math.round((completedCount / modules.length) * 100);
    };

    const handleStartModule = (module: TrainingModule) => {
        if (module.video_url && module.video_url.startsWith('/uploads')) {
            window.open(`${API_URL}${module.video_url}`, '_blank');
        } else {
            alert(`Iniciando módulo: ${module.title}\n\nMídia ainda não disponível no player integrado.`);
        }
    };

    const filteredModules = modules.filter(module => {
        // Filtro de Audiência (Already filtered by API mostly, but client side helps too)
        if (module.audience !== audienceFilter) return false;

        // Filtro de Status
        const moduleProgress = getModuleProgress(module.id);
        if (filter === 'completed') return moduleProgress?.completed;
        if (filter === 'in_progress') return moduleProgress && !moduleProgress.completed && moduleProgress.progress_percent > 0;
        if (filter === 'not_started') return !moduleProgress || moduleProgress.progress_percent === 0;
        return true;
    });

    const overallProgress = calculateOverallProgress();
    const completedModules = modules.filter(m => getModuleProgress(m.id)?.completed).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Academia de Treinamento <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2 align-middle">{COMPONENT_VERSIONS.Training}</span></h2>
                    <p className="text-sm text-gray-500">Capacite sua equipe e clientes com conteúdo educacional de alta qualidade.</p>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                    <Plus size={18} />
                    Novo Módulo
                </button>
            </div>

            {/* Hero Stats */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1">Bem-vindo de volta!</h3>
                        <p className="text-slate-300 text-sm mb-4">
                            Você completou {completedModules} de {modules.length} módulos ({overallProgress}%). Continue assim!
                        </p>
                        <div className="w-full max-w-md bg-slate-800/50 rounded-full h-2">
                            <div
                                className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${overallProgress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audience Tabs */}
            <div className="flex justify-center mb-6">
                <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => { setAudienceFilter('team'); fetchModules(); }}
                        className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${audienceFilter === 'team'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Users size={18} />
                        Para Colaboradores
                    </button>
                    <button
                        onClick={() => { setAudienceFilter('client'); fetchModules(); }}
                        className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${audienceFilter === 'client'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Briefcase size={18} />
                        Para Clientes
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModules.map(module => {
                    const moduleProgress = getModuleProgress(module.id);
                    const isCompleted = moduleProgress?.completed || false;
                    const progressPercent = moduleProgress?.progress_percent || 0;

                    return (
                        <div
                            key={module.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-all cursor-pointer"
                            onClick={() => handleStartModule(module)}
                        >
                            <div className="h-40 bg-gradient-to-br from-slate-600 to-slate-800 relative flex items-center justify-center">
                                {module.file_type === 'pdf' ? <FileText size={48} className="text-white/80" /> : <Video size={48} className="text-white/80" />}
                                {isCompleted && (
                                    <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                        <CheckCircle size={12} />
                                        CONCLUÍDO
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${module.difficulty === 'Avançado' ? 'bg-red-50 text-red-600' :
                                        module.difficulty === 'Intermediário' ? 'bg-yellow-50 text-yellow-600' :
                                            'bg-green-50 text-green-600'
                                        }`}>
                                        {module.difficulty}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock size={12} />
                                        {module.duration_minutes} min
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-800 mb-1 line-clamp-2">{module.title}</h3>
                                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{module.description}</p>
                                <button
                                    className="w-full mt-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartModule(module);
                                    }}
                                >
                                    {isCompleted ? 'Revisar' : 'Acessar Conteúdo'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Upload */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Novo Módulo de Treinamento</h3>
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    value={newModule.title}
                                    onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    rows={3}
                                    value={newModule.description}
                                    onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duração (min)</label>
                                    <input type="number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        value={newModule.duration}
                                        onChange={(e) => setNewModule({ ...newModule, duration: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dificuldade</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        value={newModule.difficulty}
                                        onChange={(e) => setNewModule({ ...newModule, difficulty: e.target.value })}
                                    >
                                        <option value="Iniciante">Iniciante</option>
                                        <option value="Intermediário">Intermediário</option>
                                        <option value="Avançado">Avançado</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Audiência</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    value={newModule.audience}
                                    onChange={(e) => setNewModule({ ...newModule, audience: e.target.value as 'team' | 'client' })}
                                >
                                    <option value="team">Colaboradores</option>
                                    <option value="client">Clientes</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo (Vídeo/PDF)</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept="video/*,.pdf,.pptx"
                                        onChange={(e) => setNewModule({ ...newModule, file: e.target.files ? e.target.files[0] : null })}
                                    />
                                    <div className="flex flex-col items-center">
                                        <Upload className="text-gray-400 mb-2" size={32} />
                                        <span className="text-sm text-gray-600">
                                            {newModule.file ? newModule.file.name : 'Clique ou arraste para enviar'}
                                        </span>
                                        <span className="text-xs text-gray-400 mt-1">MP4, WebM, PDF, PPTX (Max 500MB)</span>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={20} />
                                            Criar Módulo
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};