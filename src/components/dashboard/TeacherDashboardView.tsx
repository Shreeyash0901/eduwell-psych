import React from 'react';
import { ActiveTab } from '../../types';
import {
  Plus,
  Clock,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  Info
} from 'lucide-react';

interface TeacherDashboardViewProps {
  onAddConcern: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  onAddConcern,
  setActiveTab,
}) => {
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Good Morning, Sarah
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

          {/* 3 Class Schedule Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Class 1: Grade 10 - Biology */}
            <div className="border border-slate-200/90 rounded-2xl p-5 space-y-4 hover:border-slate-300 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                    Grade 10 - Biology
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 shrink-0 text-center leading-tight">
                    24<br />Students
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-3">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>10:00 AM - 11:30 AM</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Wellness Trend</span>
                <TrendingUp className="w-4 h-4 text-blue-700" />
              </div>
            </div>

            {/* Class 2: Grade 9 - History */}
            <div className="border border-slate-200/90 rounded-2xl p-5 space-y-4 hover:border-slate-300 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                    Grade 9 - History
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 shrink-0 text-center leading-tight">
                    28<br />Students
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-3">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>1:00 PM - 2:30 PM</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Wellness Trend</span>
                <ArrowRight className="w-4 h-4 text-amber-800" />
              </div>
            </div>

            {/* Class 3: Grade 11 - Math */}
            <div className="border border-slate-200/90 rounded-2xl p-5 space-y-4 hover:border-slate-300 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                    Grade 11 - Math
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 shrink-0 text-center leading-tight">
                    22<br />Students
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-3">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>3:00 PM - 4:00 PM</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Wellness Trend</span>
                <TrendingUp className="w-4 h-4 text-blue-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Recent Concerns Card (Col 4) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Recent Concerns</h2>

            {/* Concern Item 1 */}
            <div className="space-y-2 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900">Liam Davis</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">2h ago</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-normal pl-9">
                Noticed significant withdrawal during group activities today. Reluctant to contribute...
              </p>

              <div className="pl-9">
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200/80">
                  Academic Stress
                </span>
              </div>
            </div>

            {/* Concern Item 2 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900">Emma Wilson</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Yesterday</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-normal pl-9">
                Follow up on previous peer interaction concern. Seems to be engaging more positively...
              </p>

              <div className="pl-9">
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                  Social Interaction
                </span>
              </div>
            </div>
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
