import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Paperclip, Bot, User, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    status?: 'sending' | 'sent' | 'error';
}

interface AgentPublic {
    id: string;
    name: string;
    description: string;
    avatar?: string;
    slug: string;
}

export const PublicAgentChat: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [agent, setAgent] = useState<AgentPublic | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchAgent();
    }, [slug]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchAgent = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/agents/public/${slug}`);
            if (!res.ok) throw new Error('Agente não encontrado');
            const data = await res.json();
            setAgent(data);
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: `Olá! Sou **${data.name}**. Como posso ajudar você hoje?`,
                timestamp: new Date()
            }]);
        } catch (err) {
            setError('Agente indisponível ou não encontrado.');
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !agent) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
            status: 'sending'
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/agents/public/${slug}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })),
                    sessionId: 'public-' + Date.now()
                })
            });

            if (!response.ok) throw new Error('Falha ao enviar mensagem');

            const data = await response.json();

            const botMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.content,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'system',
                content: '⚠️ Erro ao processar mensagem. Tente novamente.',
                timestamp: new Date(),
                status: 'error'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md w-full">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Ops!</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!agent) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><RefreshCw className="animate-spin text-primary-600" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {agent.avatar ? <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-full object-cover" /> : <Bot size={20} />}
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            {agent.name} <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Online</span>
                        </h1>
                        <p className="text-xs text-gray-500 line-clamp-1">{agent.description}</p>
                    </div>
                    <div className="ml-auto">
                        <div className="text-xs text-gray-400 font-medium">Powered by AIIAM</div>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-6 pb-4">
                    {messages.map((msg) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={msg.id}
                            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                  ${msg.role === 'user' ? 'bg-gray-800 text-white' : 'bg-gradient-to-br from-primary-500 to-indigo-600 text-white'}
                `}
                            >
                                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>

                            <div
                                className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm text-sm leading-relaxed
                  ${msg.role === 'user'
                                        ? 'bg-gray-800 text-white rounded-tr-none'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}
                `}
                            >
                                {msg.role === 'system' ? (
                                    <span className="text-red-500 font-medium">{msg.content}</span>
                                ) : (
                                    <ReactMarkdown
                                        components={{
                                            code({ node, inline, className, children, ...props }) {
                                                return !inline ? (
                                                    <div className="bg-gray-900 rounded-md p-3 my-2 overflow-x-auto text-xs font-mono text-gray-200">
                                                        {children}
                                                    </div>
                                                ) : (
                                                    <code className={`${className} bg-black/10 px-1 py-0.5 rounded font-mono text-xs`} {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            }
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                )}
                                <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-gray-300' : 'text-gray-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
                                <Bot size={16} />
                            </div>
                            <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                                <div className="flex gap-1.5 h-full items-center">
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Area */}
            <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-10">
                <div className="max-w-3xl mx-auto">
                    <div className="relative flex items-center gap-2">
                        <button className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <Paperclip size={20} />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Digite sua mensagem para o agente..."
                            className="flex-1 bg-gray-100 border-0 rounded-full px-6 py-3 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none text-gray-800 placeholder-gray-400"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isLoading}
                            className="p-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95 shadow-lg"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                    <div className="text-center mt-2 text-xs text-gray-400">
                        AI pode cometer erros. Verifique as informações importantes.
                    </div>
                </div>
            </footer>
        </div>
    );
};
