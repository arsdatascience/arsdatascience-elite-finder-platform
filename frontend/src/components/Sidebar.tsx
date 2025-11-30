
import React from 'react';
import { NAV_ITEMS } from '@/constants';
import { ViewState } from '@/types';
import { Rocket } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { UserCircle } from 'lucide-react';

interface SidebarProps {
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, isOpen }) => {
  const { user } = useAuth();

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
      <div className="flex items-center justify-center h-20 border-b border-slate-800">
        <div className="flex items-center gap-2 font-bold text-xl tracking-wider text-blue-400">
          <Rocket className="w-6 h-6" />
          <span>Elite<span className="text-white">Finder</span></span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="mt-8 px-4 space-y-2 pb-24">
          {NAV_ITEMS.map((item) => {
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
        </nav>
      </div>

      <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="User" className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-blue-500 bg-slate-800 flex items-center justify-center text-slate-400">
              <UserCircle size={24} />
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuário'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role || 'Membro'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
