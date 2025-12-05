import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, User, Mail, Phone, Building, MessageCircle, Calendar, Clock, Check, Briefcase, FileText } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface ClientModalProps {
    client?: any;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    mode: 'create' | 'edit';
}

export const ClientModal: React.FC<ClientModalProps> = ({ client, isOpen, onClose, onSave, mode }) => {
    const { register, handleSubmit, setValue } = useForm({
        defaultValues: client || {
            status: 'active'
        }
    });
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [scheduleType, setScheduleType] = useState<'meet' | 'zoom' | 'teams' | 'call' | 'email' | 'whatsapp' | 'presencial' | 'skype' | 'slack' | 'outros'>('meet');
    const [isScheduling, setIsScheduling] = useState(false);

    if (!isOpen) return null;

    const onSubmit = async (data: any) => {
        onSave(data);
    };

    const handleQuickAction = (action: 'whatsapp' | 'email' | 'call') => {
        if (!client) return;
        switch (action) {
            case 'whatsapp':
                window.open(`https://wa.me/${client.phone?.replace(/\D/g, '')}`, '_blank');
                break;
            case 'email':
                window.location.href = `mailto:${client.email}`;
                break;
            case 'call':
                window.location.href = `tel:${client.phone}`;
                break;
        }
    };

    const handleScheduleMeeting = async () => {
        if (!scheduleDate || !scheduleTime || !client) return;
        setIsScheduling(true);
        try {
            const dateTime = new Date(`${scheduleDate}T${scheduleTime}`);

            await apiClient.social.createPost({
                content: `Reunião com ${client.name} - ${client.company || ''} (${scheduleType})`,
                scheduled_date: dateTime.toISOString(),
                platform: 'google',
                category: 'meeting',
                videoConference: {
                    type: scheduleType,
                    link: ''
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
                        {mode === 'create' ? 'Novo Cliente' : 'Editar Cliente'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Quick Actions Bar */}
                    {mode === 'edit' && client && (
                        <div className="flex flex-wrap gap-3 pb-6 border-b border-gray-100">
                            <button onClick={() => handleQuickAction('whatsapp')} className="flex-1 py-2 px-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2 font-medium text-sm">
                                <MessageCircle size={16} /> WhatsApp
                            </button>
                            <button onClick={() => handleQuickAction('email')} className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 font-medium text-sm">
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
                                <div className="flex gap-2 flex-wrap">
                                    {['meet', 'zoom', 'teams', 'call', 'whatsapp', 'email', 'presencial'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setScheduleType(type as any)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded border transition-all ${scheduleType === type ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-purple-200 hover:bg-purple-50'}`}
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
                                    <User size={16} className="text-blue-500" /> Nome do Cliente
                                </label>
                                <input
                                    {...register('name', { required: true })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ex: João Silva"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Building size={16} className="text-gray-500" /> Empresa
                                </label>
                                <input
                                    {...register('company')}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ex: Acme Corp"
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
                                    <Briefcase size={16} className="text-gray-500" /> Status
                                </label>
                                <select
                                    {...register('status')}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                                >
                                    <option value="active">Ativo</option>
                                    <option value="inactive">Inativo</option>
                                    <option value="lead">Lead</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <FileText size={16} className="text-gray-500" /> Notas
                            </label>
                            <textarea
                                {...register('notes')}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                placeholder="Observações importantes sobre o cliente..."
                            />
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
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                    >
                        <Save size={18} />
                        Salvar Cliente
                    </button>
                </div>
            </div>
        </div>
    );
};
