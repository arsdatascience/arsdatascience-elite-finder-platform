import React, { useState, useEffect } from 'react';
import { BookOpen, PlayCircle, FileText, Award, Star, CheckCircle, Clock, TrendingUp, Video } from 'lucide-react';

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
    const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
    const [filter, setFilter] = useState<string>('all'); // 'all', 'completed', 'in_progress', 'not_started'

    useEffect(() => {
        fetchModules();
        fetchProgress();
    }, []);

    const fetchModules = async () => {
        try {
            const response = await fetch(`${API_URL}/api/training/modules`);
            const data = await response.json();
            setModules(data);
        } catch (error) {
            console.error('Error fetching modules:', error);
            // Fallback to mock data
            setModules([
                { id: 1, title: 'Fundamentos de Google Ads', description: 'Aprenda os conceitos básicos', category: 'Fundamentos', duration_minutes: 45, difficulty: 'Iniciante', video_url: '', thumbnail_url: '', order_index: 1 },
                { id: 2, title: 'Meta Ads Avançado', description: 'Estratégias avançadas', category: 'Avançado', duration_minutes: 60, difficulty: 'Avançado', video_url: '', thumbnail_url: '', order_index: 2 },
                { id: 3, title: 'Automação de Marketing', description: 'Fluxos de automação', category: 'Especialização', duration_minutes: 90, difficulty: 'Intermediário', video_url: '', thumbnail_url: '', order_index: 3 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchProgress = async () => {
        try {
            const response = await fetch(`${API_URL}/api/training/progress?user_id=1`);
            const data = await response.json();
            setProgress(data);
        } catch (error) {
            console.error('Error fetching progress:', error);
            setProgress([]);
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
        setSelectedModule(module);
        // Here you would open a modal or navigate to the module page
        alert(`Iniciando módulo: ${module.title}\n\nEm uma implementação completa, isso abriria o player de vídeo ou documento.`);
    };

    const filteredModules = modules.filter(module => {
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Academia de Treinamento</h2>
                    <p className="text-sm text-gray-500">Capacite sua equipe com playbooks de vendas orientados por IA.</p>
                </div>
            </div>

            {/* Hero Stats */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1">Bem-vindo de volta!</h3>
                        <p className="text-indigo-100 text-sm mb-4">
                            Você completou {completedModules} de {modules.length} módulos ({overallProgress}%). Continue assim!
                        </p>
                        <div className="w-full max-w-md bg-indigo-900/50 rounded-full h-2">
                            <div
                                className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${overallProgress}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="hidden md:block text-right ml-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-2">
                            <Award size={32} className="text-yellow-400" />
                        </div>
                        <p className="font-bold">Elite Learner</p>
                        <p className="text-xs text-indigo-200">Ranking Atual</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{completedModules}</p>
                            <p className="text-sm text-gray-500">Módulos Concluídos</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Clock className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {modules.reduce((acc, m) => acc + m.duration_minutes, 0)} min
                            </p>
                            <p className="text-sm text-gray-500">Tempo Total de Conteúdo</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{overallProgress}%</p>
                            <p className="text-sm text-gray-500">Progresso Geral</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Todos ({modules.length})
                </button>
                <button
                    onClick={() => setFilter('not_started')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'not_started' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Não Iniciados
                </button>
                <button
                    onClick={() => setFilter('in_progress')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'in_progress' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Em Progresso
                </button>
                <button
                    onClick={() => setFilter('completed')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'completed' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Concluídos ({completedModules})
                </button>
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
                            <div className="h-40 bg-gradient-to-br from-blue-500 to-purple-600 relative flex items-center justify-center">
                                <Video size={48} className="text-white/80" />
                                {isCompleted && (
                                    <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                        <CheckCircle size={12} />
                                        CONCLUÍDO
                                    </div>
                                )}
                                {!isCompleted && progressPercent > 0 && (
                                    <div className="absolute top-3 right-3 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                        {progressPercent}%
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

                                {/* Progress Bar */}
                                {progressPercent > 0 && !isCompleted && (
                                    <div className="mb-3">
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className="bg-blue-600 h-1.5 rounded-full transition-all"
                                                style={{ width: `${progressPercent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartModule(module);
                                    }}
                                >
                                    {isCompleted ? 'Revisar Módulo' : progressPercent > 0 ? 'Continuar' : 'Iniciar Módulo'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredModules.length === 0 && (
                <div className="text-center py-12">
                    <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Nenhum módulo encontrado nesta categoria.</p>
                </div>
            )}

            {/* AI Simulator Promo */}
            <div className="bg-slate-900 rounded-xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                        <Star className="text-yellow-400 fill-yellow-400" size={20} />
                        Simulador de Vendas IA
                    </h3>
                    <p className="text-slate-400 text-sm max-w-xl">
                        Pratique seu pitch com nossos clientes virtuais. Eles reagem em tempo real à sua voz e tom. Receba feedback instantâneo e melhore sua taxa de conversão.
                    </p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors whitespace-nowrap">
                    Lançar Simulador
                </button>
            </div>
        </div>
    );
};