import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { PublicAgentWithObserver } from './PublicAgentWithObserver';

interface AgentPublic {
    id: string;
    name: string;
    description: string;
    avatar?: string;
    slug: string;
}

export const PublicAgentChat: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [agent, setAgent] = useState<AgentPublic | null>(null);
    const [error, setError] = useState('');

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

    // Use the Dual-Agent Observer View for ALL agents as requested
    // "Connect System Brain to any agent"
    return <PublicAgentWithObserver agent={agent} observerSlug="system-brain" />;
};
