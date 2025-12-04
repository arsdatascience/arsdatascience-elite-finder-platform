import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, User, Mail, Phone, DollarSign, Tag, MessageSquare } from 'lucide-react';
import { Lead, LeadStatus } from '@/types';

interface LeadModalProps {
    lead?: Lead;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    mode: 'create' | 'edit';
}

export const LeadModal: React.FC<LeadModalProps> = ({ lead, isOpen, onClose, onSave, mode }) => {
    const { register, handleSubmit, reset, setValue } = useForm();

    useEffect(() => {
        if (lead && mode === 'edit') {
            setValue('name', lead.name);
            setValue('email', lead.email);
            setValue('phone', lead.phone);
            setValue('value', lead.value);
            setValue('status', lead.status);
            setValue('source', lead.source);
            setValue('notes', lead.notes);
            setValue('tags', lead.tags?.join(', '));
        } else {
            reset({
                status: LeadStatus.NEW,
                source: 'Manual',
                value: 0
            });
        }
    }, [lead, mode, setValue, reset]);

    if (!isOpen) return null;

    const onSubmit = (data: any) => {
        const formattedData = {
            ...data,
            value: Number(data.value),
            tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
        };
        onSave(formattedData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">
                        {mode === 'create' ? 'Novo Lead' : 'Editar Lead'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <User size={16} className="text-blue-500" /> Nome Completo
                            </label>
                            <input
                                {...register('name', { required: true })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Ex: João Silva"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Mail size={16} className="text-blue-500" /> Email
                            </label>
                            <input
                                {...register('email', { required: true })}
                                type="email"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="joao@exemplo.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Phone size={16} className="text-blue-500" /> Telefone
                            </label>
                            <input
                                {...register('phone')}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="(11) 99999-9999"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <DollarSign size={16} className="text-green-500" /> Valor Estimado (R$)
                            </label>
                            <input
                                {...register('value')}
                                type="number"
                                step="0.01"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <select
                                {...register('status')}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                            >
                                {Object.values(LeadStatus).map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Origem</label>
                            <select
                                {...register('source')}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                            >
                                <option value="Manual">Manual</option>
                                <option value="Website">Website</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Indicação">Indicação</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Tag size={16} className="text-orange-500" /> Tags (separadas por vírgula)
                        </label>
                        <input
                            {...register('tags')}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="quente, urgente, corporativo"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <MessageSquare size={16} className="text-purple-500" /> Notas
                        </label>
                        <textarea
                            {...register('notes')}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                            placeholder="Observações importantes sobre o lead..."
                        />
                    </div>
                </form>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                    >
                        <Save size={18} />
                        Salvar Lead
                    </button>
                </div>
            </div>
        </div>
    );
};
