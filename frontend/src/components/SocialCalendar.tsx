
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Grid3x3, List, Instagram, Facebook, Linkedin, Twitter, Trash2, Clock, Users, Gift, Sparkles, X, Save } from 'lucide-react';

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
    title?: string;
    type?: string;
    endTime?: string;
    description?: string;
    videoConference?: { type: 'meet' | 'zoom' | 'teams' | null, link: string };
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
    onPostClick,
    onPostUpdate,
    onPostDelete
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'facebook', 'linkedin', 'twitter', 'youtube', 'google', 'meta']);
    const [selectedClient, setSelectedClient] = useState<string>('all');
    const [draggedPost, setDraggedPost] = useState<Post | null>(null);
    const [suggestionModal, setSuggestionModal] = useState<{ isOpen: boolean, holiday: any, date: Date } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [schedulingModal, setSchedulingModal] = useState<{ isOpen: boolean, date: Date | null }>({ isOpen: false, date: null });
    const [newEvent, setNewEvent] = useState({
        id: null as string | null,
        category: 'meeting' as 'meeting' | 'social_post',
        title: '',
        content: '',
        platform: 'instagram',
        type: 'meeting',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        videoConference: { type: null as 'meet' | 'zoom' | 'teams' | null, link: '' }
    });

    const [editingEventId, setEditingEventId] = useState<string | null>(null);

    const location = useLocation();

    useEffect(() => {
        if (location.state?.leadToSchedule) {
            const lead = location.state.leadToSchedule;
            setNewEvent({
                id: null,
                category: 'meeting',
                title: `Reunião com ${lead.name}`,
                content: '',
                platform: 'instagram',
                type: 'meeting',
                startTime: '09:00',
                endTime: '10:00',
                description: `Lead: ${lead.name}\nEmpresa: ${lead.company || 'N/A'}\nTelefone: ${lead.phone}\nEmail: ${lead.email}\nNotas: ${lead.notes || ''}`,
                videoConference: { type: null, link: '' }
            });
            setSchedulingModal({ isOpen: true, date: new Date() });
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const handleEditPost = (post: Post) => {
        const date = new Date(post.scheduled_date);
        const isSocialPost = ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'].includes(post.platform);

        setNewEvent({
            id: post.id,
            category: isSocialPost ? 'social_post' : 'meeting',
            title: post.title || '',
            content: post.content || '',
            platform: post.platform || 'instagram',
            type: post.type || 'meeting',
            startTime: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            endTime: post.endTime || new Date(date.getTime() + 60 * 60 * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            description: post.description || '',
            videoConference: post.videoConference || { type: null, link: '' }
        });
        if (onPostClick) onPostClick(post);
        setEditingEventId(post.id);
        setSchedulingModal({ isOpen: true, date });
    };

    const resetNewEvent = () => {
        setNewEvent({
            id: null,
            category: 'meeting',
            title: '',
            content: '',
            platform: 'instagram',
            type: 'meeting',
            startTime: '09:00',
            endTime: '10:00',
            description: '',
            videoConference: { type: null, link: '' }
        });
    };

    const handleScheduleEvent = () => {
        if (!schedulingModal.date) return;

        // Combine date and time
        const [hours, minutes] = newEvent.startTime.split(':').map(Number);
        const scheduledDate = new Date(schedulingModal.date);
        scheduledDate.setHours(hours, minutes, 0, 0);

        const payload = {
            ...newEvent,
            scheduled_date: scheduledDate.toISOString(),
            clientId: selectedClient === 'all' ? undefined : selectedClient
        };

        if (editingEventId) {
            updatePostMutation.mutate({ id: editingEventId, data: payload });
        } else {
            createPostMutation.mutate(payload);
        }
    };

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
            case 'facebook': return 'bg-primary-50 text-primary-700 border-blue-200';
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

    const handleDrop = (day?: number, month?: number, year?: number, hour?: number, minute?: number) => {
        if (!draggedPost) return;

        const newDate = new Date(draggedPost.scheduled_date || currentDate);

        // Update date components if provided
        if (day !== undefined) newDate.setDate(day);
        if (month !== undefined) newDate.setMonth(month);
        if (year !== undefined) newDate.setFullYear(year);

        // Update time components if provided
        if (hour !== undefined) newDate.setHours(hour);
        if (minute !== undefined) newDate.setMinutes(minute);

        // Call API to persist change
        updatePostMutation.mutate({
            id: draggedPost.id,
            data: { scheduled_date: newDate.toISOString() }
        });

        // Optimistic update (optional, but good for UX)
        if (onPostUpdate) {
            onPostUpdate(draggedPost.id, newDate.toISOString());
        }

        setDraggedPost(null);
    };

    // Delete Mutation
    const deletePostMutation = useMutation({
        mutationFn: apiClient.social.deletePost,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
            if (onPostDelete) onPostDelete(variables);
        }
    });

    // Create Mutation
    const createPostMutation = useMutation({
        mutationFn: apiClient.social.createPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
            setSchedulingModal({ isOpen: false, date: null });
            resetNewEvent();
            alert('Agendamento criado com sucesso!');
        },
        onError: (error) => {
            console.error('Failed to create post:', error);
            alert('Falha ao criar agendamento. Tente novamente.');
        }
    });

    // Update Mutation
    const updatePostMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => apiClient.social.updatePost(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
            setSchedulingModal({ isOpen: false, date: null });
            resetNewEvent();
            setEditingEventId(null);
            alert('Agendamento atualizado com sucesso!');
        },
        onError: (error) => {
            console.error('Failed to update post:', error);
            alert('Falha ao atualizar agendamento. Tente novamente.');
        }
    });

    const handleDeletePost = (e: React.MouseEvent, postId: string) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja excluir este agendamento?')) {
            deletePostMutation.mutate(postId);
        }
    };



    // AI Suggestion
    const handleHolidayClick = (holiday: any, date: Date) => {
        setSuggestionModal({ isOpen: true, holiday, date });
    };

    const generateSuggestion = async () => {
        if (!suggestionModal) return;
        setIsGenerating(true);
        try {
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
                    className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 outline-none min-w-[200px]"
                >
                    <option value="all">Todos os Clientes</option>
                    {clients?.map((client: any) => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                </select>
            </div>

            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 items-center justify-between shrink-0">
                <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
                    <button
                        onClick={() => setViewMode('month')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'month' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Grid3x3 size={16} />
                        Mês
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'week' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <List size={16} />
                        Semana
                    </button>
                    <button
                        onClick={() => setViewMode('day')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'day' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Clock size={16} />
                        Dia
                    </button>
                </div>

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
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${isSelected ? getPlatformColor(platform.id) : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                            >
                                <Icon size={14} />
                                {platform.name}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded-full">v1.0</span>
                    <div className="text-sm text-gray-600">
                        <span className="font-bold">{filteredPosts.length}</span> posts
                    </div>
                </div>
            </div>

            {/* Calendar Navigation */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
                <button onClick={previousPeriod} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h4 className="text-xl font-bold text-gray-800">
                    {viewMode === 'month'
                        ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                        : `Semana de ${weekDays[0].getDate()} a ${weekDays[6].getDate()} de ${monthNames[currentDate.getMonth()]}`
                    }
                </h4>
                <button onClick={nextPeriod} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {viewMode === 'month' ? (
                    <div className="grid grid-cols-7 gap-2">
                        {dayNames.map(day => (
                            <div key={day} className="text-center font-bold text-gray-600 text-sm py-2">{day}</div>
                        ))}
                        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square" />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dayPosts = getPostsForDay(day);
                            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                            return (
                                <div
                                    key={day}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(day)}
                                    onClick={() => handleDayClick(day)}
                                    className={`aspect-square border rounded-lg p-2 flex flex-col ${isToday ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'} hover:shadow-md transition-shadow cursor-pointer min-h-[100px]`}
                                >
                                    <div className={`text-sm font-bold mb-1 flex justify-between items-start ${isToday ? 'text-primary-600' : 'text-gray-700'}`}>
                                        <span>{day}</span>
                                        {holidays.find(h => h.date === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0]) && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleHolidayClick(holidays.find(h => h.date === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0]), new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                                                }}
                                                className="text-amber-500 hover:text-amber-600 transition-colors"
                                                title="Feriado/Data Comemorativa"
                                            >
                                                <Gift size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                                        {dayPosts.map(post => {
                                            const Icon = getPlatformIcon(post.platform);
                                            return (
                                                <div
                                                    key={post.id}
                                                    draggable
                                                    onDragStart={() => handleDragStart(post)}
                                                    onClick={(e) => { e.stopPropagation(); handleEditPost(post); }}
                                                    className={`w-full text-left p-1.5 rounded border text-xs transition-all ${getPlatformColor(post.platform)} cursor-move`}
                                                >
                                                    <div className="flex items-center gap-1 group relative pr-4">
                                                        <Icon size={12} className="shrink-0" />
                                                        <span className="truncate flex-1">{post.content.substring(0, 20)}...</span>
                                                        <button
                                                            onClick={(e) => handleDeletePost(e, post.id)}
                                                            className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 text-red-500 rounded transition-all"
                                                        >
                                                            <Trash2 size={10} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : viewMode === 'week' ? (
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
                                    className={`border rounded-lg p-4 ${isToday ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'} hover:shadow-md transition-shadow cursor-pointer`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl font-bold">{date.getDate()}</div>
                                            <div>
                                                <div className="font-bold text-gray-800">{dayNames[date.getDay()]}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {dayPosts.map(post => {
                                            const Icon = getPlatformIcon(post.platform);
                                            return (
                                                <div key={post.id} draggable onDragStart={() => handleDragStart(post)} onClick={(e) => { e.stopPropagation(); handleEditPost(post); }} className={`p-3 rounded-lg border cursor-pointer transition-all ${getPlatformColor(post.platform)}`}>
                                                    <div className="flex items-start gap-2">
                                                        <Icon size={16} className="shrink-0 mt-0.5" />
                                                        <p className="text-sm font-medium line-clamp-2">{post.content}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Day View with DND */
                    <div className="flex flex-col gap-0 border border-gray-200 rounded-lg overflow-hidden">
                        {Array.from({ length: 24 }).map((_, hour) => {
                            const timeString = `${hour.toString().padStart(2, '0')}:00`;
                            const dayPosts = getPostsForDate(currentDate).filter(post => {
                                const postHour = new Date(post.scheduled_date).getHours();
                                return postHour === hour;
                            });

                            return (
                                <div
                                    key={hour}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const offsetY = e.clientY - rect.top;
                                        const percentage = Math.min(Math.max(offsetY / rect.height, 0), 1);
                                        const minute = Math.floor(percentage * 60);
                                        const roundedMinute = Math.round(minute / 15) * 15;
                                        const finalMinute = roundedMinute === 60 ? 0 : roundedMinute;
                                        const finalHour = roundedMinute === 60 ? hour + 1 : hour;
                                        handleDrop(undefined, undefined, undefined, finalHour, finalMinute);
                                    }}
                                    className="flex border-b border-gray-100 min-h-[60px] group hover:bg-gray-50 transition-colors"
                                    onClick={() => {
                                        setNewEvent(prev => ({ ...prev, startTime: timeString, endTime: `${(hour + 1).toString().padStart(2, '0')}:00` }));
                                        setSchedulingModal({ isOpen: true, date: currentDate });
                                    }}
                                >
                                    <div className="w-20 border-r border-gray-100 p-3 text-xs font-medium text-gray-500 flex items-start justify-center">
                                        {timeString}
                                    </div>
                                    <div className="flex-1 p-2 relative">
                                        <div className="absolute top-1/4 left-0 right-0 border-t border-gray-50 pointer-events-none"></div>
                                        <div className="absolute top-2/4 left-0 right-0 border-t border-gray-50 pointer-events-none"></div>
                                        <div className="absolute top-3/4 left-0 right-0 border-t border-gray-50 pointer-events-none"></div>
                                        <div className="flex flex-wrap gap-2 relative z-10">
                                            {dayPosts.map(post => {
                                                const Icon = getPlatformIcon(post.platform);
                                                const postDate = new Date(post.scheduled_date);
                                                const minutes = postDate.getMinutes();
                                                const topOffset = (minutes / 60) * 100;
                                                return (
                                                    <div
                                                        key={post.id}
                                                        draggable
                                                        onDragStart={() => handleDragStart(post)}
                                                        onClick={(e) => { e.stopPropagation(); handleEditPost(post); }}
                                                        className={`px-3 py-1.5 rounded border text-xs transition-all ${getPlatformColor(post.platform)} cursor-move flex items-center gap-2 shadow-sm`}
                                                        style={{ marginTop: `${topOffset}%` }}
                                                    >
                                                        <Icon size={12} />
                                                        <span className="font-medium">{postDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="truncate max-w-[200px]">{post.content}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

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

            {suggestionModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Sparkles size={24} /></div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">Sugestão de Post com IA</h3>
                                <p className="text-sm text-gray-500">{suggestionModal.holiday.name}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Deseja que a IA gere uma sugestão de conteúdo criativo para o feriado <strong>{suggestionModal.holiday.name}</strong> no dia {suggestionModal.date.toLocaleDateString()}?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setSuggestionModal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium" disabled={isGenerating}>Cancelar</button>
                            <button onClick={generateSuggestion} disabled={isGenerating} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2">
                                {isGenerating ? 'Gerando...' : 'Gerar Sugestão'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {schedulingModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-6 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2"><CalendarIcon size={24} /> Novo Agendamento</h2>
                                <p className="text-primary-100 text-sm mt-1">{schedulingModal.date?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                            </div>
                            <button onClick={() => setSchedulingModal({ isOpen: false, date: null })} className="text-white/80 hover:text-white transition-colors"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
                                <button onClick={() => setNewEvent({ ...newEvent, category: 'meeting' })} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${newEvent.category === 'meeting' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>Compromisso / Reunião</button>
                                <button onClick={() => setNewEvent({ ...newEvent, category: 'social_post' })} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${newEvent.category === 'social_post' ? 'bg-white shadow text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>Postagem Social</button>
                            </div>

                            {newEvent.category === 'meeting' ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Título do Evento</label>
                                        <input type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Adicionar título" autoFocus />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div><label className="text-sm font-bold text-gray-700">Início</label><input type="time" className="w-full p-2.5 border border-gray-300 rounded-lg" value={newEvent.startTime} onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })} /></div>
                                        <div><label className="text-sm font-bold text-gray-700">Fim</label><input type="time" className="w-full p-2.5 border border-gray-300 rounded-lg" value={newEvent.endTime} onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })} /></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Conteúdo</label>
                                        <textarea className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none h-32" value={newEvent.content} onChange={(e) => setNewEvent({ ...newEvent, content: e.target.value })} placeholder="Escreva seu post..."></textarea>
                                    </div>
                                    <div><label className="text-sm font-bold text-gray-700">Horário</label><input type="time" className="w-full p-2.5 border border-gray-300 rounded-lg" value={newEvent.startTime} onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })} /></div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 shrink-0">
                                <button onClick={() => setSchedulingModal({ isOpen: false, date: null })} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
                                <button onClick={handleScheduleEvent} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary-200 transition-all"><Save size={18} /> Salvar Agendamento</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
