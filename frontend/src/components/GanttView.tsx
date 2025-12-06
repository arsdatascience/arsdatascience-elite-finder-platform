import React, { useMemo } from 'react';
import { Task } from '../types';

interface GanttViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

export const GanttView: React.FC<GanttViewProps> = ({ tasks, onTaskClick }) => {
    // 1. Determine Timeline Range
    const { minDate, maxDate, totalDays } = useMemo(() => {
        if (!tasks || !tasks.length) {
            const now = new Date();
            const next = new Date();
            next.setDate(now.getDate() + 7);
            return { minDate: now, maxDate: next, totalDays: 8 };
        }

        let min = new Date(); // Default to now
        let max = new Date(); // Default to now
        let hasValidDates = false;

        tasks.forEach(t => {
            if (t.start_date) {
                const start = new Date(t.start_date);
                if (!isNaN(start.getTime())) {
                    if (!hasValidDates || start < min) min = start;
                    hasValidDates = true;
                }
            }
            if (t.due_date) {
                const end = new Date(t.due_date);
                if (!isNaN(end.getTime())) {
                    if (!hasValidDates || end > max) max = end;
                    hasValidDates = true;
                }
            }
        });

        if (!hasValidDates) {
            const now = new Date();
            const next = new Date();
            next.setDate(now.getDate() + 7);
            return { minDate: now, maxDate: next, totalDays: 8 };
        }

        // Add buffer
        const bufferMin = new Date(min);
        bufferMin.setDate(min.getDate() - 2);

        const bufferMax = new Date(max);
        bufferMax.setDate(max.getDate() + 5);

        const diffTime = Math.abs(bufferMax.getTime() - bufferMin.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalDays = (!isNaN(days) && days > 0 && days < 3650) ? days : 30;

        return { minDate: bufferMin, maxDate: bufferMax, totalDays };
    }, [tasks]);

    // 2. Generate Days Header
    const days = useMemo(() => {
        const daysArr = [];
        const safeTotal = (totalDays > 0 && totalDays < 3650) ? totalDays : 30; // Safety cap
        for (let i = 0; i < safeTotal; i++) {
            const d = new Date(minDate);
            d.setDate(d.getDate() + i);
            daysArr.push(d);
        }
        return daysArr;
    }, [minDate, totalDays]);

    const getPosition = (dateStr?: string | Date) => {
        if (!dateStr) return 0;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 0;

        const diff = Math.ceil((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
    };

    const getWidth = (start?: string | Date, end?: string | Date) => {
        // Default to 1 day
        let s = start ? new Date(start) : new Date(); // Default start to now if missing
        let e = end ? new Date(end) : null;

        if (isNaN(s.getTime())) s = new Date(); // Fallback if start invalid

        if (!e || isNaN(e.getTime())) {
            // If end missing/invalid, default to start + 1 day
            e = new Date(s);
            e.setDate(s.getDate() + 1);
        }

        // If end is before start, swap or force length 1
        if (e <= s) {
            e = new Date(s);
            e.setDate(s.getDate() + 1);
        }

        const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff);
    };

    const COL_WIDTH = 40; // px per day

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex-1 overflow-auto">
                <div style={{ minWidth: `${days.length * COL_WIDTH + 200}px` }} className="relative h-full">

                    {/* Header */}
                    <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10 h-10">
                        <div className="w-[200px] flex-shrink-0 border-r border-gray-200 p-2 font-semibold text-gray-600 bg-gray-50 flex items-center shadow-sm">
                            Tarefa
                        </div>
                        <div className="flex">
                            {days.map((d, i) => (
                                <div key={i} className="flex-shrink-0 border-r border-gray-100 flex flex-col items-center justify-center text-xs text-gray-500 bg-gray-50" style={{ width: COL_WIDTH }}>
                                    <span className="font-bold">{d.getDate()}</span>
                                    <span className="text-[10px] uppercase">{d.toLocaleDateString('pt-BR', { weekday: 'narrow' })}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline Body */}
                    <div className="relative min-h-[200px]">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex pl-[200px] pointer-events-none h-full">
                            {days.map((_, i) => (
                                <div key={i} className="border-r border-gray-50 h-full" style={{ width: COL_WIDTH }}></div>
                            ))}
                        </div>

                        {/* Tasks */}
                        <div className="pt-2 pb-10">
                            {tasks.map((task) => {
                                const startPos = getPosition(task.start_date || task.created_at);
                                const duration = getWidth(task.start_date || task.created_at, task.due_date);

                                return (
                                    <div key={task.id} className="flex border-b border-gray-50 hover:bg-gray-50 transition-colors h-10 items-center relative group">
                                        {/* Task Name Column */}
                                        <div
                                            className="w-[200px] flex-shrink-0 border-r border-gray-200 px-3 py-2 text-sm text-gray-700 truncate cursor-pointer z-10 bg-white group-hover:bg-gray-50 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                                            onClick={() => onTaskClick(task)}
                                        >
                                            {task.title}
                                        </div>

                                        {/* Timeline Bar */}
                                        <div className="flex-1 relative h-full">
                                            <div
                                                onClick={() => onTaskClick(task)}
                                                className={`absolute top-2 h-6 rounded-full shadow-sm cursor-pointer hover:scale-105 transition-transform flex items-center px-2 text-xs text-white truncate
                                                    ${task.status === 'done' ? 'bg-emerald-500' :
                                                        task.status === 'review' ? 'bg-amber-500' :
                                                            task.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-400'}
                                                `}
                                                style={{
                                                    left: `${startPos * COL_WIDTH}px`,
                                                    width: `${duration * COL_WIDTH}px`
                                                }}
                                                title={`${task.title} (${task.status})`}
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
        </div>
    );
};
