import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, User, Bot, Sparkles, AlertTriangle, CheckCircle, TrendingUp, BrainCircuit, MessageSquare } from 'lucide-react';
import { COMPONENT_VERSIONS } from '../componentVersions';

interface Message {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
}

interface AnalysisResult {
    sentiment: 'Positive' | 'Neutral' | 'Skeptical' | 'Negative';
    detected_objections: string[];
    buying_stage: 'Curiosity' | 'Consideration' | 'Decision';
    suggested_strategy: string;
    next_best_action: string;
    coach_whisper: string;
}

export const SalesCoachingChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'agent', content: 'Olá! Como posso ajudar você hoje com nossos planos premium?', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInput('');
        setIsAnalyzing(true);

        // Simulate Agent Response (Mock for now, or could use the AI Chat endpoint)
        // For the purpose of the "Teleprompter", we want to analyze AFTER the user speaks to guide the agent's NEXT move.

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/analyze-strategy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    messages: [...messages, newUserMsg].map(m => ({ role: m.role, content: m.content })),
                    agentContext: { product: "Elite Finder SaaS", goal: "Sell Premium Plan" }
                })
            });

            if (response.ok) {
                const data = await response.json();
                setAnalysis(data);
            }
        } catch (error) {
            console.error("Error analyzing conversation:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment?.toLowerCase()) {
            case 'positive': return 'text-green-500 bg-green-50 border-green-200';
            case 'skeptical': return 'text-orange-500 bg-orange-50 border-orange-200';
            case 'negative': return 'text-red-500 bg-red-50 border-red-200';
            default: return 'text-blue-500 bg-blue-50 border-blue-200';
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 animate-fade-in">
            {/* LEFT: Main Chat Interface */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                            <User size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Prospect: João Silva</h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Online agora
                            </p>
                        </div>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{COMPONENT_VERSIONS.SalesCoachingChat || 'v1.0'}</span>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'agent' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${msg.role === 'agent'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                                }`}>
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                <span className={`text-[10px] block mt-2 ${msg.role === 'agent' ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                            <Mic size={20} />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Digite sua resposta..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-700 placeholder-gray-400"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isAnalyzing}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT: Teleprompter / AI Coach */}
            <div className="w-96 flex flex-col gap-4">
                {/* Status Card */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BrainCircuit size={16} /> Análise em Tempo Real
                    </h4>

                    {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-3">
                            <Sparkles className="animate-spin text-blue-500" size={32} />
                            <p className="text-sm animate-pulse">Analisando intenção...</p>
                        </div>
                    ) : analysis ? (
                        <div className="space-y-4">
                            {/* Sentiment & Stage */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className={`p-3 rounded-xl border ${getSentimentColor(analysis.sentiment)}`}>
                                    <p className="text-xs font-semibold opacity-70">Sentimento</p>
                                    <p className="font-bold">{analysis.sentiment}</p>
                                </div>
                                <div className="p-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-700">
                                    <p className="text-xs font-semibold opacity-70">Estágio</p>
                                    <p className="font-bold">{analysis.buying_stage}</p>
                                </div>
                            </div>

                            {/* Objections */}
                            {analysis.detected_objections && analysis.detected_objections.length > 0 && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                                    <p className="text-xs font-bold text-red-500 mb-2 flex items-center gap-1">
                                        <AlertTriangle size={12} /> OBJEÇÕES DETECTADAS
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.detected_objections.map((obj, i) => (
                                            <span key={i} className="text-xs bg-white text-red-600 px-2 py-1 rounded-md border border-red-100 shadow-sm">
                                                {obj}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            Aguardando início da conversa para gerar insights...
                        </div>
                    )}
                </div>

                {/* THE TELEPROMPTER (Actionable Advice) */}
                <div className="flex-1 bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl shadow-lg border border-slate-700 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                    <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Sparkles size={16} /> Elite Sales Coach
                    </h4>

                    {analysis ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* The Whisper (Main Tip) */}
                            <div>
                                <p className="text-xs text-slate-400 mb-1">DICA ESTRATÉGICA (WHISPER)</p>
                                <p className="text-lg font-medium leading-relaxed text-blue-50">
                                    "{analysis.coach_whisper}"
                                </p>
                            </div>

                            <div className="h-px bg-slate-700"></div>

                            {/* Suggested Action */}
                            <div>
                                <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                                    <TrendingUp size={12} /> PRÓXIMA AÇÃO RECOMENDADA
                                </p>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-600 hover:border-blue-500/50 transition-colors cursor-pointer group">
                                    <p className="text-sm text-slate-200 group-hover:text-white transition-colors">
                                        {analysis.next_best_action}
                                    </p>
                                </div>
                            </div>

                            {/* Strategy Tag */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-500/30">
                                <BrainCircuit size={12} />
                                Estratégia: {analysis.suggested_strategy}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center">
                            <MessageSquare size={48} className="mb-4 opacity-20" />
                            <p className="text-sm">O Teleprompter será ativado assim que o cliente interagir.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
