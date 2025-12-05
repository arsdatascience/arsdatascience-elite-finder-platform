import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cpf, cnpj } from 'cpf-cnpj-validator';
import { X, Save, User, Mail, Phone, Building, MessageCircle, AlertTriangle, Lock, CreditCard, FileText, Globe, Linkedin, Facebook, Instagram } from 'lucide-react';

// --- MASKS ---
const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
const maskCNPJ = (v: string) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18);
const maskPhone = (v: string) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').slice(0, 15);
const maskCEP = (v: string) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);

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
    address_district: z.string().optional(), // Adding district just in case

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
        defaultValues: client || {
            type: 'PF',
            status: 'active',
            terms_accepted: false,
            privacy_accepted: false,
            data_consent: false,
            marketing_optin: false
        }
    });

    // Watch fields for logic
    const clientType = watch('type');
    const cep = watch('cep');

    // CEP Integration
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
                        // Focus on number
                        document.getElementById('address_number')?.focus();
                    }
                })
                .catch(err => console.error('Erro ao buscar CEP:', err));
        }
    }, [cep, setValue]);

    // Update form when client changes (Edit Mode)
    useEffect(() => {
        if (client) {
            reset(client);
        } else {
            reset({
                type: 'PF',
                status: 'active',
                terms_accepted: false,
                privacy_accepted: false,
                data_consent: false,
                marketing_optin: false
            });
        }
    }, [client, reset]);

    if (!isOpen) return null;

    const onSubmit = (data: any) => {
        // Clean up data before sending (e.g. remove confirmPassword)
        const { confirmPassword, ...submitData } = data;
        onSave(submitData);
    };

    const tabs = [
        { id: 'identity', label: 'Identificação', icon: User },
        { id: 'address', label: 'Endereço', icon: Building },
        { id: 'details', label: 'Detalhes', icon: FileText },
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

                {/* Form Content */}
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
                                    <input {...register('name')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder={clientType === 'PJ' ? 'Razão Social da Empresa' : 'Nome Completo'} />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">{clientType === 'PJ' ? 'CNPJ' : 'CPF'} <span className="text-red-500">*</span></label>
                                    <Controller
                                        name="document"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                onChange={(e) => field.onChange(clientType === 'PJ' ? maskCNPJ(e.target.value) : maskCPF(e.target.value))}
                                                className={`w-full p-2.5 rounded-lg border ${errors.document ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                                                placeholder={clientType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                                            />
                                        )}
                                    />
                                    {errors.document && <p className="text-red-500 text-xs mt-1">{errors.document.message as string}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Email <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input {...register('email')} type="email" className="w-full pl-10 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="cliente@email.com" />
                                    </div>
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Telefone Principal <span className="text-red-500">*</span></label>
                                    <Controller
                                        name="phone"
                                        control={control}
                                        render={({ field }) => (
                                            <div className="relative">
                                                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input {...field} onChange={(e) => field.onChange(maskPhone(e.target.value))} className="w-full pl-10 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="(00) 0000-0000" />
                                            </div>
                                        )}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message as string}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">WhatsApp / Celular</label>
                                    <div className="relative">
                                        <MessageCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
                                        <Controller
                                            name="whatsapp"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} onChange={(e) => field.onChange(maskPhone(e.target.value))} className="w-full pl-10 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="(00) 90000-0000" />
                                            )}
                                        />
                                    </div>
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
                                            <input {...field} onChange={(e) => field.onChange(maskCEP(e.target.value))} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="00000-000" />
                                        )}
                                    />
                                    {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep.message as string}</p>}
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Rua / Logradouro <span className="text-red-500">*</span></label>
                                    <input {...register('address_street')} className="w-full p-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Número <span className="text-red-500">*</span></label>
                                    <input id="address_number" {...register('address_number')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Complemento</label>
                                    <input {...register('address_complement')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Apto, Bloco, Sala..." />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Bairro <span className="text-red-500">*</span></label>
                                    <input {...register('address_neighborhood')} className="w-full p-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Cidade <span className="text-red-500">*</span></label>
                                    <input {...register('address_city')} className="w-full p-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Estado (UF) <span className="text-red-500">*</span></label>
                                    <input {...register('address_state')} maxLength={2} className="w-full p-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase" placeholder="SP" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- DETAILS TAB --- */}
                    {activeTab === 'details' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            {/* PF Fields */}
                            {clientType === 'PF' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700 uppercase">RG</label>
                                        <input {...register('rg')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700 uppercase">Data de Nascimento</label>
                                        <input type="date" {...register('birth_date')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700 uppercase">Sexo / Gênero</label>
                                        <select {...register('gender')} className="w-full p-2.5 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                            <option value="">Selecione...</option>
                                            <option value="M">Masculino</option>
                                            <option value="F">Feminino</option>
                                            <option value="O">Outro</option>
                                            <option value="N">Prefiro não informar</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700 uppercase">Estado Civil</label>
                                        <select {...register('marital_status')} className="w-full p-2.5 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                            <option value="">Selecione...</option>
                                            <option value="solteiro">Solteiro(a)</option>
                                            <option value="casado">Casado(a)</option>
                                            <option value="divorciado">Divorciado(a)</option>
                                            <option value="viuvo">Viúvo(a)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700 uppercase">Nacionalidade</label>
                                        <input {...register('nationality')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" defaultValue="Brasileira" />
                                    </div>
                                </div>
                            )}

                            {/* PJ Fields */}
                            {clientType === 'PJ' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1 md:col-span-2">
                                            <label className="text-xs font-bold text-gray-700 uppercase">Nome Fantasia</label>
                                            <input {...register('fantasy_name')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-700 uppercase">Inscrição Estadual</label>
                                            <input {...register('state_registration')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-700 uppercase">Inscrição Municipal</label>
                                            <input {...register('municipal_registration')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-700 uppercase">Porte da Empresa</label>
                                            <select {...register('company_size')} className="w-full p-2.5 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                                <option value="">Selecione...</option>
                                                <option value="MEI">MEI</option>
                                                <option value="ME">ME (Microempresa)</option>
                                                <option value="EPP">EPP (Pequeno Porte)</option>
                                                <option value="LTDA">LTDA / Média / Grande</option>
                                                <option value="SA">S.A.</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><User size={16} /> Responsável Legal</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-blue-700 uppercase">Nome</label>
                                                <input {...register('legal_rep_name')} className="w-full p-2.5 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-blue-700 uppercase">CPF</label>
                                                <Controller
                                                    name="legal_rep_cpf"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input {...field} onChange={(e) => field.onChange(maskCPF(e.target.value))} className="w-full p-2.5 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="000.000.000-00" />
                                                    )}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-blue-700 uppercase">Cargo</label>
                                                <input {...register('legal_rep_role')} className="w-full p-2.5 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Sócio / Diretor" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-blue-700 uppercase">Email</label>
                                                <input {...register('legal_rep_email')} type="email" className="w-full p-2.5 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Social Media Section */}
                            <div className="pt-4 border-t border-gray-100">
                                <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm uppercase"><Globe size={14} /> Redes Sociais & Web</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1"><Instagram size={12} /> Instagram</label>
                                        <input {...register('instagram_url')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="https://instagram.com/..." />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1"><Facebook size={12} /> Facebook</label>
                                        <input {...register('facebook_url')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="https://facebook.com/..." />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1"><Linkedin size={12} /> LinkedIn</label>
                                        <input {...register('linkedin_url')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="https://linkedin.com/in/..." />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1"><Globe size={12} /> Website</label>
                                        <input {...register('website')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="https://..." />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 pt-4 border-t border-gray-100">
                                <label className="text-xs font-bold text-gray-700 uppercase">Observações Gerais</label>
                                <textarea {...register('notes')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none" />
                            </div>
                        </div>
                    )}

                    {/* --- ACCESS TAB --- */}
                    {activeTab === 'access' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start gap-3">
                                <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                                <div className="text-sm text-yellow-800">
                                    <p className="font-bold">Credenciais de Acesso</p>
                                    <p>Esses dados permitirão que o cliente acesse o portal (se disponível). A senha será armazenada de forma segura.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Nome de Usuário / Login</label>
                                    <input {...register('username')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Ex: nome.sobrenome" />
                                </div>
                                <div className="hidden md:block"></div> {/* Spacer */}

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Senha De Acesso</label>
                                    <input type="password" {...register('password')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="••••••••" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Confirmar Senha</label>
                                    <input type="password" {...register('confirmPassword')} className={`w-full p-2.5 rounded-lg border ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 outline-none transition-all`} placeholder="••••••••" />
                                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message as string}</p>}
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6 space-y-4">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2"><Lock size={16} /> Compliance & LGPD</h4>

                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" {...register('terms_accepted')} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Aceite dos Termos de Uso</span>
                                        <p className="text-xs text-gray-400">O cliente concordou com os termos de serviço.</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input type="checkbox" {...register('privacy_accepted')} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all" />
                                    <div>
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Política de Privacidade</span>
                                        <p className="text-xs text-gray-400">O cliente leu e aceitou a política de privacidade.</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input type="checkbox" {...register('data_consent')} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all" />
                                    <div>
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Consentimento de Dados (LGPD)</span>
                                        <p className="text-xs text-gray-400">Consentimento explícito para armazenamento e processamento de dados sensíveis.</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input type="checkbox" {...register('marketing_optin')} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all" />
                                    <div>
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Opt-in de Comunicações</span>
                                        <p className="text-xs text-gray-400">Permissão para envio de newsletters, promoções e avisos via Whatsapp/Email.</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* --- FINANCE TAB --- */}
                    {activeTab === 'finance' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Banco</label>
                                    <input {...register('bank_name')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Ex: Nubank, Itaú..." />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Tipo de Conta</label>
                                    <select {...register('bank_account_type')} className="w-full p-2.5 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="">Selecione...</option>
                                        <option value="corrente">Corrente</option>
                                        <option value="poupanca">Poupança</option>
                                        <option value="pagamento">Pagamento</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Agência</label>
                                    <input {...register('bank_agency')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Conta</label>
                                    <input {...register('bank_account')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Chave PIX</label>
                                    <input {...register('pix_key')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="CPF, Email, Telefone ou Aleatória" />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Como conheceu?</label>
                                    <input {...register('referral_source')} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Indicação, Google, Instagram..." />
                                </div>
                            </div>
                        </div>
                    )}

                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSubmit(onSubmit)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2">
                        <Save size={18} />
                        Salvar Cliente
                    </button>
                </div>
            </div>
        </div>
    );
};
