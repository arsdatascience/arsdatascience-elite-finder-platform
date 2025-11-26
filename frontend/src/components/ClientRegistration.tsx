
import React, { useState } from 'react';
import { User, MapPin, Phone, Mail, Briefcase, Save, X, Check, Building2, Globe, Calendar } from 'lucide-react';
import { COMPONENT_VERSIONS } from '../componentVersions';

interface ClientForm {
    type: 'PF' | 'PJ';
    name: string;
    document: string; // CPF or CNPJ
    foundationDate: string;
    email: string;
    phone: string;
    whatsapp: string;
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    instagramUrl: string;
    facebookUrl: string;
    linkedinUrl: string;
    website: string;
    notes: string;
}

const INITIAL_FORM: ClientForm = {
    type: 'PJ',
    name: '',
    document: '',
    foundationDate: '',
    email: '',
    phone: '',
    whatsapp: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    instagramUrl: '',
    facebookUrl: '',
    linkedinUrl: '',
    website: '',
    notes: ''
};

// Mask Helpers
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

// Mock Data for List View
const MOCK_CLIENTS = [
    { id: 1, name: 'TechCorp Soluções', type: 'PJ', email: 'contato@techcorp.com.br', phone: '(11) 99999-1010', city: 'São Paulo' },
    { id: 2, name: 'Padaria do João', type: 'PJ', email: 'joao@padaria.com', phone: '(21) 98888-2020', city: 'Rio de Janeiro' },
    { id: 3, name: 'Ana Maria Silva', type: 'PF', email: 'ana.silva@gmail.com', phone: '(31) 97777-3030', city: 'Belo Horizonte' },
];

export const ClientRegistration: React.FC = () => {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [formData, setFormData] = useState<ClientForm>(INITIAL_FORM);
    const [successMsg, setSuccessMsg] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let maskedValue = value;

        if (name === 'phone' || name === 'whatsapp') maskedValue = maskPhone(value);
        if (name === 'cep') maskedValue = maskCEP(value);
        if (name === 'document') {
            maskedValue = formData.type === 'PJ' ? maskCNPJ(value) : maskCPF(value);
        }

        setFormData(prev => ({ ...prev, [name]: maskedValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Aqui entraria a lógica de salvar no banco (POST /api/clients)
        setSuccessMsg('Cliente cadastrado com sucesso!');
        setTimeout(() => {
            setSuccessMsg('');
            setView('list');
            setFormData(INITIAL_FORM);
        }, 2000);
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
                        onClick={() => setView('form')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        + Novo Cliente
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Nome / Razão Social</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Telefone</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cidade</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {MOCK_CLIENTS.map(client => (
                                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px - 2 py - 1 rounded text - xs font - bold ${client.type === 'PJ' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'} `}>
                                            {client.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{client.email}</td>
                                    <td className="px-6 py-4 text-gray-600">{client.phone}</td>
                                    <td className="px-6 py-4 text-gray-600">{client.city}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                        <h2 className="text-2xl font-bold text-gray-800">Novo Cliente</h2>
                        <p className="text-sm text-gray-500">Preencha os dados completos para cadastro.</p>
                    </div>
                </div>
            </div>

            {successMsg && (
                <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 animate-fade-in">
                    <Check size={20} />
                    {successMsg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

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
                                    <input type="radio" name="type" value="PJ" checked={formData.type === 'PJ'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" />
                                    <span className="text-gray-900">Pessoa Jurídica (PJ)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="type" value="PF" checked={formData.type === 'PF'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" />
                                    <span className="text-gray-900">Pessoa Física (PF)</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {formData.type === 'PJ' ? 'CNPJ' : 'CPF'}
                            </label>
                            <input
                                type="text"
                                name="document"
                                value={formData.document}
                                onChange={handleChange}
                                placeholder={formData.type === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {formData.type === 'PJ' ? 'Razão Social / Nome Fantasia' : 'Nome Completo'}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    {formData.type === 'PJ' ? <Building2 className="text-gray-400" size={18} /> : <User className="text-gray-400" size={18} />}
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full pl-10 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {formData.type === 'PJ' ? 'Data de Fundação' : 'Data de Nascimento'}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="text-gray-400" size={18} />
                                </div>
                                <input
                                    type="date"
                                    name="foundationDate"
                                    value={formData.foundationDate}
                                    onChange={handleChange}
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
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-10 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="(00) 0000-0000"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                            <input
                                type="text"
                                name="whatsapp"
                                value={formData.whatsapp}
                                onChange={handleChange}
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
                                name="cep"
                                value={formData.cep}
                                onChange={handleChange}
                                placeholder="00000-000"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Avenida / Rua</label>
                            <input
                                type="text"
                                name="street"
                                value={formData.street}
                                onChange={handleChange}
                                placeholder="Ex: Av. Paulista"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                            <input
                                type="text"
                                name="number"
                                value={formData.number}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                            <input
                                type="text"
                                name="complement"
                                value={formData.complement}
                                onChange={handleChange}
                                placeholder="Ex: Sala 101"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                            <input
                                type="text"
                                name="neighborhood"
                                value={formData.neighborhood}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
                                name="instagramUrl"
                                value={formData.instagramUrl}
                                onChange={handleChange}
                                placeholder="https://instagram.com/..."
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook (URL)</label>
                            <input
                                type="text"
                                name="facebookUrl"
                                value={formData.facebookUrl}
                                onChange={handleChange}
                                placeholder="https://facebook.com/..."
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn (URL)</label>
                            <input
                                type="text"
                                name="linkedinUrl"
                                value={formData.linkedinUrl}
                                onChange={handleChange}
                                placeholder="https://linkedin.com/in/..."
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                            <input
                                type="text"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://www.seusite.com.br"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Seção 5: Observações */}
                <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações Internas</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
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
                        className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors flex items-center gap-2"
                    >
                        <Save size={18} />
                        Salvar Cadastro
                    </button>
                </div>
            </form>
        </div>
    );
};