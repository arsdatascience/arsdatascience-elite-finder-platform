import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { apiClient } from '../services/apiClient';
import {
    Plus,
    MoreHorizontal,
    Calendar as CalendarIcon,
    User as UserIcon,
    Trash2,
    Layout, // Replaced LayoutKanban
    List,
    BarChart2, // Replaced BarChart (safer)
    Users,
    Clock
} from 'lucide-react';

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    due_date?: string;
    assignee_name?: string;
    assignee_avatar?: string;
    column_order: number;
}

const COLUMNS = [
    { id: 'todo', title: 'A Fazer', color: 'bg-slate-500' },
    { id: 'doing', title: 'Em Progresso', color: 'bg-blue-500' },
    { id: 'review', title: 'Revisão', color: 'bg-yellow-500' },
    { id: 'done', title: 'Concluído', color: 'bg-green-500' }
];

interface TaskBoardProps {
    project: any;
    onDeleteProject?: () => void;
    onAdd?: () => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ project, onDeleteProject }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [view, setView] = useState<'kanban' | 'list' | 'calendar' | 'gantt' | 'workload'>('kanban');
    const [activeId, setActiveId] = useState<number | null>(null);

    // Modal State
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: ''
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchTasks();
    }, [project.id]);

    const fetchTasks = async () => {
        try {
            const data = await apiClient.tasks.list({ project_id: project.id });
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.tasks.create(project.id, {
                ...newTask,
                column_order: tasks.filter(t => t.status === newTask.status).length
            });
            setShowTaskModal(false);
            setNewTask({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '' });
            fetchTasks();
        } catch (error) {
            console.error('Failed to create task:', error);
            alert('Falha ao criar tarefa');
        }
    };

    // Kanban Logic
    const handleDragStart = (event: any) => setActiveId(event.active.id);

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;
        const activeTask = tasks.find(t => t.id === activeId);
        const overTask = tasks.find(t => t.id === overId);

        let newStatus = activeTask?.status;
        if (COLUMNS.some(c => c.id === overId)) newStatus = overId;
        else if (overTask) newStatus = overTask.status;

        if (activeTask && newStatus && activeTask.status !== newStatus) {
            setTasks(prev => prev.map(t =>
                t.id === activeId ? { ...t, status: newStatus as string } : t
            ));
            await apiClient.tasks.update(activeId, { status: newStatus });
        }
    };

    const getStatusText = (status: string) => COLUMNS.find(c => c.id === status)?.title || status;
    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'urgent': return 'bg-red-50 text-red-600';
            case 'high': return 'bg-orange-50 text-orange-600';
            default: return 'bg-blue-50 text-blue-600';
        }
    };

    return (
        <div className="flex-1 p-6 overflow-hidden flex flex-col bg-gray-50 h-full">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
                    <div className="flex items-center gap-4 mt-2">
                        {[
                            { id: 'kanban', icon: Layout, label: 'Kanban' }, // Updated
                            { id: 'list', icon: List, label: 'Lista' },
                            { id: 'calendar', icon: CalendarIcon, label: 'Calendário' },
                            { id: 'gantt', icon: Clock, label: 'Gantt' },
                            { id: 'workload', icon: Users, label: 'Workload' },
                        ].map(v => (
                            <button
                                key={v.id}
                                onClick={() => setView(v.id as any)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${view === v.id ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <v.icon className="w-4 h-4" />
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTaskModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Nova Tarefa
                    </button>
                    {onDeleteProject && (
                        <button onClick={onDeleteProject} className="bg-white border border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200 px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto min-h-0">
                {/* Kanban View */}
                {view === 'kanban' && (
                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="flex gap-6 h-full min-w-[1000px]">
                            {COLUMNS.map(col => (
                                <div key={col.id} className="flex-1 flex flex-col bg-gray-100 rounded-xl border border-gray-200 h-full max-h-full">
                                    <div className={`p-4 border-b border-gray-200 flex justify-between items-center border-t-4 ${col.color.replace('bg-', 'border-')}`}>
                                        <h3 className="font-semibold text-gray-700">{col.title}</h3>
                                        <span className="bg-white text-gray-500 text-xs px-2 py-1 rounded-full border border-gray-200 font-medium">
                                            {tasks.filter(t => t.status === col.id).length}
                                        </span>
                                    </div>
                                    <div className="flex-1 p-3 overflow-y-auto space-y-3">
                                        <SortableContext items={tasks.filter(t => t.status === col.id).map(t => t.id)} strategy={verticalListSortingStrategy}>
                                            {tasks.filter(t => t.status === col.id).map(task => <SortableTask key={task.id} task={task} />)}
                                        </SortableContext>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <DragOverlay>{activeId ? <SortableTask task={tasks.find(t => t.id === activeId)!} /> : null}</DragOverlay>
                    </DndContext>
                )}

                {/* List View */}
                {view === 'list' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="p-4">Tarefa</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Prioridade</th>
                                    <th className="p-4">Responsável</th>
                                    <th className="p-4">Prazo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {tasks.map(task => (
                                    <tr key={task.id} className="hover:bg-gray-50/50">
                                        <td className="p-4 font-medium text-gray-800">{task.title}</td>
                                        <td className="p-4"><span className="px-2 py-1 bg-gray-100 rounded-md text-xs">{getStatusText(task.status)}</span></td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded-md text-xs capitalize ${getPriorityColor(task.priority)}`}>{task.priority}</span></td>
                                        <td className="p-4 text-gray-500">{task.assignee_name || '-'}</td>
                                        <td className="p-4 text-gray-500">{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Calendar View (Simple List for now, real Calendar is complex) */}
                {view === 'calendar' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                        {Array.from({ length: 30 }, (_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() + i);
                            const dayTasks = tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === date.toDateString());
                            return (
                                <div key={i} className="bg-white border border-gray-200 p-3 rounded-lg min-h-[120px]">
                                    <div className="text-xs text-gray-500 mb-2 font-medium">{date.toLocaleDateString()}</div>
                                    {dayTasks.map(t => (
                                        <div key={t.id} className="bg-blue-50 text-blue-700 text-xs p-1.5 rounded mb-1 truncate">
                                            {t.title}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Gantt View (Simulated) */}
                {view === 'gantt' && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 overflow-x-auto">
                        <div className="min-w-[800px]">
                            <div className="flex border-b border-gray-200 pb-2 mb-4">
                                <div className="w-1/4 font-medium text-gray-500">Tarefa</div>
                                <div className="flex-1 flex text-xs text-gray-400 justify-between">
                                    <span>Hoje</span>
                                    <span>+7 Dias</span>
                                    <span>+14 Dias</span>
                                    <span>+30 Dias</span>
                                </div>
                            </div>
                            <div className="space-y-6">
                                {tasks.map((task, i) => (
                                    <div key={task.id} className="relative flex items-center group">
                                        <div className="w-1/4 pr-4">
                                            <div className="font-medium text-gray-800 truncate">{task.title}</div>
                                            <div className="text-xs text-gray-400">{getStatusText(task.status)}</div>
                                        </div>
                                        <div className="flex-1 h-8 bg-gray-50 rounded-full relative overflow-hidden">
                                            <div
                                                className="absolute top-1 bottom-1 bg-blue-500 rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
                                                style={{
                                                    left: `${(i * 5) % 80}%`,
                                                    width: '20%' // Mock width
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Workload View */}
                {view === 'workload' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><UserIcon className="w-5 h-5 text-gray-400" /> Não Atribuído</h3>
                            <div className="space-y-3">
                                {tasks.filter(t => !t.assignee_name).map(t => (
                                    <div key={t.id} className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-100">
                                        <div className="font-medium text-gray-700">{t.title}</div>
                                        <div className="text-xs text-gray-400 mt-1 flex justify-between">
                                            <span>{getStatusText(t.status)}</span>
                                            <span className="uppercase">{t.priority}</span>
                                        </div>
                                    </div>
                                ))}
                                {tasks.filter(t => !t.assignee_name).length === 0 && <p className="text-gray-400 text-sm">Nenhuma tarefa.</p>}
                            </div>
                        </div>
                        {/* Mock Users for Demo if no real assignees yet */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><UserIcon className="w-5 h-5 text-purple-400" /> Equipe</h3>
                            <p className="text-gray-500 text-sm">Adicione membros ao projeto para ver a distribuição de carga de trabalho.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* New Task Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full shadow-2xl">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">Nova Tarefa</h3>
                            <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input required type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 outline-none focus:border-blue-500" placeholder="Título" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 outline-none focus:border-blue-500 h-24" placeholder="Detalhes..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                                    <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 outline-none focus:border-blue-500">
                                        <option value="low">Baixa</option>
                                        <option value="medium">Média</option>
                                        <option value="high">Alta</option>
                                        <option value="urgent">Urgente</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                                    <input type="date" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 outline-none focus:border-blue-500" />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm">Criar Tarefa</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const SortableTask = ({ task }: { task: Task }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-400 cursor-grab active:cursor-grabbing group shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${task.priority === 'urgent' ? 'bg-red-50 text-red-600' : task.priority === 'high' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>{task.priority}</span>
                <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></button>
            </div>
            <h4 className="text-sm font-medium text-gray-800 mb-2">{task.title}</h4>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center text-gray-500 text-xs">
                    {task.assignee_avatar ? <img src={task.assignee_avatar} alt="Assignee" className="w-5 h-5 rounded-full mr-2" /> : <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-2 border border-gray-200"><UserIcon className="w-3 h-3 text-gray-400" /></div>}
                </div>
                {task.due_date && <div className="flex items-center text-xs text-gray-500"><CalendarIcon className="w-3 h-3 mr-1 text-gray-400" />{new Date(task.due_date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}</div>}
            </div>
        </div>
    );
};
