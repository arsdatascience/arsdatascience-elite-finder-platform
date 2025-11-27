import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, MoreVertical, Search, Smile, Mic, Check, CheckCheck, BarChart3, TrendingUp, Target, MessageCircle, FileText, X, Play, Image as ImageIcon } from 'lucide-react';

interface Message {
    setShowAnalysis(true);
        try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/analyze-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
    });
    const data = await response.json();
    setAnalysis(data);
} catch (error) {
    console.error('Erro na análise:', error);
    // Mock de fallback para demonstração se falhar
    setAnalysis({
        sentiment_analysis: { score: 8, explanation: "Cliente interessado e engajado." },
        sales_opportunity: { probability: "Alta", justification: "Cliente qualificou o tamanho da empresa." },
        missed_opportunities: ["Poderia ter oferecido trial gratuito."],
        marketing_angles: ["Foco em escalabilidade", "Suporte dedicado"],
        remarketing_strategy: "Enviar case de sucesso de startup similar.",
        suggested_next_steps: ["Agendar demo", "Enviar proposta comercial"]
    });
} finally {
    setAnalyzing(false);
}
    };

return (
    <div className="flex h-[600px] bg-gray-100 rounded-xl overflow-hidden shadow-2xl border border-gray-200 relative">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative z-10">
            {/* Header */}
            <div className="bg-[#00a884] p-4 flex items-center justify-between text-white shadow-md z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#00a884] font-bold">
                        EA
                    </div>
                    <div>
                        <h3 className="font-bold">Elite Assistant</h3>
                        <p className="text-xs opacity-90">Online agora</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleAnalyzeConversation}
                        className="flex items-center gap-2 bg-white text-[#00a884] px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        <BarChart3 size={16} /> Analisar Conversa
                    </button>
                    <div className="flex gap-4 opacity-80">
                        <Search size={20} className="cursor-pointer" />
                        <MoreVertical size={20} className="cursor-pointer" />
                    </div>
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#efeae2] bg-opacity-50 relative" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
                <div className="space-y-4 pb-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 shadow-sm relative ${msg.role === 'user' ? 'bg-[#d9fdd3]' : 'bg-white'}`}>
                                {/* Conteúdo da Mensagem baseado no tipo */}
                                {msg.type === 'image' ? (
                                    <div className="mb-1">
                                        <div className="bg-gray-200 w-48 h-32 rounded flex items-center justify-center text-gray-500 mb-1">
                                            <ImageIcon size={32} />
                                        </div>
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                ) : msg.type === 'audio' ? (
                                    <div className="flex items-center gap-3 min-w-[200px]">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer">
                                            <Play size={16} className="text-gray-600 ml-1" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="h-1 bg-gray-300 rounded-full w-full mb-1"></div>
                                            <span className="text-xs text-gray-500">0:05</span>
                                        </div>
                                        <div className="w-6 h-6 rounded-full overflow-hidden">
                                            {/* Avatar placeholder */}
                                        </div>
                                    </div>
                                ) : msg.type === 'file' ? (
                                    <div className="flex items-center gap-3 bg-black bg-opacity-5 p-2 rounded">
                                        <FileText size={24} className="text-red-500" />
                                        <span className="text-sm underline">{msg.content}</span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-800 leading-relaxed">{msg.content}</p>
                                )}

                                <div className="flex items-center justify-end gap-1 mt-1">
                                    <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                                    {msg.role === 'user' && (
                                        <span className="text-blue-500">
                                            {msg.status === 'read' ? <CheckCheck size={14} /> : <Check size={14} />}
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
            <div className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-4 relative z-20">
                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div className="absolute bottom-16 left-4 bg-white p-3 rounded-lg shadow-xl border border-gray-200 grid grid-cols-7 gap-2 z-30 animate-fade-in w-80">
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
        </div>

        {/* Analysis Sidebar */}
        <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 overflow-y-auto z-40 ${showAnalysis ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Target className="text-purple-600" /> Análise Estratégica
                    </h2>
                    <button onClick={() => setShowAnalysis(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
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
