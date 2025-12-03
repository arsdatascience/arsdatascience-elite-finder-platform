import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Grid3x3, List, Instagram, Facebook, Linkedin, Twitter, Edit2, Trash2, Clock, Users, Gift, Sparkles, X, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

interface Post {
    id: string;
    content: string;
    platform: string;
    status: string;
    scheduled_date: string;
    published_date?: string;
    clientId?: string;
}

interface SocialCalendarProps {
    posts?: Post[];
    onClose?: () => void;
    onPostClick?: (post: Post) => void;
    onPostUpdate?: (postId: string, newDate: string) => void;
    onPostDelete?: (postId: string) => void;
}

const MOCK_POSTS: Post[] = [
    { id: '1', content: 'Lançamento Verão 2025', platform: 'instagram', status: 'scheduled', scheduled_date: new Date().toISOString(), clientId: '1' },
    { id: '2', content: 'Promoção Relâmpago', platform: 'facebook', status: 'published', scheduled_date: new Date(Date.now() - 86400000).toISOString(), clientId: '1' },
    { id: '3', content: 'Artigo no Blog: ROI', platform: 'linkedin', status: 'draft', scheduled_date: new Date(Date.now() + 172800000).toISOString(), clientId: '2' },
    { id: '4', content: 'Dica do dia: SEO', platform: 'twitter', status: 'scheduled', scheduled_date: new Date(Date.now() + 86400000 * 2).toISOString(), clientId: '2' },
];

