import React, { useState } from 'react';
import { Student, ActiveTab, ObservationRecord } from '../../types';
import {
  ChevronRight,
  Plus,
  TrendingUp,
  FileText,
  Eye,
  Lock,
  EyeOff,
  Quote,
  GraduationCap,
  Play,
  User,
  Phone,
  Info,
  AlertTriangle,
  TrendingDown,
  Users,
  Moon,
  BarChart2,
  BookOpen,
  Brain,
  Share2,
  Search,
  SlidersHorizontal,
  ClipboardCheck
} from 'lucide-react';

interface StudentProfileViewProps {
  student?: Student;
  observations?: ObservationRecord[];
  initialTab?: ProfileTab;
  onOpenNewAssessment: () => void;
  onOpenNewObservation?: () => void;
  onSelectAssessmentResult?: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export type ProfileTab = 'overview' | 'observations' | 'assessments' | 'reports';

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  student,
  initialTab = 'overview',
  onOpenNewAssessment,
  onOpenNewObservation,
  onSelectAssessmentResult,
  setActiveTab,
}) => {
  const [activeTab, setActiveProfileTab] = useState<ProfileTab>(initialTab);

  const currentStudent = student || {
    id: 's2',
    studentId: '#STU-8821',
    name: 'Alex Johnson',
    grade: 'Grade 4',
    classGroup: 'Section B',
    age: 9,
    homeroom: 'Homeroom 4B',
    iepStatus: 'Under Evaluation',
    priorObsCount: 1,
    status: 'Monitor' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&q=80&w=200',
    primaryDomainFlag: 'Focus & Attention (Score: 3.4)',
    scoreFlag: 3.4,
    domainScores: {
      emotionalRegulation: 4.5,
      socialInteraction: 8.2,
      academicAnxiety: 5.5,
      focusAttention: 3.4,
      selfConfidence: 6.8,
      schoolAdjustment: 9.0,
    },
  };

  // Conducted Assessments Data
  const conductedAssessments = [
    {
      id: 'a1',
      name: 'Emotional Wellbeing Scale',
      date: 'Oct 12, 2023',
      score: '78/100',
      indicator: 'Monitor',
      indicatorClass: 'bg-blue-50 text-blue-800 border border-blue-200/60',
      status: 'Completed',
      isDraft: false,
    },
    {
      id: 'a2',
      name: 'Cognitive Load Assessment',
      date: 'Sep 28, 2023',
      score: '85/100',
      indicator: 'Normal',
      indicatorClass: 'bg-blue-100/80 text-blue-800 border border-blue-200/60',
      status: 'Completed',
      isDraft: false,
    },
    {
      id: 'a3',
      name: 'Social Integration Index',
      date: 'Nov 02, 2023',
      score: 'Pending',
      indicator: 'N/A',
      indicatorClass: 'bg-slate-100 text-slate-600 border border-slate-200',
      status: 'Draft',
      isDraft: true,
    },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <button
          onClick={() => setActiveTab('students')}
          className="hover:text-blue-700 transition-colors cursor-pointer"
        >
          Students
        </button>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 font-semibold">{currentStudent.name}</span>
      </div>

      {/* Student Profile Header Card (Matching Alex Johnson Screenshot) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={
              currentStudent.avatarUrl ||
              'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&q=80&w=200'
            }
            alt={currentStudent.name}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-100 shadow-2xs shrink-0"
          />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {currentStudent.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                {currentStudent.grade}
              </span>
              <span>•</span>
              <span>{currentStudent.classGroup || 'Section B'}</span>
              <span>•</span>
              <span>ID: {currentStudent.studentId}</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                Active Monitoring
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('student_report_preview')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Generate Report</span>
          </button>

          <button
            onClick={onOpenNewAssessment}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Assessment</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-8">
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'observations', label: 'Observations' },
              { id: 'assessments', label: 'Assessments' },
              { id: 'reports', label: 'Reports' },
            ] as const
          ).map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveProfileTab(t.id)}
                className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
                  isActive
                    ? 'text-blue-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{t.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW (SCREENSHOT MATCH) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Basic Information Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-5 self-start">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">Basic Information</h2>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Age</span>
                <span className="font-bold text-slate-900">{currentStudent.age || 9} Years</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Gender</span>
                <span className="font-bold text-slate-900">Male</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-xs text-slate-500 font-medium block">Homeroom Teacher</span>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  MD
                </div>
                <span className="text-xs font-bold text-slate-900">Mr. Davis</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-slate-500 font-medium block">Primary Contact</span>
              <div className="bg-blue-50/50 border border-blue-100/80 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Sarah Johnson</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Mother</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Current Overview & Recent Scores */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Overview Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">Current Overview</h2>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-bold self-start sm:self-auto">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Elevated Attention</span>
                </span>
              </div>

              <p className="text-xs text-slate-400 font-medium">Last updated: Today, 09:41 AM</p>

              {/* Narrative box */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                Alex has shown signs of academic disengagement over the past two weeks, correlating
                with reported sleep issues from home. Peer interactions remain generally positive
                during unstructured time, but attention span during morning instructional sessions
                is noticeably reduced. Recent formative assessments indicate a slight dip in reading
                comprehension speed.
              </div>

              {/* Tags Row */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                  <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>Focus Level</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-semibold">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Social Integration: Stable</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-lg text-xs font-semibold">
                  <Moon className="w-3.5 h-3.5 text-orange-600" />
                  <span>Sleep Quality Flag</span>
                </span>
              </div>
            </div>

            {/* Recent Assessment Scores Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Recent Assessment Scores</h3>
                </div>
                <button
                  onClick={() => setActiveProfileTab('assessments')}
                  className="text-xs text-blue-700 font-bold hover:underline cursor-pointer"
                >
                  View Full History &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {/* Item 1 */}
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Reading Comprehension Index</h4>
                      <p className="text-[11px] text-slate-400 font-medium">Oct 12, 2023</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <span className="text-sm font-bold text-slate-900">65%</span>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Behavioral Screener (BASC-3)</h4>
                      <p className="text-[11px] text-slate-400 font-medium">Sep 28, 2023</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold">
                    At Risk
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OBSERVATIONS TIMELINE */}
      {activeTab === 'observations' && (
        <div className="relative pl-8 sm:pl-10 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
          {/* Item 1: Psychologist Clinical Note */}
          <div className="relative">
            <div className="absolute -left-8 sm:-left-10 top-5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-blue-600 bg-white flex items-center justify-center z-10 shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs border-l-4 border-l-blue-600 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Psychologist Clinical Note</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">Today, 10:30 AM</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Follow-up Session: Emotional Regulation
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-2 font-normal">
                  Marcus attended the scheduled bi-weekly session. Discussed recent triggers in
                  structured environments (specifically Math class). He successfully identified
                  somatic markers of anxiety prior to an outburst. Introduced grounding technique
                  (5–4–3–2–1). He demonstrated good comprehension but noted difficulty initiating
                  the technique when highly dysregulated.
                </p>
              </div>

              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold">
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Restricted access: Psych team only</span>
                </span>
              </div>
            </div>
          </div>

          {/* Item 2: Teacher Educator Observation */}
          <div className="relative">
            <div className="absolute -left-8 sm:-left-10 top-5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center z-10 shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                    JD
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Mr. J. Davis</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Mathematics Educator</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-medium">Oct 24, 2:15 PM</span>
              </div>

              <div className="space-y-2">
                <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-600 font-bold text-[10px] uppercase rounded-xs tracking-wider border border-rose-100">
                  BEHAVIOUR - ESCALATION
                </span>
                <h3 className="text-base font-bold text-slate-900">Task Refusal & Disruption</h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  During independent practice, Marcus became visibly frustrated with the algebraic
                  equations. He pushed his desk forward, threw his pencil, and refused to engage when
                  offered assistance. Left the classroom without permission for approximately 5
                  minutes before returning voluntarily.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-600 font-medium italic">
                  Action taken: Allowed cool-down period. Directed to counselor&apos;s office later in the day.
                </p>
              </div>
            </div>
          </div>

          {/* Item 3: Parent / Guardian Feedback */}
          <div className="relative">
            <div className="absolute -left-8 sm:-left-10 top-5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center z-10 shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-800 font-bold text-xs flex items-center justify-center shrink-0 border border-orange-200">
                    ST
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Sarah Thorne</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Parent / Guardian</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Oct 22, 7:00 PM</span>
                  <span className="px-2 py-0.5 border border-slate-200 text-slate-600 rounded-xs text-[10px] font-medium bg-slate-50">
                    Optional Parent Feedback
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Home Update regarding sleep patterns
                </h3>
                <div className="flex gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                  <Quote className="w-5 h-5 text-slate-300 shrink-0 rotate-180" />
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                    Just wanted to update the team. Marcus has been having significant trouble
                    sleeping the past three nights. He seems very anxious about the upcoming
                    standardized testing next week. We are trying to keep things calm at home, but
                    please be aware he might be more fatigued or irritable than usual during school
                    hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONDUCTED ASSESSMENTS */}
      {activeTab === 'assessments' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Conducted Assessments</h2>
            <button
              onClick={onOpenNewAssessment}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>New Assessment</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Total Assessments</span>
              <div className="text-3xl font-extrabold text-blue-700 mt-2 tracking-tight">12</div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Last Assessment</span>
              <div className="text-base sm:text-lg font-bold text-slate-900 mt-3 tracking-tight">
                Oct 12, 2023
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Avg Score Trend</span>
              <div className="flex items-center gap-1.5 text-base sm:text-lg font-bold text-blue-600 mt-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Improving</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-200/80 pt-2">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 border-b border-slate-200/80">
                  <th className="py-3.5 pr-4 font-semibold">Assessment Name</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold">Score</th>
                  <th className="py-3.5 px-4 font-semibold">Indicator</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 pl-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {conductedAssessments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pr-4 font-bold text-slate-900">{item.name}</td>
                    <td className="py-4 px-4 text-slate-600 font-medium">{item.date}</td>
                    <td className="py-4 px-4">
                      {item.score === 'Pending' ? (
                        <span className="italic text-slate-400 font-medium">Pending</span>
                      ) : (
                        <span className="font-bold text-slate-900">{item.score}</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.indicatorClass}`}
                      >
                        {item.indicator}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {item.isDraft ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>Draft</span>
                        </span>
                      ) : (
                        <span className="text-slate-700 font-medium">{item.status}</span>
                      )}
                    </td>
                    <td className="py-4 pl-4 text-right">
                      {item.isDraft ? (
                        <button
                          onClick={() => setActiveTab('psychologist_interpretation')}
                          className="text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                        >
                          Continue
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (onSelectAssessmentResult) {
                              onSelectAssessmentResult();
                            } else {
                              setActiveTab('assessment_result');
                            }
                          }}
                          className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="View Result"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REPORTS (DOCUMENT HISTORY - SCREENSHOT MATCH) */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
          {/* Card Header: Title & Search/Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Document History</h2>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  className="pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent w-48 sm:w-56"
                />
              </div>

              <button
                type="button"
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
                title="Filter Documents"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Document History Table */}
          <div className="overflow-x-auto border-t border-slate-200/80 pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 pr-4 font-bold">Report Title</th>
                  <th className="py-3 px-4 font-bold">Type</th>
                  <th className="py-3 px-4 font-bold">Date Generated</th>
                  <th className="py-3 px-4 font-bold">Created By</th>
                  <th className="py-3 pl-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Row 1 */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2.5 font-bold text-slate-900">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Term 2 Academic & Wellness Summary</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                      Comprehensive
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-medium">Oct 12, 2023</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                        DR
                      </div>
                      <span className="font-medium text-slate-800">Dr. Sarah Jenkins</span>
                    </div>
                  </td>
                  <td className="py-4 pl-4 text-right">
                    <button
                      onClick={() => setActiveTab('student_report_preview')}
                      className="text-blue-700 hover:text-blue-900 font-bold hover:underline cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2.5 font-bold text-slate-900">
                      <ClipboardCheck className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Behavioral Observation Log - Q3</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/80">
                      Observation
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-medium">Sep 28, 2023</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                        DR
                      </div>
                      <span className="font-medium text-slate-800">Dr. Sarah Jenkins</span>
                    </div>
                  </td>
                  <td className="py-4 pl-4 text-right">
                    <button
                      onClick={() => setActiveTab('student_report_preview')}
                      className="text-blue-700 hover:text-blue-900 font-bold hover:underline cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2.5 font-bold text-slate-900">
                      <BarChart2 className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>Initial Cognitive Assessment Results</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      Assessment
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-medium">Aug 15, 2023</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                        ML
                      </div>
                      <span className="font-medium text-slate-800">Mark Loman</span>
                    </div>
                  </td>
                  <td className="py-4 pl-4 text-right">
                    <button
                      onClick={() => setActiveTab('student_report_preview')}
                      className="text-blue-700 hover:text-blue-900 font-bold hover:underline cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
