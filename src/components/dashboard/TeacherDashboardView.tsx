import React, { useState, useEffect } from 'react';
import { ActiveTab, UserSession, ObservationRecord } from '../../types';
import {
  Plus,
  Clock,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  Info,
  GraduationCap,
  BookOpen,
  Users
} from 'lucide-react';

interface TeacherDashboardViewProps {
  user?: UserSession | null;
  onAddConcern: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  user,
  onAddConcern,
  setActiveTab,
}) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [concerns, setConcerns] = useState<ObservationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [filtersRes, observationsRes] = await Promise.all([
          fetch('/api/lookups/student-filters', { credentials: 'include' }),
          fetch('/api/observations?limit=5', { credentials: 'include' })
        ]);
        const filtersData = await filtersRes.json();
        const obsData = await observationsRes.json();

        if (!cancelled) {
          if (filtersData.success && filtersData.classes) {
            setClasses(filtersData.classes);
          }
          if (obsData.success && obsData.observations) {
            setConcerns(obsData.observations);
          }
        }
      } catch (err) {
        console.error('Failed to load teacher dashboard data', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      cancelled = true;
    };
  }, []);

  const teacherName = user?.name ? user.name.split(' ')[0] : 'Educator';
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Good Morning, {teacherName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Here is your daily overview of student wellness.
          </p>
        </div>

        <button
          onClick={onAddConcern}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Concern</span>
        </button>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section: My Classes Card (Col 8) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">My Classes</h2>
            <button
              onClick={() => setActiveTab('students')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          {/* Dynamic Class Cards */}
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              Loading assigned classes...
            </div>
          ) : classes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => setActiveTab('students')}
                  className="border border-slate-200/90 rounded-2xl p-5 space-y-4 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                          {cls.name}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 shrink-0 text-center leading-tight">
                        Active<br />Roster
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-3">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cls.sections?.length ? `${cls.sections.length} Section(s)` : 'Assigned Class'}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Wellness Roster</span>
                    <TrendingUp className="w-4 h-4 text-blue-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              No specific class restrictions assigned. You have general student roster access.
            </div>
          )}
        </div>

        {/* Right Section: Recent Concerns Card (Col 4) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Recent Concerns</h2>

            {/* Dynamic Concern Items */}
            {loading ? (
              <p className="py-6 text-center text-slate-400 text-xs">Loading concerns...</p>
            ) : concerns.length > 0 ? (
              concerns.map((obs) => (
                <div key={obs.id} className="space-y-2 pb-4 border-b border-slate-100 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900">{obs.studentName}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">{obs.date}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal pl-9 line-clamp-2">
                    {obs.narrative}
                  </p>

                  <div className="pl-9 flex items-center gap-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200/80">
                      {obs.concernCategory}
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {obs.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-slate-400 text-xs">No recent concerns recorded.</p>
            )}
          </div>

          <div className="pt-4">
            <button
              onClick={() => setActiveTab('observations')}
              className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-blue-700 font-semibold text-xs rounded-xl transition-colors text-center cursor-pointer"
            >
              View All Concerns
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
