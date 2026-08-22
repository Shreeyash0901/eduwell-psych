import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ActiveTab, Student, AssessmentResult } from '../../types';
import {
  Save,
  FileText,
  Brain,
  Lightbulb,
  Info,
  ExternalLink,
  Bold,
  Italic,
  List,
  Type,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronDown,
  User,
  Clock,
  Check
} from 'lucide-react';

interface CompletedAssessmentItem {
  id: number;
  studentId: string;
  numericStudentId: number;
  studentName: string;
  grade: string;
  section: string;
  protocolId: string;
  protocolTitle: string;
  overallScore: number;
  attentionLevel: string;
  completedAt: string;
  status: string;
  hasInterpretation: boolean;
  professionalInterpretation?: string;
  recommendations?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  respondentType: string;
  domains: { name: string; score: number; maxScore: number; status: string }[];
}

interface PsychologistInterpretationViewProps {
  assessmentId?: string | number | null;
  studentName?: string;
  recordNumber?: string;
  grade?: string;
  assessmentDate?: string;
  student?: Student;
  assessmentResult?: AssessmentResult;
  userRole?: string;
  onGenerateReport?: (reportData: {
    studentName: string;
    clinicalInterpretation: string;
    recommendations: string;
  }) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const PsychologistInterpretationView: React.FC<PsychologistInterpretationViewProps> = ({
  assessmentId: initialAssessmentId,
  studentName: initialStudentName,
  recordNumber: initialRecordNumber,
  grade: initialGrade,
  assessmentDate: initialAssessmentDate,
  student: initialStudent,
  assessmentResult: initialAssessmentResult,
  userRole,
  onGenerateReport,
  setActiveTab,
}) => {
  const isTeacher = userRole?.toLowerCase() === 'teacher';

  const [completedList, setCompletedList] = useState<CompletedAssessmentItem[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<CompletedAssessmentItem | null>(null);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [clinicalInterpretation, setClinicalInterpretation] = useState('');
  const [recommendations, setRecommendations] = useState('');

  // Fetch completed assessments queue
  useEffect(() => {
    let cancelled = false;
    const fetchCompleted = async () => {
      setIsLoadingList(true);
      try {
        const res = await fetch('/api/assessments/completed', { credentials: 'include' });
        const data = await res.json();
        if (data.success && Array.isArray(data.assessments) && !cancelled) {
          setCompletedList(data.assessments);

          // If an initial ID was passed, find it
          if (initialAssessmentId) {
            const found = data.assessments.find((a: any) => String(a.id) === String(initialAssessmentId));
            if (found) {
              selectAssessment(found);
              return;
            }
          }

          // If a student was passed, try to find an assessment for that student
          if (initialStudentName) {
            const match = data.assessments.find(
              (a: any) => a.studentName.toLowerCase() === initialStudentName.toLowerCase()
            );
            if (match) {
              selectAssessment(match);
              return;
            }
          }

          // Otherwise, if assessments exist, pick the first one that needs interpretation (or the first completed)
          if (data.assessments.length > 0) {
            const needsReview = data.assessments.find((a: any) => !a.hasInterpretation) || data.assessments[0];
            selectAssessment(needsReview);
          }
        }
      } catch (err) {
        console.error('Failed to load completed assessments:', err);
      } finally {
        if (!cancelled) setIsLoadingList(false);
      }
    };

    fetchCompleted();
    return () => { cancelled = true; };
  }, [initialAssessmentId, initialStudentName]);

  const selectAssessment = (item: CompletedAssessmentItem) => {
    setSelectedAssessment(item);
    setClinicalInterpretation(item.professionalInterpretation || '');
    setRecommendations(item.recommendations || '');
  };

  const handleAssessmentChange = (idStr: string) => {
    const found = completedList.find((a) => String(a.id) === idStr);
    if (found) {
      selectAssessment(found);
    }
  };

  const handleSaveInterpretation = async () => {
    if (!selectedAssessment) {
      toast.error('No assessment selected to interpret.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/assessments/${selectedAssessment.id}/interpretation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          professionalInterpretation: clinicalInterpretation.trim(),
          recommendations: recommendations.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Clinical interpretation saved for ${selectedAssessment.studentName}!`);
        // Update local list
        setCompletedList((prev) =>
          prev.map((a) =>
            a.id === selectedAssessment.id
              ? {
                  ...a,
                  hasInterpretation: Boolean(clinicalInterpretation.trim()),
                  professionalInterpretation: clinicalInterpretation.trim(),
                  recommendations: recommendations.trim(),
                  status: 'REVIEWED',
                }
              : a
          )
        );
      } else {
        toast.error(data.error || 'Failed to save clinical interpretation.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error saving interpretation.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateReport = async () => {
    if (selectedAssessment && (clinicalInterpretation || recommendations)) {
      await handleSaveInterpretation();
    }

    const currentStudentName = selectedAssessment?.studentName || initialStudentName || 'Student';
    if (onGenerateReport) {
      onGenerateReport({
        studentName: currentStudentName,
        clinicalInterpretation,
        recommendations,
      });
    } else {
      setActiveTab('student_report_preview');
    }
  };

  // Helper text styling insertion
  const applyFormatting = (field: 'clinical' | 'recommendations', type: 'bold' | 'italic' | 'list') => {
    if (field === 'clinical') {
      if (type === 'list') {
        setClinicalInterpretation((prev) => (prev ? `${prev}\n• ` : '• '));
      } else if (type === 'bold') {
        setClinicalInterpretation((prev) => `${prev} **Key Finding:** `);
      } else if (type === 'italic') {
        setClinicalInterpretation((prev) => `${prev} _(clinical note)_ `);
      }
    } else {
      if (type === 'list') {
        setRecommendations((prev) => (prev ? `${prev}\n1. ` : '1. '));
      } else if (type === 'bold') {
        setRecommendations((prev) => `${prev} **Recommended Intervention:** `);
      } else if (type === 'italic') {
        setRecommendations((prev) => `${prev} _(classroom strategy)_ `);
      }
    }
  };

  const activeStudentName = selectedAssessment?.studentName || initialStudentName || 'Select Student';
  const activeRecordNumber = selectedAssessment?.studentId || initialRecordNumber || 'STU-000';
  const activeGrade = selectedAssessment?.grade || initialGrade || 'Grade';
  const activeDate = selectedAssessment?.completedAt
    ? new Date(selectedAssessment.completedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : initialAssessmentDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const activeDomains = selectedAssessment?.domains || initialAssessmentResult?.domains || [];

  if (isTeacher) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
        <div className="bg-white border-2 border-purple-200 rounded-3xl p-8 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 mx-auto">
            <Brain className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Psychologist Scope Only</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Clinical interpretation, diagnostic formulation, and clinical note authoring are strictly restricted to licensed School Psychologists.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActiveTab('assessments')}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Return to Assessments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <button
              onClick={() => setActiveTab('assessments')}
              className="hover:text-blue-700 transition-colors cursor-pointer"
            >
              Assessments
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 font-medium">
              Clinical Interpretation &amp; Diagnosis
            </span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Psychologist Clinical Interpretation
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveInterpretation}
            disabled={isSaving || !selectedAssessment}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-purple-600" />
            <span>{isSaving ? 'Saving...' : 'Save Interpretation'}</span>
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={!selectedAssessment}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-purple-800 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Official Report</span>
          </button>
        </div>
      </div>

      {/* Selector: Completed Assessment Result to Interpret */}
      <div className="bg-white border border-purple-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100/70 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">
              Selected Completed Assessment
            </label>
            <p className="text-xs text-slate-500 font-medium">
              Choose which submitted student screening evaluation you are reviewing
            </p>
          </div>
        </div>

        <div className="min-w-[280px] sm:max-w-md w-full sm:w-auto">
          {completedList.length > 0 ? (
            <select
              value={selectedAssessment?.id || ''}
              onChange={(e) => handleAssessmentChange(e.target.value)}
              className="w-full bg-purple-50/50 border border-purple-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 shadow-2xs"
            >
              {completedList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.studentName} ({item.grade}) — {item.protocolTitle} (Score: {item.overallScore}/100) {item.hasInterpretation ? '✓ Reviewed' : '⚠️ Needs Review'}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-xs text-slate-400 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              {isLoadingList ? 'Loading completed assessments...' : 'No completed assessment submissions found.'}
            </div>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Clinical Form Inputs (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Clinical Interpretation */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
                <Brain className="w-5 h-5 text-purple-600" />
                <h2>Clinical &amp; Behavioral Interpretation</h2>
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-100 uppercase tracking-wider">
                Clinical Note
              </span>
            </div>

            {/* Custom Rich Formatting Toolbar */}
            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-purple-600 transition-all">
              <div className="bg-slate-50/80 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 text-slate-600">
                <button
                  type="button"
                  onClick={() => applyFormatting('clinical', 'bold')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('clinical', 'italic')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('clinical', 'list')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                  title="Bulleted List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <div className="h-4 w-px bg-slate-300 mx-1"></div>
                <button
                  type="button"
                  onClick={() =>
                    setClinicalInterpretation(
                      (prev) =>
                        `${prev}\n[Clinical Analysis]: Behavioral evaluation demonstrates elevated emotional dysregulation and peer interaction friction during group activities.`
                    )
                  }
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Insert template note"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Insert Template Note</span>
                </button>
              </div>

              <textarea
                rows={7}
                value={clinicalInterpretation}
                onChange={(e) => setClinicalInterpretation(e.target.value)}
                placeholder="Enter professional clinical interpretation based on assessment results and behavioral screening scores..."
                className="w-full p-4 bg-white text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-hidden resize-y font-normal"
              />
            </div>
          </div>

          {/* Card 2: Recommendations & Interventions */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <h2>Actionable Recommendations &amp; School Interventions</h2>
            </div>

            {/* Custom Rich Formatting Toolbar */}
            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-purple-600 transition-all">
              <div className="bg-slate-50/80 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 text-slate-600">
                <button
                  type="button"
                  onClick={() => applyFormatting('recommendations', 'bold')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('recommendations', 'italic')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('recommendations', 'list')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                  title="Numbered List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <textarea
                rows={6}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Outline actionable accommodations, classroom strategies, and parent support recommendations..."
                className="w-full p-4 bg-white text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-hidden resize-y font-normal"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Context, Highlights & Guidelines (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Student & Assessment Context */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Student &amp; Assessment Context</h3>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Student Name</span>
                <span className="font-bold text-slate-900">{activeStudentName}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Student ID</span>
                <span className="font-mono font-semibold text-slate-700">{activeRecordNumber}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Grade / Class</span>
                <span className="font-semibold text-slate-800">{activeGrade}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Assessment Protocol</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[150px]">
                  {selectedAssessment?.protocolTitle || 'Emotional & Behavioral Screening'}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Overall Score</span>
                <span className="font-bold text-purple-700">
                  {selectedAssessment?.overallScore !== undefined ? `${selectedAssessment.overallScore}/100` : 'Scored'}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Completion Date</span>
                <span className="font-semibold text-slate-800">{activeDate}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Domain Highlights */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Domain Breakdown</h3>
              <button
                onClick={() => setActiveTab('assessment_result')}
                className="text-slate-400 hover:text-purple-600 transition-colors"
                title="View full assessment report"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {activeDomains.length > 0 ? (
                activeDomains.map((domain) => (
                  <div key={domain.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 truncate">{domain.name}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          domain.status === 'CONCERN'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        }`}
                      >
                        {domain.score} pts ({domain.status === 'CONCERN' ? 'Concern' : 'Optimal'})
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          domain.status === 'CONCERN' ? 'bg-rose-500' : 'bg-purple-600'
                        }`}
                        style={{ width: `${Math.min(100, (domain.score / (domain.maxScore || 100)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-2">
                  No domain breakdown available for this screening.
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Clinical Guidelines Card */}
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Info className="w-4 h-4 text-purple-600 shrink-0" />
              <h4>Clinical Standards &amp; Ethical Guidelines</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
              Clinical interpretations saved here are synthesized into comprehensive student psychological reports and IEP documentation accessible to authorized multidisciplinary teams.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
