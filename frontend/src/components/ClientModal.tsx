import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cpf, cnpj } from 'cpf-cnpj-validator';
import {
    X, Save, User, Mail, Phone, Building, MessageCircle, AlertTriangle, Lock, CreditCard,
    FileText, Calendar, Tag, Plus
} from 'lucide-react';
import { maskCEP, maskPhone, maskCPF, maskCNPJ } from '../utils/masks';

// --- VALIDATION SCHEMA ---
const schema = z.object({
    // Basic Info
    type: z.enum(['PF', 'PJ']),
    name: z.string().min(3, 'Nome Obrigatório'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(10, 'Telefone inválido'),
    whatsapp: z.string().optional(),

    // Conditionally Validated Document
    document: z.string().min(1, 'Documento obrigatório'),

    // Address
    cep: z.string().min(8, 'CEP inválido'),
    address_street: z.string().min(3, 'Rua obrigatória'),
    address_number: z.string().min(1, 'Número obrigatório'),
    address_complement: z.string().optional(),
    address_neighborhood: z.string().min(2, 'Bairro obrigatório'),
    address_city: z.string().min(2, 'Cidade obrigatória'),
    address_state: z.string().length(2, 'Estado (UF) obrigatório'),
    address_district: z.string().optional(),

    // Social Media
    instagram_url: z.string().optional(),
    facebook_url: z.string().optional(),
    linkedin_url: z.string().optional(),
    website: z.string().optional(),

    // Access
    username: z.string().optional(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),

    // Compliance
    terms_accepted: z.boolean().default(false),
    privacy_accepted: z.boolean().default(false),
    data_consent: z.boolean().default(false),
    marketing_optin: z.boolean().default(false),

    // PF Specific
    rg: z.string().optional(),
    birth_date: z.string().optional(),
    gender: z.string().optional(),
    marital_status: z.string().optional(),
    nationality: z.string().optional(),
    mother_name: z.string().optional(),

    // PJ Specific
    fantasy_name: z.string().optional(),
    state_registration: z.string().optional(),
    municipal_registration: z.string().optional(),
    company_size: z.string().optional(),
    cnae: z.string().optional(),
    legal_rep_name: z.string().optional(),
    legal_rep_cpf: z.string().optional(),
    legal_rep_role: z.string().optional(),
    legal_rep_email: z.string().optional(),
    legal_rep_phone: z.string().optional(),

    // Bank
    bank_name: z.string().optional(),
    bank_agency: z.string().optional(),
    bank_account: z.string().optional(),
    bank_account_type: z.string().optional(),
    pix_key: z.string().optional(),

    // Extra
    notes: z.string().optional(),
    referral_source: z.string().optional(),
    client_references: z.string().optional(),

    // Management
    tags: z.union([z.array(z.string()), z.string()]).optional().transform(val => {
        if (typeof val === 'string') return val.split(',').filter(Boolean);
        return val || [];
    }),
    next_meeting: z.string().optional(),
    meeting_notes: z.string().optional(),

    status: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.type === 'PF') {
        if (!cpf.isValid(data.document)) {
            ctx.addIssue({ path: ['document'], code: z.ZodIssueCode.custom, message: 'CPF Inválido' });
        }
    } else {
        if (!cnpj.isValid(data.document)) {
            ctx.addIssue({ path: ['document'], code: z.ZodIssueCode.custom, message: 'CNPJ Inválido' });
        }
    }

    if (data.password && data.password !== data.confirmPassword) {
        ctx.addIssue({ path: ['confirmPassword'], code: z.ZodIssueCode.custom, message: 'As senhas não coincidem' });
    }
});

interface ClientModalProps {
    client?: any;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    mode: 'create' | 'edit';
}

