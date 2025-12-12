import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCw, AlertTriangle, MonitorPlay, MessageSquare } from 'lucide-react';
import { PublicAgentWithObserver } from './PublicAgentWithObserver';
import { PublicSalesCoach } from './PublicSalesCoach';

interface AgentPublic {
    id: string;
    name: string;
    description: string;
    avatar?: string;
    slug: string;
}

type AgentMode = 'assistant' | 'training';

export const PublicAgentChat: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [agent, setAgent] = useState<AgentPublic | null>(null);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<AgentMode>('assistant');

    useEffect(() => {
        fetchAgent();
    }, [slug]);

    const fetchAgent = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/agents/public/${slug}`);
            if (!res.ok) throw new Error('Agente não encontrado');
            const data = await res.json();
            setAgent(data);
        } catch (err) {
            setError('Agente indisponível ou não encontrado.');
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md w-full">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Ops!</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!agent) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><RefreshCw className="animate-spin text-primary-600" /></div>;
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Mode Switcher Floating Toggle (Top Center) */}
            <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] bg-white shadow-xl rounded-full px-1.5 py-1.5 flex items-center border border-gray-200 ring-2 ring-gray-100">
                <button
                    onClick={() => setMode('assistant')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'assistant'
                            ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md transform scale-105'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                >
                    <MessageSquare size={16} />
                    Modo Assistente
                </button>
                <button
                    onClick={() => setMode('training')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'training'
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md transform scale-105'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                >
                    <MonitorPlay size={16} />
                    Sales Coach
                </button>
            </div>

            {/* Render Selected Mode */}
            <div className="flex-1 relative">
                {mode === 'assistant' ? (
                    // Assistant Mode: User talks to Agent, System Brain observes
                    <PublicAgentWithObserver agent={agent} observerSlug="system-brain" />
                ) : (
                    // Training Mode: User talks to "Customer" (Agent), Sales Coach observes
                    // Note: PublicSalesCoach internally uses 'agent-sales-coach' as the observer
                    <PublicSalesCoach agent={agent} />
                )}
            </div>
        </div>
    );
};
