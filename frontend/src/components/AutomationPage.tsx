import React from 'react';
import { Workflow, ExternalLink, Server, Activity, Zap, ShieldCheck } from 'lucide-react';

const AutomationPage: React.FC = () => {
    // URLs de configuração
    const N8N_EDITOR_URL = "https://arsdatascience-n8n.aiiam.com.br";
    const WEBHOOK_BASE_URL = "https://webhookn8n.aiiam.com.br";

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 animate-fade-in">
            {/* Header da Automação */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <Workflow className="text-orange-600 w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            Automação Avançada
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1">
                                <Activity size={12} /> Online
                            </span>
                        </h1>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            Powered by n8n <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                                <Server size={10} /> Webhook Node: {WEBHOOK_BASE_URL}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-6 mr-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5" title="Conexão Segura via Traefik">
                            <ShieldCheck size={16} className="text-green-500" />
                            <span className="font-medium">SSL Ativo</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Alta Performance">
                            <Zap size={16} className="text-yellow-500" />
                            <span className="font-medium">Turbo Mode</span>
                        </div>
                    </div>
                    <a
                        href={N8N_EDITOR_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                    >
                        <ExternalLink size={18} />
                        Abrir em Nova Aba
                    </a>
                </div>
            </div>

            {/* Área Principal (Iframe) */}
            <div className="flex-1 relative bg-gray-100 overflow-hidden">
                <iframe
                    src={N8N_EDITOR_URL}
                    className="w-full h-full border-none"
                    title="n8n Workflow Editor"
                    allow="clipboard-read; clipboard-write; microphone; camera; geolocation"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads"
                />
            </div>
        </div>
    );
};

export default AutomationPage;
