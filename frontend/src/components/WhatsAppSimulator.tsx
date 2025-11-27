import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, MoreVertical, Search, Phone, Video, Smile, Mic, Check, CheckCheck, BarChart3, TrendingUp, Target, MessageCircle, FileText, X } from 'lucide-react';

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
    status: 'sent' | 'delivered' | 'read';
    type?: 'text' | 'image' | 'audio' | 'file';
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

    // Novos estados para interatividade
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const commonEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '🔥', '🎉', '❤️', '✅', '🚀', '💼', '💰', '👋'];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;
                                    </div >
                                </div >
                            </div >
                        ))}
<div ref={messagesEndRef} />
                    </div >
                </div >

    {/* Input Area */ }
{/* Input Area */ }
<div className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-4 relative">
    {/* Emoji Picker */}
    {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 bg-white p-3 rounded-lg shadow-xl border border-gray-200 grid grid-cols-7 gap-2 z-10 animate-fade-in w-80">
            {commonEmojis.map(emoji => (
                <button key={emoji} onClick={() => {
                    setInput(prev => prev + emoji);
                    setShowEmojiPicker(false);
                }} className="text-2xl hover:bg-gray-100 p-2 rounded transition-colors">
                    {emoji}
                </button>
            ))}
            <button onClick={() => setShowEmojiPicker(false)} className="col-span-7 text-xs text-red-500 hover:bg-red-50 p-1 rounded mt-2">Fechar</button>
        </div>
    )}

    <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
    />

    <Smile
        className={`cursor-pointer transition-colors ${showEmojiPicker ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
    />
    <Paperclip
        className="text-gray-500 cursor-pointer hover:text-gray-700"
        onClick={() => fileInputRef.current?.click()}
    />

    <div className="flex-1 bg-white rounded-lg px-4 py-2">
        {isRecording ? (
            <div className="flex items-center gap-3 text-red-500 animate-pulse py-0.5">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">Gravando áudio... 0:05</span>
            </div>
        ) : (
            <input
                type="text"
                placeholder="Digite uma mensagem"
                className="w-full outline-none text-sm bg-transparent"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
        )}
    </div>

    {input || isRecording ? (
        <div
            className={`p-2 rounded-full cursor-pointer transition-all ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'text-gray-500 hover:text-green-600'}`}
            onClick={isRecording ? handleMicClick : handleSendMessage}
        >
            {isRecording ? <Check size={20} /> : <Send size={20} />}
        </div>
    ) : (
        <Mic
            className="text-gray-500 cursor-pointer hover:text-gray-700"
            onClick={handleMicClick}
        />
    )}
</div>
            </div >

    {/* Analysis Sidebar */ }
    < div className = {`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 overflow-y-auto z-20 ${showAnalysis ? 'translate-x-0' : 'translate-x-full'}`}>
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
            </div >
        </div >
    );
};
