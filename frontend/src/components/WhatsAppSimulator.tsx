import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, MoreVertical, Search, Phone, Video, Smile, Mic, Check, CheckCheck, BarChart3, TrendingUp, Target, MessageCircle } from 'lucide-react';

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
    status: 'sent' | 'delivered' | 'read';
}

interface AnalysisResult {
    sentiment_analysis: {
        score: number;
        explanation: string;
    };
    sales_opportunity: {
        probability: string;
        justification: string;
    };
    missed_opportunities: string[];
    marketing_angles: string[];
    remarketing_strategy: string;
    suggested_next_steps: string[];
}

export const WhatsAppSimulator: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', content: 'Olá! Gostaria de saber mais sobre os planos.', role: 'user', timestamp: '10:30', status: 'read' },
        { id: '2', content: 'Olá! Claro, sou o assistente virtual da Elite. Temos planos a partir de R$ 99,90. Qual o tamanho da sua empresa?', role: 'assistant', timestamp: '10:31', status: 'read' },
        { id: '3', content: 'Somos uma startup com 15 funcionários.', role: 'user', timestamp: '10:32', status: 'read' },
    ]);
    const [input, setInput] = useState('');
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
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

        const newMessage: Message = {
            id: Date.now().toString(),
            content: input,
            role: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent'
        };

        setMessages(prev => [...prev, newMessage]);
        setInput('');

        // Simular resposta do agente (mock por enquanto, depois conectar com API real)
        setTimeout(() => {
            const response: Message = {
                id: (Date.now() + 1).toString(),
                content: 'Entendi! Para startups desse porte, recomendo o plano Growth. Ele inclui automação de marketing e CRM integrado. Gostaria de ver uma demo?',
                role: 'assistant',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'read'
            };
            setMessages(prev => [...prev, response]);
        }, 1500);
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setShowAnalysis(true);
        setAnalysis(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/analyze-strategy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.map(m => ({ role: m.role, content: m.content })),
                    agentContext: { name: "Elite Sales Bot", role: "Sales Representative" }
                })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || data.message || 'Falha na análise');
            }

            setAnalysis(data);
        } catch (error: any) {
            console.error('Erro na análise:', error);
            alert('Erro ao analisar conversa: ' + error.message);
            setShowAnalysis(false);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col relative transition-all duration-300 ${showAnalysis ? 'mr-96' : ''}`}>

                {/* Header */}
                <div className="bg-[#f0f2f5] px-4 py-3 flex items-center justify-between border-b border-gray-300">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                            <img src="https://ui-avatars.com/api/?name=Elite+Bot&background=0D8ABC&color=fff" alt="Bot" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Elite Sales Bot</h3>
                            <span className="text-xs text-gray-500">Business Account</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-gray-500">
                        <button onClick={handleAnalyze} className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm">
                            <BarChart3 size={18} /> Analisar Conversa
                        </button>
                        <Search size={20} />
                        <MoreVertical size={20} />
                    </div>
                </div>

                {/* Chat Background */}
                <div className="flex-1 bg-[#efeae2] relative overflow-y-auto p-4" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', opacity: 0.9 }}>
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-lg px-3 py-2 shadow-sm relative ${msg.role === 'user' ? 'bg-[#d9fdd3]' : 'bg-white'}`}>
                                    <p className="text-sm text-gray-800 leading-relaxed">{msg.content}</p>
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                        <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                                        {msg.role === 'user' && (
                                            <span className={`text-[10px] ${msg.status === 'read' ? 'text-blue-500' : 'text-gray-400'}`}>
                                                <CheckCheck size={14} />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-4">
                    <Smile className="text-gray-500 cursor-pointer" />
                    <Paperclip className="text-gray-500 cursor-pointer" />
                    <div className="flex-1 bg-white rounded-lg px-4 py-2">
                        <input
                            type="text"
                            placeholder="Digite uma mensagem"
                            className="w-full outline-none text-sm bg-transparent"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                    </div>
                    {input ? (
                        <Send className="text-gray-500 cursor-pointer" onClick={handleSendMessage} />
                    ) : (
                        <Mic className="text-gray-500 cursor-pointer" />
                    )}
                </div>
            </div>

            {/* Analysis Sidebar */}
            <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 overflow-y-auto z-20 ${showAnalysis ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Target className="text-purple-600" /> Análise Estratégica
                        </h2>
                        <button onClick={() => setShowAnalysis(false)} className="text-gray-400 hover:text-gray-600">×</button>
                    </div>

                    {analyzing ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-500 animate-pulse">A IA está analisando a conversa...</p>
                        </div>
                    ) : analysis ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* Sentiment */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <Smile size={16} className="text-yellow-500" /> Sentimento do Cliente
                                </h4>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${analysis.sentiment_analysis.score > 7 ? 'bg-green-500' : analysis.sentiment_analysis.score > 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${analysis.sentiment_analysis.score * 10}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold">{analysis.sentiment_analysis.score}/10</span>
                                </div>
                                <p className="text-xs text-gray-600">{analysis.sentiment_analysis.explanation}</p>
                            </div>

                            {/* Sales Opportunity */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                                    <TrendingUp size={16} /> Probabilidade de Venda
                                </h4>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${analysis.sales_opportunity.probability === 'Alta' ? 'bg-green-200 text-green-800' :
                                        analysis.sales_opportunity.probability === 'Média' ? 'bg-yellow-200 text-yellow-800' :
                                            'bg-red-200 text-red-800'
                                        }`}>
                                        {analysis.sales_opportunity.probability}
                                    </span>
                                </div>
                                <p className="text-xs text-blue-700">{analysis.sales_opportunity.justification}</p>
                            </div>

                            {/* Marketing Angles */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Target size={16} className="text-red-500" /> Ângulos de Marketing
                                </h4>
                                <ul className="space-y-2">
                                    {analysis.marketing_angles?.map((angle, i) => (
                                        <li key={i} className="text-xs bg-red-50 text-red-700 p-2 rounded border border-red-100">
                                            • {typeof angle === 'object' ? (angle as any).message || (angle as any).text || JSON.stringify(angle) : angle}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Remarketing */}
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <h4 className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
                                    <MessageCircle size={16} /> Estratégia de Remarketing
                                </h4>
                                <p className="text-xs text-purple-700 italic">"{analysis.remarketing_strategy}"</p>
                            </div>

                            {/* Next Steps */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <CheckCheck size={16} className="text-green-500" /> Próximos Passos
                                </h4>
                                <ul className="space-y-2">
                                    {analysis.suggested_next_steps?.map((step, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                            <span className="text-green-500 font-bold">{i + 1}.</span>
                                            {typeof step === 'object' ? (step as any).message || (step as any).text || JSON.stringify(step) : step}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm">Clique em "Analisar Conversa" para gerar insights estratégicos.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
