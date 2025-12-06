import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Lead } from '@/types';

// --- Droppable Column Component ---
export const DroppableColumn = ({ column, leads, children }: { column: any, leads: Lead[], children: React.ReactNode }) => {
    const { setNodeRef } = useDroppable({
        id: column.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`w-[270px] flex-shrink-0 rounded-xl ${column.bgColor} p-4 flex flex-col gap-3`}
        >
            <div className={`flex items-center justify-between pb-3 border-b-2 ${column.color} mb-2`}>
                <h3 className="font-bold text-gray-700">{column.label}</h3>
                <span className="bg-white px-2 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                    {leads.length}
                </span>
            </div>
            {children}
        </div>
    );
};
