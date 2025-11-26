import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { ChatMessage } from '@/types';
import { askEliteAssistant } from '@/services/geminiService';
import { AIProvider, AI_MODELS, OpenAIModel, GeminiModel } from '@/constants/aiModels';

interface AIChatBotProps {
    mode?: 'widget' | 'page';
}

export const AIChatBot: React.FC<AIChatBotProps> = ({ mode = 'widget' }) => {
    const [isOpen, setIsOpen] = useState(mode === 'page');
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [provider, setProvider] = useState<AIProvider>(AIProvider.OPENAI);
    const [model, setModel] = useState<string>(OpenAIModel.GPT_5);

    // Atualiza o modelo padrão quando o provedor muda
    useEffect(() => {
        if (provider === AIProvider.OPENAI) {
            setModel(OpenAIModel.GPT_5);
        } else {
            setModel(GeminiModel.GEMINI_2_5_FLASH);
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
            const response = await askEliteAssistant(messages, currentInput, provider, model);
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
                className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            >
                <MessageCircle size={24} />
            </button>
        );
    }

    return (
        <div className={mode === 'widget' ? "fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col" : "h-full flex flex-col bg-white rounded-lg"}>
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
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
                <div className="bg-gray-50 p-3 border-b flex gap-3">
                    <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value as AIProvider)}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        {Object.values(AIProvider).map((p) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                    <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 flex-1"
                    >
                        {AI_MODELS[provider].map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'agent' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                                <Bot size={16} className="text-white" />
                            </div>
                        )}
                        <div className={`max-w-[70%] p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                            <p className="text-sm">{msg.text}</p>
                            <span className="text-xs opacity-70 mt-1 block">{msg.timestamp}</span>
                        </div>
                        {msg.sender === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <User size={16} className="text-white" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-2 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
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
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
