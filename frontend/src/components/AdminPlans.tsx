import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Plus, X } from 'lucide-react';

interface Plan {
    id: number;
    name: string;
    price: number;
    limits: {
        social_posts_per_day: number;
        ai_generations_per_day: number;
    };
    features: string[];
}

export const AdminPlans: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/plans`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setPlans(data);
        } catch (error) {
            console.error('Erro ao buscar planos:', error);
        }
    };

    const handleSave = async (plan: Plan) => {
        const token = localStorage.getItem('token');
        const method = plan.id === 0 ? 'POST' : 'PUT';
        const url = plan.id === 0
            ? `${import.meta.env.VITE_API_URL}/api/admin/plans`
            : `${import.meta.env.VITE_API_URL}/api/admin/plans/${plan.id}`;

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(plan)
            });

            if (res.ok) {
                fetchPlans();
                setEditingPlan(null);
                setIsCreating(false);
            } else {
                alert('Erro ao salvar plano');
            }
        } catch (e) {
            console.error(e);
            alert('Erro de conexão');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza?')) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/admin/plans/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchPlans();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Gestão de Planos</h2>
                <button
                    onClick={() => {
                        setEditingPlan({
                            id: 0,
                            name: 'Novo Plano',
                            price: 0,
                            limits: { social_posts_per_day: 10, ai_generations_per_day: 5 },
                            features: []
                        });
                        setIsCreating(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} /> Novo Plano
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className="border border-gray-200 rounded-xl p-6 relative group hover:shadow-md transition-shadow bg-gray-50">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingPlan(plan)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(plan.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                        <div className="text-2xl font-bold text-blue-600 my-2">
                            R$ {plan.price}<span className="text-sm text-gray-500 font-normal">/mês</span>
                        </div>

                        <div className="space-y-2 mt-4 text-sm text-gray-600">
                            <p className="flex justify-between"><span>Posts Sociais:</span> <strong>{plan.limits.social_posts_per_day}/dia</strong></p>
                            <p className="flex justify-between"><span>Gerações IA:</span> <strong>{plan.limits.ai_generations_per_day}/dia</strong></p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Edição */}
            {(editingPlan || isCreating) && editingPlan && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{editingPlan.id === 0 ? 'Criar Plano' : 'Editar Plano'}</h3>
                            <button onClick={() => setEditingPlan(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Plano</label>
                                <input
                                    value={editingPlan.name}
                                    onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: Pro, Enterprise"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                                <input
                                    type="number"
                                    value={editingPlan.price}
                                    onChange={e => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Limite Posts/Dia</label>
                                    <input
                                        type="number"
                                        value={editingPlan.limits.social_posts_per_day}
                                        onChange={e => setEditingPlan({
                                            ...editingPlan,
                                            limits: { ...editingPlan.limits, social_posts_per_day: Number(e.target.value) }
                                        })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Limite IA/Dia</label>
                                    <input
                                        type="number"
                                        value={editingPlan.limits.ai_generations_per_day}
                                        onChange={e => setEditingPlan({
                                            ...editingPlan,
                                            limits: { ...editingPlan.limits, ai_generations_per_day: Number(e.target.value) }
                                        })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => handleSave(editingPlan)}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 mt-4 shadow-lg shadow-blue-200 transition-all"
                            >
                                Salvar Plano
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
