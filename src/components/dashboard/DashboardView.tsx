import React, { useState } from 'react';
import { Student, ActiveTab, ObservationRecord } from '../../types';
import {
  Users,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Plus,
  FileText,
  Eye,
  ChevronLeft,
  Download,
  MoreVertical,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Sparkles,
  BarChart2,
  Calendar
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
  // Toggle between General Overview (Image 2) and Class Aggregate Report (Image 1)
  const [viewMode, setViewMode] = useState<'overview' | 'class_report'>('overview');
  const [selectedClass, setSelectedClass] = useState('Grade 4, Class B');

  // Recent Student Concerns for Overview (from screenshot)
  const recentConcerns = [
    {
      id: 'c1',
      student: 'Leo Martinez',
      class: '3B',
      concern: 'Social Isolation',
      date: 'Oct 24',
      status: 'NEW',
    },
    {
      id: 'c2',
      student: 'Chloe Davis',
      class: '5A',
      concern: 'Attention Span',
      date: 'Oct 23',
      status: 'REVIEWED',
    },
    {
      id: 'c3',
      student: 'Samira Patel',
      class: '2C',
      concern: 'Anxiety (Testing)',
      date: 'Oct 22',
      status: 'NEW',
    },
  ];

  // Recent Assessments for Overview (from screenshot)
  const recentAssessments = [
    {
      id: 'a1',
      protocol: 'WISC-V',
      date: 'Oct 25',
      student: 'Julian Rossi',
      progress: 65,
      statusText: 'In Progress',
      isComplete: false,
    },
    {
      id: 'a2',
      protocol: 'BASC-3',
      date: 'Oct 20',
      student: 'Aaliyah Jones',
      progress: 100,
      statusText: 'Complete',
      isComplete: true,
    },
  ];

  // ==========================================
  // VIEW MODE 1: CLASS AGGREGATE REPORT (IMAGE 1)
  // ==========================================
  if (viewMode === 'class_report') {
    return (
      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
        {/* Top Breadcrumb & Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => setViewMode('overview')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              All Classes
            </button>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {selectedClass}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              Assessment & Wellness Aggregate Report • Term 1, 2024
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("Exporting Grade 4, Class B Assessment Report...")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export Report
            </button>
            <button
              onClick={onOpenNewAssessment}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Assessment
            </button>
          </div>
        </div>

        {/* First Row: 2 Metric Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 1: Total Cohort */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">Total Cohort</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
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

          {/* Card 2: Term 1 Assessment Progress */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">
                Term 1 Assessment Progress
              </span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                85% Completion
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span>Assessed</span>
                  <span className="text-slate-900 font-bold text-sm">24</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Pending</span>
                  <span className="text-slate-900 font-bold text-sm">4</span>
                </div>
              </div>

              {/* Progress Dual Bar */}
              <div className="h-2.5 w-full bg-slate-100 rounded-full flex overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: '85%' }}
                ></div>
                <div
                  className="bg-slate-200 h-full rounded-full ml-1"
                  style={{ width: '15%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row: 2 Detail Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 3: Overall Wellness Distribution */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Overall Wellness Distribution
              </h3>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Options"
              >
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
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: '75%' }}
                  ></div>
                </div>
              </div>

              {/* Monitor closely */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Monitor closely
                  </span>
                  <span className="text-slate-900">5 Students (20%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: '20%' }}
                  ></div>
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
                  <div
                    className="bg-red-600 h-full rounded-full"
                    style={{ width: '5%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Domain Aggregates (Mean Score) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Domain Aggregates (Mean Score)
              </h3>
              <span className="text-xs text-slate-400 font-medium">Max Score: 10</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Emotional Regulation */}
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <p className="text-xs font-medium text-slate-600">Emotional Regulation</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg font-bold text-slate-900">7.2</span>
                  <TrendingDown className="w-4 h-4 text-amber-500" />
                </div>
              </div>

              {/* Social Integration */}
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <p className="text-xs font-medium text-slate-600">Social Integration</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg font-bold text-slate-900">8.5</span>
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
              </div>

              {/* Academic Anxiety */}
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <p className="text-xs font-medium text-slate-600">Academic Anxiety</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg font-bold text-slate-900">4.1</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Focus & Attention */}
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <p className="text-xs font-medium text-slate-600">Focus & Attention</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg font-bold text-slate-900">6.8</span>
                  <TrendingDown className="w-4 h-4 text-amber-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Return to Overview */}
        <div className="flex justify-start">
          <button
            onClick={() => setViewMode('overview')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Global Overview
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW MODE 2: PSYCHOLOGIST OVERVIEW DASHBOARD (IMAGE 2)
  // ==========================================
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Greeting & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Good morning, Dr. Mercer
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Review student concerns, assessments and reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('students')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>

          <button
            onClick={onOpenNewAssessment}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200/80 text-blue-700 hover:bg-blue-50/50 rounded-lg text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <span>Start Assessment</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200/80 text-blue-700 hover:bg-blue-50/50 rounded-lg text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* STUDENTS Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Students
            </span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">142</span>
          </div>
        </div>

        {/* NEW CONCERNS Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              New Concerns
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">8</span>
          </div>
        </div>

        {/* ASSESSMENTS Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Assessments
            </span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">12</span>
            <span className="text-xs font-medium text-slate-500">in progress</span>
          </div>
        </div>

        {/* REPORTS READY Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Reports Ready
            </span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">5</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Section: Recent Student Concerns (Left) & Recent Assessments (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Student Concerns Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Student Concerns</h2>
            <button
              onClick={() => setActiveTab('observations')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/60 text-xs font-semibold text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-3 font-semibold">Student</th>
                  <th className="px-6 py-3 font-semibold">Class</th>
                  <th className="px-6 py-3 font-semibold">Concern</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentConcerns.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{row.student}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{row.class}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{row.concern}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{row.date}</td>
                    <td className="px-6 py-4">
                      {row.status === 'NEW' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-red-100 text-red-700">
                          NEW
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-slate-200 text-slate-700">
                          REVIEWED
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setActiveTab('observations')}
                        className="p-1 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors inline-flex items-center justify-center cursor-pointer"
                        title="View Observation"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Recent Assessments Card */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Assessments</h2>
          </div>

          <div className="space-y-4">
            {recentAssessments.map((ass) => (
              <div
                key={ass.id}
                className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs space-y-2 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 tracking-tight">
                    {ass.protocol}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{ass.date}</span>
                </div>

                <p className="text-xs text-slate-600 font-medium">
                  Student: <span className="font-semibold text-slate-800">{ass.student}</span>
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${ass.progress}%` }}
                    ></div>
                  </div>
                  <span
                    className={`text-xs font-semibold shrink-0 ${
                      ass.isComplete ? 'text-blue-700' : 'text-slate-500'
                    }`}
                  >
                    {ass.statusText}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onOpenNewAssessment}
            className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Launch Protocol Screening</span>
          </button>
        </div>
      </div>

      {/* Class / Cohort Aggregate Quick Drilldown Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Grade 4, Class B • Cohort Wellness Report Available
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              85% assessed • Mean emotional regulation: 7.2 • Mean social integration: 8.5
            </p>
          </div>
        </div>

        <button
          onClick={() => setViewMode('class_report')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <span>View Class Aggregate Report</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
