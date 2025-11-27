import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, MapPin, Phone, Mail, Save, X, Check, Building2, Globe, Calendar } from 'lucide-react';
import { COMPONENT_VERSIONS } from '../componentVersions';

// --- SCHEMAS DE VALIDAÇÃO (ZOD) ---

const clientSchema = z.object({
    type: z.enum(['PF', 'PJ']),
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    document: z.string().min(11, 'Documento inválido'), // Validação mais complexa pode ser adicionada
    foundationDate: z.string().optional(),
    email: z.string().email('Email inválido'),
    phone: z.string().min(10, 'Telefone inválido'),
    whatsapp: z.string().optional(),
    cep: z.string().min(8, 'CEP inválido'),
    street: z.string().min(3, 'Rua obrigatória'),
    number: z.string().min(1, 'Número obrigatório'),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, 'Bairro obrigatório'),
    city: z.string().min(2, 'Cidade obrigatória'),
    state: z.string().length(2, 'Selecione um estado'),
    instagramUrl: z.string().url('URL inválida').optional().or(z.literal('')),
    facebookUrl: z.string().url('URL inválida').optional().or(z.literal('')),
    linkedinUrl: z.string().url('URL inválida').optional().or(z.literal('')),
    website: z.string().url('URL inválida').optional().or(z.literal('')),
    notes: z.string().optional()
}).refine((data) => {
    if (data.type === 'PF') return data.document.length >= 11;
    if (data.type === 'PJ') return data.document.length >= 14;
    return true;
}, {
    message: "Documento inválido para o tipo selecionado",
    path: ["document"]
});

type ClientFormData = z.infer<typeof clientSchema>;

// --- MÁSCARAS ---

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d)(\d{4})$/, '$1-$2')
        .slice(0, 15);
};

const maskCEP = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{5})(\d)/, '$1-$2')
        .slice(0, 9);
};

const maskCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const maskCNPJ = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
};

