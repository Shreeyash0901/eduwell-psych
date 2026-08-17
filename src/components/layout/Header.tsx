import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenHelp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenHelp,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
      {/* Search Input */}
      <div className="relative w-96">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search observations, students, assessments..."
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
      </div>

      {/* Top Right Utilities */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => alert("No unread alerts. All priority reviews are up to date.")}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
        </button>

        <button
          onClick={onOpenHelp}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Help & Guidance"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-slate-200 my-auto"></div>

        {/* User Profile */}
        <div className="flex items-center gap-3 cursor-pointer">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120"
            alt="Dr. Sarah Jenkins"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
          />
          <div className="text-left hidden md:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">Dr. Sarah Jenkins</p>
            <p className="text-[11px] text-slate-500 font-medium">Lead Psychologist</p>
          </div>
        </div>
      </div>
    </header>
  );
};
