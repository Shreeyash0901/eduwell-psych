import React, { useState } from 'react';
import { toast } from 'sonner';
import { ActiveTab, Student } from '../../types';
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
  Info,
  Search,
  X,
  FileText,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface ReportsViewProps {
  students?: Student[];
  onSelectStudentReport?: (student: Student) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students = [],
  onSelectStudentReport,
  setActiveTab,
}) => {
  const [selectedSubView, setSelectedSubView] = useState<'dashboard' | 'grade_report'>('dashboard');
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const studentsLimit = 8;

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentId.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.grade.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.homeroom.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const totalStudentPages = Math.ceil(filteredStudents.length / studentsLimit) || 1;
  const paginatedStudents = filteredStudents.slice((studentPage - 1) * studentsLimit, studentPage * studentsLimit);

  const handleOpenStudentReport = (student: Student) => {
    setIsStudentPickerOpen(false);
    if (onSelectStudentReport) {
      onSelectStudentReport(student);
    } else {
      setActiveTab('student_report_preview');
    }
  };

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
              onClick={() => toast.success('Report exported successfully!')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export PDF
            </button>
            <button
              onClick={() => {}}
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
          onClick={() => setIsStudentPickerOpen(true)}
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
              onClick={() => setIsStudentPickerOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors cursor-pointer group"
            >
              <span>Choose Student Report</span>
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

      {/* Student Selection Modal for Report Generation */}
      {isStudentPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Select Student for Report</h3>
                  <p className="text-xs text-slate-500 font-medium">Choose a student to view or generate their confidential wellness report</p>
                </div>
              </div>
              <button
                onClick={() => setIsStudentPickerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setStudentPage(1);
                }}
                placeholder="Search by student name, ID, or grade..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                autoFocus
              />
            </div>

            {/* Students List */}
            <div className="overflow-y-auto divide-y divide-slate-100 flex-1 pr-1 max-h-80 space-y-1">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleOpenStudentReport(s)}
                    className="w-full text-left p-3 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-100 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {s.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-900 group-hover:text-blue-700 block">
                          {s.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <span>{s.studentId}</span>
                          <span>•</span>
                          <span>{s.grade}</span>
                          <span>•</span>
                          <span>{s.homeroom}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          s.status === 'Attention Required'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : s.status === 'Monitor'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {s.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No students match "{studentSearch}"
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalStudentPages > 1 && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <span className="text-xs text-slate-500 font-medium">
                  Showing {(studentPage - 1) * studentsLimit + 1} to {Math.min(studentPage * studentsLimit, filteredStudents.length)} of {filteredStudents.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={studentPage === 1}
                    onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    {studentPage} / {totalStudentPages}
                  </span>
                  <button
                    disabled={studentPage === totalStudentPages}
                    onClick={() => setStudentPage((p) => Math.min(totalStudentPages, p + 1))}
                    className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
