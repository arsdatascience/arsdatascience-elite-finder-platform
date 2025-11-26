import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, BrainCircuit, Sparkles, CheckCircle, AlertTriangle, ThumbsUp } from 'lucide-react';
import { ChatMessage, AnalysisResult } from '../types';
import { analyzeChatConversation } from '../services/geminiService';

export const ChatMode: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'client',
            text: input,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: [...messages, userMessage].map(m => ({
                        sender: m.sender, // Backend expects 'sender' and 'text' in history objects based on aiController logic
                        text: m.text
                    })),
                    question: input
                })
            });

            if (!response.ok) throw new Error('Failed to get AI response');

            const data = await response.json();

            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'agent',
                text: data.answer || 'Desculpe, não consegui gerar uma resposta.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error getting AI response:', error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'agent',
                text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Verifique se a API está configurada corretamente.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const triggerAnalysis = async () => {
        if (messages.length === 0) return;

        setIsAnalyzing(true);
        try {
            const result = await analyzeChatConversation(messages);
            setAnalysis(result);
        } catch (e) {
            console.error(e);
            alert("Erro ao analisar a conversa. Verifique sua chave de API.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Elite Strategist IA</h3>
                            <p className="text-xs text-gray-600">Especialista em Ads, Social Media e Funis</p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Bot size={64} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">Olá! Sou seu Estrategista Digital.</p>
                            <p className="text-sm mt-2 max-w-xs text-center">Peça ajuda com campanhas de Ads, ideias para Reels, copy para anúncios ou análise de funil.</p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${msg.sender === 'agent'
                                ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-200'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
                                }`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                <p className={`text-[10px] mt-1 text-right ${msg.sender === 'agent' ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {msg.timestamp}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex justify-end">
                            <div className="max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-200">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            disabled={isTyping}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isTyping || !input.trim()}
                            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isTyping ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Analysis Sidebar */}
            <div className="w-full md:w-80 flex flex-col gap-4 md:h-full overflow-hidden shrink-0">
                {/* Action Card */}
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-5 rounded-xl shadow-lg relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <BrainCircuit size={120} />
                    </div>
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2 relative z-10">
                        <Sparkles size={18} className="text-yellow-400" />
                        Análise em Tempo Real
                    </h3>
                    <p className="text-indigo-200 text-xs mb-4 relative z-10">
                        Esta Meta Análise avalia o sentimento, intenção de compra, estratégias de conversão aplicadas e o uso de gatilhos mentais para otimizar seus resultados.
                    </p>
                    <button
                        onClick={triggerAnalysis}
                        disabled={isAnalyzing || messages.length === 0}
                        className={`w-full bg-white text-indigo-900 font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 relative z-10 ${isAnalyzing || messages.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50'
                            }`}
                    >
                        {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
                        {isAnalyzing ? 'Analisando...' : 'Analisar Conversa'}
                    </button>
                </div>

                {/* Results Area */}
                {analysis ? (
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-y-auto space-y-4">
                        {/* Sentiment */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Sentimento</h4>
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${analysis.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                                analysis.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                {analysis.sentiment === 'positive' ? <CheckCircle size={14} /> :
                                    analysis.sentiment === 'negative' ? <AlertTriangle size={14} /> :
                                        <ThumbsUp size={14} />}
                                {analysis.sentiment === 'positive' ? 'Positivo' :
                                    analysis.sentiment === 'negative' ? 'Negativo' : 'Neutro'}
                            </div>
                        </div>

                        {/* Intent */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Intenção</h4>
                            <p className="text-xs text-gray-800 bg-blue-50 px-3 py-2 rounded-lg font-medium">{analysis.intent}</p>
                        </div>

                        {/* Summary */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Resumo</h4>
                            <p className="text-xs text-gray-700 leading-relaxed">{analysis.summary}</p>
                        </div>

                        {/* Recommended Actions */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Recomendações</h4>
                            <ul className="space-y-2">
                                {analysis.suggestions.map((action: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                                        <span className="text-green-600 font-bold">✓</span>
                                        {action}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center flex-col text-gray-400 p-8 text-center">
                        <Bot size={32} className="mb-2 opacity-20" />
                        <p className="text-sm">Inicie uma conversa e clique em analisar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
