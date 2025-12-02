import React, { useEffect, useState } from 'react';
import { AlertTriangle, TrendingDown, Phone, Mail } from 'lucide-react';

interface RiskClient {
    client_id: number;
    name: string;
    email: string;
    riskScore: number;
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    factors: string[];
}

export const ChurnRiskWidget: React.FC = () => {
    const [risks, setRisks] = useState<RiskClient[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRisks = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/churn/predict`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setRisks(data.risks || []);
                }
            } catch (error) {
                console.error('Erro ao buscar riscos de churn:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRisks();
    }, []);

    if (loading) return <div className="animate-pulse h-40 bg-gray-100 rounded-xl"></div>;

    if (risks.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex flex-col items-center justify-center text-center h-full">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                    <TrendingDown className="text-green-600" size={24} />
                </div>
                <h3 className="font-bold text-gray-800">Tudo sob controle!</h3>
                <p className="text-sm text-gray-500">Nenhum cliente em risco detectado.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 h-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="text-red-500" size={20} />
                    Radar de Retenção
                </h3>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                    {risks.length} em risco
                </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {risks.map((client) => (
                    <div key={client.client_id} className="p-3 bg-red-50 rounded-lg border border-red-100 group hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">{client.name}</h4>
                                <p className="text-xs text-red-600 font-medium">{client.riskLevel} RISK ({client.riskScore}%)</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 bg-white text-gray-600 rounded hover:text-blue-600 shadow-sm" title="Enviar Email">
                                    <Mail size={14} />
                                </button>
                                <button className="p-1.5 bg-white text-gray-600 rounded hover:text-green-600 shadow-sm" title="Ligar">
                                    <Phone size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            {client.factors.slice(0, 2).map((factor, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
                                    <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                                    {factor}
                                </div>
                            ))}
                            {client.factors.length > 2 && (
                                <p className="text-[10px] text-gray-400 pl-2.5">e mais {client.factors.length - 2} fatores...</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
