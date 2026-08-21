import React, { useState, useRef, useEffect } from 'react';
import { UserSession, ActiveTab } from '../../types';
import { Search, HelpCircle, LogOut, Command, X } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenHelp?: () => void;
  activeTab?: string;
  user?: UserSession | null;
  onSignOut?: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Psychologist overview' },
  teacher_dashboard: { title: 'Teacher Dashboard', subtitle: 'Your class at a glance' },
  students: { title: 'Students', subtitle: 'Student directory & profiles' },
  student_profile: { title: 'Student Profile', subtitle: 'Individual assessment record' },
  observations: { title: 'Observations', subtitle: 'Behavioral concerns log' },
  observation_detail: { title: 'Observation Detail', subtitle: 'Concern review & follow-up' },
  teacher_add_concern: { title: 'Log Observation', subtitle: 'Record a new behavioral concern' },
  assessments: { title: 'Assessments', subtitle: 'Protocol library & active sessions' },
  assessment_setup: { title: 'Assessment Setup', subtitle: 'Configure assessment parameters' },
  assessment_runner: { title: 'Assessment in Progress', subtitle: 'Active student assessment' },
  assessment_result: { title: 'Assessment Results', subtitle: 'Scored results & domain breakdown' },
  psychologist_interpretation: { title: 'Clinical Interpretation', subtitle: 'Psychologist review & notes' },
  reports: { title: 'Reports', subtitle: 'Analytics & wellness reports' },
  student_report_preview: { title: 'Student Report', subtitle: 'Confidential wellness summary' },
  settings: { title: 'Settings', subtitle: 'Preferences & configuration' },
  parent_feedback: { title: 'Parent Feedback', subtitle: 'Parent portal & communication' },
  super_admin_dashboard: { title: 'Platform Overview', subtitle: 'SaaS control plane' },
  super_admin_schools: { title: 'Tenant Schools', subtitle: 'School account management' },
  super_admin_audit: { title: 'Audit Logs', subtitle: 'Platform activity history' },
};

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenHelp,
  activeTab,
  user,
  onSignOut,
  onNavigateTab,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pageInfo = activeTab ? PAGE_TITLES[activeTab] : null;

  // Cmd+K / Ctrl+K shortcut to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setSearchQuery('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setSearchQuery]);

  return (
    <header
      className="h-14 px-6 sm:px-7 flex items-center justify-between sticky top-0 z-30 shrink-0 gap-4"
      style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        borderBottom: '1px solid rgba(15,23,42,0.07)',
        boxShadow: '0 1px 0 rgba(15,23,42,0.05)',
      }}
    >
      {/* Left: page breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {pageInfo && (
          <div className="min-w-0 hidden sm:block animate-fade-in">
            <p className="text-[13px] font-bold text-slate-900 leading-tight truncate">{pageInfo.title}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate leading-tight mt-0.5">{pageInfo.subtitle}</p>
          </div>
        )}
      </div>

      {/* Center: Command Bar Search */}
      <div className="flex-1 flex justify-center max-w-md mx-auto">
        <div className={`relative w-full transition-all duration-200 ${isFocused ? 'scale-[1.01]' : ''}`}>
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ width: '14px', height: '14px', color: isFocused ? '#3b5bdb' : '#94a3b8', transition: 'color 200ms' }}
          />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              user?.role === 'super_admin'
                ? 'Search schools, tenants, audit logs…'
                : 'Search students, observations, assessments…'
            }
            className="w-full pl-9 pr-10 py-2"
            style={{
              background: isFocused ? '#fff' : 'rgba(241,245,249,0.8)',
              border: isFocused ? '1.5px solid rgba(59,91,219,0.6)' : '1px solid rgba(226,232,240,0.8)',
              borderRadius: '10px',
              fontSize: '12.5px',
              fontWeight: 500,
              color: '#0f172a',
              outline: 'none',
              boxShadow: isFocused ? '0 0 0 3px rgba(59,91,219,0.1)' : 'none',
              transition: 'all 200ms',
            }}
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          ) : (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5">
              <kbd
                className="text-[9px] font-bold px-1 py-0.5 rounded"
                style={{ background: 'rgba(226,232,240,0.6)', color: '#94a3b8', border: '1px solid rgba(203,213,225,0.5)', lineHeight: 1 }}
              >
                {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}
              </kbd>
              <kbd
                className="text-[9px] font-bold px-1 py-0.5 rounded"
                style={{ background: 'rgba(226,232,240,0.6)', color: '#94a3b8', border: '1px solid rgba(203,213,225,0.5)', lineHeight: 1 }}
              >
                K
              </kbd>
            </div>
          )}
        </div>
      </div>

      {/* Right: utilities */}
      <div className="flex items-center gap-1.5">
        <NotificationDropdown onNavigateTab={(tab) => onNavigateTab?.(tab as ActiveTab)} />

        <button
          onClick={onOpenHelp}
          className="p-2 rounded-lg transition-all cursor-pointer"
          style={{ color: '#94a3b8' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#94a3b8'; }}
          title="Help & Guidance"
        >
          <HelpCircle style={{ width: '18px', height: '18px' }} />
        </button>

        <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 2px' }} />

        {/* User avatar + name */}
        <div className="flex items-center gap-2 pl-1">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || 'User'}
              className="rounded-full object-cover shrink-0"
              style={{ width: '30px', height: '30px', border: '2px solid rgba(59,91,219,0.15)' }}
            />
          ) : (
            <div
              className="rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
              style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg,#3b5bdb,#7950f2)' }}
            >
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
            </div>
          )}
          <div className="text-left hidden md:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 font-medium">{user?.roleTitle || 'School Staff'}</p>
          </div>
        </div>

        {onSignOut && (
          <button
            onClick={onSignOut}
            className="p-2 rounded-lg transition-all cursor-pointer ml-0.5"
            style={{ color: '#94a3b8' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#f43f5e'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#94a3b8'; }}
            title="Sign Out"
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
          </button>
        )}
      </div>
    </header>
  );
};
