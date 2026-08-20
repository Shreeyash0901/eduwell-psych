import React, { useState, useEffect } from 'react';
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
  ClipboardCheck,
  Calendar,
  Layers,
  Mail,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

export type ProfileTab = 'overview' | 'observations' | 'assessments' | 'reports';

interface StudentProfileViewProps {
  student?: Student;
  studentId?: string | number | null;
  initialTab?: ProfileTab;
  refreshKey?: number;
  onOpenNewAssessment: (studentName?: string) => void;
  onGenerateReport?: (studentName: string) => void;
  onOpenNewObservation?: () => void;
  onSelectAssessmentResult?: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  student: initialStudent,
  studentId: propStudentId,
  initialTab = 'overview',
  refreshKey = 0,
  onOpenNewAssessment,
  onGenerateReport,
  onOpenNewObservation,
  onSelectAssessmentResult,
  setActiveTab,
}) => {
  const [activeTab, setActiveProfileTab] = useState<ProfileTab>(initialTab);
  const [apiStudent, setApiStudent] = useState<Student | null>(initialStudent || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [observations, setObservations] = useState<ObservationRecord[]>([]);
  const [observationsLoading, setObservationsLoading] = useState<boolean>(false);
  const [observationsError, setObservationsError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState<boolean>(false);
  const [assessmentsError, setAssessmentsError] = useState<string | null>(null);

  // Derive target identifier from prop, initial student, or URL hash
  const effectiveId =
    propStudentId ||
    apiStudent?.id ||
    initialStudent?.id ||
    (() => {
      const hash = window.location.hash;
      const match = hash.match(/[#?]id=([^&]+)/) || hash.match(/#student_profile\/([^?&]+)/);
      return match ? match[1] : null;
    })();

  // Fetch real student profile from GET /api/students/:id
  const fetchStudentProfile = async () => {
    const idToFetch = propStudentId || (() => {
      const hash = window.location.hash;
      const match = hash.match(/[#?]id=([^&]+)/) || hash.match(/#student_profile\/([^?&]+)/);
      return match ? match[1] : null;
    })() || initialStudent?.id;

    if (!idToFetch) {
      // If no ID is available, fall back to initialStudent if present
      if (initialStudent) {
        setApiStudent(initialStudent);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/students/${effectiveId}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        }
        if (res.status === 404) {
          throw new Error(`Student record (#${effectiveId}) not found or you do not have permission to view it.`);
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch student record (Status ${res.status})`);
      }

      const data = await res.json();
      if (data.success && data.student) {
        setApiStudent(data.student);
      } else {
        throw new Error(data.error || 'Invalid student record returned by server.');
      }
    } catch (err: any) {
      console.error('[STUDENT_PROFILE] Error loading student profile:', err);
      setError(err.message || 'Unable to load student profile from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, [effectiveId]);

  // Fetch observation records for this student from the Observations API
  const fetchObservations = async () => {
    const targetId = apiStudent?.id || effectiveId;
    if (!targetId) return;
    setObservationsLoading(true);
    setObservationsError(null);
    try {
      const res = await fetch(`/api/observations?studentId=${encodeURIComponent(targetId)}&limit=100`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setObservations(data.observations || []);
      } else {
        setObservationsError(data.error || 'Failed to load observations.');
      }
    } catch (err: any) {
      setObservationsError(err.message || 'Failed to load observations.');
    } finally {
      setObservationsLoading(false);
    }
  };

  // Fetch assessment history records for this student from the Assessments API
  const fetchAssessments = async () => {
    const targetId = apiStudent?.id || effectiveId;
    if (!targetId) return;
    setAssessmentsLoading(true);
    setAssessmentsError(null);
    try {
      const res = await fetch(`/api/assessments/student/${encodeURIComponent(targetId)}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setAssessments(data.assessments || []);
      } else {
        setAssessmentsError(data.error || 'Failed to load assessments.');
      }
    } catch (err: any) {
      setAssessmentsError(err.message || 'Failed to load assessments.');
    } finally {
      setAssessmentsLoading(false);
    }
  };

  useEffect(() => {
    fetchObservations();
    fetchAssessments();
  }, [effectiveId, apiStudent?.id, refreshKey]);

  // Construct display representation
  const studentData = apiStudent || initialStudent;
  const displayName =
    studentData?.fullName ||
    studentData?.name ||
    [studentData?.firstName, studentData?.lastName].filter(Boolean).join(' ') ||
    studentData?.studentId ||
    'Student Profile';

  const displayGrade = studentData?.className || studentData?.grade || 'Unassigned Grade';
  const displaySection = studentData?.sectionName
    ? `Section ${studentData.sectionName}`
    : studentData?.classGroup || 'Unassigned Section';

  // Calculate age if dateOfBirth is present
  const calculatedAge = studentData?.dateOfBirth
    ? Math.floor((Date.now() - new Date(studentData.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : studentData?.age || 13;

  // Loading state skeleton
  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-40 mb-4"></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200 shrink-0"></div>
            <div className="space-y-2">
              <div className="h-6 bg-slate-200 rounded w-52"></div>
              <div className="h-4 bg-slate-100 rounded w-72"></div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-9 bg-slate-200 rounded-xl w-32"></div>
            <div className="h-9 bg-slate-200 rounded-xl w-36"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-72 bg-white border border-slate-200 rounded-2xl p-6"></div>
          <div className="lg:col-span-2 h-72 bg-white border border-slate-200 rounded-2xl p-6"></div>
        </div>
      </div>
    );
  }

  // Error / Not Found state
  if (error && !apiStudent) {
    return (
      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-rose-900">Unable to Load Student Profile</h2>
            <p className="text-xs font-medium text-rose-700">{error}</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('students')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Student Roster</span>
            </button>
            <button
              onClick={() => fetchStudentProfile()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <button
            onClick={() => setActiveTab('students')}
            className="hover:text-blue-700 transition-colors cursor-pointer"
          >
            Student Roster
          </button>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-800 font-semibold">{displayName}</span>
        </div>

        {studentData?.source && (
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
            Source: {studentData.source}
          </span>
        )}
      </div>

      {/* Student Profile Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-700 text-white font-bold text-xl flex items-center justify-center ring-2 ring-slate-100 shadow-2xs shrink-0">
            {displayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {displayName}
              </h1>
              {studentData?.isActive !== false ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active Enrolled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  Inactive
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                {displayGrade}
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-700">{displaySection}</span>
              <span>•</span>
              <span className="font-mono font-bold text-slate-900">ID: {studentData?.studentId}</span>
              {studentData?.academicSessionName && (
                <>
                  <span>•</span>
                  <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-100">
                    {studentData.academicSessionName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => {
              if (onGenerateReport) {
                onGenerateReport(displayName);
              } else {
                setActiveTab('student_report_preview');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Generate Report</span>
          </button>

          <button
            onClick={() => onOpenNewAssessment(displayName)}
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

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Real Demographic & School Information Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-5 self-start">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-900">Demographic & Registry</h2>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Verified DB Record
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Database ID</span>
                <span className="font-mono font-bold text-slate-900">{studentData?.id}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Admission No.</span>
                <span className="font-bold text-slate-900">{studentData?.admissionNo || '—'}</span>
              </div>

              {studentData?.registrationNo && (
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Registration No.</span>
                  <span className="font-bold text-slate-900">{studentData.registrationNo}</span>
                </div>
              )}

              {studentData?.externalStudentId && (
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">External API Key</span>
                  <span className="font-mono text-slate-700">{studentData.externalStudentId}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Gender</span>
                <span className="font-bold text-slate-900">{studentData?.gender || '—'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Date of Birth</span>
                <span className="font-bold text-slate-900">
                  {studentData?.dateOfBirth ? `${studentData.dateOfBirth} (${calculatedAge} yrs)` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Primary Email</span>
                <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                  {studentData?.email || '—'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Contact Phone</span>
                <span className="font-semibold text-slate-800">{studentData?.phone || '—'}</span>
              </div>

              {studentData?.lastSyncedAt && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 font-medium">Last Synced</span>
                  <span className="text-slate-600 font-medium">
                    {new Date(studentData.lastSyncedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-2">
              <span className="text-xs text-slate-500 font-medium block">Academic Placement</span>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{displayGrade}</span>
                  <span className="text-[11px] text-slate-500 font-medium">{displaySection}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Psychological Baseline & Recent Screening Scores */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Overview Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">Psychological Screening Baseline</h2>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold self-start sm:self-auto">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Tier 1 Active Support</span>
                </span>
              </div>

              <p className="text-xs text-slate-400 font-medium">
                Student Profile Record for {displayName} ({studentData?.studentId})
              </p>

              {/* Narrative box */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {displayName} is currently enrolled in {displayGrade} ({displaySection}). Standardized screening baseline reflects steady academic adaptation. Observational and clinical screening records are tracked within the centralized district database for longitudinal psychological wellness monitoring.
              </div>

              {/* Tags Row */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                  <span>Focus Baseline: Optimal</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-semibold">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Social Integration: Stable</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Enrollment</span>
                </span>
              </div>
            </div>

            {/* Recent Assessment Scores Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Standardized Assessment History</h3>
                </div>
                <button
                  onClick={() => setActiveProfileTab('assessments')}
                  className="text-xs text-blue-700 font-bold hover:underline cursor-pointer"
                >
                  View Full History &rarr;
                </button>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                {assessmentsLoading ? (
                  <p className="py-6 text-center text-slate-400">Loading assessments...</p>
                ) : assessments.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {assessments.slice(0, 3).map((a) => {
                      const dateStr = a.completedAt
                        ? new Date(a.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      const scoreStr = a.overallScore !== null && a.overallScore !== undefined ? `${a.overallScore}` : 'Pending';
                      const attentionLevel = a.attentionLevel || 'Normal';

                      let badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
                      if (attentionLevel === 'High' || attentionLevel === 'ATTENTION_REQUIRED') {
                        badgeColor = 'bg-rose-50 text-rose-700 border border-rose-200/60';
                      } else if (attentionLevel === 'Moderate' || attentionLevel === 'MONITOR') {
                        badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200/60';
                      }

                      return (
                        <div key={a.id} className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{a.assessmentTemplate?.name || 'Standard Assessment'}</h4>
                              <p className="text-[11px] text-slate-400 font-medium">{dateStr}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${badgeColor}`}>
                              {attentionLevel}
                            </span>
                            <span className="text-sm font-bold text-slate-900">{scoreStr}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-6 text-center text-slate-400">
                    No standardized assessments recorded for {displayName} yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OBSERVATIONS */}
      {activeTab === 'observations' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Submitted Observations for {displayName}
            </h3>
            {onOpenNewObservation && (
              <button
                onClick={onOpenNewObservation}
                className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
              >
                + Log Observation
              </button>
            )}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {observationsLoading ? (
              <p className="py-8 text-center text-slate-400">Loading observations...</p>
            ) : observationsError ? (
              <p className="py-8 text-center text-red-500">{observationsError}</p>
            ) : observations.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {observations.map((obs) => (
                  <div key={obs.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{obs.concernCategory}</span>
                      <span className="text-slate-500 text-[11px]">{obs.date} • by {obs.submitter}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                      {obs.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-slate-400">
                No observation logs recorded for {displayName} yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ASSESSMENTS */}
      {activeTab === 'assessments' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Screening Assessments for {displayName}
            </h3>
            <button
              onClick={() => onOpenNewAssessment(displayName)}
              className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
            >
              + Start Screening Protocol
            </button>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {assessmentsLoading ? (
              <p className="py-8 text-center text-slate-400">Loading assessments...</p>
            ) : assessmentsError ? (
              <p className="py-8 text-center text-red-500">{assessmentsError}</p>
            ) : assessments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {assessments.map((a) => {
                  const dateStr = a.completedAt
                    ? new Date(a.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const scoreStr = a.overallScore !== null && a.overallScore !== undefined ? `${a.overallScore}` : 'Pending';
                  const attentionLevel = a.attentionLevel || 'Normal';
                  const statusLabel = a.status === 'COMPLETED' ? 'Completed' : 'In Progress';

                  let badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
                  if (attentionLevel === 'High' || attentionLevel === 'ATTENTION_REQUIRED') {
                    badgeColor = 'bg-rose-50 text-rose-700 border border-rose-200/60';
                  } else if (attentionLevel === 'Moderate' || attentionLevel === 'MONITOR') {
                    badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200/60';
                  }

                  return (
                    <div key={a.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                          <ClipboardCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{a.assessmentTemplate?.name || 'Standard Assessment'}</h4>
                          <p className="text-[11px] text-slate-400 font-medium">{dateStr} • {statusLabel}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${badgeColor}`}>
                          {attentionLevel}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{scoreStr}</span>
                        {onSelectAssessmentResult && (
                          <button
                            onClick={onSelectAssessmentResult}
                            className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                          >
                            View Report &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-slate-400">
                No screening assessments recorded for {displayName} yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Psychological Evaluation Reports ({displayName})
            </h3>
            <button
              onClick={() => {
                if (onGenerateReport) {
                  onGenerateReport(displayName);
                } else {
                  setActiveTab('student_report_preview');
                }
              }}
              className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
            >
              + Generate New Report
            </button>
          </div>
          <p className="text-xs text-slate-500 font-medium py-6 text-center text-slate-400">
            Click "Generate New Report" to create an evaluation summary preview for {displayName}.
          </p>
        </div>
      )}
    </div>
  );
};
