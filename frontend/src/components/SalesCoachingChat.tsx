import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Sparkles, AlertTriangle, TrendingUp, BrainCircuit, MessageSquare, Smartphone, Settings, Users, MessageCircle, Download, UserPlus, X, FileText, FileBarChart, RefreshCw } from 'lucide-react';
import { COMPONENT_VERSIONS } from '../componentVersions';
import socketService from '../services/socket';
import { WhatsAppConfigModal } from './WhatsAppConfigModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Message {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    source?: 'whatsapp' | 'web';
}

interface AnalysisResult {
    sentiment: 'Positive' | 'Neutral' | 'Skeptical' | 'Negative';
    detected_objections: string[];
    buying_stage: 'Curiosity' | 'Consideration' | 'Decision';
    suggested_strategy: string;
    next_best_action: string;
    coach_whisper: string;
}

interface Session {
    id: string;
    name: string;
    phone: string;
    lastUpdate: string;
    status: string;
}

export const SalesCoachingChat: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [activePhone, setActivePhone] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [integrationStatus, setIntegrationStatus] = useState<{ connected: boolean; platform: string; phone?: string }>({ connected: false, platform: '' });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const activeSessionIdRef = useRef(activeSessionId);

    const formatPhoneNumber = (phone: string | null) => {
        if (!phone) return '';
        const clean = phone.replace('@s.whatsapp.net', '').replace('@g.us', '');
        // Format as +55 (XX) XXXXX-XXXX for Brazil numbers
        if (clean.length >= 10 && (clean.startsWith('55') || clean.startsWith('1'))) {
            // Basic formatting attempt
            if (clean.startsWith('55') && clean.length > 4) {
                const ddd = clean.substring(2, 4);
                const rest = clean.substring(4);
                if (rest.length === 9) {
                    return `+55 (${ddd}) ${rest.substring(0, 5)}-${rest.substring(5)}`;
                } else if (rest.length === 8) {
                    return `+55 (${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
                }
            }
        }
        return clean;
    };

    const fetchIntegrationStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/integrations/whatsapp`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'connected') {
                    setIntegrationStatus({
                        connected: true,
                        platform: data.platform === 'evolution_api' ? 'EvolutionAPI' : 'API Oficial',
                        phone: data.phone // Assuming backend returns connected phone if available
                    });
                } else {
                    setIntegrationStatus({ connected: false, platform: '' });
                }
            } else {
                setIntegrationStatus({ connected: false, platform: '' });
            }
        } catch (error) {
            console.error('Error fetching integration status:', error);
            setIntegrationStatus({ connected: false, platform: '' });
        }
    };

    useEffect(() => {
        fetchIntegrationStatus();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Update ref when state changes
    useEffect(() => {
        activeSessionIdRef.current = activeSessionId;
    }, [activeSessionId]);

    // Fetch Sessions on Mount
    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/sessions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
                // Auto-select first session if available
                if (data.length > 0 && !activeSessionId) {
                    selectSession(data[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta conversa?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                // Remove from local state
                setSessions(prev => prev.filter(s => s.id !== sessionId));

                // Clear active session if it was deleted
                if (activeSessionId === sessionId) {
                    setActiveSessionId(null);
                    setActivePhone(null);
                    setMessages([]);
                    setAnalysis(null);
                }
            } else {
                alert('Erro ao excluir conversa.');
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            alert('Erro ao excluir conversa.');
        }
    };

    const selectSession = async (session: Session) => {
        setActiveSessionId(session.id);
        setActivePhone(session.phone);
        setMessages([]); // Clear current messages
        setAnalysis(null); // Clear analysis

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/sessions/${session.id}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const formattedMessages = data.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }));
                setMessages(formattedMessages);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    // Socket.io Integration
    useEffect(() => {
        const socket = socketService.connect();

        const handleNewMessage = (data: any) => {
            console.log('📩 New WhatsApp Message:', data);

            // Update sessions list (move to top or add new)
            setSessions(prev => {
                const existing = prev.find(s => s.id === data.sessionId);
                if (existing) {
                    // Move to top
                    return [
                        { ...existing, lastUpdate: new Date().toISOString() },
                        ...prev.filter(s => s.id !== data.sessionId)
                    ];
                } else {
                    // Add new
                    return [{
                        id: data.sessionId,
                        name: data.name || 'Novo Cliente',
                        phone: data.phone,
                        lastUpdate: new Date().toISOString(),
                        status: 'active'
                    }, ...prev];
                }
            });

            // If this message belongs to the active session, append it
            if (activeSessionIdRef.current === data.sessionId) {
                const newMsg: Message = {
                    id: Date.now().toString(),
                    role: 'user',
                    content: data.content,
                    timestamp: new Date(data.timestamp),
                    source: 'whatsapp'
                };
                setMessages(prev => [...prev, newMsg]);
                setIsAnalyzing(true);
            } else if (!activeSessionIdRef.current) {
                // If no session active, auto-select this one (optional, maybe just notify)
                // For now, let's auto-select if empty
                setActiveSessionId(data.sessionId);
                setActivePhone(data.phone);
                const newMsg: Message = {
                    id: Date.now().toString(),
                    role: 'user',
                    content: data.content,
                    timestamp: new Date(data.timestamp),
                    source: 'whatsapp'
                };
                setMessages([newMsg]);
                setIsAnalyzing(true);
            }
        };

        const handleCoachingUpdate = (data: any) => {
            console.log('🧠 Coaching Update:', data);
            if (activeSessionIdRef.current === data.sessionId) {
                setAnalysis(data.analysis);
                setIsAnalyzing(false);
            }
        };

        // ML Agent Analysis Complete Handler
        const handleMLAnalysisComplete = (data: any) => {
            console.log('🤖 ML Analysis Complete:', data);
            if (activeSessionIdRef.current === data.sessionId) {
                // Add ML response as a message
                const mlMessage: Message = {
                    id: `ml-${Date.now()}`,
                    role: 'agent',
                    content: data.response,
                    timestamp: new Date(),
                    source: 'web'
                };
                setMessages(prev => [...prev, mlMessage]);
                setIsAnalyzing(false);
            }
        };

        // ML Agent Analysis Error Handler
        const handleMLAnalysisError = (data: any) => {
            console.error('❌ ML Analysis Error:', data);
            if (activeSessionIdRef.current === data.sessionId) {
                // Add error message
                const errorMessage: Message = {
                    id: `ml-error-${Date.now()}`,
                    role: 'agent',
                    content: `⚠️ Erro na análise: ${data.error}`,
                    timestamp: new Date(),
                    source: 'web'
                };
                setMessages(prev => [...prev, errorMessage]);
                setIsAnalyzing(false);
            }
        };

        socket.on('whatsapp_message', handleNewMessage);
        socket.on('sales_coaching_update', handleCoachingUpdate);
        socket.on('ml-analysis-complete', handleMLAnalysisComplete);
        socket.on('ml-analysis-error', handleMLAnalysisError);

        return () => {
            socket.off('whatsapp_message', handleNewMessage);
            socket.off('sales_coaching_update', handleCoachingUpdate);
            socket.off('ml-analysis-complete', handleMLAnalysisComplete);
            socket.off('ml-analysis-error', handleMLAnalysisError);
        };
    }, []);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'agent', // Human agent sending message via web
            content: input,
            timestamp: new Date(),
            source: 'web'
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInput('');

        // Send to WhatsApp API if we have an active phone number
        if (activePhone && activeSessionId) {
            try {
                const token = localStorage.getItem('token');
                await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        to: activePhone,
                        content: newUserMsg.content,
                        sessionId: activeSessionId
                    })
                });
            } catch (error) {
                console.error("Error sending WhatsApp message:", error);
                // Optionally show an error toast here
            }
        } else {
            console.warn("No active phone number to send WhatsApp message to.");
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

    const [showSaveClientModal, setShowSaveClientModal] = useState(false);
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');

    // Pre-fill modal when opening
    useEffect(() => {
        if (showSaveClientModal && activeSessionId) {
            const session = sessions.find(s => s.id === activeSessionId);
            if (session) {
                setClientName(session.name !== 'Novo Cliente' ? session.name : '');
                setClientPhone(session.phone);
            }
        }
    }, [showSaveClientModal, activeSessionId, sessions]);

    const handleExportChat = () => {
        if (!messages.length) return;

        const text = messages.map(m =>
            `[${new Date(m.timestamp).toLocaleString()}] ${m.role === 'agent' ? 'Agente' : 'Cliente'}: ${m.content}`
        ).join('\n');

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_history_${activePhone || 'unknown'}_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleGeneratePDFReport = (type: 'analysis' | 'full') => {
        if (!analysis && type === 'analysis') {
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
        doc.text(`Cliente: ${clientName || formatPhoneNumber(activePhone) || 'Desconhecido'}`, 14, 33);

        let yPos = 45;

        // Section: Analysis Insights
        if (analysis) {
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("Análise Estratégica (IA)", 14, yPos);
            yPos += 10;

            doc.setFontSize(11);
            doc.setTextColor(50);

            const insightsData = [
                ['Sentimento', analysis.sentiment],
                ['Estágio de Compra', analysis.buying_stage],
                ['Estratégia Sugerida', analysis.suggested_strategy],
                ['Próxima Ação', analysis.next_best_action],
                ['Whisper (Dica)', analysis.coach_whisper]
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
            if (analysis.detected_objections && analysis.detected_objections.length > 0) {
                doc.text("Objeções Detectadas", 14, yPos);
                yPos += 5;
                autoTable(doc, {
                    startY: yPos,
                    body: analysis.detected_objections.map(obj => [obj]),
                    theme: 'striped',
                    headStyles: { fillColor: [220, 53, 69] }, // Red for danger/objection
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
                new Date(m.timestamp).toLocaleTimeString(),
                m.role === 'agent' ? 'Agente' : 'Cliente',
                m.content
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Hora', 'Autor', 'Mensagem']],
                body: chatData,
                theme: 'striped',
                columnStyles: { 2: { cellWidth: 100 } }
            });
        }

        doc.save(`relatorio_${type}_${activePhone || 'cliente'}.pdf`);
    };

    const handleReanalyze = async () => {
        if (!activeSessionId) return;

        setIsAnalyzing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/sessions/${activeSessionId}/reanalyze`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                // Toast or notification could go here
                console.log('Reanalysis triggered');
            } else {
                console.error('Failed to trigger reanalysis');
                setIsAnalyzing(false);
                alert('Erro ao iniciar reanálise.');
            }
        } catch (error) {
            console.error('Error triggering reanalysis:', error);
            setIsAnalyzing(false);
            alert('Erro ao iniciar reanálise.');
        }
    };

    const handleSaveClient = async () => {
        if (!clientName || !clientPhone) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: clientName,
                    phone: clientPhone,
                    whatsapp: clientPhone,
                    origin: 'whatsapp_chat'
                })
            });

            if (res.ok) {
                alert('Cliente salvo com sucesso!');
                setShowSaveClientModal(false);
                // Update session name locally
                setSessions(prev => prev.map(s =>
                    s.id === activeSessionId ? { ...s, name: clientName } : s
                ));
            } else {
                alert('Erro ao salvar cliente.');
            }
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Erro ao salvar cliente.');
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-4 animate-fade-in relative">
            {/* LEFT: Sessions List */}
            <div className="w-72 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Users size={18} /> Conversas
                    </h3>
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{sessions.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {sessions.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            Nenhuma conversa ativa.
                        </div>
                    ) : (
                        sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => selectSession(session)}
                                className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${activeSessionId === session.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-gray-800 text-sm truncate flex-1">{session.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(session.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                                            className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500 transition-colors"
                                            title="Excluir conversa"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Smartphone size={10} />
                                    <span>{formatPhoneNumber(session.phone)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MIDDLE: Main Chat Interface */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white relative">
                            <Smartphone size={20} />
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">
                                {activePhone ? `WhatsApp: ${formatPhoneNumber(activePhone)}` : 'Selecione uma conversa'}
                            </h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${integrationStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                {integrationStatus.connected ? `Conectado via ${integrationStatus.platform}` : 'Desconectado'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{COMPONENT_VERSIONS.SalesCoachingChat || 'v1.1'}</span>

                        {activeSessionId && (
                            <>
                                <button
                                    onClick={handleExportChat}
                                    className="p-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
                                    title="Exportar Conversa (TXT)"
                                >
                                    <Download size={20} />
                                </button>
                                <button
                                    onClick={() => setShowSaveClientModal(true)}
                                    className="p-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
                                    title="Salvar como Cliente"
                                >
                                    <UserPlus size={20} />
                                </button>
                            </>
                        )}

                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
                            title="Configurações do WhatsApp"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                    {messages.length === 0 && !activeSessionId ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <MessageCircle size={48} className="mb-4 opacity-20" />
                            <p>Selecione uma conversa ao lado para iniciar.</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm relative ${msg.role === 'agent'
                                    ? 'bg-primary-600 text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                                    }`}>
                                    {msg.source === 'whatsapp' && (
                                        <span className="absolute -top-2 -left-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                                            <Smartphone size={8} /> WA
                                        </span>
                                    )}
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                    <span className={`text-[10px] block mt-2 ${msg.role === 'agent' ? 'text-primary-100' : 'text-gray-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all">
                        <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                            <Mic size={20} />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={activeSessionId ? "Digite sua resposta..." : "Selecione uma conversa..."}
                            disabled={!activeSessionId}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-700 placeholder-gray-400 disabled:opacity-50"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isAnalyzing || !activeSessionId}
                            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT: Teleprompter / AI Coach */}
            <div className="w-80 flex flex-col gap-4 overflow-hidden">
                {/* AI Header with Report Buttons */}
                <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <BrainCircuit size={14} /> AI COACH
                    </h4>
                    <div className="flex gap-1">
                        <button
                            onClick={() => handleGeneratePDFReport('analysis')}
                            disabled={!analysis}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Gerar Relatório de Análise"
                        >
                            <FileBarChart size={16} />
                        </button>
                        <button
                            onClick={() => handleGeneratePDFReport('full')}
                            disabled={!messages.length}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Gerar Relatório Completo (Chat + Análise)"
                        >
                            <FileText size={16} />
                        </button>
                        <button
                            onClick={handleReanalyze}
                            disabled={!messages.length || isAnalyzing}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Reanalisar Conversa (Completa)"
                        >
                            <RefreshCw size={16} className={isAnalyzing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Status Card (Scrollable Area Start) */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <BrainCircuit size={16} /> Análise em Tempo Real
                        </h4>

                        {isAnalyzing ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-3">
                                <Sparkles className="animate-spin text-primary-500" size={32} />
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
                    <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl shadow-lg border border-slate-700 p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500"></div>

                        <h4 className="text-sm font-bold text-primary-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Sparkles size={16} /> Elite Sales Coach
                        </h4>

                        {analysis ? (
                            <div className="space-y-6 animate-fade-in">
                                {/* The Whisper (Main Tip) */}
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">DICA ESTRATÉGICA (WHISPER)</p>
                                    <p className="text-lg font-medium leading-relaxed text-primary-50">
                                        "{analysis.coach_whisper}"
                                    </p>
                                </div>

                                <div className="h-px bg-slate-700"></div>

                                {/* Suggested Action */}
                                <div>
                                    <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                                        <TrendingUp size={12} /> PRÓXIMA AÇÃO RECOMENDADA
                                    </p>
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-600 hover:border-primary-500/50 transition-colors cursor-pointer group">
                                        <p className="text-sm text-slate-200 group-hover:text-white transition-colors">
                                            {analysis.next_best_action}
                                        </p>
                                    </div>
                                </div>

                                {/* Strategy Tag */}
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-primary-300 text-xs font-medium border border-blue-500/30">
                                    <BrainCircuit size={12} />
                                    Estratégia: {analysis.suggested_strategy}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-8">
                                <MessageSquare size={48} className="mb-4 opacity-20" />
                                <p className="text-sm">O Teleprompter será ativado assim que o cliente interagir.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <WhatsAppConfigModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onConfigUpdate={fetchIntegrationStatus}
            />

            {/* Save Client Modal */}
            {showSaveClientModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <UserPlus size={24} className="text-primary-600" /> Salvar Cliente
                            </h3>
                            <button onClick={() => setShowSaveClientModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                                <input
                                    type="text"
                                    value={clientPhone}
                                    onChange={(e) => setClientPhone(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowSaveClientModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveClient}
                                disabled={!clientName.trim()}
                                className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <UserPlus size={18} /> Salvar Cliente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
