import React from 'react';
import { ActiveTab } from '../../types';
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
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  observationCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  observationCount = 4,
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students' as ActiveTab, label: 'Students', icon: Users },
    { id: 'observations' as ActiveTab, label: 'Observations', icon: Eye, badge: observationCount },
    { id: 'parent_feedback' as ActiveTab, label: 'Parent Form', icon: MessageSquareHeart },
    { id: 'assessments' as ActiveTab, label: 'Assessments', icon: ClipboardList },
    { id: 'reports' as ActiveTab, label: 'Reports', icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#f8fafc] border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 pb-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shadow-blue-500/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-blue-700 tracking-tight leading-none">
              EduWell Psych
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Professional Suite
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'observations' && activeTab === 'observation_detail') ||
              (item.id === 'assessments' &&
                (activeTab === 'assessment_runner' || activeTab === 'assessment_result'));

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-100/80 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isActive ? 'bg-blue-200/80 text-blue-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Utility Links */}
      <div className="p-3 border-t border-slate-200 space-y-1">
        <button
          onClick={() => alert("EduWell Psych Support Center: Contact support@eduwellpsych.org")}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 font-medium transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>Help Center</span>
        </button>
        <button
          onClick={() => alert("Signed out of EduWell Psych Professional Suite.")}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 font-medium transition-colors"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
