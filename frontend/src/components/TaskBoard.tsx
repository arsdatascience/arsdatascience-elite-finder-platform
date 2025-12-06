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
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { apiClient } from '../services/apiClient';
import {
    Plus,
    MoreHorizontal,
    Calendar,
    User as UserIcon,
    Trash2
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

export const TaskBoard: React.FC<TaskBoardProps> = ({ project, onDeleteProject, onAdd }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);

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

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find source and destination containers
        const activeTask = tasks.find(t => t.id === activeId);
        const overTask = tasks.find(t => t.id === overId);

        let newStatus = activeTask?.status;

        // Dropped over a column directly
        if (COLUMNS.some(c => c.id === overId)) {
            newStatus = overId;
        }
        // Dropped over another task
        else if (overTask) {
            newStatus = overTask.status;
        }

        if (activeTask && newStatus && activeTask.status !== newStatus) {
            // Optimistic Update
            setTasks(prev => prev.map(t =>
                t.id === activeId ? { ...t, status: newStatus as string } : t
            ));

            // API Update
            await apiClient.tasks.update(activeId, { status: newStatus });
        }
    };

    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: ''
    });

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

    return (
        <div className="flex-1 p-6 overflow-x-auto bg-gray-50">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
                    <p className="text-gray-500 text-sm">Kanban Board</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTaskModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Nova Tarefa
                    </button>
                    {onDeleteProject && (
                        <button onClick={onDeleteProject} className="bg-white border border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200 px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm">
                            <Trash2 className="w-4 h-4" /> Excluir Projeto
                        </button>
                    )}
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-6 h-full min-w-[1000px]">
                    {COLUMNS.map(col => (
                        <div key={col.id} className="flex-1 flex flex-col bg-gray-100 rounded-xl border border-gray-200 h-full max-h-[calc(100vh-250px)]">
                            <div className={`p-4 border-b border-gray-200 flex justify-between items-center border-t-4 ${col.color.replace('bg-', 'border-')}`}>
                                <h3 className="font-semibold text-gray-700">{col.title}</h3>
                                <span className="bg-white text-gray-500 text-xs px-2 py-1 rounded-full border border-gray-200 font-medium">
                                    {tasks.filter(t => t.status === col.id).length}
                                </span>
                            </div>

                            <div className="flex-1 p-3 overflow-y-auto space-y-3">
                                <SortableContext
                                    items={tasks.filter(t => t.status === col.id).map(t => t.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {tasks.filter(t => t.status === col.id).map(task => (
                                        <SortableTask key={task.id} task={task} />
                                    ))}
                                </SortableContext>
                                {tasks.filter(t => t.status === col.id).length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                                        Solte tarefas aqui
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <DragOverlay>
                    {activeId ? (
                        <SortableTask task={tasks.find(t => t.id === activeId)!} />
                    ) : null}
                </DragOverlay>
            </DndContext>

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
                                <input
                                    required
                                    type="text"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500"
                                    placeholder="Ex: Criar Wireframes"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 h-24"
                                    placeholder="Detalhes da tarefa..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                                    <select
                                        value={newTask.priority}
                                        onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="low">Baixa</option>
                                        <option value="medium">Média</option>
                                        <option value="high">Alta</option>
                                        <option value="urgent">Urgente</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                                    <input
                                        type="date"
                                        value={newTask.due_date}
                                        onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTaskModal(false)}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                                >
                                    Criar Tarefa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const SortableTask = ({ task }: { task: Task }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-400 cursor-grab active:cursor-grabbing group shadow-sm hover:shadow-md transition-all"
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide 
                    ${task.priority === 'urgent' ? 'bg-red-50 text-red-600' :
                        task.priority === 'high' ? 'bg-orange-50 text-orange-600' :
                            'bg-blue-50 text-blue-600'}`}>
                    {task.priority}
                </span>
                <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            <h4 className="text-sm font-medium text-gray-800 mb-2">{task.title}</h4>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center text-gray-500 text-xs">
                    {task.assignee_avatar ? (
                        <img src={task.assignee_avatar} alt="Assignee" className="w-5 h-5 rounded-full mr-2" />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-2 border border-gray-200">
                            <UserIcon className="w-3 h-3 text-gray-400" />
                        </div>
                    )}
                </div>
                {task.due_date && (
                    <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                        {new Date(task.due_date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                    </div>
                )}
            </div>
        </div>
    );
};
