import React, { useEffect, useState } from 'react';
import { Activity, Zap, Crown } from 'lucide-react';

interface UsageData {
    plan: string;
    limits: {
        social_posts_per_day: number;
        ai_generations_per_day: number;
    };
    usage: {
        social_posts: number;
        ai_generations: number;
    };
}

export const UsageStats: React.FC = () => {
    const [data, setData] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/usage`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.plan) setData(json);
            } catch (error) {
                console.error('Error fetching usage:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsage();
    }, []);

    const handleUpgrade = async (planName: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stripe/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ planName })
            });
            const json = await res.json();
            if (json.url) {
                window.location.href = json.url;
            } else {
                alert('Erro ao iniciar pagamento: ' + (json.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Erro no upgrade:', error);
            alert('Erro ao conectar com servidor de pagamento.');
        }
    };

    if (loading) return <div className="animate-pulse h-20 bg-gray-100 rounded-lg"></div>;
    if (!data) return null;

    const postPercentage = Math.min(100, (data.usage.social_posts / data.limits.social_posts_per_day) * 100);
    const aiPercentage = Math.min(100, (data.usage.ai_generations / data.limits.ai_generations_per_day) * 100);

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="text-blue-600" size={20} />
                    Consumo do Plano
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${data.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
                    data.plan === 'Pro' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                    }`}>
                    <Crown size={14} />
                    {data.plan}
                </span>
            </div>

            <div className="space-y-6">
                {/* Social Posts */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">Posts Sociais (Hoje)</span>
                        <span className="text-gray-500">{data.usage.social_posts} / {data.limits.social_posts_per_day}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${postPercentage > 90 ? 'bg-red-500' :
                                postPercentage > 70 ? 'bg-yellow-500' : 'bg-blue-500'
                                }`}
                            style={{ width: `${postPercentage}%` }}
                        />
                    </div>
                </div>

                {/* AI Generations */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">Gerações IA (Hoje)</span>
                        <span className="text-gray-500">{data.usage.ai_generations} / {data.limits.ai_generations_per_day}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${aiPercentage > 90 ? 'bg-red-500' :
                                aiPercentage > 70 ? 'bg-yellow-500' : 'bg-purple-500'
                                }`}
                            style={{ width: `${aiPercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {data.plan !== 'Enterprise' && (
                <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-1 gap-3">
                    {data.plan === 'Free' && (
                        <button
                            onClick={() => handleUpgrade('Pro')}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Zap size={16} />
                            Upgrade para Pro (R$ 97/mês)
                        </button>
                    )}
                    <button
                        onClick={() => handleUpgrade('Enterprise')}
                        className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 flex items-center justify-center gap-2 transition-colors"
                    >
                        <Crown size={16} />
                        Upgrade para Enterprise (R$ 297/mês)
                    </button>
                </div>
            )}
        </div>
    );
};
