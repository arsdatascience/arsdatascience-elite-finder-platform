import React, { useMemo } from 'react';
import { Task } from '../types';

interface GanttViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

export const GanttView: React.FC<GanttViewProps> = ({ tasks, onTaskClick }) => {
    // 1. Determine Timeline Range
    const { minDate, maxDate, totalDays } = useMemo(() => {
        if (!tasks.length) return { minDate: new Date(), maxDate: new Date(), totalDays: 1 };

        let min = new Date();
        let max = new Date();

        tasks.forEach(t => {
            if (t.start_date) {
                const start = new Date(t.start_date);
                if (start < min) min = start;
            }
            if (t.due_date) {
                const end = new Date(t.due_date);
                if (end > max) max = end;
            }
        });

        // Add buffer
        min.setDate(min.getDate() - 2);
        max.setDate(max.getDate() + 5);

        const diffTime = Math.abs(max.getTime() - min.getTime());
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return { minDate: min, maxDate: max, totalDays };
    }, [tasks]);

    // 2. Generate Days Header
    const days = useMemo(() => {
        const daysArr = [];
        for (let i = 0; i < totalDays; i++) {
            const d = new Date(minDate);
            d.setDate(d.getDate() + i);
            daysArr.push(d);
        }
        return daysArr;
    }, [minDate, totalDays]);

    const getPosition = (dateStr?: string | Date) => {
        if (!dateStr) return 0;
        const date = new Date(dateStr);
        const diff = Math.ceil((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff); // Ensure no negative position
    };

    const getWidth = (start?: string | Date, end?: string | Date) => {
        if (!start && !end) return 1;
        const s = start ? new Date(start) : new Date();
        const e = end ? new Date(end) : new Date(s);
        // Default duration 1 day if dates match or missing
        if (e <= s) e.setDate(s.getDate() + 1);

        const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff);
    };

    const COL_WIDTH = 40; // px per day

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex-1 overflow-auto">
                <div style={{ minWidth: `${totalDays * COL_WIDTH + 200}px` }} className="relative">

                    {/* Header */}
                    <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10 h-10">
                        <div className="w-[200px] flex-shrink-0 border-r border-gray-200 p-2 font-semibold text-gray-600 bg-gray-50 flex items-center">
                            Tarefa
                        </div>
                        <div className="flex">
                            {days.map((d, i) => (
                                <div key={i} className="flex-shrink-0 border-r border-gray-100 flex flex-col items-center justify-center text-xs text-gray-500" style={{ width: COL_WIDTH }}>
                                    <span className="font-bold">{d.getDate()}</span>
                                    <span className="text-[10px] uppercase">{d.toLocaleDateString('pt-BR', { weekday: 'narrow' })}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline Body */}
                    <div className="relative">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex pl-[200px] pointer-events-none">
                            {days.map((_, i) => (
                                <div key={i} className="border-r border-gray-50 h-full" style={{ width: COL_WIDTH }}></div>
                            ))}
                        </div>

                        {/* Tasks */}
                        {tasks.map((task) => {
                            const startPos = getPosition(task.start_date || task.created_at);
                            const duration = getWidth(task.start_date || task.created_at, task.due_date);

                            return (
                                <div key={task.id} className="flex border-b border-gray-100 hover:bg-gray-50 transition-colors h-10 items-center relative group">
                                    {/* Task Name Column */}
                                    <div className="w-[200px] flex-shrink-0 border-r border-gray-200 px-3 py-2 text-sm text-gray-700 truncate cursor-pointer z-10 bg-inherit" onClick={() => onTaskClick(task)}>
                                        {task.title}
                                    </div>

                                    {/* Timeline Bar */}
                                    <div className="flex-1 relative h-full">
                                        <div
                                            onClick={() => onTaskClick(task)}
                                            className={`absolute top-2 h-6 rounded-full shadow-sm cursor-pointer hover:brightness-95 transition-all flex items-center px-2 text-xs text-white truncate
                                                ${task.status === 'done' ? 'bg-emerald-500' :
                                                    task.status === 'review' ? 'bg-amber-500' :
                                                        task.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-400'}
                                             `}
                                            style={{
                                                left: `${startPos * COL_WIDTH}px`,
                                                width: `${duration * COL_WIDTH}px`
                                            }}
                                        >
                                            {duration > 2 && <span className="drop-shadow-sm">{task.title}</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
