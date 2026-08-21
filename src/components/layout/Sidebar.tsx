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
      className="w-60 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none sidebar-dark sidebar-scroll overflow-y-auto animate-slide-in-left"
      style={{ minHeight: '100vh' }}
    >
      {/* Top section */}
      <div className="flex flex-col gap-0">
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #3b5bdb 0%, #7950f2 100%)', boxShadow: '0 0 16px rgba(59,91,219,0.5)' }}
          >
            <BrainCircuit className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
          </div>
          <div>
            <div className="font-bold text-[15px] text-white tracking-tight leading-none gradient-text-blue" style={{ background: 'linear-gradient(120deg,#a5b4fc,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              EduWell Psych
            </div>
            <div className="text-[10px] font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {role === 'super_admin' ? 'Control Plane' : 'Professional Suite'}
            </div>
          </div>
        </div>

        {/* User card */}
        {user && (
          <div className="mx-3 mb-3 p-3 rounded-xl flex items-center gap-2.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-white/15" />
            ) : (
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg,#3b5bdb,#7950f2)' }}>
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate leading-tight">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getRoleDot()}`} />
                <p className="text-[10px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{getRoleLabel()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Separator label */}
        <div className="px-5 pb-1.5">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>Navigation</span>
        </div>

        {/* Nav Items */}
        <nav className="px-2.5 space-y-0.5">
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
                  style={{ width: '16px', height: '16px', flexShrink: 0, color: active ? '#a5b4fc' : 'rgba(255,255,255,0.35)', transition: 'color 120ms' }}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: active ? 'rgba(165,180,252,0.2)' : 'rgba(255,255,255,0.08)', color: active ? '#a5b4fc' : 'rgba(255,255,255,0.5)', minWidth: '20px', textAlign: 'center' }}
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
      <div className="p-2.5 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Upgrade prompt — only for non super_admin */}
        {role !== 'super_admin' && (
          <div className="mb-2 p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59,91,219,0.25), rgba(121,80,242,0.2))', border: '1px solid rgba(92,124,250,0.25)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles style={{ width: '12px', height: '12px', color: '#a5b4fc', flexShrink: 0 }} />
              <span className="text-[11px] font-bold text-white">EduWell Pro</span>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>Advanced analytics, custom reports & priority support.</p>
            <button className="mt-2 text-[10px] font-bold text-white px-2.5 py-1 rounded-lg w-full text-center" style={{ background: 'linear-gradient(135deg,#3b5bdb,#7950f2)' }}>
              Upgrade Plan
            </button>
          </div>
        )}

        <button
          onClick={() => alert('EduWell Support:\n• docs.eduwellpsych.org\n• support@eduwellpsych.org')}
          className="sidebar-nav-item"
        >
          <HelpCircle style={{ width: '16px', height: '16px', flexShrink: 0, color: 'rgba(255,255,255,0.3)' }} />
          <span>Help Center</span>
        </button>

        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="sidebar-nav-item"
          style={{ color: isSigningOut ? 'rgba(255,255,255,0.3)' : 'rgba(248,113,113,0.75)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = '')}
        >
          <LogOut style={{ width: '16px', height: '16px', flexShrink: 0, color: isSigningOut ? 'rgba(255,255,255,0.2)' : 'rgba(248,113,113,0.7)' }} />
          <span>{isSigningOut ? 'Signing out…' : 'Sign Out'}</span>
        </button>
      </div>
    </aside>
  );
};
