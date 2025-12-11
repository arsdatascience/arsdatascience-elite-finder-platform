import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, User, Mail, Phone, DollarSign, Tag, MessageSquare, Calendar, Clock, MessageCircle, Check, Briefcase, Building } from 'lucide-react';
import { Lead, LeadStatus } from '@/types';
import { apiClient } from '../services/apiClient';

interface LeadModalProps {
    lead?: Lead;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    mode: 'create' | 'edit';
}

const PREDEFINED_TAGS = [
    'Quente', 'Frio', 'Morno', 'Urgente', 'Retorno',
    'Cliente Antigo', 'Novo', 'Indicação', 'VIP', 'Corporativo'
];

export const LeadModal: React.FC<LeadModalProps> = ({ lead, isOpen, onClose, onSave, mode }) => {
    const { register, handleSubmit, reset, setValue } = useForm();
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [scheduleType, setScheduleType] = useState<'meet' | 'zoom' | 'teams' | 'call' | 'email' | 'whatsapp' | 'presencial' | 'skype' | 'slack' | 'outros'>('meet');
    const [isScheduling, setIsScheduling] = useState(false);
    const [addToCalendar, setAddToCalendar] = useState(false);
    const [clients, setClients] = useState<any[]>([]);

    useEffect(() => {
        fetchClients();
        if (lead && mode === 'edit') {
            setValue('name', lead.name);
            setValue('email', lead.email);
            setValue('phone', lead.phone);
            setValue('value', lead.value);
            setValue('status', lead.status);
            setValue('source', lead.source);
            setValue('notes', lead.notes);
            setValue('tags', lead.tags?.join(', '));
            setValue('productInterest', lead.productInterest);
            setValue('assignedTo', lead.assignedTo);
            setValue('clientId', lead.clientId);
        } else {
            reset({
                status: LeadStatus.NEW,
                source: 'Manual',
                value: 0
            });
        }
    }, [lead, mode, setValue, reset]);

    const fetchClients = async () => {
        try {
            const data = await apiClient.clients.getClients();
            setClients(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    if (!isOpen) return null;

    const onSubmit = async (data: any) => {
        let formattedData = {
            ...data,
            value: Number(data.value),
            tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
            clientId: data.clientId ? Number(data.clientId) : null
        };

        // Handle Scheduling
        if (addToCalendar && scheduleDate && scheduleTime) {
            try {
                const dateTime = new Date(`${scheduleDate}T${scheduleTime}`);

                // 1. Create Calendar Event
                await apiClient.social.createPost({
                    content: `Reunião com ${data.name} (${scheduleType})`,
                    scheduled_date: dateTime.toISOString(),
                    platform: 'google',
                    category: 'meeting',
                    videoConference: { type: scheduleType, link: '' }
                });

                // 2. Append to Notes
                const scheduleNote = `\n[Agendamento] ${dateTime.toLocaleDateString('pt-BR')} às ${scheduleTime} (${scheduleType})`;
                formattedData.notes = (formattedData.notes || '') + scheduleNote;

            } catch (error) {
                console.error('Error scheduling:', error);
                alert('Erro ao agendar no calendário, mas o lead será salvo.');
            }
        }

        onSave(formattedData);
    };

    const handleQuickAction = (action: 'whatsapp' | 'email' | 'call') => {
        if (!lead) return;
        switch (action) {
            case 'whatsapp':
                window.open(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`, '_blank');
                break;
            case 'email':
                window.location.href = `mailto:${lead.email}`;
                break;
            case 'call':
                window.location.href = `tel:${lead.phone}`;
                break;
        }
    };

    const handleScheduleMeeting = async () => {
        if (!scheduleDate || !scheduleTime || !lead) return;
        setIsScheduling(true);
        try {
            const dateTime = new Date(`${scheduleDate}T${scheduleTime}`);

            // Create event in Social Calendar
            await apiClient.social.createPost({
                content: `Reunião com ${lead.name} (${scheduleType})`,
                scheduled_date: dateTime.toISOString(),
                platform: 'google', // Using Google Calendar as default for meetings
                category: 'meeting',
                videoConference: {
                    type: scheduleType,
                    link: '' // Could generate link here
                }
            });

            alert('Reunião agendada com sucesso!');
            setShowSchedule(false);
        } catch (error) {
            console.error('Erro ao agendar:', error);
            alert('Erro ao agendar reunião.');
        } finally {
            setIsScheduling(false);
        }
    };

    // Generate time slots (24h, 15 min increments)
    const timeSlots = [];
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 15) {
            const hour = i.toString().padStart(2, '0');
            const minute = j.toString().padStart(2, '0');
            timeSlots.push(`${hour}:${minute}`);
        }
    }

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

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Quick Actions Bar */}
                    {mode === 'edit' && lead && (
                        <div className="flex flex-wrap gap-3 pb-6 border-b border-gray-100">
                            <button onClick={() => handleQuickAction('whatsapp')} className="flex-1 py-2 px-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2 font-medium text-sm">
                                <MessageCircle size={16} /> WhatsApp
                            </button>
                            <button onClick={() => handleQuickAction('email')} className="flex-1 py-2 px-3 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors flex items-center justify-center gap-2 font-medium text-sm">
                                <Mail size={16} /> Email
                            </button>
                            <button onClick={() => handleQuickAction('call')} className="flex-1 py-2 px-3 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 font-medium text-sm">
                                <Phone size={16} /> Ligar
                            </button>
                            <button onClick={() => setShowSchedule(!showSchedule)} className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm ${showSchedule ? 'bg-purple-100 text-purple-700' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}>
                                <Calendar size={16} /> Agendar
                            </button>
                        </div>
                    )}

                    {/* Schedule Section */}
                    {showSchedule && (
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                            <h3 className="font-bold text-purple-800 flex items-center gap-2">
                                <Clock size={18} /> Agendar Reunião
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-purple-700 uppercase mb-1 block">Data</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-purple-700 uppercase mb-1 block">Horário</label>
                                    <select
                                        className="w-full p-2 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={scheduleTime}
                                        onChange={(e) => setScheduleTime(e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {timeSlots.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-purple-700 uppercase mb-1 block">Plataforma</label>
                                <div className="flex gap-2">
                                    {['meet', 'zoom', 'teams', 'call', 'whatsapp', 'email', 'presencial'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setScheduleType(type as any)}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded border transition-all ${scheduleType === type ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-purple-200 hover:bg-purple-50'}`}
                                        >
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleScheduleMeeting}
                                disabled={isScheduling}
                                className="w-full py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                {isScheduling ? 'Agendando...' : <><Check size={16} /> Confirmar Agendamento</>}
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <User size={16} className="text-primary-500" /> Nome Completo
                                </label>
                                <input
                                    {...register('name', { required: true })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="Ex: João Silva"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Mail size={16} className="text-primary-500" /> Email
                                </label>
                                <input
                                    {...register('email', { required: true })}
                                    type="email"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="joao@exemplo.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Phone size={16} className="text-primary-500" /> Telefone
                                </label>
                                <input
                                    {...register('phone')}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="(11) 99999-9999"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Building size={16} className="text-gray-500" /> Cliente
                                </label>
                                <select
                                    {...register('clientId')}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-white"
                                >
                                    <option value="">Sem Cliente</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <DollarSign size={16} className="text-green-500" /> Valor Estimado (R$)
                                </label>
                                <input
                                    {...register('value')}
                                    type="number"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <select
                                    {...register('status')}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-white"
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
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-white"
                                >
                                    <option value="Manual">Manual</option>
                                    <option value="Google Ads">Google Ads</option>
                                    <option value="Meta Ads">Meta Ads</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="LinkedIn">LinkedIn</option>
                                    <option value="Website">Website</option>
                                    <option value="Indicação">Indicação</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Briefcase size={16} className="text-gray-500" /> Interesse
                                </label>
                                <input
                                    {...register('productInterest')}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="Ex: Consultoria SEO"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <User size={16} className="text-gray-500" /> Responsável
                                </label>
                                <input
                                    {...register('assignedTo')}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="Nome do responsável"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Tag size={16} className="text-orange-500" /> Tags
                            </label>
                            <input
                                {...register('tags')}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                placeholder="quente, urgente, corporativo"
                            />
                            <div className="flex flex-wrap gap-2 mt-2">
                                {PREDEFINED_TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => {
                                            const currentTags = (document.querySelector('input[name="tags"]') as HTMLInputElement).value;
                                            const newTags = currentTags ? `${currentTags}, ${tag}` : tag;
                                            setValue('tags', newTags);
                                        }}
                                        className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full hover:bg-primary-50 hover:text-primary-600 transition-colors border border-gray-200"
                                    >
                                        + {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <MessageSquare size={16} className="text-purple-500" /> Notas
                            </label>
                            <textarea
                                {...register('notes')}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                                placeholder="Observações importantes sobre o lead..."
                            />
                        </div>

                        {/* Scheduling Section in Main Form */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="addToCalendar"
                                    checked={addToCalendar}
                                    onChange={(e) => setAddToCalendar(e.target.checked)}
                                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                />
                                <label htmlFor="addToCalendar" className="text-sm font-bold text-gray-700 flex items-center gap-2 cursor-pointer">
                                    <Calendar size={16} className="text-primary-500" /> Incluir no Calendário
                                </label>
                            </div>

                            {addToCalendar && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Data</label>
                                        <input
                                            type="date"
                                            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Horário (15 min)</label>
                                        <select
                                            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                            value={scheduleTime}
                                            onChange={(e) => setScheduleTime(e.target.value)}
                                        >
                                            <option value="">Selecione...</option>
                                            {timeSlots.map(time => (
                                                <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Tipo</label>
                                        <select
                                            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                            value={scheduleType}
                                            onChange={(e) => setScheduleType(e.target.value as any)}
                                        >
                                            <option value="meet">Google Meet</option>
                                            <option value="zoom">Zoom</option>
                                            <option value="teams">Teams</option>
                                            <option value="call">Telefone</option>
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="email">Email</option>
                                            <option value="presencial">Presencial</option>
                                            <option value="skype">Skype</option>
                                            <option value="slack">Slack</option>
                                            <option value="outros">Outros</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all flex items-center gap-2"
                    >
                        <Save size={18} />
                        Salvar Lead
                    </button>
                </div>
            </div>
        </div>
    );
};
