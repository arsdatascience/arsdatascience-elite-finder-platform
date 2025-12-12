import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, AlertTriangle, TrendingUp, BrainCircuit, Bot, User, Download, Trash2, Paperclip, FileUp, Settings, FileBarChart, FileText, RefreshCw } from 'lucide-react';
import { WhatsAppConfigModal } from './WhatsAppConfigModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

interface LoggerAgentProps {
    agent: {
        id: string;
        name: string;
        description: string;
        slug: string;
        avatar?: string;
    };
    observerSlug?: string; // Slug of the agent acting as the observer ("System Brain")
}

export const PublicAgentWithObserver: React.FC<LoggerAgentProps> = ({ agent, observerSlug = 'system-brain' }) => { // Default to system-brain
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [showWhatsAppConfig, setShowWhatsAppConfig] = useState(false);

    // Load history from LocalStorage
    useEffect(() => {
        const key = `chat_history_${agent.slug}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Convert timestamp strings back to Date objects
                const restored = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
                setMessages(restored);
                return; // Don't overwrite with welcome message if history exists
            } catch (e) {
                console.error('Failed to load chat history', e);
            }
        }

        // Initial Greeting if no history
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `Olá! Sou **${agent.name}**. \n\n${agent.description || 'Como posso ajudar?'}`,
            timestamp: new Date()
        }]);
    }, [agent]);

    // Save history to LocalStorage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(`chat_history_${agent.slug}`, JSON.stringify(messages));
        }
    }, [messages, agent.slug]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSaveChat = () => {
        const textContent = messages.map(m => `[${m.role.toUpperCase()} - ${m.timestamp.toLocaleString()}]: ${m.content}`).join('\n\n');
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${agent.slug}-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClearChat = () => {
        if (confirm('Tem certeza que deseja limpar o histórico desta conversa?')) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: `Olá! Sou **${agent.name}**. \n\n${agent.description || 'Como posso ajudar?'}`,
                timestamp: new Date()
            }]);
            localStorage.removeItem(`chat_history_${agent.slug}`);
            setCurrentAnalysis(null);
        }
    };

    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) await processFile(files[0]);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await processFile(e.target.files[0]);
        }
    };

    const processFile = async (file: File) => {
        // Simple Text/Code Reader
        if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.json')) {
            const text = await file.text();
            setInput(prev => prev + `\n\n[Arquivo: ${file.name}]\n\`\`\`\n${text}\n\`\`\`\n`);
        } else {
            alert('Apenas arquivos de texto/código são suportados no momento para análise direta.');
        }
    };

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
            // 1. Primary Chat with the visible agent
            const chatPromise = fetch(`${import.meta.env.VITE_API_URL}/api/agents/public/${agent.slug}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })),
                    sessionId: 'public-' + Date.now()
                })
            });

            // 2. Parallel Shadow Analysis with Observer (System Brain / Orchestrator)
            // The prompt is now fetched from the DB for 'system-brain' slug.
            const analysisPromise = fetch(`${import.meta.env.VITE_API_URL}/api/agents/public/${observerSlug}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: `CONTEXT: User is chatting with Agent: "${agent.name}" (${agent.description}).`
                        },
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

    const handleGeneratePDFReport = (type: 'analysis' | 'full') => {
        if (!currentAnalysis && type === 'analysis') {
            alert('Nenhuma análise disponível para gerar relatório.');
            return;
        }

        const doc = new jsPDF();
        const dateStr = new Date().toLocaleString();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(41, 98, 255); // Primary Blue
        doc.text("Elite Finder - Relatório de Inteligência", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${dateStr}`, 14, 28);
        doc.text(`Agente: ${agent.name}`, 14, 33);
        doc.text(`Observer: System Brain`, 14, 38);

        let yPos = 50;

        // Section: Analysis Insights
        if (currentAnalysis) {
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("Análise Estratégica (IA)", 14, yPos);
            yPos += 10;

            doc.setFontSize(11);
            doc.setTextColor(50);

            const insightsData = [
                ['Sentimento', currentAnalysis.sentiment],
                ['Estágio', currentAnalysis.buying_stage],
                ['Estratégia Sugerida', currentAnalysis.suggested_strategy || '-'],
                ['Próxima Ação', currentAnalysis.next_best_action || '-'],
                ['Insight (Whisper)', currentAnalysis.coach_whisper]
            ];

            autoTable(doc, {
                startY: yPos,
                head: [['Métrica', 'Insight']],
                body: insightsData,
                theme: 'grid',
                headStyles: { fillColor: [41, 98, 255] },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
            });

            // @ts-ignore
            yPos = doc.lastAutoTable.finalY + 15;

            // Objections Table
            if (currentAnalysis.detected_objections && currentAnalysis.detected_objections.length > 0) {
                doc.text("Objeções Detectadas", 14, yPos);
                yPos += 5;
                autoTable(doc, {
                    startY: yPos,
                    body: currentAnalysis.detected_objections.map(obj => [obj]),
                    theme: 'striped',
                    headStyles: { fillColor: [220, 53, 69] }, // Red for danger
                });
                // @ts-ignore
                yPos = doc.lastAutoTable.finalY + 15;
            }
        }

        // Section: Chat History (If requested)
        if (type === 'full' && messages.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("Histórico da Conversa", 14, yPos);
            yPos += 10;

            const chatData = messages.map(m => [
                m.timestamp.toLocaleTimeString(),
                m.role === 'assistant' ? agent.name : 'Usuário',
                m.content.substring(0, 500) // Truncate very long messages for PDF safety
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Hora', 'Autor', 'Mensagem']],
                body: chatData,
                theme: 'striped',
                columnStyles: { 2: { cellWidth: 100 } }
            });
        }

        doc.save(`relatorio_${type}_${agent.slug}_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    const handleReanalyze = async () => {
        if (messages.length === 0) return;
        setIsLoading(true);
        try {
            // Re-trigger only the observer analysis
            const analysisPromise = fetch(`${import.meta.env.VITE_API_URL}/api/agents/public/${observerSlug}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: `CONTEXT: User is chatting with Agent: "${agent.name}" (${agent.description}). RE-ANALYSIS REQUESTED. Review conversation context.`
                        },
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: "(System: Please provide updated analysis based on full history)" }
                    ],
                    sessionId: 'reanalysis-' + Date.now()
                })
            });

            const analysisResponse = await analysisPromise;
            if (analysisResponse.ok) {
                const analysisData = await analysisResponse.json();
                try {
                    let analysisJsonStr = analysisData.content;
                    analysisJsonStr = analysisJsonStr.replace(/```json/g, '').replace(/```/g, '');
                    const jsonMatch = analysisJsonStr.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        setCurrentAnalysis(parsed);
                    }
                } catch (e) {
                    console.warn('Failed to parse re-analysis:', e);
                }
            }
        } catch (error) {
            console.error("Reanalysis failed", error);
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
        <div
            className="min-h-screen bg-gray-50 flex flex-col font-sans"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {agent.avatar ? <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-full object-cover" /> : <Bot size={20} />}
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            {agent.name} <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Monitored by System Brain</span>
                        </h1>
                        <p className="text-xs text-gray-500">Intelligent Agent Ecosystem</p>
                    </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowWhatsAppConfig(true)}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Configuração WhatsApp"
                    >
                        <Settings size={20} />
                    </button>
                    <button
                        onClick={handleSaveChat}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Salvar Conversa"
                    >
                        <Download size={20} />
                    </button>
                    <button
                        onClick={handleClearChat}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Limpar Conversa (Reset)"
                    >
                        <Trash2 size={20} />
                    </button>
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

                </div>

                {/* RIGHT: Observer Teleprompter */}
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <BrainCircuit size={16} /> System Brain
                        </h3>
                        <div className="flex gap-1">
                            <button
                                onClick={() => handleGeneratePDFReport('analysis')}
                                disabled={!currentAnalysis}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Gerar Relatório de Análise"
                            >
                                <FileBarChart size={16} />
                            </button>
                            <button
                                onClick={() => handleGeneratePDFReport('full')}
                                disabled={!messages.length}
                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Gerar Relatório Completo"
                            >
                                <FileText size={16} />
                            </button>
                            <button
                                onClick={handleReanalyze}
                                disabled={!messages.length || isLoading}
                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Reanalisar Conversa"
                            >
                                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {currentAnalysis ? (
                            <div className="space-y-6 animate-fade-in">
                                {/* Dashboard Cards */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className={`p-3 rounded-xl border ${getSentimentColor(currentAnalysis.sentiment)}`}>
                                        <p className="text-xs font-semibold opacity-70">User Sentiment</p>
                                        <p className="font-bold">{currentAnalysis.sentiment}</p>
                                    </div>
                                    <div className="p-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-700">
                                        <p className="text-xs font-semibold opacity-70">Stage</p>
                                        <p className="font-bold">{currentAnalysis.buying_stage}</p>
                                    </div>
                                </div>

                                {/* Objections / Risks */}
                                {currentAnalysis.detected_objections && currentAnalysis.detected_objections.length > 0 && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                                        <p className="text-xs font-bold text-red-500 mb-2 flex items-center gap-1">
                                            <AlertTriangle size={12} /> RISK / OBJECTIONS
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
                                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Sparkles size={12} /> SYSTEM INSIGHT</p>
                                        <p className="text-md font-medium leading-relaxed text-primary-50">"{currentAnalysis.coach_whisper}"</p>
                                    </div>
                                    <div className="h-px bg-slate-700 my-4"></div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><TrendingUp size={12} /> NEXT BEST ACTION</p>
                                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                                            <p className="text-sm text-slate-200">{currentAnalysis.next_best_action}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : isLoading ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400 space-y-4">
                                <Sparkles size={32} className="opacity-20 animate-pulse text-purple-500" />
                                <p className="text-sm">Observing interaction...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400 space-y-4">
                                <BrainCircuit size={32} className="opacity-20" />
                                <p className="text-sm">System Brain is active.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Drag Overlay */}
                {isDragging && (
                    <div className="absolute inset-0 bg-primary-500/10 backdrop-blur-sm z-50 flex items-center justify-center border-2 border-dashed border-primary-500 m-4 rounded-3xl">
                        <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center animate-bounce">
                            <FileUp size={48} className="text-primary-600 mb-2" />
                            <p className="text-lg font-bold text-primary-900">Solte o arquivo aqui</p>
                        </div>
                    </div>
                )}
            </main>

            {/* Input Area (Bottom) */}
            <div className="p-4 bg-white border-t border-gray-200">
                <div className="max-w-3xl mx-auto flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".txt,.md,.js,.ts,.tsx,.json,.css,.html"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="Anexar Arquivo"
                    >
                        <Paperclip size={20} />
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 bg-gray-100 border-0 rounded-full px-6 py-3 focus:ring-2 focus:ring-primary-500 outline-none text-gray-800"
                        disabled={isLoading}
                    />
                    <button onClick={handleSendMessage} disabled={!input.trim() || isLoading} className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50">
                        <Send size={20} />
                    </button>
                </div>
            </div>
            {/* WhatsApp Integration Modal */}
            <WhatsAppConfigModal
                isOpen={showWhatsAppConfig}
                onClose={() => setShowWhatsAppConfig(false)}
                onConfigUpdate={() => console.log('WhatsApp Config Updated')}
            />
        </div>
    );
};
