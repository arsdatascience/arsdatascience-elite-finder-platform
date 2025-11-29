import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Grid3x3, List, Instagram, Facebook, Linkedin, Twitter, Edit2, Trash2, Clock, Users } from 'lucide-react';
import { CLIENTS_LIST } from '../constants';
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
    onClose,
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
    const queryClient = useQueryClient();

    const { data: fetchedPosts, isLoading } = useQuery({
        queryKey: ['socialPosts', selectedClient],
        queryFn: () => apiClient.social.getPosts(selectedClient),
    });

    const updatePostMutation = useMutation({
        mutationFn: (variables: { id: string, data: any }) => apiClient.social.updatePost(variables.id, variables.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
        }
    });

    const deletePostMutation = useMutation({
        mutationFn: (id: string) => apiClient.social.deletePost(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
        }
    });

    const platforms = [
        { id: 'instagram', name: 'Instagram', color: 'pink' },
        { id: 'facebook', name: 'Facebook', color: 'blue' },
        { id: 'linkedin', name: 'LinkedIn', color: 'indigo' },
        { id: 'twitter', name: 'Twitter', color: 'sky' },
        { id: 'youtube', name: 'YouTube', color: 'red' },
        { id: 'google', name: 'Google Ads', color: 'green' },
        { id: 'meta', name: 'Meta Ads', color: 'purple' }
    ];

    const getPlatformIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'instagram': return Instagram;
            case 'facebook': return Facebook;
            case 'linkedin': return Linkedin;
            case 'twitter': return Twitter;
            case 'youtube': return Users; // Usando Users como placeholder para Youtube se não tiver icone
            default: return CalendarIcon;
        }
    };

    const getPlatformColor = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'instagram': return 'bg-pink-100 text-pink-600 border-pink-200 hover:bg-pink-200';
            case 'facebook': return 'bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200';
            case 'linkedin': return 'bg-indigo-100 text-indigo-600 border-indigo-200 hover:bg-indigo-200';
            case 'twitter': return 'bg-sky-100 text-sky-600 border-sky-200 hover:bg-sky-200';
            case 'youtube': return 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200';
            case 'google': return 'bg-green-100 text-green-600 border-green-200 hover:bg-green-200';
            case 'meta': return 'bg-purple-100 text-purple-600 border-purple-200 hover:bg-purple-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200';
        }
    };

    const togglePlatform = (platformId: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(platformId)
                ? prev.filter(p => p !== platformId)
                : [...prev, platformId]
        );
    };

    const effectivePosts = (posts && posts !== MOCK_POSTS) ? posts : (fetchedPosts || []);

    const filteredPosts = effectivePosts.filter((post: Post) => {
        const platformMatch = selectedPlatforms.includes(post.platform.toLowerCase());
        const clientMatch = selectedClient === 'all' || String(post.clientId) === String(selectedClient);
        return platformMatch && clientMatch;
    });

    // Get days in month
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek };
    };

    // Get week days
    const getWeekDays = (date: Date) => {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());

        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push(day);
        }
        return days;
    };

    // Get posts for a specific day
    const getPostsForDay = (day: number, month?: number, year?: number) => {
        const targetYear = year || currentDate.getFullYear();
        const targetMonth = month !== undefined ? month : currentDate.getMonth();
        const dateStr = new Date(targetYear, targetMonth, day).toISOString().split('T')[0];

        return filteredPosts.filter(post => {
            const postDate = post.scheduled_date || post.published_date;
            if (!postDate) return false;
            return postDate.split('T')[0] === dateStr;
        });
    };

    const getPostsForDate = (date: Date) => {
        return getPostsForDay(date.getDate(), date.getMonth(), date.getFullYear());
    };

    // Drag and drop handlers
    const handleDragStart = (post: Post) => {
        setDraggedPost(post);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (day: number, month?: number, year?: number) => {
        if (!draggedPost || !onPostUpdate) return;

        const targetYear = year || currentDate.getFullYear();
        const targetMonth = month !== undefined ? month : currentDate.getMonth();
        const newDate = new Date(targetYear, targetMonth, day);
        const newDateStr = newDate.toISOString();

        if (onPostUpdate) {
            onPostUpdate(draggedPost.id, newDateStr);
        } else {
            updatePostMutation.mutate({ id: draggedPost.id, data: { scheduled_date: newDateStr } });
        }
        setDraggedPost(null);
    };

    // Inline edit handlers
    const startEdit = (post: Post) => {
        setEditingPostId(post.id);
        setEditContent(post.content);
    };

    const saveEdit = () => {
        if (editingPostId) {
            updatePostMutation.mutate({ id: editingPostId, data: { content: editContent } });
        }
        setEditingPostId(null);
        setEditContent('');
    };

    const cancelEdit = () => {
        setEditingPostId(null);
        setEditContent('');
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const weekDays = getWeekDays(currentDate);

    const previousPeriod = () => {
        if (viewMode === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        } else {
            const newDate = new Date(currentDate);
            newDate.setDate(currentDate.getDate() - 7);
            setCurrentDate(newDate);
        }
    };

    const nextPeriod = () => {
        if (viewMode === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        } else {
            const newDate = new Date(currentDate);
            newDate.setDate(currentDate.getDate() + 7);
            setCurrentDate(newDate);
        }
    };

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const isModal = !!onClose;

    return (
        <div className={isModal ? "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" : "h-full flex flex-col"}>
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${isModal ? 'max-w-7xl max-h-[90vh]' : 'h-full'} flex flex-col overflow-hidden animate-fade-in`}>

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        <CalendarIcon size={28} />
                        <div>
                            <h3 className="text-2xl font-bold">Calendário de Publicações</h3>
                            <p className="text-blue-100 text-sm">Visualize e gerencie seus posts agendados</p>
                        </div>
                    </div>
                    {isModal && (
                        <button onClick={onClose} className="text-white/80 hover:text-white text-2xl font-bold">
                            ×
                        </button>
                    )}
                </div>

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
                        {CLIENTS_LIST.map(client => (
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
                                        className={`aspect-square border rounded-lg p-2 flex flex-col ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                                            } hover:shadow-md transition-shadow cursor-pointer min-h-[100px]`}
                                    >
                                        <div className={`text-sm font-bold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                                            {day}
                                        </div>

                                        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                                            {dayPosts.map(post => {
                                                const Icon = getPlatformIcon(post.platform);
                                                const isEditing = editingPostId === post.id;

                                                return (
                                                    <div
                                                        key={post.id}
                                                        draggable
                                                        onDragStart={() => handleDragStart(post)}
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
                                        className={`border rounded-lg p-4 ${isToday ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'
                                            } hover:shadow-md transition-shadow`}
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
                                                        onClick={() => onPostClick(post)}
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
            </div>
        </div>
    );
};
