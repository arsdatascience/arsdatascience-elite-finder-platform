import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { X, TrendingUp, Image as ImageIcon, DollarSign, Activity, Filter } from 'lucide-react';

interface AnalyticsData {
    totalImages: number;
    imagesByModel: { name: string; value: number; cost: number; costPerImage: number }[];
    activity: { date: string; count: number }[];
    totalCredits: number;
    recentImages: {
        id: string;
        prompt: string;
        model: string;
        created_at: string;
        width: number;
        height: number;
        cost: number;
    }[];
}

interface AnalyticsDashboardProps {
    onClose: () => void;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onClose }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState<string>('all');

    useEffect(() => {
        fetchData();
    }, [selectedModel]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await apiClient.imageGeneration.getAnalytics(selectedModel);
            if (res.success) {
                setData(res.data);
            }
        } catch (error) {
            console.error('Failed to load analytics', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) {
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

    const safeImagesByModel = data.imagesByModel || [];
    const pieCells = safeImagesByModel.map((_entry: any, index: number) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ));

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl flex flex-col my-8 animate-in zoom-in-95 duration-200 max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Painel de Análise</h2>
                            <p className="text-sm text-gray-500">Métricas de uso e custos por modelo</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                            <Filter size={16} className="text-gray-400" />
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="text-sm text-gray-700 outline-none bg-transparent border-none cursor-pointer"
                            >
                                <option value="all">Todos os Modelos</option>
                                <option value="flux-schnell">Flux Schnell</option>
                                <option value="sdxl-lightning">SDXL Lightning</option>
                                <option value="z-image-turbo">Z-Image Turbo</option>
                                <option value="stable-diffusion">Stable Diffusion</option>
                                <option value="dall-e-3">DALL-E 3</option>
                                <option value="gemini-2.5-flash-image">Gemini Flash</option>
                            </select>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
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
                            <div className="text-xs text-gray-400">Filtrado por modelo</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Custo Total (Tokens)</p>
                                    <h3 className="text-3xl font-bold text-gray-800 mt-1">{(data.totalCredits || 0).toFixed(3)}</h3>
                                </div>
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <DollarSign size={20} />
                                </div>
                            </div>
                            <div className="text-xs text-gray-400">Créditos consumidos</div>
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

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-800 mb-6">Atividade Recente</h4>
                            <div style={{ width: '100%', height: 300 }}>
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
                            <h4 className="text-lg font-semibold text-gray-800 mb-6">Distribuição por Modelo</h4>
                            <div className="h-64 w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={safeImagesByModel}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieCells}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                                {safeImagesByModel.map((entry: any, index: number) => (
                                    <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span>{entry.name}: {entry.value} ({(entry.cost || 0).toFixed(2)} tokens)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h4 className="text-lg font-semibold text-gray-800">Detalhamento de Custos (Últimas 50 Imagens)</h4>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3">Data</th>
                                        <th className="px-6 py-3">Modelo</th>
                                        <th className="px-6 py-3">Dimensões</th>
                                        <th className="px-6 py-3">Prompt</th>
                                        <th className="px-6 py-3 text-right">Custo (Tokens)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.recentImages && data.recentImages.length > 0 ? (
                                        data.recentImages.map((img) => (
                                            <tr key={img.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-3 text-gray-600 whitespace-nowrap">
                                                    {new Date(img.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                                        {img.model}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-gray-500">
                                                    {img.width}x{img.height}
                                                </td>
                                                <td className="px-6 py-3 text-gray-600 max-w-xs truncate" title={img.prompt}>
                                                    {img.prompt}
                                                </td>
                                                <td className="px-6 py-3 text-right font-medium text-gray-900">
                                                    {(img.cost || 0).toFixed(3)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                                                Nenhum registro encontrado para este filtro.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
