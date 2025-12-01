import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Plus, X, Building, Users, CheckCircle, XCircle } from 'lucide-react';

interface Tenant {
    id: number;
    name: string;
    cnpj: string;
    email: string;
    phone: string;
    plan_name: string;
    plan_id: number;
    status: string;
    user_count: number;
    address_street?: string;
    address_number?: string;
    address_complement?: string;
    address_district?: string;
    address_city?: string;
    address_state?: string;
    address_zip?: string;
}

interface Plan {
    id: number;
    name: string;
}

export const AdminTenants: React.FC = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [editingTenant, setEditingTenant] = useState<any | null>(null); // Use any for form flexibility
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchTenants();
        fetchPlans();
    }, []);

    const fetchTenants = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/tenants`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setTenants(data);
        } catch (error) {
            console.error('Erro ao buscar tenants:', error);
        }
    };

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

    const handleSave = async (tenant: any) => {
        const token = localStorage.getItem('token');
        const method = tenant.id ? 'PUT' : 'POST';
        const url = tenant.id
            ? `${import.meta.env.VITE_API_URL}/api/admin/tenants/${tenant.id}`
            : `${import.meta.env.VITE_API_URL}/api/admin/tenants`;

        // Formatar endereço para o backend
        const payload = {
            ...tenant,
            address: {
                street: tenant.address_street,
                number: tenant.address_number,
                complement: tenant.address_complement,
                district: tenant.address_district,
                city: tenant.address_city,
                state: tenant.address_state,
                zip: tenant.address_zip
            }
        };

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                fetchTenants();
                setEditingTenant(null);
                setIsCreating(false);
            } else {
                const data = await res.json();
                alert('Erro ao salvar: ' + (data.error || 'Erro desconhecido'));
            }
        } catch (e) {
            console.error(e);
            alert('Erro de conexão');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza? Isso removerá a empresa e desvinculará usuários.')) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/admin/tenants/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchTenants();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Building className="text-blue-600" /> Gestão de Clientes (Tenants)
                </h2>
                <button
                    onClick={() => {
                        setEditingTenant({
                            name: '', cnpj: '', email: '', phone: '', plan_id: plans[0]?.id,
                            address_street: '', address_number: '', address_city: '', address_state: '',
                            adminUser: { name: '', email: '', password: '' } // Para criação
                        });
                        setIsCreating(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} /> Novo Cliente
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-sm">
                            <th className="p-4 rounded-tl-lg">Empresa</th>
                            <th className="p-4">CNPJ</th>
                            <th className="p-4">Plano</th>
                            <th className="p-4">Usuários</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 rounded-tr-lg text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tenants.map(tenant => (
                            <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="font-medium text-gray-900">{tenant.name}</div>
                                    <div className="text-xs text-gray-500">{tenant.email}</div>
                                </td>
                                <td className="p-4 text-sm text-gray-600">{tenant.cnpj}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                                        {tenant.plan_name || 'Sem Plano'}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-600 flex items-center gap-1">
                                    <Users size={14} /> {tenant.user_count}
                                </td>
                                <td className="p-4">
                                    {tenant.status === 'active' ? (
                                        <span className="flex items-center gap-1 text-green-600 text-xs font-bold"><CheckCircle size={14} /> Ativo</span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-red-600 text-xs font-bold"><XCircle size={14} /> Inativo</span>
                                    )}
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button onClick={() => { setEditingTenant(tenant); setIsCreating(false); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(tenant.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {(editingTenant) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{isCreating ? 'Novo Cliente' : 'Editar Cliente'}</h3>
                            <button onClick={() => setEditingTenant(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                                    <input
                                        value={editingTenant.name}
                                        onChange={e => setEditingTenant({ ...editingTenant, name: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                                    <input
                                        value={editingTenant.cnpj}
                                        onChange={e => setEditingTenant({ ...editingTenant, cnpj: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Contato</label>
                                    <input
                                        value={editingTenant.email}
                                        onChange={e => setEditingTenant({ ...editingTenant, email: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                    <input
                                        value={editingTenant.phone}
                                        onChange={e => setEditingTenant({ ...editingTenant, phone: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plano</label>
                                <select
                                    value={editingTenant.plan_id}
                                    onChange={e => setEditingTenant({ ...editingTenant, plan_id: Number(e.target.value) })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                >
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-bold text-gray-800 mb-2">Endereço</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-2">
                                        <input placeholder="Rua" value={editingTenant.address_street || ''} onChange={e => setEditingTenant({ ...editingTenant, address_street: e.target.value })} className="w-full p-2 border rounded-lg text-sm text-gray-900" />
                                    </div>
                                    <div>
                                        <input placeholder="Número" value={editingTenant.address_number || ''} onChange={e => setEditingTenant({ ...editingTenant, address_number: e.target.value })} className="w-full p-2 border rounded-lg text-sm text-gray-900" />
                                    </div>
                                    <div>
                                        <input placeholder="Cidade" value={editingTenant.address_city || ''} onChange={e => setEditingTenant({ ...editingTenant, address_city: e.target.value })} className="w-full p-2 border rounded-lg text-sm text-gray-900" />
                                    </div>
                                    <div>
                                        <input placeholder="Estado" value={editingTenant.address_state || ''} onChange={e => setEditingTenant({ ...editingTenant, address_state: e.target.value })} className="w-full p-2 border rounded-lg text-sm text-gray-900" />
                                    </div>
                                    <div>
                                        <input placeholder="CEP" value={editingTenant.address_zip || ''} onChange={e => setEditingTenant({ ...editingTenant, address_zip: e.target.value })} className="w-full p-2 border rounded-lg text-sm text-gray-900" />
                                    </div>
                                </div>
                            </div>

                            {isCreating && (
                                <div className="border-t pt-4 mt-4 bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-bold text-blue-800 mb-2">Criar Administrador Inicial</h4>
                                    <div className="space-y-3">
                                        <input placeholder="Nome do Admin" value={editingTenant.adminUser?.name || ''} onChange={e => setEditingTenant({ ...editingTenant, adminUser: { ...editingTenant.adminUser, name: e.target.value } })} className="w-full p-2 border rounded-lg text-sm text-gray-900" />
                                        <input placeholder="Email do Admin" value={editingTenant.adminUser?.email || ''} onChange={e => setEditingTenant({ ...editingTenant, adminUser: { ...editingTenant.adminUser, email: e.target.value } })} className="w-full p-2 border rounded-lg text-sm text-gray-900" />
                                        <input type="password" placeholder="Senha Inicial" value={editingTenant.adminUser?.password || ''} onChange={e => setEditingTenant({ ...editingTenant, adminUser: { ...editingTenant.adminUser, password: e.target.value } })} className="w-full p-2 border rounded-lg text-sm text-gray-900" />
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => handleSave(editingTenant)}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 mt-4 shadow-lg shadow-blue-200 transition-all"
                            >
                                Salvar Cliente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
