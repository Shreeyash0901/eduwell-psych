import React from 'react';
import { UserSession, UserRole, ActiveTab } from '../../types';
import { Search, HelpCircle, LogOut } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenHelp?: () => void;
  activeTab?: string;
  user?: UserSession | null;
  onSwitchRole?: (role: UserRole) => void;
  onSignOut?: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenHelp,
  activeTab,
  user,
  onSwitchRole,
  onSignOut,
  onNavigateTab,
}) => {
  const currentRole = user?.role || 'psychologist';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0 gap-4">
      {/* Search Input */}
      <div className="relative w-72 sm:w-96">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search observations, students, assessments..."
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
      </div>

      {/* Top Right Utilities */}
      <div className="flex items-center gap-3">
        {/* Role Switcher Pill */}
        {onSwitchRole && (
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => onSwitchRole('psychologist')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                currentRole === 'psychologist'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Psychologist
            </button>
            <button
              onClick={() => onSwitchRole('teacher')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                currentRole === 'teacher'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Teacher
            </button>
            <button
              onClick={() => onSwitchRole('parent')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                currentRole === 'parent'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Parent
            </button>
            <button
              onClick={() => onSwitchRole('admin')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
          </div>
        )}

        {/* Notifications Dropdown */}
        <NotificationDropdown onNavigateTab={(tab) => onNavigateTab && onNavigateTab(tab as ActiveTab)} />

        <button
          onClick={onOpenHelp}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Help & Guidance"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-slate-200 my-auto"></div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <img
            src={
              user?.avatarUrl ||
              'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120'
            }
            alt={user?.name || 'Dr. Sarah Jenkins'}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
          />
          <div className="text-left hidden md:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.name || 'Dr. Sarah Jenkins'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {user?.roleTitle || 'Lead Psychologist'}
            </p>
          </div>
        </div>

        {onSignOut && (
          <button
            onClick={onSignOut}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
