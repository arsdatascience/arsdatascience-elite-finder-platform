import React, { useState } from 'react';
import { MessageSquare, BrainCircuit } from 'lucide-react';
import { ChatMode } from './ChatMode';
import { AnalysisMode } from './AnalysisMode';

export const ChatAI: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis'>('chat');

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-6 animate-fade-in">
      {/* Tabs */}
      <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'chat'
            ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-200'
            : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
        >
          <MessageSquare size={20} />
          Chat Interativo
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'analysis'
            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200'
            : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
        >
          <BrainCircuit size={20} />
          Análise de Conversa
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? <ChatMode /> : <AnalysisMode />}
      </div>
    </div>
  );
};