export const SocialCalendar: React.FC<SocialCalendarProps> = ({
    posts = MOCK_POSTS,
    onPostClick = () => { },
    onPostUpdate,
    onPostDelete
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'facebook', 'linkedin', 'twitter', 'youtube', 'google', 'meta']);
    const [selectedClient, setSelectedClient] = useState<string>('all');
    const [draggedPost, setDraggedPost] = useState<Post | null>(null);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [suggestionModal, setSuggestionModal] = useState<{ isOpen: boolean, holiday: any, date: Date } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [schedulingModal, setSchedulingModal] = useState<{ isOpen: boolean, date: Date | null }>({ isOpen: false, date: null });
    const [newEvent, setNewEvent] = useState({ title: '', type: 'meeting', time: '09:00', description: '' });

    const location = useLocation();

    useEffect(() => {
        if (location.state?.leadToSchedule) {
            const lead = location.state.leadToSchedule;
            setNewEvent({
                title: `Reunião com ${lead.name}`,
                type: 'meeting',
                time: '09:00',
                description: `Lead: ${lead.name}\nEmpresa: ${lead.company || 'N/A'}\nTelefone: ${lead.phone}\nEmail: ${lead.email}\nNotas: ${lead.notes || ''}`
            });
            setSchedulingModal({ isOpen: true, date: new Date() });
            // Clear state to prevent reopening on refresh (optional, but good practice)
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const queryClient = useQueryClient();

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: apiClient.clients.getClients,
        staleTime: 5 * 60 * 1000
    });

    const { data: fetchedPosts } = useQuery({
        queryKey: ['socialPosts', selectedClient],
        queryFn: () => apiClient.social.getPosts(selectedClient),
    });

    // Combine mock posts with fetched posts (if any)
    const allPosts = [...posts, ...(fetchedPosts || [])];

    // Filter posts
    const filteredPosts = allPosts.filter(post => {
        if (selectedClient !== 'all' && post.clientId !== selectedClient) return false;
        if (!selectedPlatforms.includes(post.platform)) return false;
        return true;
    });

    // Calendar logic
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startingDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Week view logic
    const getWeekDays = (date: Date) => {
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay());
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            days.push(day);
        }
        return days;
    };
    const weekDays = getWeekDays(currentDate);

    // Holidays (Mock)
    const holidays = [
        { date: '2025-12-25', name: 'Natal' },
        { date: '2025-01-01', name: 'Ano Novo' },
        { date: '2025-11-15', name: 'Proclamação da República' },
        { date: new Date().toISOString().split('T')[0], name: 'Dia do Marketing' } // Fake holiday for demo
    ];

    const previousPeriod = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setDate(newDate.getDate() - 7);
        }
        setCurrentDate(newDate);
    };

    const nextPeriod = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else {
            newDate.setDate(newDate.getDate() + 7);
        }
        setCurrentDate(newDate);
    };

    const getPostsForDay = (day: number) => {
        return filteredPosts.filter(post => {
            const postDate = new Date(post.scheduled_date);
            return postDate.getDate() === day &&
                postDate.getMonth() === currentDate.getMonth() &&
                postDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const getPostsForDate = (date: Date) => {
        return filteredPosts.filter(post => {
            const postDate = new Date(post.scheduled_date);
            return postDate.toDateString() === date.toDateString();
        });
    };

    const getPlatformColor = (platform: string) => {
        switch (platform) {
            case 'instagram': return 'bg-pink-50 text-pink-700 border-pink-200';
            case 'facebook': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'linkedin': return 'bg-sky-50 text-sky-700 border-sky-200';
            case 'twitter': return 'bg-gray-50 text-gray-700 border-gray-200';
            case 'youtube': return 'bg-red-50 text-red-700 border-red-200';
            case 'google': return 'bg-green-50 text-green-700 border-green-200';
            case 'meta': return 'bg-purple-50 text-purple-700 border-purple-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'instagram': return Instagram;
            case 'facebook': return Facebook;
            case 'linkedin': return Linkedin;
            case 'twitter': return Twitter;
            default: return CalendarIcon;
        }
    };

    const platforms = [
        { id: 'instagram', name: 'Instagram' },
        { id: 'facebook', name: 'Facebook' },
        { id: 'linkedin', name: 'LinkedIn' },
        { id: 'twitter', name: 'X / Twitter' },
        { id: 'youtube', name: 'YouTube' },
        { id: 'google', name: 'Google Ads' },
        { id: 'meta', name: 'Meta Ads' },
    ];

    const togglePlatform = (platformId: string) => {
        if (selectedPlatforms.includes(platformId)) {
            setSelectedPlatforms(selectedPlatforms.filter(p => p !== platformId));
        } else {
            setSelectedPlatforms([...selectedPlatforms, platformId]);
        }
    };

    // Drag and Drop
    const handleDragStart = (post: Post) => {
        setDraggedPost(post);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (day: number, month?: number, year?: number) => {
        if (!draggedPost) return;

        const newDate = new Date(currentDate);
        newDate.setDate(day);
        if (month !== undefined) newDate.setMonth(month);
        if (year !== undefined) newDate.setFullYear(year);

        // Optimistic update
        // In a real app, we would update the backend here
        if (onPostUpdate) {
            onPostUpdate(draggedPost.id, newDate.toISOString());
        } else {
            // Local update for demo
            const postIndex = posts.findIndex(p => p.id === draggedPost.id);
            if (postIndex >= 0) {
                posts[postIndex].scheduled_date = newDate.toISOString();
            }
        }
        setDraggedPost(null);
    };

    // Inline Edit
    const startEdit = (post: Post) => {
        setEditingPostId(post.id);
        setEditContent(post.content);
    };

    const saveEdit = () => {
        // Implement save logic
        setEditingPostId(null);
    };

    const cancelEdit = () => {
        setEditingPostId(null);
    };

    // Delete Mutation
    const deletePostMutation = useMutation({
        mutationFn: apiClient.social.deletePost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
        }
    });

    // AI Suggestion
    const handleHolidayClick = (holiday: any, date: Date) => {
        setSuggestionModal({ isOpen: true, holiday, date });
    };

    const generateSuggestion = async () => {
        if (!suggestionModal) return;
        setIsGenerating(true);
        try {
            // Simulate AI generation
            await new Promise(resolve => setTimeout(resolve, 2000));
            alert(`Sugestão gerada para ${suggestionModal.holiday.name}: "Celebre este dia especial com..."`);
            setSuggestionModal(null);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDayClick = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSchedulingModal({ isOpen: true, date });
    };

    const handleScheduleEvent = () => {
        // Here you would typically save the event to the backend
        console.log('Scheduling event:', newEvent, 'on', schedulingModal.date);
        alert(`Evento agendado: ${newEvent.title} em ${schedulingModal.date?.toLocaleDateString()} às ${newEvent.time}`);
        setSchedulingModal({ isOpen: false, date: null });
        setNewEvent({ title: '', type: 'meeting', time: '09:00', description: '' });
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in relative">
            {/* Client Filter Bar */}
            <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center gap-3">
                <div className="flex items-center gap-2 text-gray-600">
                    <Users size={18} />
                    <span className="text-sm font-medium">Cliente:</span>
                </div>
                <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none min-w-[200px]"
                >
                    <option value="all">Todos os Clientes</option>
                    {clients?.map((client: any) => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                </select>
            </div>

            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 items-center justify-between shrink-0">
                {/* View Mode Toggle */}
                <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
                    <button
                        onClick={() => setViewMode('month')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'month'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Grid3x3 size={16} />
                        Mês
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'week'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <List size={16} />
                        Semana
                    </button>
                </div>

                {/* Platform Filters */}
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Filtros:</span>
                    {platforms.map(platform => {
                        const Icon = getPlatformIcon(platform.id);
                        const isSelected = selectedPlatforms.includes(platform.id);
                        return (
                            <button
                                key={platform.id}
                                onClick={() => togglePlatform(platform.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${isSelected
                                    ? getPlatformColor(platform.id)
                                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                                    }`}
                            >
                                <Icon size={14} />
                                {platform.name}
                            </button>
                        );
                    })}
                </div>

                {/* Post Count */}
                <div className="text-sm text-gray-600">
                    <span className="font-bold">{filteredPosts.length}</span> posts
                </div>
            </div>

            {/* Calendar Navigation */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
                <button
                    onClick={previousPeriod}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>

                <h4 className="text-xl font-bold text-gray-800">
                    {viewMode === 'month'
                        ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                        : `Semana de ${weekDays[0].getDate()} a ${weekDays[6].getDate()} de ${monthNames[currentDate.getMonth()]}`
                    }
                </h4>

                <button
                    onClick={nextPeriod}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {viewMode === 'month' ? (
                    <div className="grid grid-cols-7 gap-2">
                        {/* Day headers */}
                        {dayNames.map(day => (
                            <div key={day} className="text-center font-bold text-gray-600 text-sm py-2">
                                {day}
                            </div>
                        ))}

                        {/* Empty cells for days before month starts */}
                        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square" />
                        ))}

                        {/* Calendar days */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dayPosts = getPostsForDay(day);
                            const isToday =
                                day === new Date().getDate() &&
                                currentDate.getMonth() === new Date().getMonth() &&
                                currentDate.getFullYear() === new Date().getFullYear();

                            return (
                                <div
                                    key={day}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(day)}
                                    onClick={() => handleDayClick(day)}
                                    className={`aspect-square border rounded-lg p-2 flex flex-col ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                                        } hover:shadow-md transition-shadow cursor-pointer min-h-[100px]`}
                                >
                                    <div className={`text-sm font-bold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                                        {day}
                                    </div>

                                    {holidays?.find((h: any) => h.date === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0]) && (
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const h = holidays.find((h: any) => h.date === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0]);
                                                handleHolidayClick(h, new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                                            }}
                                            className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded mb-1 truncate cursor-pointer hover:bg-green-100 border border-green-100 flex items-center gap-1 font-medium transition-colors"
                                            title="Clique para gerar sugestão com IA"
                                        >
                                            <Gift size={10} />
                                            {holidays.find((h: any) => h.date === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0])?.name}
                                        </div>
                                    )}

                                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                                        {dayPosts.map(post => {
                                            const Icon = getPlatformIcon(post.platform);
                                            const isEditing = editingPostId === post.id;

                                            return (
                                                <div
                                                    key={post.id}
                                                    draggable
                                                    onDragStart={() => handleDragStart(post)}
                                                    onClick={(e) => { e.stopPropagation(); }}
                                                    className={`w-full text-left p-1.5 rounded border text-xs transition-all ${getPlatformColor(post.platform)} cursor-move`}
                                                >
                                                    {isEditing ? (
                                                        <div className="space-y-1">
                                                            <input
                                                                type="text"
                                                                value={editContent}
                                                                onChange={(e) => setEditContent(e.target.value)}
                                                                className="w-full px-1 py-0.5 text-xs border rounded"
                                                                autoFocus
                                                            />
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={saveEdit}
                                                                    className="px-2 py-0.5 bg-green-600 text-white rounded text-[10px]"
                                                                >
                                                                    Salvar
                                                                </button>
                                                                <button
                                                                    onClick={cancelEdit}
                                                                    className="px-2 py-0.5 bg-gray-400 text-white rounded text-[10px]"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 group">
                                                            <Icon size={12} />
                                                            <span className="truncate flex-1">{post.content.substring(0, 20)}...</span>
                                                            <div className="hidden group-hover:flex gap-0.5">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        startEdit(post);
                                                                    }}
                                                                    className="p-0.5 hover:bg-white/50 rounded"
                                                                >
                                                                    <Edit2 size={10} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm('Deletar este post?')) {
                                                                            if (onPostDelete) {
                                                                                onPostDelete(post.id);
                                                                            } else {
                                                                                deletePostMutation.mutate(post.id);
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="p-0.5 hover:bg-red-500/20 rounded"
                                                                >
                                                                    <Trash2 size={10} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Week View */
                    <div className="space-y-2">
                        {weekDays.map((date, idx) => {
                            const dayPosts = getPostsForDate(date);
                            const isToday = date.toDateString() === new Date().toDateString();

                            return (
                                <div
                                    key={idx}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(date.getDate(), date.getMonth(), date.getFullYear())}
                                    onClick={() => setSchedulingModal({ isOpen: true, date })}
                                    className={`border rounded-lg p-4 ${isToday ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'
                                        } hover:shadow-md transition-shadow cursor-pointer`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`text-2xl font-bold ${isToday ? 'text-purple-600' : 'text-gray-700'}`}>
                                                {date.getDate()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800">{dayNames[date.getDay()]}</div>
                                                <div className="text-xs text-gray-500">
                                                    {monthNames[date.getMonth()]} {date.getFullYear()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {dayPosts.length} {dayPosts.length === 1 ? 'post' : 'posts'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {dayPosts.map(post => {
                                            const Icon = getPlatformIcon(post.platform);
                                            return (
                                                <div
                                                    key={post.id}
                                                    draggable
                                                    onDragStart={() => handleDragStart(post)}
                                                    onClick={(e) => { e.stopPropagation(); onPostClick(post); }}
                                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${getPlatformColor(post.platform)}`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <Icon size={16} className="shrink-0 mt-0.5" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium line-clamp-2">{post.content}</p>
                                                            <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                                                                <Clock size={10} />
                                                                {new Date(post.scheduled_date).toLocaleTimeString('pt-BR', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
                <div className="flex flex-wrap gap-4 justify-center items-center">
                    <div className="text-sm text-gray-600 font-medium">Legenda:</div>
                    {platforms.map(platform => {
                        const Icon = getPlatformIcon(platform.id);
                        return (
                            <div key={platform.id} className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded flex items-center justify-center ${getPlatformColor(platform.id)}`}>
                                    <Icon size={10} />
                                </div>
                                <span className="text-sm text-gray-600">{platform.name}</span>
                            </div>
                        );
                    })}
                    <div className="text-xs text-gray-500 ml-4">
                        💡 Dica: Arraste posts para reagendar
                    </div>
                </div>
            </div>

            {
                suggestionModal && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">Sugestão de Post com IA</h3>
                                    <p className="text-sm text-gray-500">{suggestionModal.holiday.name}</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-6">
                                Deseja que a IA gere uma sugestão de conteúdo criativo para o feriado <strong>{suggestionModal.holiday.name}</strong> no dia {suggestionModal.date.toLocaleDateString()}?
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setSuggestionModal(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                                    disabled={isGenerating}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={generateSuggestion}
                                    disabled={isGenerating}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Gerando...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            Gerar Sugestão
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Scheduling Modal */}
            {schedulingModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <CalendarIcon size={24} /> Novo Agendamento
                                </h2>
                                <p className="text-blue-100 text-sm mt-1">
                                    {schedulingModal.date?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                            <button onClick={() => setSchedulingModal({ isOpen: false, date: null })} className="text-white/80 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Título do Evento</label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="Ex: Reunião de Alinhamento"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Tipo</label>
                                    <select
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newEvent.type}
                                        onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                                    >
                                        <option value="meeting">Reunião</option>
                                        <option value="call">Ligação</option>
                                        <option value="task">Tarefa</option>
                                        <option value="reminder">Lembrete</option>
                                        <option value="deadline">Prazo Final</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Horário</label>
                                    <input
                                        type="time"
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newEvent.time}
                                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Descrição</label>
                                <textarea
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                    placeholder="Detalhes adicionais..."
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setSchedulingModal({ isOpen: false, date: null })}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleScheduleEvent}
                                    disabled={!newEvent.title}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save size={18} /> Agendar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