export const ClientModal: React.FC<ClientModalProps> = ({ client, isOpen, onClose, onSave, mode }) => {
    const [activeTab, setActiveTab] = useState('identity');
    const { register, handleSubmit, setValue, reset, watch, control, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            type: 'PF',
            status: 'active',
            terms_accepted: false,
            privacy_accepted: false,
            data_consent: false,
            marketing_optin: false,
            tags: []
        }
    });

    const clientType = watch('type');
    const cep = watch('cep');
    const currentTags = watch('tags') || [];

    useEffect(() => {
        if (cep && cep.length === 9) {
            const cleanCep = cep.replace('-', '');
            fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
                .then(res => res.json())
                .then(data => {
                    if (!data.erro) {
                        setValue('address_street', data.logradouro);
                        setValue('address_neighborhood', data.bairro);
                        setValue('address_city', data.localidade);
                        setValue('address_state', data.uf);
                        setValue('address_complement', data.complemento);
                        document.getElementById('address_number')?.focus();
                    }
                })
                .catch(err => console.error('Erro ao buscar CEP:', err));
        }
    }, [cep, setValue]);

    useEffect(() => {
        // Prepare tags to be an array for local state
        const safeClient = client ? {
            ...client,
            tags: Array.isArray(client.tags) ? client.tags : (client.tags ? client.tags.split(',') : [])
        } : null;

        if (safeClient) {
            reset(safeClient);
        } else {
            reset({
                type: 'PF',
                status: 'active',
                terms_accepted: false,
                privacy_accepted: false,
                data_consent: false,
                marketing_optin: false,
                tags: []
            });
        }
    }, [client, reset]);

    if (!isOpen) return null;

    const onSubmit = (data: any) => {
        const { confirmPassword, ...submitData } = data;
        onSave(submitData);
    };

    const toggleTag = (tag: string) => {
        const current = Array.isArray(currentTags) ? currentTags : [];
        const newTags = current.includes(tag)
            ? current.filter((t: string) => t !== tag)
            : [...current, tag];
        setValue('tags', newTags, { shouldDirty: true, shouldValidate: true });
    };

    const predefinedTags = ['VIP', 'Novo', 'Quente', 'Frio', 'Retorno', 'Contrato Enviado', 'Risco Churn', 'High Ticket'];

    const tabs = [
        { id: 'identity', label: 'Identificação', icon: User },
        { id: 'address', label: 'Endereço', icon: Building },
        { id: 'details', label: 'Detalhes', icon: FileText },
        { id: 'management', label: 'Gestão', icon: Calendar },
        { id: 'access', label: 'Acesso', icon: Lock },
        { id: 'finance', label: 'Financeiro', icon: CreditCard },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {mode === 'create' ? 'Novo Cliente' : `Editar ${client?.name || 'Cliente'}`}
                        </h2>
                        <p className="text-xs text-gray-500">Preencha os dados completos para o cadastro.</p>

                        {mode === 'edit' && (
                            <div className="flex gap-2 mt-3">
                                <button type="button" onClick={() => window.open(`https://wa.me/55${client?.whatsapp?.replace(/\D/g, '')}`, '_blank')} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm" title="WhatsApp">
                                    <MessageCircle size={16} />
                                </button>
                                <button type="button" onClick={() => window.location.href = `mailto:${client?.email}`} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm" title="Email">
                                    <Mail size={16} />
                                </button>
                                <button type="button" onClick={() => window.location.href = `tel:${client?.phone}`} className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors shadow-sm" title="Ligar">
                                    <Phone size={16} />
                                </button>
                                <button type="button" onClick={() => setActiveTab('management')} className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm" title="Agendar">
                                    <Calendar size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 bg-gray-50/30">

                    {/* --- IDENTITY TAB --- */}
                    {activeTab === 'identity' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Tipo de Cadastro</label>
                                    <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" value="PF" {...register('type')} className="text-blue-600 focus:ring-blue-500" />
                                            <span className="text-sm">Pessoa Física</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" value="PJ" {...register('type')} className="text-blue-600 focus:ring-blue-500" />
                                            <span className="text-sm">Pessoa Jurídica</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Status</label>
                                    <select {...register('status')} className="w-full p-2.5 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                        <option value="lead">Lead</option>
                                    </select>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Nome Completo / Razão Social <span className="text-red-500">*</span></label>
                                    <input {...register('name')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Email <span className="text-red-500">*</span></label>
                                    <input {...register('email')} type="email" className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Documento</label>
                                    <Controller
                                        name="document"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} onChange={(e) => field.onChange(clientType === 'PF' ? maskCPF(e.target.value) : maskCNPJ(e.target.value))} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                        )}
                                    />
                                    {errors.document && <p className="text-red-500 text-xs mt-1">{errors.document.message as string}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Telefone</label>
                                    <Controller
                                        name="phone"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} onChange={(e) => field.onChange(maskPhone(e.target.value))} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                        )}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message as string}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">WhatsApp</label>
                                    <Controller
                                        name="whatsapp"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} onChange={(e) => field.onChange(maskPhone(e.target.value))} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- ADDRESS TAB --- */}
                    {activeTab === 'address' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">CEP <span className="text-red-500">*</span></label>
                                    <Controller
                                        name="cep"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} onChange={(e) => field.onChange(maskCEP(e.target.value))} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                        )}
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Logradouro</label>
                                    <input {...register('address_street')} className="w-full p-2.5 rounded-lg border border-gray-200 bg-gray-50" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Número</label>
                                    <input id="address_number" {...register('address_number')} className="w-full p-2.5 rounded-lg border border-gray-200" />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Complemento</label>
                                    <input {...register('address_complement')} className="w-full p-2.5 rounded-lg border border-gray-200" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Bairro</label>
                                    <input {...register('address_neighborhood')} className="w-full p-2.5 rounded-lg border border-gray-200 bg-gray-50" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Cidade</label>
                                    <input {...register('address_city')} className="w-full p-2.5 rounded-lg border border-gray-200 bg-gray-50" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Estado</label>
                                    <input {...register('address_state')} className="w-full p-2.5 rounded-lg border border-gray-200 bg-gray-50" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- DETAILS TAB --- */}
                    {activeTab === 'details' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            {clientType === 'PF' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1"><label className="text-xs font-bold text-gray-700 uppercase">RG</label><input {...register('rg')} className="w-full p-2.5 rounded-lg border border-gray-200" /></div>
                                    <div className="space-y-1"><label className="text-xs font-bold text-gray-700 uppercase">Data Nasc.</label><input type="date" {...register('birth_date')} className="w-full p-2.5 rounded-lg border border-gray-200" /></div>
                                </div>
                            )}
                            {clientType === 'PJ' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1"><label className="text-xs font-bold text-gray-700 uppercase">Nome Fantasia</label><input {...register('fantasy_name')} className="w-full p-2.5 rounded-lg border border-gray-200" /></div>
                                    <div className="space-y-1"><label className="text-xs font-bold text-gray-700 uppercase">IE</label><input {...register('state_registration')} className="w-full p-2.5 rounded-lg border border-gray-200" /></div>
                                </div>
                            )}
                            <div className="pt-4 mt-4 border-t border-gray-100">
                                <label className="text-xs font-bold text-gray-700 uppercase">Observações</label>
                                <textarea {...register('notes')} className="w-full p-2.5 rounded-lg border border-gray-200 h-24" />
                            </div>
                        </div>
                    )}

                    {/* --- MANAGEMENT TAB (NEW) --- */}
                    {activeTab === 'management' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                            {/* Tags */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <Tag className="text-blue-600" size={18} />
                                    <h3 className="font-bold text-gray-800">Tags e Segmentação</h3>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex flex-wrap gap-2">
                                        {predefinedTags.map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => toggleTag(tag)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${(Array.isArray(currentTags) ? currentTags : []).includes(tag)
                                                    ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {tag} {(Array.isArray(currentTags) ? currentTags : []).includes(tag) && '✓'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Schedule */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <Calendar className="text-orange-500" size={18} />
                                    <h3 className="font-bold text-gray-800">Agendamento</h3>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-700 uppercase">Data da Reunião</label>
                                            <input id="meeting_date" type="datetime-local" {...register('next_meeting')} className="w-full p-2.5 rounded-lg border border-gray-200" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-700 uppercase">Pauta</label>
                                            <textarea {...register('meeting_notes')} className="w-full p-2.5 rounded-lg border border-gray-200 h-10 resize-none" placeholder="Assunto..." />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const date = watch('next_meeting');
                                                if (!date) return alert('Selecione uma data para adicionar ao calendário.');
                                                const title = `Reunião com: ${watch('name')}`;
                                                // Google Calendar Link
                                                const start = new Date(date).toISOString().replace(/-|:|\.\d\d\d/g, "");
                                                const end = new Date(new Date(date).getTime() + 60 * 60000).toISOString().replace(/-|:|\.\d\d\d/g, "");
                                                const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(watch('meeting_notes') || '')}`;
                                                window.open(url, '_blank');
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <Plus size={16} /> Adicionar ao Google Calendar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- ACCESS TAB --- */}
                    {activeTab === 'access' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start gap-3">
                                <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                                <div className="text-sm text-yellow-800"><p className="font-bold">Acesso</p><p>Credenciais para acesso ao portal.</p></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 uppercase">Usuário</label><input {...register('username')} className="w-full p-2.5 rounded-lg border border-gray-200" /></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 uppercase">Senha</label><input type="password" {...register('password')} className="w-full p-2.5 rounded-lg border border-gray-200" /></div>
                            </div>
                        </div>
                    )}

                    {/* --- FINANCE TAB --- */}
                    {activeTab === 'finance' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 uppercase">Banco</label><input {...register('bank_name')} className="w-full p-2.5 rounded-lg border border-gray-200" /></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 uppercase">Agência</label><input {...register('bank_agency')} className="w-full p-2.5 rounded-lg border border-gray-200" /></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 uppercase">Conta</label><input {...register('bank_account')} className="w-full p-2.5 rounded-lg border border-gray-200" /></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 uppercase">PIX</label><input {...register('pix_key')} className="w-full p-2.5 rounded-lg border border-gray-200" /></div>
                            </div>
                        </div>
                    )}

                </form>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleSubmit(onSubmit)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2">
                        <Save size={18} /> Salvar Cliente
                    </button>
                </div>
            </div>
        </div>
    );
};
