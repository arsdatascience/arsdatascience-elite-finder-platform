import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, AlertTriangle, TrendingUp, BrainCircuit, Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    analysis?: AnalysisResult;
}

interface AnalysisResult {
    sentiment: 'Positive' | 'Neutral' | 'Skeptical' | 'Negative';
    detected_objections?: string[];
    buying_stage: 'Curiosity' | 'Consideration' | 'Decision';
    suggested_strategy?: string;
    next_best_action?: string;
    coach_whisper: string;
    gap_analysis?: string;
}

interface PublicSalesCoachProps {
    agent: {
        id: string;
        name: string;
        description: string;
        slug: string;
        avatar?: string;
    };
}

export const PublicSalesCoach: React.FC<PublicSalesCoachProps> = ({ agent }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Greeting
    useEffect(() => {
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `Olá! Sou o **${agent.name}**. \n\nVamos simular uma negociação? Atuarei como seu cliente ou treinador. \n\n*Pode começar a conversa!*`,
            timestamp: new Date()
        }]);
    }, [agent]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/agents/public/${agent.slug}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })),
                    sessionId: 'public-' + Date.now() // Unique per session-ish
                })
            });

            if (!response.ok) throw new Error('Falha ao enviar mensagem');

            const data = await response.json();
            let rawContent = data.content;
            let parsedAnalysis: AnalysisResult | null = null;
            let cleanContent = rawContent;

            // Attempt to extract JSON from response (The agent is instructed to return JSON)
            // Sometimes models wrap JSON in ```json ... ```
            try {
                const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsedAnalysis = JSON.parse(jsonMatch[0]);

                    // If the content was ONLY the JSON, we might want to display the "Coach Whisper" as the text, 
                    // or if the agent provides a "response" field. The current prompt structure returns PURE JSON.
                    // If pure JSON, the "message" to the user might be implicit or mapped.
                    // However, usually we want the AI to reply AND coach.
                    // The prompt says "Retorne JSON estrito". This means the User sees nothing?
                    // Ah, for the "Sales Coach" (Shadowing), it's a silent observer.
                    // BUT for "Roleplay", it should speak.
                    // Let's assume for this "Coach" view, we display the 'coach_whisper' as the main insight, 
                    // but we might need the "Simulated Customer" reply if it's roleplay.

                    // If the agent is purely coaching, the user IS the salesperson.
                    // If the agent IS the customer, it acts as customer + sends hidden metadata.

                    // For now, let's treat the JSON as metadata and if there's text outside, show it.
                    // If ONLY JSON, we show the JSON fields in the UI.

                    // Check logic: The prompt `agent-sales-coach` is a "Director" analyzing the conversation.
                    // So it likely shouldn't "speak" to the customer effectively, it speaks to the SALESPERSON.
                    // So the `cleanContent` (what appears in chat) should be the `coach_whisper` or `next_best_action`.

                    if (parsedAnalysis?.coach_whisper) {
                        cleanContent = `💡 **Coach:** ${parsedAnalysis.coach_whisper}`;
                    }
                    setCurrentAnalysis(parsedAnalysis);
                }
            } catch (e) {
                console.warn('Could not parse JSON analysis', e);
            }

            const botMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: cleanContent,
                timestamp: new Date(),
                analysis: parsedAnalysis || undefined
            };

            setMessages(prev => [...prev, botMsg]);

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'system',
                content: '⚠️ Erro ao processar. Tente novamente.',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment?.toLowerCase()) {
            case 'positive': return 'text-green-500 bg-green-50 border-green-200';
            case 'skeptical': return 'text-orange-500 bg-orange-50 border-orange-200';
            case 'negative': return 'text-red-500 bg-red-50 border-red-200';
            default: return 'text-primary-500 bg-primary-50 border-primary-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {agent.avatar ? <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-full object-cover" /> : <Bot size={20} />}
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            {agent.name} <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Modo Treinamento</span>
                        </h1>
                        <p className="text-xs text-gray-500">Sales Intelligence Powered by AIIAM</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* MIDDLE: Main Chat Interface */}
                <div className="flex-1 flex flex-col relative">
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 custom-scrollbar">
                        {messages.map((msg) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={msg.id}
                                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-gray-800 text-white' : 'bg-gradient-to-br from-primary-500 to-indigo-600 text-white'}`}>
                                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm text-sm leading-relaxed ${msg.role === 'user' ? 'bg-gray-800 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    <span className="text-[10px] opacity-50 mt-2 block">{msg.timestamp.toLocaleTimeString()}</span>
                                </div>
                            </motion.div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shrink-0"><Bot size={16} /></div>
                                <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-150" />
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-300" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-gray-200">
                        <div className="max-w-3xl mx-auto flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Digite sua mensagem (simule o vendedor)..."
                                className="flex-1 bg-gray-100 border-0 rounded-full px-6 py-3 focus:ring-2 focus:ring-primary-500 outline-none text-gray-800"
                                disabled={isLoading}
                            />
                            <button onClick={handleSendMessage} disabled={!input.trim() || isLoading} className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50">
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: AI Coach Teleprompter */}
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <BrainCircuit size={16} /> Análise em Tempo Real
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {currentAnalysis ? (
                            <div className="space-y-6 animate-fade-in">
                                {/* Dashboard Cards */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className={`p-3 rounded-xl border ${getSentimentColor(currentAnalysis.sentiment)}`}>
                                        <p className="text-xs font-semibold opacity-70">Sentimento</p>
                                        <p className="font-bold">{currentAnalysis.sentiment}</p>
                                    </div>
                                    <div className="p-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-700">
                                        <p className="text-xs font-semibold opacity-70">Estágio</p>
                                        <p className="font-bold">{currentAnalysis.buying_stage}</p>
                                    </div>
                                </div>

                                {/* Objections */}
                                {currentAnalysis.detected_objections && currentAnalysis.detected_objections.length > 0 && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                                        <p className="text-xs font-bold text-red-500 mb-2 flex items-center gap-1">
                                            <AlertTriangle size={12} /> OBJEÇÕES
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {currentAnalysis.detected_objections.map((obj, i) => (
                                                <span key={i} className="text-xs bg-white text-red-600 px-2 py-1 rounded-md border border-red-100 shadow-sm">{obj}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Teleprompter */}
                                <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl shadow-lg border border-slate-700 p-5 text-white">
                                    <div className="mb-4">
                                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Sparkles size={12} /> DICA DO COACH</p>
                                        <p className="text-md font-medium leading-relaxed text-primary-50">"{currentAnalysis.coach_whisper}"</p>
                                    </div>
                                    <div className="h-px bg-slate-700 my-4"></div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><TrendingUp size={12} /> PRÓXIMA AÇÃO</p>
                                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                                            <p className="text-sm text-slate-200">{currentAnalysis.next_best_action}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400 space-y-4">
                                <Sparkles size={32} className="opacity-20" />
                                <p className="text-sm">Inicie a conversa para receber <br />análise em tempo real.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
