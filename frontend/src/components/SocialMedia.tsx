import React, { useState } from 'react';
import { Calendar, Image, ThumbsUp, MessageCircle, Share2, TrendingUp, Sparkles, Users } from 'lucide-react';
import { ContentGenerator } from './ContentGenerator';
import { CLIENTS_LIST } from '../constants';
import { ViewState } from '../types';
import { COMPONENT_VERSIONS } from '../componentVersions';

interface SocialMediaProps {
    onNavigate: (view: ViewState) => void;
}

const POSTS = [
    { id: 1, date: '24 Out', content: 'Lançamento da coleção de verão! 🌞 #verao #moda', platform: 'instagram', status: 'publicado', likes: 245, comments: 12 },
    { id: 2, date: '26 Out', content: '5 Dicas para melhorar seu ROAS agora. Link na bio.', platform: 'linkedin', status: 'agendado', likes: 0, comments: 0 },
    { id: 3, date: '28 Out', content: 'Bastidores do nosso escritório.', platform: 'instagram', status: 'rascunho', likes: 0, comments: 0 },
];

export const SocialMedia: React.FC<SocialMediaProps> = ({ onNavigate }) => {
    const [showGenerator, setShowGenerator] = useState(false);
    const [selectedClient, setSelectedClient] = useState(CLIENTS_LIST[1].id);

    // Simulate stats based on client
    const statsMultiplier = selectedClient === '1' ? 1 : selectedClient === '2' ? 0.1 : 0.5;

    const stats = {
        reach: (124500 * statsMultiplier).toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 }),
        engagement: (4.2 * (selectedClient === '2' ? 2 : 1)).toFixed(1) + '%', // Pequenos negocios as vezes tem engajamento maior
        comments: Math.floor(892 * statsMultiplier)
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gestão de Redes Sociais <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2 align-middle">{COMPONENT_VERSIONS.SocialMedia}</span></h2>
                    <p className="text-sm text-gray-500">Calendário editorial e performance de conteúdo.</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    {/* Client Selector */}
                    <div className="relative flex-1 md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                            <Users size={16} />
                        </div>
                        <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className="w-full bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 shadow-sm outline-none"
                        >
                            {CLIENTS_LIST.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setShowGenerator(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2 shadow-lg shadow-purple-200 whitespace-nowrap"
                    >
                        <Sparkles size={16} />
                        Criar Post IA
                    </button>
                </div>
            </div>

            <ContentGenerator
                isOpen={showGenerator}
                onClose={() => setShowGenerator(false)}
                defaultType="post"
                defaultPlatform="instagram"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar / Upcoming */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                <TrendingUp size={16} />
                                <span>Alcance Total</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stats.reach}</p>
                            <p className="text-xs text-green-600 font-medium">+12% vs mês anterior</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                <ThumbsUp size={16} />
                                <span>Engajamento Médio</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stats.engagement}</p>
                            <p className="text-xs text-green-600 font-medium">+0.5% vs mês anterior</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                <MessageCircle size={16} />
                                <span>Comentários</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stats.comments}</p>
                            <p className="text-xs text-red-600 font-medium">-3% vs mês anterior</p>
                        </div>
                    </div>

                    {/* Content Calendar List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Calendário de Conteúdo</h3>
                            <button
                                onClick={() => onNavigate(ViewState.SOCIAL_CALENDAR)}
                                className="text-sm text-blue-600 font-medium cursor-pointer hover:underline"
                            >
                                Ver Calendário Completo
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {POSTS.map(post => (
                                <div key={post.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                                        <Image size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">{post.date} • {post.platform}</p>
                                                <p className="text-sm font-medium text-gray-900 line-clamp-1">{post.content}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${post.status === 'publicado' ? 'bg-green-100 text-green-700' :
                                                post.status === 'agendado' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {post.status}
                                            </span>
                                        </div>
                                        {post.status === 'publicado' && (
                                            <div className="mt-2 flex gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1"><ThumbsUp size={12} /> {Math.floor(post.likes * statsMultiplier)}</span>
                                                <span className="flex items-center gap-1"><MessageCircle size={12} /> {Math.floor(post.comments * statsMultiplier)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Feed Preview */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-800 mb-4">Prévia Instagram</h3>
                    <div className="border border-gray-200 rounded-xl p-4 max-w-[300px] mx-auto bg-white shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 p-[2px]">
                                <div className="w-full h-full bg-white rounded-full border-2 border-white overflow-hidden">
                                    <img src="https://picsum.photos/50/50" alt="Profile" className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <span className="text-sm font-semibold">
                                {selectedClient === '2' ? 'padaria_joao' : 'elite_tech'}
                            </span>
                        </div>
                        <div className="aspect-square bg-gray-100 rounded mb-3 overflow-hidden">
                            <img src="https://picsum.photos/400/400" alt="Post" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex gap-3 mb-2 text-gray-800">
                            <ThumbsUp size={20} />
                            <MessageCircle size={20} />
                            <Share2 size={20} />
                        </div>
                        <p className="text-sm text-gray-900 font-semibold mb-1">{Math.floor(245 * statsMultiplier)} curtidas</p>
                        <p className="text-xs text-gray-600 leading-snug">
                            <span className="font-semibold text-gray-900 mr-1">
                                {selectedClient === '2' ? 'padaria_joao' : 'elite_tech'}
                            </span>
                            {selectedClient === '2'
                                ? 'Pão quentinho saindo do forno agora! 🍞 Venha garantir o seu café da tarde.'
                                : 'Inovação e tecnologia para escalar sua operação. Conheça nossa nova suite de APIs.'}
                        </p>
                    </div>
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                        <strong>Sugestão da IA:</strong> Postar às 18:00 aumenta o engajamento em aprox. 15%.
                    </div>
                </div>
            </div>
        </div>
    );
};
