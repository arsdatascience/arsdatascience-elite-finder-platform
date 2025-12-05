
import React from 'react';
import { NAV_ITEMS } from '@/constants';
import { ViewState } from '@/types';
import { Rocket } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { UserCircle, Shield, X, LogOut, Activity } from 'lucide-react';

interface SidebarProps {
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, isOpen }) => {
  const { user, logout } = useAuth();

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
      <div className="flex items-center justify-between px-4 h-20 border-b border-slate-800">
        <div className="flex items-center gap-2 font-bold text-xl tracking-wider text-blue-400">
          <Rocket className="w-6 h-6" />
          <span>Elite<span className="text-white">Finder</span></span>
        </div>
        <button
          onClick={() => onNavigate(activeView)} // Hack para fechar (já que onNavigate fecha no Layout) ou idealmente passar uma prop onClose
          className="md:hidden text-slate-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scroll">
        <nav className="mt-8 px-4 space-y-2 pb-24">
          {NAV_ITEMS.map((item) => {
            // Ocultar Settings para usuários comuns (apenas admin e super_admin acessam)
            if (item.id === ViewState.SETTINGS && user?.role !== 'super_admin' && user?.role !== 'admin') {
              return null;
            }

            const isActive = activeView === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as ViewState)}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
          {/* Apenas Super Admin acessa o painel Admin */}
          {user?.role === 'super_admin' && (
            <button
              onClick={() => onNavigate(ViewState.ADMIN)}
              className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 text-purple-400 hover:bg-purple-900/20 hover:text-purple-300 mt-4 border border-purple-500/30"
            >
              <Shield className="w-5 h-5 mr-3" />
              Admin Panel
            </button>
          )}


          {/* BullMQ Dashboard - Admin Only */}
          {(user?.role === 'super_admin' || user?.role === 'admin') && (
            <a
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/admin/queues`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 text-orange-400 hover:bg-orange-900/20 hover:text-orange-300 mt-2 border border-orange-500/30"
            >
              <Activity className="w-5 h-5 mr-3" />
              Fila de Processos
            </a>
          )}
        </nav>
      </div>

      <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between z-20">
        <div className="flex items-center gap-3 overflow-hidden">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="User" className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-blue-500 bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
              <UserCircle size={24} />
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuário'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role || 'Membro'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-800"
          title="Sair"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div >
  );
};
