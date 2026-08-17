import React from 'react';
import { Student, ActiveTab } from '../../types';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  MoreVertical,
  Plus,
  Download,
  ChevronLeft
} from 'lucide-react';

interface DashboardViewProps {
  students: Student[];
  onSelectStudent: (s: Student) => void;
  onOpenNewAssessment: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  onSelectStudent,
  onOpenNewAssessment,
  setActiveTab,
}) => {
  const priorityStudents = students.filter(
    (s) => s.status === 'Attention Required' || s.status === 'Monitor'
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setActiveTab('students')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            All Classes
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Grade 4, Class B</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            Assessment & Wellness Aggregate Report • Term 1, 2024
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert("Exporting Class Assessment Report PDF...")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export Report
          </button>
          <button
            onClick={onOpenNewAssessment}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Assessment
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Total Cohort Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">Total Cohort</span>
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold text-slate-900 tracking-tight">28</span>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Active Students</span>
            </div>
          </div>
        </div>

        {/* Assessment Progress Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">Term 1 Assessment Progress</span>
            <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
              85% Completion
            </span>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span>Assessed</span>
                <span className="text-slate-900 font-bold text-sm">24</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Pending</span>
                <span className="text-slate-900 font-bold text-sm">4</span>
              </div>
            </div>

            {/* Progress Dual Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full flex overflow-hidden p-0.5">
              <div className="bg-blue-700 h-full rounded-full transition-all duration-500" style={{ width: '85%' }}></div>
              <div className="bg-slate-300 h-full rounded-full ml-1" style={{ width: '15%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Wellness Distribution */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Overall Wellness Distribution</h3>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Normal Range */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Normal Range
                </span>
                <span className="text-slate-900">18 Students (75%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            {/* Monitor closely */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  Monitor closely
                </span>
                <span className="text-slate-900">5 Students (20%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-amber-600 h-full rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>

            {/* Attention Required */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  Attention Required
                </span>
                <span className="text-slate-900">1 Student (5%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-red-600 h-full rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Domain Aggregates (Mean Score) */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Domain Aggregates (Mean Score)</h3>
            <span className="text-xs text-slate-500 font-medium">Max Score: 10</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Emotional Regulation */}
            <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-100">
              <p className="text-xs font-medium text-slate-600">Emotional Regulation</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-bold text-slate-900">7.2</span>
                <TrendingDown className="w-4 h-4 text-amber-600" />
              </div>
            </div>

            {/* Social Integration */}
            <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-100">
              <p className="text-xs font-medium text-slate-600">Social Integration</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-bold text-slate-900">8.5</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
            </div>

            {/* Academic Anxiety */}
            <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-100">
              <p className="text-xs font-medium text-slate-600">Academic Anxiety</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-bold text-slate-900">4.1</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>

            {/* Focus & Attention */}
            <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-100">
              <p className="text-xs font-medium text-slate-600">Focus & Attention</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-bold text-slate-900">6.8</span>
                <TrendingDown className="w-4 h-4 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Student Review Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Priority Student Review</h3>
          <button
            onClick={() => setActiveTab('students')}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors"
          >
            View All Students
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-3.5">Student ID</th>
                <th className="px-6 py-3.5">Primary Domain Flag</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {priorityStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{s.studentId}</td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{s.primaryDomainFlag}</td>
                  <td className="px-6 py-4">
                    {s.status === 'Attention Required' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700">
                        ATTENTION REQUIRED
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                        MONITOR
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onSelectStudent(s)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
