import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenHelp?: () => void;
  activeTab?: string;
  onSwitchRole?: (tab: 'dashboard' | 'teacher_dashboard') => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenHelp,
  activeTab,
  onSwitchRole,
}) => {
  const isTeacher = activeTab === 'teacher_dashboard' || activeTab === 'teacher_add_concern';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-10 shrink-0 gap-4">
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
          <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => onSwitchRole('dashboard')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                !isTeacher
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Psychologist View
            </button>
            <button
              onClick={() => onSwitchRole('teacher_dashboard')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                isTeacher
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Teacher View
            </button>
          </div>
        )}

        <button
          onClick={() => alert("No unread alerts. All priority reviews are up to date.")}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
        </button>

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
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120"
            alt={isTeacher ? "Sarah Jenkins (Teacher)" : "Dr. Sarah Jenkins"}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
          />
          <div className="text-left hidden md:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {isTeacher ? "Sarah Jenkins" : "Dr. Sarah Jenkins"}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {isTeacher ? "Primary Educator" : "Lead Psychologist"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
