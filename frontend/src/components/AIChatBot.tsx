import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Info } from 'lucide-react';
import { ChatMessage } from '@/types';
import { askEliteAssistant } from '@/services/geminiService';
import { AIProvider, AI_MODELS, OpenAIModel, GeminiModel, ClaudeModel } from '@/constants/aiModels';

interface AIChatBotProps {
    mode?: 'widget' | 'page';
}

export const AIChatBot: React.FC<AIChatBotProps> = ({ mode = 'widget' }) => {
    const [isOpen, setIsOpen] = useState(mode === 'page');
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [provider, setProvider] = useState<AIProvider>(AIProvider.OPENAI);
    const [model, setModel] = useState<string>(OpenAIModel.GPT_5);
    const [internetAccess, setInternetAccess] = useState(false);

    // Atualiza o modelo padrão quando o provedor muda
    useEffect(() => {
        if (provider === AIProvider.OPENAI) {
            setModel(OpenAIModel.GPT_5);
        } else if (provider === AIProvider.GEMINI) {
            setModel(GeminiModel.GEMINI_2_5_FLASH);
        } else if (provider === AIProvider.ANTHROPIC) {
            setModel(ClaudeModel.SONNET_4_5);
        }
    }, [provider]);

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            sender: 'agent',
            text: 'Olá! Sou o assistente da Elite Finder. Como posso te ajudar a otimizar suas campanhas hoje?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: input,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const response = await askEliteAssistant(messages, currentInput, provider, model, internetAccess);
            const botMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'agent',
                text: response,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'agent',
                text: 'Desculpe, ocorreu um erro ao conectar com a API. Verifique se a chave do Gemini está configurada em Configurações.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (mode === 'widget' && !isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-slate-800 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            >
                <MessageCircle size={24} />
            </button>
        );
    }

    return (
        <div className={mode === 'widget' ? "fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col" : "h-full flex flex-col bg-white rounded-lg"}>
            <div className="bg-slate-800 text-white p-4 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles size={20} />
                    <span className="font-semibold">Elite Assistant</span>
                </div>
                {mode === 'widget' && (
                    <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
                        <X size={20} />
                    </button>
                )}
            </div>

            {mode === 'page' && (
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={16} className="text-slate-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Configuração do Modelo IA</span>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Provedor</label>
                            <select
                                value={provider}
                                onChange={(e) => setProvider(e.target.value as AIProvider)}
                                className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-slate-500 focus:ring-slate-500 bg-white py-2"
                            >
                                <option value={AIProvider.OPENAI}>OpenAI (GPT)</option>
                                <option value={AIProvider.GEMINI}>Google (Gemini)</option>
                                <option value={AIProvider.ANTHROPIC}>Anthropic (Claude)</option>
                            </select>
                        </div>
                        <div className="flex-[2]">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Modelo</label>
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-slate-500 focus:ring-slate-500 bg-white py-2"
                            >
                                {AI_MODELS[provider].map((m) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Internet Access Toggle */}
                    <div className="flex items-center gap-2 mt-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={internetAccess} onChange={(e) => setInternetAccess(e.target.checked)} />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-600"></div>
                            <span className="ml-2 text-xs font-medium text-gray-700 flex items-center gap-1">
                                🌍 Acesso à Internet {internetAccess ? '(Ativo)' : '(Offline)'}
                            </span>
                        </label>
                        <div className="group relative flex items-center">
                            <Info size={14} className="text-gray-400 hover:text-gray-600 cursor-help" />
                            <div className="absolute left-full ml-2 w-64 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all duration-200 z-50 pointer-events-none border border-slate-700">
                                <p className="font-semibold mb-1">Acesso Global vs. Interno:</p>
                                <p><strong>Online:</strong> O agente pesquisa informações globais na web.</p>
                                <p><strong>Offline:</strong> Acessa exclusivamente a base de dados interna do sistema.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1 mb-2">
                            💡 Dica: Qual modelo usar?
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900">🧠 Raciocínio & Estratégia</span>
                                <span className="text-gray-700">Claude 4.5 Opus ou GPT-5</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900">🎨 Criatividade & Copy</span>
                                <span className="text-gray-700">Claude 4.5 Sonnet</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900">📊 Análise de Dados</span>
                                <span className="text-gray-700">Gemini 3 Pro ou 2.5 Pro</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900">⚡ Respostas Rápidas</span>
                                <span className="text-gray-700">Gemini 2.5 Flash ou GPT-5 Mini</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'agent' && (
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                                <Bot size={16} className="text-white" />
                            </div>
                        )}
                        <div className={`max-w-[85%] p-3 rounded-lg ${msg.sender === 'user' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-800'}`}>
                            {msg.sender === 'agent' ? (
                                <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            ) : (
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            )}
                            <span className="text-xs opacity-70 mt-1 block">{msg.timestamp}</span>
                        </div>
                        {msg.sender === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                                <User size={16} className="text-white" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-2 justify-start">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                            <Loader2 size={16} className="text-white animate-spin" />
                        </div>
                        <div className="bg-gray-100 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">Pensando...</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="bg-slate-800 text-white p-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div >
    );
};
