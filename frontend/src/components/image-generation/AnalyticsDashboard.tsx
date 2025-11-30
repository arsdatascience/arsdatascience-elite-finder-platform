import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { X, TrendingUp, Image as ImageIcon, DollarSign, Activity } from 'lucide-react';

interface AnalyticsData {
    totalImages: number;
    imagesByModel: { name: string; value: number }[];
    activity: { date: string; count: number }[];
    totalCredits: number;
}

interface AnalyticsDashboardProps {
    onClose: () => void;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onClose }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await apiClient.imageGeneration.getAnalytics();
                if (res.success) {
                    setData(res.data);
                }
            } catch (error) {
                console.error('Failed to load analytics', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                    <p className="text-gray-500">Carregando dados...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col my-8 animate-in zoom-in-95 duration-200 max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Painel de Análise</h2>
                            <p className="text-sm text-gray-500">Métricas de uso e performance</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-full transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Total de Imagens</p>
                                    <h3 className="text-3xl font-bold text-gray-800 mt-1">{data.totalImages}</h3>
                                </div>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <ImageIcon size={20} />
                                </div>
                            </div>
                            <div className="text-xs text-gray-400">Desde o início</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Custo Estimado</p>
                                    <h3 className="text-3xl font-bold text-gray-800 mt-1">${data.totalCredits.toFixed(2)}</h3>
                                </div>
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <DollarSign size={20} />
                                </div>
                            </div>
                            <div className="text-xs text-gray-400">Baseado no uso de modelos</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Média Diária</p>
                                    <h3 className="text-3xl font-bold text-gray-800 mt-1">
                                        {(data.activity.reduce((acc, curr) => acc + curr.count, 0) / 30).toFixed(1)}
                                    </h3>
                                </div>
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <Activity size={20} />
                                </div>
                            </div>
                            <div className="text-xs text-gray-400">Últimos 30 dias</div>
                        </div>
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-800 mb-6">Atividade Recente (30 dias)</h4>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.activity}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10 }}
                                            tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                                        />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#8884d8"
                                            strokeWidth={3}
                                            dot={{ r: 3, fill: '#8884d8' }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-800 mb-6">Modelos Mais Utilizados</h4>
                            <div className="h-64 w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.imagesByModel}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {data.imagesByModel.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                                {data.imagesByModel.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span>{entry.name} ({entry.value})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
