import React, { useState } from 'react';
import { BarChart2, TrendingUp, Users, AlertTriangle, Play } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const PRESETS = {
    'sales-forecast': {
        title: 'Sales Forecast',
        icon: TrendingUp,
        defaultPayload: JSON.stringify({
            "historical_data": [100, 120, 110, 140, 160],
            "periods": 3
        }, null, 2)
    },
    'churn-prediction': {
        title: 'Churn Prediction',
        icon: Users,
        defaultPayload: JSON.stringify({
            "customer_age": 365,
            "total_spend": 500.00,
            "last_interaction_days": 10
        }, null, 2)
    },
    'anomaly-detection': {
        title: 'Anomaly Detection',
        icon: AlertTriangle,
        defaultPayload: JSON.stringify({
            "transactions": [
                { "amount": 50, "location": "USA" },
                { "amount": 5000, "location": "Unknown" }
            ]
        }, null, 2)
    }
};

export const AnalysisView: React.FC = () => {
    const [selectedType, setSelectedType] = useState<string>('sales-forecast');
    const [payload, setPayload] = useState(PRESETS['sales-forecast'].defaultPayload);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTypeChange = (key: string) => {
        setSelectedType(key);
        setPayload(PRESETS[key as keyof typeof PRESETS].defaultPayload);
        setResult(null);
        setError(null);
    };

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = JSON.parse(payload);
            const res = await apiClient.marketAnalysis.predict(selectedType, data);
            setResult(res);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            <div className="lg:col-span-1 space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-indigo-600" />
                    Predictive Models
                </h2>
                <div className="flex flex-col gap-2">
                    {Object.entries(PRESETS).map(([key, config]) => {
                        const Icon = config.icon;
                        const isSelected = selectedType === key;
                        return (
                            <button
                                key={key}
                                onClick={() => handleTypeChange(key)}
                                className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left
                                    ${isSelected
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                                        : 'border-gray-100 bg-white hover:border-indigo-200'}`}
                            >
                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className="font-medium">{config.title}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Input Parameters (JSON)</h3>
                    <textarea
                        className="w-full h-48 font-mono text-sm p-4 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={payload}
                        onChange={(e) => setPayload(e.target.value)}
                    />
                    <div className="mt-4 flex justify-between items-center">
                        <p className="text-sm text-gray-500">Edit JSON parameters matching your ML Service API.</p>
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors
                                ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            <Play className="w-4 h-4" />
                            {loading ? 'Analyzing...' : 'Run Analysis'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {result && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 text-green-700">Analysis Results</h3>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 font-mono text-sm">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};
