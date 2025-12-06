import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Task } from '../types';

interface WorkloadViewProps {
    tasks: Task[];
    users: any[];
}

export const WorkloadView: React.FC<WorkloadViewProps> = ({ tasks, users }) => {

    const data = useMemo(() => {
        // Init map with all users to ensure everyone shows up even if 0 tasks
        const userMap: Record<string, any> = {};

        users.forEach(u => {
            userMap[u.id] = {
                name: u.name || u.email || `User ${u.id}`,
                todo: 0,
                in_progress: 0,
                review: 0,
                done: 0,
                total: 0
            };
        });

        // Add Unassigned if needed
        userMap['unassigned'] = { name: 'Não Atribuído', todo: 0, in_progress: 0, review: 0, done: 0, total: 0 };

        tasks.forEach(task => {
            const assigneeId = task.assignee_id ? String(task.assignee_id) : 'unassigned';

            // If user not in list (maybe deleted?), add basic entry
            if (!userMap[assigneeId]) {
                userMap[assigneeId] = {
                    name: task.assignee_name || 'Desconhecido',
                    todo: 0, in_progress: 0, review: 0, done: 0, total: 0
                };
            }

            const status = task.status || 'todo';
            if (userMap[assigneeId][status] !== undefined) {
                userMap[assigneeId][status]++;
            } else {
                // Map unknown statuses to todo or ignore? Let's map to todo default
                userMap[assigneeId].todo++;
            }
            userMap[assigneeId].total++;
        });

        return Object.values(userMap).filter(u => u.total > 0 || users.length < 10); // Show empty users only if list is small
    }, [tasks, users]);

    return (
        <div className="h-full bg-white p-6 rounded-lg border border-gray-200 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Workload da Equipe</h3>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#f0f0f0" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f9fafb' }}
                        />
                        <Legend />
                        <Bar dataKey="todo" name="A Fazer" stackId="a" fill="#64748b" barSize={20} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="in_progress" name="Em Progresso" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="review" name="Revisão" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="done" name="Concluído" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
