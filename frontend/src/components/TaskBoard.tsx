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
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ project }) => {
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

    return (
        <div className="flex-1 p-6 overflow-x-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">{project.name}</h2>
                    <p className="text-slate-400 text-sm">Kanban Board</p>
                </div>
                <div className="flex gap-2">
                    {/* Add Task Button Placeholder */}
                    <button className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nova Tarefa
                    </button>
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
                        <div key={col.id} className="flex-1 flex flex-col bg-[#1e293b] rounded-xl border border-slate-800 h-full max-h-[calc(100vh-250px)]">
                            <div className={`p-4 border-b border-slate-700 flex justify-between items-center border-t-4 ${col.color.replace('bg-', 'border-')}`}>
                                <h3 className="font-semibold text-white">{col.title}</h3>
                                <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-full">
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
                                    <div className="text-center py-8 text-slate-600 text-sm border-2 border-dashed border-slate-800 rounded-lg">
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
            className="bg-[#0f172a] p-4 rounded-lg border border-slate-700 hover:border-blue-500/50 cursor-grab active:cursor-grabbing group shadow-sm transition-all"
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide 
                    ${task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                        task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-blue-500/20 text-blue-400'}`}>
                    {task.priority}
                </span>
                <button className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            <h4 className="text-sm font-medium text-white mb-2">{task.title}</h4>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                <div className="flex items-center text-slate-500 text-xs">
                    {task.assignee_avatar ? (
                        <img src={task.assignee_avatar} alt="Assignee" className="w-5 h-5 rounded-full mr-2" />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center mr-2">
                            <UserIcon className="w-3 h-3 text-slate-400" />
                        </div>
                    )}
                </div>
                {task.due_date && (
                    <div className="flex items-center text-xs text-slate-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(task.due_date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                    </div>
                )}
            </div>
        </div>
    );
};
