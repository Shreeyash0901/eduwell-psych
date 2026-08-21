import React, { useState } from 'react';
import { ActiveTab, UserSession } from '../../types';
import {
  LayoutDashboard,
  Users,
  Eye,
  ClipboardList,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  BrainCircuit,
  MessageSquareHeart,
  Building2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  observationCount?: number;
  user?: UserSession | null;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  observationCount = 0,
  user,
  onSignOut,
}) => {
  const role = user?.role || 'psychologist';
  const [isSigningOut, setIsSigningOut] = useState(false);

  const getNavItems = () => {
    if (role === 'super_admin') {
      return [
        { id: 'super_admin_dashboard' as ActiveTab, label: 'Platform Overview', icon: LayoutDashboard },
        { id: 'super_admin_schools' as ActiveTab, label: 'Tenant Schools', icon: Building2 },
        { id: 'super_admin_audit' as ActiveTab, label: 'Audit Logs', icon: ClipboardList },
        { id: 'settings' as ActiveTab, label: 'Platform Settings', icon: Settings },
      ];
    }
    if (role === 'teacher') {
      return [
        { id: 'teacher_dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'students' as ActiveTab, label: 'My Students', icon: Users },
        { id: 'observations' as ActiveTab, label: 'Observations', icon: Eye, badge: observationCount },
        { id: 'reports' as ActiveTab, label: 'Reports', icon: BarChart3 },
      ];
    }
    if (role === 'parent') {
      return [
        { id: 'parent_feedback' as ActiveTab, label: 'Parent Feedback', icon: MessageSquareHeart },
        { id: 'student_profile' as ActiveTab, label: 'Student Progress', icon: Users },
      ];
    }
    if (role === 'admin') {
      return [
        { id: 'dashboard' as ActiveTab, label: 'District Overview', icon: LayoutDashboard },
        { id: 'students' as ActiveTab, label: 'Student Directory', icon: Users },
        { id: 'reports' as ActiveTab, label: 'District Reports', icon: BarChart3 },
        { id: 'settings' as ActiveTab, label: 'Settings & Policy', icon: Settings },
      ];
    }
    return [
      { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
      { id: 'students' as ActiveTab, label: 'Students', icon: Users },
      { id: 'observations' as ActiveTab, label: 'Observations', icon: Eye, badge: observationCount },
      { id: 'parent_feedback' as ActiveTab, label: 'Parent Form', icon: MessageSquareHeart },
      { id: 'assessments' as ActiveTab, label: 'Assessments', icon: ClipboardList },
      { id: 'reports' as ActiveTab, label: 'Reports', icon: BarChart3 },
      { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
    ];
  };

  const navItems = getNavItems();

  const isActive = (id: ActiveTab) =>
    activeTab === id ||
    (id === 'super_admin_dashboard' && (activeTab === 'dashboard' || activeTab === 'super_admin_dashboard')) ||
    (id === 'teacher_dashboard' && activeTab === 'teacher_add_concern') ||
    (id === 'observations' && (activeTab === 'observation_detail' || activeTab === 'teacher_add_concern')) ||
    (id === 'assessments' && (activeTab === 'assessment_setup' || activeTab === 'assessment_runner' || activeTab === 'assessment_result' || activeTab === 'psychologist_interpretation')) ||
    (id === 'reports' && activeTab === 'student_report_preview') ||
    (id === 'students' && activeTab === 'student_profile');

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await onSignOut?.();
    setIsSigningOut(false);
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'teacher': return 'Teacher';
      case 'psychologist': return 'Psychologist';
      case 'admin': return 'Principal';
      case 'parent': return 'Parent';
      default: return role;
    }
  };

  const getRoleDot = () => {
    switch (role) {
      case 'super_admin': return 'bg-violet-400';
      case 'psychologist': return 'bg-blue-400';
      case 'teacher': return 'bg-emerald-400';
      case 'admin': return 'bg-amber-400';
      default: return 'bg-slate-400';
    }
  };

  // First letter of each word in name
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <aside
      className="w-60 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none bg-white border-r border-slate-200 overflow-y-auto animate-slide-in-left"
      style={{ minHeight: '100vh' }}
    >
      {/* Top section */}
      <div className="flex flex-col gap-0">
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' }}
          >
            <BrainCircuit className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
          </div>
          <div>
            <div className="font-bold text-[15px] text-slate-900 tracking-tight leading-none">
              EduWell Psych
            </div>
            <div className="text-[10px] font-semibold mt-0.5 text-slate-400 tracking-wider uppercase">
              {role === 'super_admin' ? 'Control Plane' : 'Professional Suite'}
            </div>
          </div>
        </div>

        {/* User card */}
        {user && (
          <div className="mx-3 mb-3 p-3 rounded-xl flex items-center gap-2.5 bg-slate-50 border border-slate-200/80">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-200" />
            ) : (
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getRoleDot()}`} />
                <p className="text-[10px] font-semibold text-slate-500 truncate uppercase">{getRoleLabel()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Separator label */}
        <div className="px-5 pb-1.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Navigation</span>
        </div>

        {/* Nav Items */}
        <nav className="px-2.5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`sidebar-nav-item${active ? ' active' : ''}`}
              >
                <Icon
                  style={{ width: '16px', height: '16px', flexShrink: 0, color: active ? '#2563eb' : '#64748b', transition: 'color 120ms' }}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}
                    style={{ minWidth: '20px', textAlign: 'center' }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-2.5 space-y-1 border-t border-slate-100">
        {/* Upgrade prompt — only for non super_admin */}
        {role !== 'super_admin' && (
          <div className="mb-2 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-100">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles style={{ width: '13px', height: '13px', color: '#3b82f6', flexShrink: 0 }} />
              <span className="text-[11px] font-bold text-slate-900">EduWell Pro</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">Advanced analytics, custom reports & priority support.</p>
            <button className="mt-2 text-[10px] font-bold text-white px-2.5 py-1.5 rounded-lg w-full text-center bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer">
              Upgrade Plan
            </button>
          </div>
        )}

        <button
          onClick={() => alert('EduWell Support:\n• docs.eduwellpsych.org\n• support@eduwellpsych.org')}
          className="sidebar-nav-item"
        >
          <HelpCircle style={{ width: '16px', height: '16px', flexShrink: 0, color: '#64748b' }} />
          <span>Help Center</span>
        </button>

        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="sidebar-nav-item text-rose-600 hover:bg-rose-50"
        >
          <LogOut style={{ width: '16px', height: '16px', flexShrink: 0, color: '#e11d48' }} />
          <span className="font-semibold">{isSigningOut ? 'Signing out…' : 'Sign Out'}</span>
        </button>
      </div>
    </aside>
  );
};
