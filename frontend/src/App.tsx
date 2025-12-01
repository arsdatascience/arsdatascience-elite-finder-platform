import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { Campaigns } from '@/components/Campaigns';
import { FlightControl } from '@/components/FlightControl';
import { ClientRegistration } from '@/components/ClientRegistration';
import { AnalysisMode } from '@/components/AnalysisMode';
import { SocialMedia } from '@/components/SocialMedia';
const AutomationPage = React.lazy(() => import('@/components/AutomationPage'));
import { Training } from '@/components/Training';
import { Reports } from '@/components/Reports';
import { Settings } from '@/components/Settings';
import { AIChatBot } from '@/components/AIChatBot';
import { AgentBuilder } from '@/components/AgentBuilder';
import { TemplateManager } from '@/components/TemplateManager';
import { WhatsAppSimulator } from '@/components/WhatsAppSimulator';
import { AnimatePresence, motion } from 'framer-motion';
import Home from '@/components/Home';
import { SocialCalendar } from '@/components/SocialCalendar';
import { SocialIntegrations } from '@/components/SocialIntegrations';
import { ViewState } from '@/types';
import { Menu, Loader2 } from 'lucide-react';
import { ContentGenerator } from '@/components/ContentGenerator';
import { Login } from '@/components/Login';
import { Register } from '@/components/Register';
import { useAuth } from '@/contexts/AuthContext';

import { ImageGenerationPage } from '@/components/ImageGenerationPage';
import AdminDashboard from '@/components/AdminDashboard';
import { AudioAnalysis } from '@/components/AudioAnalysis';

const PATH_MAP: Record<ViewState, string> = {
  [ViewState.HOME]: '/',
  [ViewState.DASHBOARD]: '/dashboard',
  [ViewState.CAMPAIGNS]: '/campaigns',
  [ViewState.FLIGHT_CONTROL]: '/flight-control',
  [ViewState.CLIENTS]: '/clients',
  [ViewState.CHAT_AI]: '/chat-ai',
  [ViewState.SOCIAL]: '/social',
  [ViewState.SOCIAL_CALENDAR]: '/social-calendar',
  [ViewState.SOCIAL_INTEGRATIONS]: '/social-integrations',
  [ViewState.IMAGE_GENERATION]: '/images/generate',
  [ViewState.AUDIO_ANALYSIS]: '/audio-analysis',
  [ViewState.AUTOMATION]: '/automation',
  [ViewState.TRAINING]: '/training',
  [ViewState.REPORTS]: '/reports',
  [ViewState.AI_AGENT]: '/ai-agent',
  [ViewState.ELITE_ASSISTANT]: '/elite-assistant',
  [ViewState.SETTINGS]: '/settings',
  [ViewState.AGENT_BUILDER]: '/agent-builder',
  [ViewState.ADMIN]: '/admin',
};



const PrivateRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // Aceitar 'super_admin' ou 'Super Admin'
  if (user?.role !== 'super_admin' && user?.role !== 'Super Admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const SettingsRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // Aceitar 'super_admin', 'admin', 'Super Admin', 'Admin'
  const allowedRoles = ['super_admin', 'admin', 'Super Admin', 'Admin'];
  if (!user?.role || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveView = (): ViewState => {
    const path = location.pathname;
    const entry = Object.entries(PATH_MAP).find(([_, p]) => p === path);
    return entry ? (entry[0] as ViewState) : ViewState.HOME;
  };

  const handleNavigate = (view: ViewState) => {
    navigate(PATH_MAP[view]);
    setSidebarOpen(false);
  };

  const pageVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans relative">
      <Sidebar
        activeView={getActiveView()}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
      />

      <div className="flex-1 flex flex-col h-full relative w-full">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between z-20">
          <h1 className="text-lg font-bold text-gray-800">Elite Finder</h1>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600">
            <Menu size={24} />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (view: ViewState | string) => {
    const path = PATH_MAP[view as ViewState];
    if (path) {
      navigate(path);
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home onSelect={handleNavigate} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/flight-control" element={<FlightControl />} />
          <Route path="/clients" element={<ClientRegistration />} />
          <Route path="/chat-ai" element={<AnalysisMode />} />
          <Route path="/social" element={<SocialMedia onNavigate={handleNavigate} />} />
          <Route path="/social-calendar" element={<div className="h-full min-h-screen"><SocialCalendar /></div>} />
          <Route path="/social-integrations" element={<SocialIntegrations />} />
          <Route path="/images/generate" element={<ImageGenerationPage />} />
          <Route path="/audio-analysis" element={<AudioAnalysis />} />
          <Route
            path="/automation"
            element={
              <React.Suspense fallback={<div className="p-10 text-center">Carregando Módulo de Automação...</div>}>
                <AutomationPage />
              </React.Suspense>
            }
          />
          <Route path="/training" element={<Training />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/ai-agent" element={<ContentGenerator isOpen={true} onClose={() => { }} mode="page" />} />
          <Route path="/elite-assistant" element={<AIChatBot mode="page" />} />
          <Route path="/settings" element={<SettingsRoute><Settings /></SettingsRoute>} />
          <Route path="/agent-builder" element={<AgentBuilder />} />
          <Route path="/templates" element={<TemplateManager />} />
          <Route path="/templates" element={<TemplateManager />} />
          <Route path="/whatsapp-simulator" element={<WhatsAppSimulator />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
