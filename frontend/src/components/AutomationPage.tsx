import React from 'react';
import { N8nEmbed } from './N8nEmbed';

const AutomationPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 animate-fade-in">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                🤖 Automação de Marketing
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Crie workflows inteligentes para automatizar suas campanhas
                            </p>
                        </div>

                        <div className="flex items-center space-x-4">
                            <a
                                href="https://arsdatascience-n8n.aiiam.com.br"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Abrir em nova aba
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* N8N Embed */}
            <div className="container mx-auto p-6">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <N8nEmbed height="calc(100vh - 220px)" />
                </div>
            </div>
        </div>
    )
}

export default AutomationPage;
