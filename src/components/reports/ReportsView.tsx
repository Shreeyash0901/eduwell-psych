import React, { useState } from 'react';
import { ActiveTab } from '../../types';
import {
  Plus,
  User,
  Users,
  Building2,
  ArrowRight,
  ArrowLeft,
  Download,
  Filter,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

interface ReportsViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ setActiveTab }) => {
  const [selectedSubView, setSelectedSubView] = useState<'dashboard' | 'grade_report'>('dashboard');

  if (selectedSubView === 'grade_report') {
    return (
      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => setSelectedSubView('dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Reports Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Grade 5 Wellness Report</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Aggregate cohort overview for Fall Term 2024
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("Exporting Grade 5 Wellness Report PDF...")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export PDF
            </button>
            <button
              onClick={() => alert("Filter report parameters...")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 shadow-sm transition-colors cursor-pointer"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Top 3 Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Classes Evaluated */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <BookOpen className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold uppercase tracking-wider">Classes Evaluated</span>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">12</span>
              <p className="text-xs font-bold text-blue-700 mt-1 flex items-center gap-1">
                <span>↑ 2 pending completion</span>
              </p>
            </div>
          </div>

          {/* Students Assessed */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <Users className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold uppercase tracking-wider">Students Assessed</span>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">284</span>
              <p className="text-xs font-medium text-slate-500 mt-1">out of 310 enrolled</p>
            </div>
          </div>

          {/* Assessment Coverage */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold uppercase tracking-wider">Assessment Coverage</span>
            </div>
            <div className="mt-4 space-y-2">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">91.6%</span>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-blue-700 h-full rounded-full" style={{ width: '91.6%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Domain Distribution & Priority Focus Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Domain Distribution Card */}
          <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Domain Distribution</h2>
              <span className="text-xs font-semibold text-slate-500">Grade 5 Cohort</span>
            </div>

            <div className="space-y-6">
              {/* Emotional Regulation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800">Emotional Regulation</span>
                  <span className="text-slate-900 font-bold">72% Optimal</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden">
                  <div className="bg-blue-700 h-full" style={{ width: '72%' }}></div>
                  <div className="bg-slate-500 h-full" style={{ width: '18%' }}></div>
                  <div className="bg-red-600 h-full" style={{ width: '10%' }}></div>
                </div>
              </div>

              {/* Social Integration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800">Social Integration</span>
                  <span className="text-slate-900 font-bold">65% Optimal</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden">
                  <div className="bg-blue-700 h-full" style={{ width: '65%' }}></div>
                  <div className="bg-slate-500 h-full" style={{ width: '22%' }}></div>
                  <div className="bg-red-600 h-full" style={{ width: '13%' }}></div>
                </div>
              </div>

              {/* Academic Resilience */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800">Academic Resilience</span>
                  <span className="text-slate-900 font-bold">80% Optimal</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden">
                  <div className="bg-blue-700 h-full" style={{ width: '80%' }}></div>
                  <div className="bg-slate-500 h-full" style={{ width: '14%' }}></div>
                  <div className="bg-red-600 h-full" style={{ width: '6%' }}></div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-700"></span>
                <span>Optimal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                <span>Developing</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                <span>Needs Support</span>
              </div>
            </div>
          </div>

          {/* Priority Focus Areas Card */}
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Priority Focus Areas</h2>

            {/* Alert Box 1 */}
            <div className="p-4 bg-red-50/50 border border-red-200/80 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-red-700 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Class 5B: Social Integration</span>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed pl-6">
                A cluster of 8 students showing elevated peer conflict scores.
              </p>
            </div>

            {/* Info Box 2 */}
            <div className="p-4 bg-blue-50/50 border border-blue-200/80 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                <Info className="w-4 h-4 shrink-0" />
                <span>Grade-wide: Anxiety Trends</span>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed pl-6">
                Slight uptick (+4%) in reported test anxiety compared to Fall 2023.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Reports Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Generate and view analytical reports for academic wellness.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('student_report_preview')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Report</span>
        </button>
      </div>

      {/* 3 Main Analytical Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Student Reports */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>

            <h2 className="text-base font-bold text-slate-900 mt-5">
              Student Reports
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mt-2 font-normal">
              Detailed individual wellness and academic assessment profiles for specific students.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('student_report_preview')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors cursor-pointer group"
            >
              <span>View Templates</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card 2: Class Reports */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>

            <h2 className="text-base font-bold text-slate-900 mt-5">
              Class Reports
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mt-2 font-normal">
              Aggregated data visualizing classroom dynamics, overall wellness trends, and
              collective performance.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-950 transition-colors cursor-pointer group"
            >
              <span>View Templates</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card 3: Grade Reports */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>

            <h2 className="text-base font-bold text-slate-900 mt-5">
              Grade Reports
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mt-2 font-normal">
              Broad demographic analysis comparing academic wellness across entire grade levels or cohorts.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => setSelectedSubView('grade_report')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer group"
            >
              <span>View Templates</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
