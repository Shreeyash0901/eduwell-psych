import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UserSession, ActiveTab, Student } from '../../types';
import {
  Search,
  HelpCircle,
  LogOut,
  X,
  GraduationCap,
  FileText,
  ClipboardList,
  BarChart3,
  Settings as SettingsIcon,
  Users,
  ArrowRight,
  Loader2,
  Building2,
  ShieldCheck,
  HeartHandshake,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenHelp?: () => void;
  activeTab?: string;
  user?: UserSession | null;
  onSignOut?: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  onOpenStudentProfile?: (student: Student) => void;
  onSelectObservation?: (obs: any) => void;
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

const QUICK_PAGES = [
  { id: 'dashboard', label: 'Dashboard Overview', category: 'Navigation', icon: BarChart3 },
  { id: 'students', label: 'Student Directory', category: 'Navigation', icon: GraduationCap },
  { id: 'observations', label: 'Observations Queue', category: 'Navigation', icon: FileText },
  { id: 'assessments', label: 'Assessments & Protocols', category: 'Navigation', icon: ClipboardList },
  { id: 'reports', label: 'Reports & Analytics', category: 'Navigation', icon: BarChart3 },
  { id: 'parent_feedback', label: 'Parent Feedback Portal', category: 'Navigation', icon: HeartHandshake },
  { id: 'teacher_add_concern', label: 'Log New Observation Note', category: 'Action', icon: PlusCircle },
  { id: 'settings', label: 'School Settings & Policy', category: 'Navigation', icon: SettingsIcon },
];

const SUPER_ADMIN_PAGES = [
  { id: 'super_admin_dashboard', label: 'Platform Overview', category: 'Control Plane', icon: Building2 },
  { id: 'super_admin_schools', label: 'Tenant Schools', category: 'Control Plane', icon: Building2 },
  { id: 'super_admin_audit', label: 'System Audit Logs', category: 'Control Plane', icon: ShieldCheck },
  { id: 'settings', label: 'Platform Settings', category: 'Control Plane', icon: SettingsIcon },
];

interface SearchResultStudent {
  id: string | number;
  studentId: string;
  name?: string;
  fullName?: string;
  grade?: string;
  homeroom?: string;
  status?: string;
}

interface SearchResultObservation {
  id: string | number;
  recordNumber?: string;
  studentName: string;
  concernCategory: string;
  date: string;
  status: string;
  classGroup?: string;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenHelp,
  activeTab,
  user,
  onSignOut,
  onNavigateTab,
  onOpenStudentProfile,
  onSelectObservation,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [foundStudents, setFoundStudents] = useState<SearchResultStudent[]>([]);
  const [foundObservations, setFoundObservations] = useState<SearchResultObservation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = user?.role === 'super_admin';
  const pageInfo = activeTab ? PAGE_TITLES[activeTab] : null;

  // Filter navigation links
  const availablePages = isSuperAdmin ? SUPER_ADMIN_PAGES : QUICK_PAGES;
  const filteredPages = searchQuery.trim()
    ? availablePages.filter((p) =>
        p.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availablePages.slice(0, 5);

  // Live async query against API for students and observations
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || isSuperAdmin) {
        setFoundStudents([]);
        setFoundObservations([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [studentsRes, obsRes] = await Promise.all([
          fetch(`/api/students?search=${encodeURIComponent(query)}&limit=5`, {
            credentials: 'include',
          }).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/observations?search=${encodeURIComponent(query)}&limit=5`, {
            credentials: 'include',
          }).then((r) => r.json()).catch(() => ({ success: false })),
        ]);

        if (studentsRes.success) {
          setFoundStudents(studentsRes.students || []);
        } else {
          setFoundStudents([]);
        }

        if (obsRes.success) {
          setFoundObservations(obsRes.observations || []);
        } else {
          setFoundObservations([]);
        }
      } catch (err) {
        console.error('[HeaderSearch] error:', err);
      } finally {
        setLoading(false);
      }
    },
    [isSuperAdmin]
  );

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setFoundStudents([]);
        setFoundObservations([]);
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Cmd+K / Ctrl+K shortcut to focus search and open palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle selecting a student
  const handleSelectStudent = (st: SearchResultStudent) => {
    setIsOpen(false);
    setSearchQuery('');
    if (onOpenStudentProfile) {
      const studentObj: Student = {
        id: String(st.id),
        studentId: st.studentId,
        name: st.name || st.fullName || 'Student',
        fullName: st.fullName || st.name || 'Student',
        grade: st.grade || 'Grade',
        homeroom: st.homeroom || '',
        status: (st.status as any) || 'Active',
      };
      onOpenStudentProfile(studentObj);
    } else {
      window.location.hash = `#student_profile?id=${st.id}`;
      onNavigateTab?.('student_profile');
    }
  };

  // Handle selecting an observation
  const handleSelectObs = (obs: SearchResultObservation) => {
    setIsOpen(false);
    setSearchQuery('');
    if (onSelectObservation) {
      onSelectObservation(obs);
    } else {
      window.location.hash = '#observations';
      onNavigateTab?.('observations');
    }
  };

  // Handle selecting a page
  const handleSelectPage = (pageId: string) => {
    setIsOpen(false);
    setSearchQuery('');
    window.location.hash = `#${pageId}`;
    onNavigateTab?.(pageId as ActiveTab);
  };

  const hasResults =
    foundStudents.length > 0 ||
    foundObservations.length > 0 ||
    filteredPages.length > 0;

  return (
    <header
      className="h-14 px-6 sm:px-7 flex items-center justify-between sticky top-0 z-40 shrink-0 gap-4"
      style={{
        background: 'rgba(255,255,255,0.92)',
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

      {/* Center: Command Bar Search & Palette */}
      <div ref={containerRef} className="flex-1 flex justify-center max-w-lg mx-auto relative">
        <div className={`relative w-full transition-all duration-200 ${isFocused || isOpen ? 'scale-[1.01]' : ''}`}>
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: '14px',
              height: '14px',
              color: isFocused || isOpen ? '#3b5bdb' : '#94a3b8',
              transition: 'color 200ms',
            }}
          />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              setIsFocused(true);
              setIsOpen(true);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={
              isSuperAdmin
                ? 'Search schools, tenants, audit logs…'
                : 'Search students, observations, assessments…'
            }
            className="w-full pl-9 pr-10 py-2"
            style={{
              background: isFocused || isOpen ? '#fff' : 'rgba(241,245,249,0.85)',
              border: isFocused || isOpen ? '1.5px solid rgba(59,91,219,0.6)' : '1px solid rgba(226,232,240,0.8)',
              borderRadius: '10px',
              fontSize: '12.5px',
              fontWeight: 500,
              color: '#0f172a',
              outline: 'none',
              boxShadow: isFocused || isOpen ? '0 0 0 3px rgba(59,91,219,0.1)' : 'none',
              transition: 'all 200ms',
            }}
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setFoundStudents([]);
                setFoundObservations([]);
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          ) : (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 pointer-events-none">
              <kbd
                className="text-[9px] font-bold px-1 py-0.5 rounded"
                style={{
                  background: 'rgba(226,232,240,0.6)',
                  color: '#94a3b8',
                  border: '1px solid rgba(203,213,225,0.5)',
                  lineHeight: 1,
                }}
              >
                {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}
              </kbd>
              <kbd
                className="text-[9px] font-bold px-1 py-0.5 rounded"
                style={{
                  background: 'rgba(226,232,240,0.6)',
                  color: '#94a3b8',
                  border: '1px solid rgba(203,213,225,0.5)',
                  lineHeight: 1,
                }}
              >
                K
              </kbd>
            </div>
          )}
        </div>

        {/* Live Search & Command Palette Dropdown */}
        {isOpen && (
          <div
            className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200/80 shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
            style={{ maxHeight: '420px', overflowY: 'auto' }}
          >
            {loading ? (
              <div className="p-6 flex items-center justify-center gap-2 text-slate-500 text-xs font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Searching records...</span>
              </div>
            ) : !hasResults && searchQuery.trim() ? (
              <div className="p-8 text-center">
                <p className="text-xs font-semibold text-slate-700">No matching results found</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Try searching for a student name, student ID, concern type, or navigation destination.
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-3 divide-y divide-slate-100">
                {/* 1. Found Students */}
                {foundStudents.length > 0 && (
                  <div className="pt-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Students ({foundStudents.length})</span>
                      <span className="text-slate-300 font-normal">Press to view profile</span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {foundStudents.map((st) => (
                        <button
                          key={st.id}
                          onClick={() => handleSelectStudent(st)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50/80 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                              style={{ background: 'linear-gradient(135deg,#3b5bdb,#5c7cfa)' }}
                            >
                              {(st.name || st.fullName || 'S')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                                {st.name || st.fullName}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                ID: <span className="font-mono">{st.studentId}</span>
                                {st.grade && ` • ${st.grade}`}
                                {st.homeroom && ` • Section ${st.homeroom}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 pl-2">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-md">
                              Profile
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Found Observations */}
                {foundObservations.length > 0 && (
                  <div className="pt-2">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Observations &amp; Concerns ({foundObservations.length})</span>
                      <span className="text-slate-300 font-normal">View detail</span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {foundObservations.map((obs) => (
                        <button
                          key={obs.id}
                          onClick={() => handleSelectObs(obs)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                                {obs.studentName} — <span className="font-normal text-slate-600">{obs.concernCategory}</span>
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {obs.date} {obs.classGroup && `• ${obs.classGroup}`}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                              obs.status === 'New'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {obs.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Quick Pages / Navigation Links */}
                {filteredPages.length > 0 && (
                  <div className="pt-2">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {searchQuery.trim() ? 'Navigation & Quick Actions' : 'Quick Navigation'}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {filteredPages.map((p) => {
                        const Icon = p.icon;
                        return (
                          <button
                            key={p.id}
                            onClick={() => handleSelectPage(p.id)}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                                {p.label}
                              </span>
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                              <span>Jump to</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer hint */}
                <div className="px-3 py-2 bg-slate-50/70 -mx-2 -mb-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    <span>Global Search powered by EduWell Psych Engine</span>
                  </span>
                  <span>Esc to close</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: utilities */}
      <div className="flex items-center gap-1.5">
        <NotificationDropdown onNavigateTab={(tab) => onNavigateTab?.(tab as ActiveTab)} />

        <button
          onClick={onOpenHelp}
          className="p-2 rounded-lg transition-all cursor-pointer"
          style={{ color: '#94a3b8' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#475569';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '';
            e.currentTarget.style.color = '#94a3b8';
          }}
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
              {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U'}
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
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fff1f2';
              e.currentTarget.style.color = '#f43f5e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '';
              e.currentTarget.style.color = '#94a3b8';
            }}
            title="Sign Out"
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
          </button>
        )}
      </div>
    </header>
  );
};
