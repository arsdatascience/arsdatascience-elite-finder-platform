import React, { useState, useEffect } from 'react';
import { DndContext, closestCorners, useSensor, useSensors, PointerSensor, KeyboardSensor, DragOverlay } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Layout, Search, Filter, MoreHorizontal, Calendar as CalendarIcon, Clock, Users, Trash2, User as UserIcon } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { Task } from '../types';
import TaskModal from './TaskModal';

const COLUMNS = [
    { id: 'todo', title: 'A Fazer', color: 'bg-slate-500' },
    { id: 'in_progress', title: 'Em Progresso', color: 'bg-blue-500' },
    { id: 'review', title: 'Revisão', color: 'bg-amber-500' },
    { id: 'done', title: 'Concluído', color: 'bg-emerald-500' }
];

interface TaskBoardProps {
    project: any;
    users?: any[];
    onDeleteProject?: () => void;
    onAdd?: () => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ project, onDeleteProject, users = [] }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [view, setView] = useState<'kanban' | 'list' | 'calendar' | 'gantt' | 'workload'>('kanban');
    const [activeId, setActiveId] = useState<number | null>(null);

    // Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        workspace: '',
        squad: '',
        stage: '',
        tags: '',
        task_type: ''
    });

    // Modal State
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchTasks();
    }, [project.id, filters]);

    const fetchTasks = async () => {
        try {
            const params: any = { project_id: project.id };
            if (filters.status) params.status = filters.status;
            if (filters.workspace) params.workspace = filters.workspace;
            if (filters.squad) params.squad = filters.squad;
            if (filters.stage) params.stage = filters.stage;
            if (filters.tags) params.tags = filters.tags;
            if (filters.task_type) params.task_type = filters.task_type;

            const data = await apiClient.tasks.list(params);

            // Client-side filtering for search
            let filtered = data;
            if (filters.search) {
                const term = filters.search.toLowerCase();
                filtered = data.filter((t: Task) => t.title.toLowerCase().includes(term));
            }

            setTasks(filtered);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const handleOpenCreateModal = () => {
        setSelectedTask(undefined);
        setShowTaskModal(true);
    };

    const handleOpenEditModal = (task: Task) => {
        setSelectedTask(task);
        setShowTaskModal(true);
    };

    const handleSaveTask = async (taskData: Partial<Task>) => {
        try {
            if (taskData.id) {
                // Update
                await apiClient.tasks.update(taskData.id, taskData);
            } else {
                // Create
                await apiClient.tasks.create(project.id, {
                    ...taskData,
                    column_order: tasks.filter(t => t.status === (taskData.status || 'todo')).length
                });
            }
            setShowTaskModal(false);
            fetchTasks();
        } catch (error) {
            console.error('Failed to save task:', error);
            alert('Falha ao salvar tarefa');
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
            <div className="flex flex-col gap-4 mb-6 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
                        <div className="flex items-center gap-4 mt-2">
                            {[
                                { id: 'kanban', icon: Layout, label: 'Kanban' },
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
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors border ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Filter className="w-4 h-4" /> Filtros
                        </button>
                        <button onClick={handleOpenCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm">
                            <Plus className="w-4 h-4" /> Nova Tarefa
                        </button>
                        {onDeleteProject && (
                            <button onClick={onDeleteProject} className="bg-white border border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200 px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters Bar */}
                {showFilters && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        <input
                            placeholder="Buscar..."
                            className="px-3 py-1.5 text-sm border rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500"
                            value={filters.search}
                            onChange={e => setFilters({ ...filters, search: e.target.value })}
                        />
                        <select
                            className="px-3 py-1.5 text-sm border rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500"
                            value={filters.status}
                            onChange={e => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">Status: Todos</option>
                            {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                        <input placeholder="Workspace" className="px-3 py-1.5 text-sm border rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500" value={filters.workspace} onChange={e => setFilters({ ...filters, workspace: e.target.value })} />
                        <input placeholder="Squad" className="px-3 py-1.5 text-sm border rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500" value={filters.squad} onChange={e => setFilters({ ...filters, squad: e.target.value })} />
                        <input placeholder="Etapa" className="px-3 py-1.5 text-sm border rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500" value={filters.stage} onChange={e => setFilters({ ...filters, stage: e.target.value })} />
                        <input placeholder="Tags" className="px-3 py-1.5 text-sm border rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500" value={filters.tags} onChange={e => setFilters({ ...filters, tags: e.target.value })} />
                        <input placeholder="Tipo Tarefa" className="px-3 py-1.5 text-sm border rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500" value={filters.task_type} onChange={e => setFilters({ ...filters, task_type: e.target.value })} />
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-auto min-h-0">
                {/* Kanban View */}
                {view === 'kanban' && (
                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="flex gap-6 h-full min-w-[1200px]">
                            {COLUMNS.map(col => (
                                <div key={col.id} className="flex-1 flex flex-col bg-gray-100 rounded-xl border border-gray-200 h-full max-h-full min-w-[250px]">
                                    <div className={`p-4 border-b border-gray-200 flex justify-between items-center border-t-4 ${col.color.replace('bg-', 'border-')}`}>
                                        <h3 className="font-semibold text-gray-700">{col.title}</h3>
                                        <span className="bg-white text-gray-500 text-xs px-2 py-1 rounded-full border border-gray-200 font-medium">
                                            {tasks.filter(t => t.status === col.id).length}
                                        </span>
                                    </div>
                                    <div className="flex-1 p-3 overflow-y-auto space-y-3">
                                        <SortableContext items={tasks.filter(t => t.status === col.id).map(t => t.id)} strategy={verticalListSortingStrategy}>
                                            {tasks.filter(t => t.status === col.id).map(task =>
                                                <SortableTask key={task.id} task={task} onClick={() => handleOpenEditModal(task)} />
                                            )}
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
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Tarefa</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Etapa</th>
                                    <th className="p-4">Squad</th>
                                    <th className="p-4">Prioridade</th>
                                    <th className="p-4">Responsável</th>
                                    <th className="p-4">Prazo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {tasks.map(task => (
                                    <tr key={task.id} onClick={() => handleOpenEditModal(task)} className="hover:bg-gray-50/50 cursor-pointer">
                                        <td className="p-4 text-gray-400">#{task.id}</td>
                                        <td className="p-4 font-medium text-gray-800">
                                            {task.title}
                                            {task.tags && task.tags.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {task.tags.map((tag: any, i: number) => <span key={i} className="bg-gray-100 text-gray-500 text-[10px] px-1 rounded">{tag}</span>)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4"><span className="px-2 py-1 bg-gray-100 rounded-md text-xs">{getStatusText(task.status)}</span></td>
                                        <td className="p-4 text-gray-500">{task.stage || '-'}</td>
                                        <td className="p-4 text-gray-500">{task.squad || '-'}</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded-md text-xs capitalize ${getPriorityColor(task.priority)}`}>{task.priority}</span></td>
                                        <td className="p-4 text-gray-500">{task.assignee_name || '-'}</td>
                                        <td className="p-4 text-gray-500">{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Calendar View */}
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
                                        <div key={t.id} onClick={() => handleOpenEditModal(t)} className="bg-blue-50 text-blue-700 text-xs p-1.5 rounded mb-1 truncate cursor-pointer hover:bg-blue-100">
                                            {t.title}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )}
                {view === 'gantt' && (<div className="p-10 text-center text-gray-400">Gantt Chart Simulated (Requires more complex Lib)</div>)}
                {view === 'workload' && (<div className="p-10 text-center text-gray-400">Workload Chart Simulated</div>)}
            </div>

            {/* New Task Modal */}
            <TaskModal
                isOpen={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                onSave={handleSaveTask}
                task={selectedTask}
                projectId={project.id}
                users={users}
                projects={[project]} // Pass current project as option
            />
        </div>
    );
};

const SortableTask = ({ task, onClick }: { task: Task, onClick?: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-400 cursor-grab active:cursor-grabbing group shadow-sm hover:shadow-md transition-all"
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${task.priority === 'urgent' ? 'bg-red-50 text-red-600' : task.priority === 'high' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>{task.priority}</span>
                <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></button>
            </div>
            <h4 className="text-sm font-medium text-gray-800 mb-2">{task.title}</h4>
            {task.tags && task.tags.length > 0 && (
                <div className="flex gap-1 mb-2 flex-wrap">
                    {task.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="bg-gray-100 text-gray-500 text-[9px] px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                    {task.tags.length > 3 && <span className="text-[9px] text-gray-400">+{task.tags.length - 3}</span>}
                </div>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center text-gray-500 text-xs">
                    {task.assignee_avatar ? <img src={task.assignee_avatar} alt="Assignee" className="w-5 h-5 rounded-full mr-2" /> : <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-2 border border-gray-200"><UserIcon className="w-3 h-3 text-gray-400" /></div>}
                </div>
                {task.due_date && <div className="flex items-center text-xs text-gray-500"><CalendarIcon className="w-3 h-3 mr-1 text-gray-400" />{new Date(task.due_date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}</div>}
            </div>
        </div>
    );
};
