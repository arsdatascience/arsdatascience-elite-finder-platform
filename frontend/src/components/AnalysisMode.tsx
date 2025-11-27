import React, { useState, useRef, useEffect } from 'react';
import { Upload, RefreshCw, Trash2, BrainCircuit, Sparkles, Loader2, CheckCircle, AlertTriangle, ThumbsUp, Bot } from 'lucide-react';
import { MOCK_CHAT } from '../constants';
import { ChatMessage, AnalysisResult } from '../types';
import { analyzeChatConversation } from '../services/geminiService';
import { AIProvider, AI_MODELS, OpenAIModel, GeminiModel, ClaudeModel } from '@/constants/aiModels';

export const AnalysisMode: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [provider, setProvider] = useState<AIProvider>(AIProvider.OPENAI);
    const [model, setModel] = useState<string>(OpenAIModel.GPT_5);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Atualiza o modelo padrão quando o provedor muda
    useEffect(() => {
        if (provider === AIProvider.OPENAI) {
            setModel(OpenAIModel.GPT_5);
        } else if (provider === AIProvider.GEMINI) {
            setModel(GeminiModel.GEMINI_2_5_FLASH);
        } else if (provider === AIProvider.ANTHROPIC) {
            setModel(ClaudeModel.SONNET_4_5);
        }
    }, [provider]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;

            try {
                let newMessages: ChatMessage[] = [];

                if (file.name.endsWith('.json')) {
                    const parsed = JSON.parse(content);
                    if (Array.isArray(parsed)) {
                        newMessages = parsed.map((m: any, idx) => ({
                            id: m.id || idx.toString(),
                            sender: m.sender === 'agent' || m.sender === 'Agente' ? 'agent' : 'client',
                            text: m.text || m.content || '',
                            timestamp: m.timestamp || new Date().toLocaleTimeString()
                        }));
                    }
                } else {
                    const lines = content.split('\n').filter(line => line.trim() !== '');
                    newMessages = lines.map((line, idx) => {
                        const lowerLine = line.toLowerCase();
                        const isAgent = lowerLine.startsWith('agente') ||
                            lowerLine.startsWith('agent') ||
                            lowerLine.startsWith('vendedor') ||
                            lowerLine.startsWith('me:') ||
                            lowerLine.startsWith('eu:');

                        const cleanText = line.replace(/^[\w\s]+:\s*/, '').trim();

                        return {
                            id: Date.now().toString() + idx,
                            sender: isAgent ? 'agent' : 'client',
                            text: cleanText || line,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };
                    });
                }

                if (newMessages.length > 0) {
                    setMessages(newMessages);
                    setAnalysis(null);
                } else {
                    alert("Não foi possível ler mensagens válidas neste arquivo.");
                }
            } catch (error) {
                console.error("Error parsing file:", error);
                alert("Erro ao ler o arquivo. Verifique o formato.");
            }
        };

        reader.readAsText(file);
        event.target.value = '';
    };

    const triggerAnalysis = async () => {
        if (messages.length === 0) return;

        setIsAnalyzing(true);
        try {
            const result = await analyzeChatConversation(messages, provider, model);
            setAnalysis(result);
        } catch (e) {
            console.error(e);
            alert("Erro ao analisar a conversa. Verifique sua chave de API.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const resetChat = () => {
        if (window.confirm("Deseja limpar a conversa atual e restaurar o exemplo?")) {
            setMessages(MOCK_CHAT);
            setAnalysis(null);
        }
    };

    const clearChat = () => {
        setMessages([]);
        setAnalysis(null);
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-purple-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                            A
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Análise de Atendimento</h3>
                            <p className="text-xs text-gray-500">{messages.length} mensagens carregadas</p>
                        </div>
                    </div>

                    <div className="flex gap-3 bg-white p-1.5 rounded-lg shadow-sm border border-purple-100">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Provedor</label>
                            <select
                                value={provider}
                                onChange={(e) => setProvider(e.target.value as AIProvider)}
                                className="text-xs font-medium border-none bg-transparent focus:ring-0 text-gray-700 cursor-pointer py-0 pl-1 pr-6"
                            >
                                <option value={AIProvider.OPENAI}>OpenAI</option>
                                <option value={AIProvider.GEMINI}>Google</option>
                                <option value={AIProvider.ANTHROPIC}>Anthropic</option>
                            </select>
                        </div>
                        <div className="w-px bg-gray-200 my-1"></div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Modelo</label>
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="text-xs font-medium border-none bg-transparent focus:ring-0 text-gray-700 cursor-pointer py-0 pl-1 pr-6 w-32"
                            >
                                {AI_MODELS[provider].map((m) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".txt,.json"
                        className="hidden"
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                        title="Carregar conversa (.txt ou .json)"
                    >
                        <Upload size={14} />
                        Importar Chat
                    </button>

                    <button
                        onClick={resetChat}
                        className="p-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                        title="Restaurar Exemplo"
                    >
                        <RefreshCw size={14} />
                    </button>

                    <button
                        onClick={clearChat}
                        className="p-2 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
                        title="Limpar Tudo"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                            <Upload size={48} className="mb-4" />
                            <p>Importe um arquivo .txt ou .json</p>
                            <p className="text-xs mt-2">Formato TXT: "Agente: Olá" (linha por linha)</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
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
                        ))
                    )}
                </div>
            </div>
        </div>

            {/* AI Analysis Sidebar */ }
    <div className="w-full md:w-96 flex flex-col gap-4 md:h-full overflow-hidden shrink-0">

        {/* Action Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-5 rounded-xl shadow-lg relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <BrainCircuit size={120} />
            </div>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 relative z-10">
                <Sparkles size={18} className="text-yellow-400" />
                Copiloto IA
            </h3>
            <p className="text-indigo-200 text-sm mb-4 relative z-10">Analise sentimento, intenção e receba coaching em tempo real.</p>
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
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-y-auto space-y-6">
                {/* Sentiment */}
                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Sentimento Geral</h4>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${analysis.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                        analysis.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                        }`}>
                        {analysis.sentiment === 'positive' ? <CheckCircle size={16} /> :
                            analysis.sentiment === 'negative' ? <AlertTriangle size={16} /> :
                                <ThumbsUp size={16} />}
                        {analysis.sentiment === 'positive' ? 'Positivo' :
                            analysis.sentiment === 'negative' ? 'Negativo' : 'Neutro'}
                    </div>
                </div>

                {/* Intent */}
                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Intenção do Cliente</h4>
                    <p className="text-sm text-gray-800 bg-blue-50 px-3 py-2 rounded-lg font-medium">{analysis.intent}</p>
                </div>

                {/* Summary */}
                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Resumo da Conversa</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{analysis.summary}</p>
                </div>

                {/* Recommended Actions */}
                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Próximas Ações Recomendadas</h4>
                    <ul className="space-y-2">
                        {analysis.suggestions.map((action: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-green-600 font-bold">✓</span>
                                {action}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Warnings */}
                {analysis.warnings && analysis.warnings.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">⚠️ Alertas</h4>
                        <ul className="space-y-2">
                            {analysis.warnings.map((w: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded-lg">
                                    <span className="font-bold">!</span>
                                    {w}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        ) : (
            <div className="flex-1 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center flex-col text-gray-400 p-8 text-center">
                <Bot size={48} className="mb-4 opacity-20" />
                <p>Carregue um arquivo ou clique em "Analisar Conversa" para gerar insights.</p>
            </div>
        )}
    </div>
        </div >
    );
};
