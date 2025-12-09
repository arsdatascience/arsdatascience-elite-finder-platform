
import React, { useState } from 'react';
import { NAV_GROUPS, NavGroup } from '@/constants';
import { ViewState } from '@/types';
import { Rocket, ChevronDown, ChevronRight } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { UserCircle, Shield, X, LogOut, Activity } from 'lucide-react';

interface SidebarProps {
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
  isOpen: boolean;
}

// Collapsible Group Component
const NavGroupComponent: React.FC<{
  group: NavGroup;
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
  isOpen: boolean;
  onToggle: () => void;
  userRole?: string;
}> = ({ group, activeView, onNavigate, isOpen, onToggle, userRole }) => {
  const GroupIcon = group.icon;

  // Check if any item in group is active
  const hasActiveItem = group.items.some(item => activeView === item.id);

  // Filter items based on role (Settings only for admin)
  const visibleItems = group.items.filter(item => {
    if (item.id === 'SETTINGS' && userRole !== 'super_admin' && userRole !== 'admin') {
      return false;
    }
    return true;
  });

  if (visibleItems.length === 0) return null;

  // For single-item groups (like Home), don't show collapsible header
  if (group.id === 'home') {
    const item = visibleItems[0];
    const Icon = item.icon;
    const isActive = activeView === item.id;

    return (
      <button
        onClick={() => onNavigate(item.id as ViewState)}
        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 mb-4 ${isActive
            ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
      >
        <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-slate-500'}`} />
        {item.label}
      </button>
    );
  }

  return (
    <div className="mb-2">
      {/* Group Header */}
      <button
        onClick={onToggle}
        className={`flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all duration-200 ${hasActiveItem
            ? 'text-primary-400 bg-primary-900/20'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
      >
        <div className="flex items-center gap-2">
          <GroupIcon className="w-4 h-4" />
          <span>{group.name}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 transition-transform duration-200" />
        ) : (
          <ChevronRight className="w-4 h-4 transition-transform duration-200" />
        )}
      </button>

      {/* Group Items with Animation */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="mt-1 ml-2 space-y-1 border-l border-slate-700/50 pl-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as ViewState)}
                className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-900/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, isOpen }) => {
  const { user, logout } = useAuth();

  // Initialize open state for groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NAV_GROUPS.forEach(group => {
      // Open group if it has active item or is default open
      const hasActiveItem = group.items.some(item => activeView === item.id);
      initial[group.id] = hasActiveItem || group.defaultOpen || false;
    });
    return initial;
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
      <div className="flex items-center justify-between px-4 h-20 border-b border-slate-800">
        <div className="flex items-center gap-2 font-bold text-xl tracking-wider text-primary-400">
          <Rocket className="w-6 h-6" />
          <span>Elite<span className="text-white">Finder</span></span>
        </div>
        <button
          onClick={() => onNavigate(activeView)}
          className="md:hidden text-slate-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scroll">
        <nav className="mt-4 px-3 space-y-1 pb-24">
          {NAV_GROUPS.map((group) => (
            <NavGroupComponent
              key={group.id}
              group={group}
              activeView={activeView}
              onNavigate={onNavigate}
              isOpen={openGroups[group.id] || false}
              onToggle={() => toggleGroup(group.id)}
              userRole={user?.role}
            />
          ))}

          {/* Admin Panel - Super Admin Only */}
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
            <img src={user.avatar_url} alt="User" className="w-10 h-10 rounded-full border-2 border-primary-500 object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-primary-500 bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
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
    </div>
  );
};
