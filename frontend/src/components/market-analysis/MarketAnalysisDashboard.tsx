import React, { useState } from 'react';
import { LayoutDashboard, Database, BrainCircuit, BarChart2 } from 'lucide-react';
import { DataUpload } from './DataUpload';
import { ModelTraining } from './ModelTraining';
import { AnalysisView } from './AnalysisView';

type Tab = 'data' | 'analysis' | 'training';

export const MarketAnalysisDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('analysis');

    return (
        <div className="flex flex-col h-full bg-gray-50 min-h-screen">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BrainCircuit className="text-indigo-600" />
                        Market Analysis & AI
                    </h1>
                    <p className="text-gray-500 text-sm">Advanced predictive analytics and custom model training</p>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 p-8">
                {/* Tabs */}
                <div className="flex items-center gap-4 mb-8 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2
                            ${activeTab === 'analysis' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <BarChart2 className="w-4 h-4" />
                        Predictive Analysis (VPS)
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2
                            ${activeTab === 'data' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Database className="w-4 h-4" />
                        Data Management
                    </button>
                    <button
                        onClick={() => setActiveTab('training')}
                        className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2
                            ${activeTab === 'training' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Model Training
                    </button>
                </div>

                {/* View Content */}
                <div className="animate-in fade-in duration-300">
                    {activeTab === 'data' && <DataUpload />}
                    {activeTab === 'analysis' && <AnalysisView />}
                    {activeTab === 'training' && <ModelTraining />}
                </div>
            </main>
        </div>
    );
};

export default MarketAnalysisDashboard;
