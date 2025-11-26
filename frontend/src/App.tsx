import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { Campaigns } from '@/components/Campaigns';
import { FlightControl } from '@/components/FlightControl';
import { ClientRegistration } from '@/components/ClientRegistration';
import { ChatAI } from '@/components/ChatAI';
import { SocialMedia } from '@/components/SocialMedia';
import { Automation } from '@/components/Automation';
import { Training } from '@/components/Training';
import { ContentGenerator } from '@/components/ContentGenerator';
import { Reports } from '@/components/Reports';
import { Settings } from '@/components/Settings';
import { AIChatBot } from '@/components/AIChatBot';
import Home from '@/components/Home';
import { SocialCalendar } from '@/components/SocialCalendar';
import { SocialIntegrations } from '@/components/SocialIntegrations';
import { ViewState } from '@/types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>(ViewState.HOME);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeView) {
      case ViewState.HOME:
        return <Home onSelect={(id) => setActiveView(id as ViewState)} />;
      case ViewState.DASHBOARD:
        return <Dashboard />;
      case ViewState.CAMPAIGNS:
        return <Campaigns />;
      case ViewState.FLIGHT_CONTROL:
        return <FlightControl />;
      case ViewState.CLIENTS:
        return <ClientRegistration />;
      case ViewState.CHAT_AI:
        return <ChatAI />;
      case ViewState.SOCIAL:
        return <SocialMedia onNavigate={setActiveView} />;
      case ViewState.SOCIAL_CALENDAR:
        return <div className="h-full min-h-screen"><SocialCalendar /></div>;
      case ViewState.SOCIAL_INTEGRATIONS:
        return <SocialIntegrations />;
      case ViewState.AUTOMATION:
        return <Automation />;
      case ViewState.TRAINING:
        return <Training />;
      case ViewState.REPORTS:
        return <Reports />;
      case ViewState.AI_AGENT:
        return <ContentGenerator isOpen={true} onClose={() => { }} mode="page" />;
      case ViewState.ELITE_ASSISTANT:
        return <AIChatBot mode="page" />;
      case ViewState.SETTINGS:
        return <Settings />;
      default:
        return <Home onSelect={(id) => setActiveView(id as ViewState)} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans relative">
      <Sidebar
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
      />

      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setSidebarOpen(false)}></div>}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:hidden print:hidden">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
              <Menu size={24} />
            </button>
            <span className="font-bold text-gray-800">EliteFinder</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible">
          <div className="max-w-7xl mx-auto h-full print:max-w-none print:h-auto">
            {renderContent()}
          </div>
        </div>

        {activeView !== ViewState.ELITE_ASSISTANT && <AIChatBot mode="widget" />}
      </main>
    </div>
  );
};

export default App;