// --- MOCK DATA ---
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const ClientRegistration: React.FC = () => {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [successMsg, setSuccessMsg] = useState('');
    const queryClient = useQueryClient();

    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: apiClient.clients.getClients
    });

    const createMutation = useMutation({
        mutationFn: apiClient.clients.createClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setSuccessMsg('Cliente cadastrado com sucesso!');
            setTimeout(() => setSuccessMsg(''), 3000);
            setView('list');
            reset();
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiClient.clients.updateClient(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setSuccessMsg('Cliente atualizado com sucesso!');
            setTimeout(() => setSuccessMsg(''), 3000);
            setView('list');
            setEditingId(null);
            reset();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: apiClient.clients.deleteClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setSuccessMsg('Cliente removido com sucesso!');
            setTimeout(() => setSuccessMsg(''), 3000);
        }
    });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            type: 'PJ',
            name: '',
            document: '',
            email: '',
            phone: '',
            cep: '',
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: '',
            notes: ''
        }
    });

    const selectedType = watch('type');

    // Handlers de Máscara
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.name as any, maskPhone(e.target.value));
    };

    const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue('cep', maskCEP(e.target.value));
    };

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = selectedType === 'PJ' ? maskCNPJ(e.target.value) : maskCPF(e.target.value);
        setValue('document', masked);
    };

    const onSubmit = async (data: ClientFormData) => {
        try {
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data });
            } else {
                await createMutation.mutateAsync(data);
            }
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
        }
    };

    const handleEdit = (client: any) => {
        setEditingId(client.id);
        // Preencher formulário com dados do cliente
        Object.keys(client).forEach(key => {
            setValue(key as any, client[key]);
        });
        setView('form');
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const handleNewClient = () => {
        reset({
            type: 'PJ',
            name: '',
            document: '',
            email: '',
            phone: '',
            cep: '',
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: '',
            notes: ''
        });
        setEditingId(null);
        setView('form');
    };

    if (view === 'list') {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Gestão de Clientes <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2 align-middle">{COMPONENT_VERSIONS.ClientRegistration}</span></h2>
                        <p className="text-sm text-gray-500">Base de clientes ativos e inativos</p>
                    </div>
                    <button
                        onClick={handleNewClient}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        + Novo Cliente
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Carregando clientes...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contato</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Localização</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {clients.map((client: any) => (
                                        <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                        {client.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{client.name}</p>
                                                        <p className="text-xs text-gray-500">ID: #{client.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${client.type === 'PJ' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {client.type === 'PJ' ? <Building2 size={12} className="mr-1" /> : <User size={12} className="mr-1" />}
                                                    {client.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Mail size={14} className="mr-2 text-gray-400" />
                                                        {client.email}
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Phone size={14} className="mr-2 text-gray-400" />
                                                        {client.phone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <MapPin size={14} className="mr-2 text-gray-400" />
                                                    {client.city}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(client)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <User size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(client.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-10">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className="bg-white border border-gray-300 p-2 rounded-lg hover:bg-gray-50 text-gray-600">
                        <X size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                        <p className="text-sm text-gray-500">{editingId ? 'Atualize os dados do cliente.' : 'Preencha os dados completos para cadastro.'}</p>
                    </div>
                </div>
            </div>

            {successMsg && (
                <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 animate-fade-in">
                    <Check size={20} />
                    {successMsg}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                {/* Seção 1: Dados Principais */}
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <User className="text-blue-500" size={20} />
                        Dados Principais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pessoa</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="PJ"
                                        {...register('type')}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900">Pessoa Jurídica (PJ)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="PF"
                                        {...register('type')}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900">Pessoa Física (PF)</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {selectedType === 'PJ' ? 'CNPJ' : 'CPF'}
                            </label>
                            <input
                                type="text"
                                {...register('document')}
                                onChange={handleDocumentChange}
                                placeholder={selectedType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                                className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.document ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.document && <p className="text-red-500 text-xs mt-1">{errors.document.message}</p>}
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {selectedType === 'PJ' ? 'Razão Social / Nome Fantasia' : 'Nome Completo'}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    {selectedType === 'PJ' ? <Building2 className="text-gray-400" size={18} /> : <User className="text-gray-400" size={18} />}
                                </div>
                                <input
                                    type="text"
                                    {...register('name')}
                                    className={`w-full pl-10 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                />
                            </div>
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {selectedType === 'PJ' ? 'Data de Fundação' : 'Data de Nascimento'}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="text-gray-400" size={18} />
                                </div>
                                <input
                                    type="date"
                                    {...register('foundationDate')}
                                    className="w-full pl-10 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seção 2: Contato */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Phone className="text-green-500" size={20} />
                        Contato
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="text-gray-400" size={18} />
                                </div>
                                <input
                                    type="email"
                                    {...register('email')}
                                    className={`w-full pl-10 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                            <input
                                type="text"
                                {...register('phone')}
                                onChange={handlePhoneChange}
                                placeholder="(00) 0000-0000"
                                className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                            <input
                                type="text"
                                {...register('whatsapp')}
                                onChange={handlePhoneChange}
                                placeholder="(00) 90000-0000"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Seção 3: Endereço Detalhado */}
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <MapPin className="text-red-500" size={20} />
                        Endereço
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                            <input
                                type="text"
                                {...register('cep')}
                                onChange={handleCEPChange}
                                placeholder="00000-000"
                                className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.cep ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep.message}</p>}
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Avenida / Rua</label>
                            <input
                                type="text"
                                {...register('street')}
                                placeholder="Ex: Av. Paulista"
                                className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.street ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                            <input
                                type="text"
                                {...register('number')}
                                className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.number ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                            <input
                                type="text"
                                {...register('complement')}
                                placeholder="Ex: Sala 101"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                            <input
                                type="text"
                                {...register('neighborhood')}
                                className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.neighborhood ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.neighborhood && <p className="text-red-500 text-xs mt-1">{errors.neighborhood.message}</p>}
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                            <input
                                type="text"
                                {...register('city')}
                                className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select
                                {...register('state')}
                                className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                <option value="">UF</option>
                                <option value="SP">SP</option>
                                <option value="RJ">RJ</option>
                                <option value="MG">MG</option>
                                <option value="RS">RS</option>
                                <option value="PR">PR</option>
                                <option value="SC">SC</option>
                                <option value="BA">BA</option>
                                {/* Outros estados... */}
                            </select>
                            {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Seção 4: Redes Sociais */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Globe className="text-purple-500" size={20} />
                        Presença Digital
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram (URL)</label>
                            <input
                                type="text"
                                {...register('instagramUrl')}
                                placeholder="https://instagram.com/..."
                                className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.instagramUrl ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.instagramUrl && <p className="text-red-500 text-xs mt-1">{errors.instagramUrl.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook (URL)</label>
                            <input
                                type="text"
                                {...register('facebookUrl')}
                                placeholder="https://facebook.com/..."
                                className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.facebookUrl ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.facebookUrl && <p className="text-red-500 text-xs mt-1">{errors.facebookUrl.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn (URL)</label>
                            <input
                                type="text"
                                {...register('linkedinUrl')}
                                placeholder="https://linkedin.com/in/..."
                                className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.linkedinUrl ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.linkedinUrl && <p className="text-red-500 text-xs mt-1">{errors.linkedinUrl.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                            <input
                                type="text"
                                {...register('website')}
                                placeholder="https://www.seusite.com.br"
                                className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.website ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Seção 5: Observações */}
                <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações Internas</label>
                    <textarea
                        {...register('notes')}
                        className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Informações adicionais sobre o cliente..."
                    />
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => setView('list')}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        {isSubmitting ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Salvar Cadastro')}
                    </button>
                </div>
            </form>
        </div>
    );
};