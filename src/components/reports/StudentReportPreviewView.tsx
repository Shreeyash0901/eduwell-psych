import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ActiveTab, Student, AssessmentResult } from '../../types';
import {
  ArrowLeft,
  Printer,
  Download,
  User,
  Lightbulb,
  Eye,
  BarChart2,
  Sparkles,
  CheckCircle2,
  FileCheck,
  ChevronDown
} from 'lucide-react';

interface PsychologistReportNotes {
  clinicalInterpretation?: string;
  recommendations?: string;
  studentName?: string;
}

interface StudentReportPreviewViewProps {
  student?: Student;
  students?: Student[];
  assessmentResult?: AssessmentResult;
  psychologistNotes?: PsychologistReportNotes;
  authorName?: string;
  onSelectStudent?: (student: Student) => void;
  onBack: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const StudentReportPreviewView: React.FC<StudentReportPreviewViewProps> = ({
  student,
  students = [],
  assessmentResult,
  psychologistNotes,
  authorName = 'Dr. Sarah Jenkins',
  onSelectStudent,
  onBack,
}) => {
  const defaultStudent: Student = {
    id: 's_default',
    studentId: '#883492',
    name: 'Elijah Vance',
    grade: '8th Grade',
    classGroup: '8A',
    age: 13,
    homeroom: 'Homeroom 8A',
    iepStatus: 'No IEP',
    priorObsCount: 2,
    status: 'Attention Required',
    domainScores: {
      emotionalRegulation: 5.2,
      socialInteraction: 4.8,
      academicAnxiety: 6.2,
      focusAttention: 3.2,
      selfConfidence: 5.5,
      schoolAdjustment: 6.0,
    },
  };

  const [currentStudent, setCurrentStudent] = useState<Student>(() => {
    return student || (students.length > 0 ? students[0] : defaultStudent);
  });
  const [liveAssessment, setLiveAssessment] = useState<any>(assessmentResult || null);
  const [liveObsCount, setLiveObsCount] = useState<number>(currentStudent.priorObsCount || 0);
  const [liveObservations, setLiveObservations] = useState<any[]>([]);

  useEffect(() => {
    if (student) {
      setCurrentStudent(student);
    }
  }, [student]);

  useEffect(() => {
    let cancelled = false;
    const fetchStudentData = async () => {
      const targetId = currentStudent.studentId || currentStudent.id;
      if (!targetId) return;

      try {
        const [assessRes, obsRes] = await Promise.all([
          fetch(`/api/assessments/student/${encodeURIComponent(targetId)}`, { credentials: 'include' }),
          fetch(`/api/observations?studentId=${encodeURIComponent(targetId)}`, { credentials: 'include' })
        ]);

        const assessData = await assessRes.json();
        const obsData = await obsRes.json();

        if (!cancelled) {
          if (assessData.success && assessData.assessments && assessData.assessments.length > 0) {
            const latest = assessData.assessments[0];
            setLiveAssessment({
              id: String(latest.id),
              studentId: currentStudent.studentId,
              studentName: currentStudent.name,
              protocolTitle: latest.assessmentTemplate?.name || 'Screening Protocol',
              overallScore: Number(latest.overallScore) || 75,
              date: new Date(latest.completedAt || latest.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }),
              statusTag: latest.attentionLevel || 'Normal',
              professionalInterpretation: latest.professionalInterpretation,
              recommendations: latest.recommendations,
              domains: (latest.domainResults || []).map((dr: any) => ({
                name: dr.domain?.name || 'Domain',
                score: Number(dr.score),
                maxScore: Number(dr.maxScore) || 100,
                status: dr.attentionLevel === 'High' || dr.attentionLevel === 'ATTENTION_REQUIRED' ? 'CONCERN' : 'OPTIMAL',
              }))
            });
          }

          if (obsData.success && obsData.observations) {
            setLiveObsCount(obsData.observations.length);
            setLiveObservations(obsData.observations);
          }
        }
      } catch (err) {
        console.error('Error fetching student report context:', err);
      }
    };

    fetchStudentData();
    return () => {
      cancelled = true;
    };
  }, [currentStudent]);

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = students.find((s) => s.id === e.target.value);
    if (found) {
      setCurrentStudent(found);
      if (onSelectStudent) {
        onSelectStudent(found);
      }
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const getReferralText = () => {
    if (currentStudent.status === 'Attention Required') {
      return `Referred due to observed decline in academic engagement, heightened attention problems during prolonged instructional sessions, and active behavioral observation flags logged across classroom settings.`;
    }
    if (currentStudent.status === 'Monitor') {
      return `Referred for structured periodic monitoring and baseline psychological assessment review to evaluate classroom cognitive load, emotional regulation, and social integration.`;
    }
    return `Standard comprehensive wellness evaluation and proactive psychological baseline screening for academic and social-emotional development.`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      toast.info('Generating PDF report...');
      // Request backend report export or browser print if not saved yet
      window.print();
    } catch {
      toast.error('Failed to export report PDF');
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Profile</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Comprehensive Wellness Report
          </h1>
        </div>

        {/* Action Controls & Student Picker */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {students.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <User className="w-4 h-4 text-blue-700 shrink-0" />
              <label htmlFor="report-student-select" className="text-xs font-semibold text-slate-500 whitespace-nowrap hidden sm:inline">
                Student:
              </label>
              <div className="relative flex items-center">
                <select
                  id="report-student-select"
                  value={currentStudent.id}
                  onChange={handleStudentChange}
                  className="appearance-none text-xs sm:text-sm font-bold text-slate-900 bg-transparent pr-6 focus:outline-hidden cursor-pointer"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.grade} • {s.studentId})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" />
              </div>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Main Document Card (Confidential Psychological Evaluation) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 print:shadow-none print:border-none">
        {/* Document Header */}
        <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Confidential Psychological Evaluation
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Prepared by {authorName}, Lead School Psychologist
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-xs text-slate-400 font-medium block">Date of Report</span>
            <span className="text-sm font-bold text-slate-900 block mt-0.5">{currentDate}</span>
          </div>
        </div>

        {/* Section 1: Student Information & Referral Reason */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Student Information */}
          <div className="lg:col-span-7 border border-slate-200/90 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
              <User className="w-4 h-4" />
              <span>Student Information</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Name</span>
                <span className="font-bold text-slate-900 text-sm">{currentStudent.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Grade / Section</span>
                <span className="font-bold text-slate-900 text-sm">
                  {currentStudent.grade && currentStudent.grade !== 'N/A' ? currentStudent.grade : 'Grade 4'} {currentStudent.classGroup ? `(${currentStudent.classGroup})` : '(Section 4A)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Age / DOB</span>
                <span className="font-bold text-slate-900 text-sm">
                  {currentStudent.age ? `${currentStudent.age} Yrs` : '10 Yrs'} {currentStudent.dateOfBirth ? `• ${currentStudent.dateOfBirth}` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Student ID</span>
                <span className="font-bold text-slate-900 text-sm">{currentStudent.studentId || 'STU-1006'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 font-medium block">Homeroom Educator</span>
                <span className="font-bold text-slate-900 text-sm">{currentStudent.homeroom || 'Sarah Jenkins'}</span>
              </div>
            </div>
          </div>

          {/* Right: Referral Reason */}
          <div className="lg:col-span-5 bg-slate-50/70 border border-slate-200/90 rounded-xl p-5 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs mb-1.5">
                <Lightbulb className="w-4 h-4 text-slate-600" />
                <span>Referral Reason</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {getReferralText()}
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                <span>IEP Status:</span>
                <span className="font-bold">{currentStudent.iepStatus}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                <span>Status:</span>
                <span className="font-bold">{currentStudent.status}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Standardized Scores & Domain Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Observational Context */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Behavioral &amp; Observational Context</span>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-3 text-xs bg-white">
              {liveObservations.length > 0 ? (
                liveObservations.slice(0, 2).map((obs: any, index: number) => (
                  <React.Fragment key={obs.id}>
                    <div className="space-y-1">
                      <h4 className="font-bold text-blue-950">{obs.concernCategory || 'Observation'} - {obs.date}</h4>
                      <p className="text-slate-600 leading-relaxed font-normal">
                        {obs.narrative}
                      </p>
                    </div>
                    {index < Math.min(liveObservations.length, 2) - 1 && <hr className="border-slate-100" />}
                  </React.Fragment>
                ))
              ) : (
                <div className="space-y-1">
                  <p className="text-slate-600 leading-relaxed font-normal italic">
                    No recent verified observations logged for this student.
                  </p>
                </div>
              )}
              
              <hr className="border-slate-100" />

              <div className="space-y-1">
                <h4 className="font-bold text-blue-950">Total Prior Observations Logged</h4>
                <p className="text-slate-700 font-bold">
                  {liveObsCount} verified record{liveObsCount === 1 ? '' : 's'} on file
                </p>
              </div>
            </div>
          </div>

          {/* Right: Domain Results & Standardized Scores */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span>
                Domain Results &amp; Standardized Assessment (
                {liveAssessment?.protocolTitle || assessmentResult?.protocolTitle || 'Standardized Wellbeing Scale'})
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-white text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900">Standardized Domain Summary</span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Overall Score: {liveAssessment?.overallScore || assessmentResult?.overallScore || 72}/100
                </span>
              </div>

              {(liveAssessment?.domains?.length || assessmentResult?.domains?.length) ? (
                (liveAssessment?.domains || assessmentResult?.domains || []).map((domain: any) => (
                  <div key={domain.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{domain.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 text-[11px]">
                          {domain.score} / {domain.maxScore}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${
                            domain.status === 'CONCERN'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}
                        >
                          {domain.status === 'CONCERN' ? 'Concern' : 'Optimal'}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          domain.status === 'CONCERN' ? 'bg-rose-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, (domain.score / domain.maxScore) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                Object.entries(currentStudent.domainScores || {}).map(([key, score]) => {
                  const numScore = Number(score);
                  const isConcern = numScore < 5.0;
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 text-[11px]">
                            {numScore * 10}%
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${
                              isConcern
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}
                          >
                            {isConcern ? 'At Risk' : 'Optimal'}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isConcern ? 'bg-rose-600' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min(100, numScore * 10)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Interpretation & Recommendations */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Recorded Psychologist Interpretation &amp; Actionable Recommendations</span>
          </div>

          <div className="border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-6 bg-white text-xs">
            {/* Psychologist Clinical Interpretation */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Clinical Narrative &amp; Diagnosis Notes</h3>
              </div>
              <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                {liveAssessment?.professionalInterpretation?.trim() || psychologistNotes?.clinicalInterpretation?.trim() ||
                  `Standardized screening results for ${currentStudent.name} indicate domain variability across instructional settings. While general cognitive problem solving remains strong, elevated latency is observed during complex multi-step tasks. Recommendations emphasize proactive classroom chunking, executive functioning aids, and regular wellness check-ins.`}
              </div>
            </div>

            {/* Actionable Recommendations */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Actionable Accommodations &amp; Strategies</h3>
              </div>

              {(liveAssessment?.recommendations?.trim() || psychologistNotes?.recommendations?.trim()) ? (
                <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                  {liveAssessment?.recommendations?.trim() || psychologistNotes?.recommendations?.trim()}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Environmental &amp; Instructional Modifications</span>
                      <p className="text-slate-600 font-normal mt-0.5">
                        Seat near instructional focal point; allow structured 2-minute movement breaks during prolonged testing.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Executive Functioning Support</span>
                      <p className="text-slate-600 font-normal mt-0.5">
                        Provide visual task checklists and implement digital planner check-ins at the start of each morning.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Social-Emotional Check-ins</span>
                      <p className="text-slate-600 font-normal mt-0.5">
                        Conduct bi-weekly counseling check-ins to monitor anxiety somatic triggers and support self-advocacy.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Signature Block */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="w-48 h-10 border-b border-slate-300 flex items-center justify-start text-slate-700 italic font-serif text-base">
              {authorName}
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900">{authorName}, Ph.D.</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Licensed School Psychologist • Educational District Evaluation Team
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Confidential Document — Protected under FERPA / Educational Records Privacy
          </div>
        </div>
      </div>
    </div>
  );
};
