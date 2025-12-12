import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, AlertTriangle, TrendingUp, BrainCircuit, Bot, User, Settings } from 'lucide-react';
import { WhatsAppConfigModal } from './WhatsAppConfigModal';
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
    const [showWhatsAppConfig, setShowWhatsAppConfig] = useState(false);
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
            // 1. Primary Chat with the visible agent (Simulated Customer)
            const chatPromise = fetch(`${import.meta.env.VITE_API_URL}/api/agents/public/${agent.slug}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })),
                    sessionId: 'public-' + Date.now()
                })
            });

            // 2. Parallel Shadow Analysis with "Elite Sales Coach"
            // Using 'agent-sales-coach' as the permanent analyst
            const analysisPromise = fetch(`${import.meta.env.VITE_API_URL}/api/agents/public/agent-sales-coach/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'You are an expert Sales Coach observing a negotiation. The "user" is the Salesperson. The "assistant" is the Customer. ANALYZE the Salesperson\'s performance. Return ONLY a pure JSON object (no markdown) with keys: sentiment (of the customer), buying_stage, detected_objections (array), coach_whisper (short advice to salesperson), next_best_action.' },
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: userMsg.content }
                    ],
                    sessionId: 'analysis-' + Date.now()
                })
            });

            const [chatResponse, analysisResponse] = await Promise.all([chatPromise, analysisPromise]);

            if (!chatResponse.ok) throw new Error('Falha no chat');

            const chatData = await chatResponse.json();

            // Process Chat Response
            let cleanContent = chatData.content;

            // If the chatbot itself returns JSON (it shouldn't if it's the customer role, but safety check)
            try {
                if (cleanContent.trim().startsWith('{')) {
                    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
                    if (jsonMatch) cleanContent = JSON.parse(jsonMatch[0]).message || cleanContent;
                }
            } catch (e) { /* ignore */ }

            const botMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: cleanContent,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);

            // Process Analysis Response (Silent)
            if (analysisResponse.ok) {
                const analysisData = await analysisResponse.json();
                try {
                    let analysisJsonStr = analysisData.content;
                    // Strip markdown code blocks if present
                    analysisJsonStr = analysisJsonStr.replace(/```json/g, '').replace(/```/g, '');

                    const jsonMatch = analysisJsonStr.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        setCurrentAnalysis(parsed);
                    }
                } catch (e) {
                    console.warn('Failed to parse shadow analysis:', e);
                }
            }

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
                            {agent.name} <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Training Mode</span>
                        </h1>
                        <p className="text-xs text-gray-500">Sales Intelligence Powered by AIIAM</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowWhatsAppConfig(true)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Configuração WhatsApp"
                >
                    <Settings size={20} />
                </button>
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
                                placeholder="Digite sua resposta de venda..."
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
                        ) : isLoading ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400 space-y-4">
                                <Sparkles size={32} className="opacity-20 animate-pulse text-purple-500" />
                                <p className="text-sm">Analisando seu padrão de resposta...</p>
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
            <WhatsAppConfigModal
                isOpen={showWhatsAppConfig}
                onClose={() => setShowWhatsAppConfig(false)}
                onConfigUpdate={() => console.log('WhatsApp Config Updated')}
            />
        </div>
    );
};
