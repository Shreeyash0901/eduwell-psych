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
  User,
  Clock,
  Search,
  BookOpen,
  Filter,
  Eye,
  Edit3,
  Calendar,
  AlertCircle,
  MessageSquare,
  GraduationCap
} from 'lucide-react';

export interface CompletedAssessmentItem {
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
  observation?: {
    id: number;
    recordNumber: string;
    category: string;
    observation: string;
    setting?: string;
    triggers?: string;
    interventions?: string;
    submitterName?: string;
    observedAt?: string | null;
  } | null;
  domains: { name: string; score: number; maxScore: number; status: string }[];
  responses?: any[];
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
  onSelectAssessmentResult?: (item: CompletedAssessmentItem) => void;
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
  onSelectAssessmentResult,
  onGenerateReport,
  setActiveTab,
}) => {
  const isTeacher = userRole?.toLowerCase() === 'teacher';

  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'repository'>('editor');
  const [completedList, setCompletedList] = useState<CompletedAssessmentItem[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<CompletedAssessmentItem | null>(null);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [clinicalInterpretation, setClinicalInterpretation] = useState('');
  const [recommendations, setRecommendations] = useState('');

  // Search & Filter for All Interpretations Repository
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'reviewed' | 'needs_review'>('all');

  // Fetch completed assessments queue
  const fetchCompleted = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch('/api/assessments/completed', { credentials: 'include' });
      const data = await res.json();
      if (data.success && Array.isArray(data.assessments)) {
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

        // Otherwise, pick the first one that needs interpretation or the first completed
        if (data.assessments.length > 0) {
          const needsReview = data.assessments.find((a: any) => !a.hasInterpretation) || data.assessments[0];
          selectAssessment(needsReview);
        }
      }
    } catch (err) {
      console.error('Failed to load completed assessments:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchCompleted();
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
        
        // Update local state list
        setCompletedList((prev) =>
          prev.map((a) =>
            a.id === selectedAssessment.id
              ? {
                  ...a,
                  hasInterpretation: Boolean(clinicalInterpretation.trim()),
                  professionalInterpretation: clinicalInterpretation.trim(),
                  recommendations: recommendations.trim(),
                  status: 'REVIEWED',
                  reviewedBy: data.assessment?.reviewer?.name || 'School Psychologist',
                  reviewedAt: new Date().toISOString(),
                  observation: data.assessment?.observation || a.observation,
                }
              : a
          )
        );

        if (selectedAssessment) {
          setSelectedAssessment((prev) =>
            prev
              ? {
                  ...prev,
                  hasInterpretation: Boolean(clinicalInterpretation.trim()),
                  professionalInterpretation: clinicalInterpretation.trim(),
                  recommendations: recommendations.trim(),
                  status: 'REVIEWED',
                  reviewedBy: data.assessment?.reviewer?.name || 'School Psychologist',
                  reviewedAt: new Date().toISOString(),
                  observation: data.assessment?.observation || prev.observation,
                }
              : null
          );
        }
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
  const linkedObs = selectedAssessment?.observation;

  // Filtered Repository list
  const filteredRepository = completedList.filter((item) => {
    if (filterMode === 'reviewed' && !item.hasInterpretation) return false;
    if (filterMode === 'needs_review' && item.hasInterpretation) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.studentName.toLowerCase().includes(q) ||
      item.studentId.toLowerCase().includes(q) ||
      item.grade.toLowerCase().includes(q) ||
      item.protocolTitle.toLowerCase().includes(q) ||
      (item.professionalInterpretation && item.professionalInterpretation.toLowerCase().includes(q)) ||
      (item.observation?.submitterName && item.observation.submitterName.toLowerCase().includes(q)) ||
      (item.observation?.observation && item.observation.observation.toLowerCase().includes(q))
    );
  });

  const reviewedCount = completedList.filter((a) => a.hasInterpretation).length;
  const pendingCount = completedList.filter((a) => !a.hasInterpretation).length;

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
            Psychologist Clinical Interpretations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Synthesize teacher concerns and standardized screening results into professional diagnostic interpretations and IEP recommendations.
          </p>
        </div>

        {activeSubTab === 'editor' && (
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
        )}
      </div>

      {/* SUB-TABS: Active Editor vs. All Saved Interpretations Repository */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('editor')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'editor'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Clinical Note Editor</span>
          </button>

          <button
            onClick={() => setActiveSubTab('repository')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'repository'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>All Interpretations Log</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeSubTab === 'repository' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
              }`}
            >
              {completedList.length}
            </span>
          </button>
        </div>

        {activeSubTab === 'repository' && (
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            {reviewedCount} Reviewed • {pendingCount} Pending Interpretation
          </span>
        )}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CLINICAL INTERPRETATION EDITOR                     */}
      {/* ========================================================= */}
      {activeSubTab === 'editor' && (
        <div className="space-y-6">
          {/* Selector: Completed Assessment Result to Interpret */}
          <div className="bg-white border border-purple-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100/70 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">
                  Select Completed Student Assessment
                </label>
                <p className="text-xs text-slate-500 font-medium">
                  Select a submitted screening evaluation to interpret or review
                </p>
              </div>
            </div>

            <div className="min-w-[280px] sm:max-w-md w-full sm:w-auto">
              {completedList.length > 0 ? (
                <select
                  value={selectedAssessment?.id || ''}
                  onChange={(e) => handleAssessmentChange(e.target.value)}
                  className="w-full bg-purple-50/50 border border-purple-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer"
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

          {/* HIGHLIGHTED CARD: Originating Teacher Concern & Assessment Origin */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border-2 border-amber-300/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <MessageSquare className="w-4.5 h-4.5 text-amber-700" />
                <span>Originating Teacher Concern &amp; Incident Context</span>
              </div>
              {linkedObs && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-md self-start sm:self-auto uppercase tracking-wider">
                  Record {linkedObs.recordNumber} • {linkedObs.category}
                </span>
              )}
            </div>

            {linkedObs ? (
              <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-900">
                    Teacher: <span className="text-amber-900 font-bold">{linkedObs.submitterName || 'Classroom Teacher'}</span>
                  </span>
                  {linkedObs.setting && (
                    <span>
                      Setting: <span className="font-medium text-slate-700">{linkedObs.setting}</span>
                    </span>
                  )}
                  {linkedObs.observedAt && (
                    <span>
                      Observed: <span className="font-medium text-slate-700">{new Date(linkedObs.observedAt).toLocaleDateString()}</span>
                    </span>
                  )}
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-lg text-slate-800 italic leading-relaxed">
                  &ldquo;{linkedObs.observation}&rdquo;
                </div>

                {(linkedObs.triggers || linkedObs.interventions) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                    {linkedObs.triggers && (
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-700 block">Identified Triggers:</span>
                        <span className="text-slate-600">{linkedObs.triggers}</span>
                      </div>
                    )}
                    {linkedObs.interventions && (
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-700 block">Teacher Interventions Tried:</span>
                        <span className="text-slate-600">{linkedObs.interventions}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/80 rounded-xl p-3.5 border border-amber-200/80 text-xs text-slate-600 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Standard direct screening evaluation initiated for <strong>{activeStudentName}</strong> (Protocol: <em>{selectedAssessment?.protocolTitle || 'Wellbeing Inventory'}</em>).
                </span>
              </div>
            )}
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
                    Psychologist Diagnostic Synthesis
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
                            `${prev}\n[Clinical Synthesis]: Evaluation indicates moderate emotional dysregulation and peer performance friction under high-stakes timed classroom settings.`
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
                    placeholder="Enter professional clinical interpretation based on assessment results and teacher's behavioral observation..."
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
                    placeholder="Outline actionable accommodations, classroom strategies, and IEP/parent support recommendations..."
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
                  {onSelectAssessmentResult && selectedAssessment && (
                    <button
                      onClick={() => onSelectAssessmentResult(selectedAssessment)}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 cursor-pointer"
                      title="View full assessment score details"
                    >
                      <span>View Items</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
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
      )}

      {/* ========================================================= */}
      {/* TAB 2: ALL SAVED CLINICAL INTERPRETATIONS LOG & HISTORY   */}
      {/* ========================================================= */}
      {activeSubTab === 'repository' && (
        <div className="space-y-6">
          {/* Filter Bar & Search */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, ID, teacher, or clinical notes..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-purple-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({completedList.length})
              </button>

              <button
                onClick={() => setFilterMode('reviewed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterMode === 'reviewed'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ✓ Interpreted ({reviewedCount})
              </button>

              <button
                onClick={() => setFilterMode('needs_review')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterMode === 'needs_review'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ⚠️ Pending ({pendingCount})
              </button>
            </div>
          </div>

          {/* Interpretations List Grid */}
          {filteredRepository.length > 0 ? (
            <div className="grid grid-cols-1 gap-5">
              {filteredRepository.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:border-purple-300 hover:shadow-md transition-all space-y-4 group"
                >
                  {/* Top Bar: Student + Protocol + Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
                        {item.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900 group-hover:text-purple-700 transition-colors">
                            {item.studentName}
                          </h3>
                          <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {item.studentId}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            {item.grade} {item.section && `• ${item.section}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Evaluated: <strong className="text-slate-800">{item.protocolTitle}</strong> • Completed {new Date(item.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-lg border ${
                          item.hasInterpretation
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{item.hasInterpretation ? 'Interpretation Recorded' : 'Needs Interpretation'}</span>
                      </span>

                      <span className="text-xs font-bold text-slate-900 bg-purple-50 border border-purple-200 px-3 py-1 rounded-lg">
                        Score: <span className="text-purple-700">{item.overallScore}</span>/100
                      </span>
                    </div>
                  </div>

                  {/* Body Content Grid: Teacher Concern vs Psychologist Interpretation */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left: Originating Teacher Concern (5 cols) */}
                    <div className="lg:col-span-5 bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                          Teacher Concern
                        </span>
                        {item.observation?.category && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            {item.observation.category}
                          </span>
                        )}
                      </div>

                      {item.observation ? (
                        <>
                          <p className="text-slate-700 italic bg-white p-3 rounded-xl border border-amber-100 leading-relaxed">
                            &ldquo;{item.observation.observation}&rdquo;
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span>
                              Submitted by: <strong>{item.observation.submitterName || 'Teacher'}</strong>
                            </span>
                            {item.observation.setting && (
                              <span>Setting: <strong>{item.observation.setting}</strong></span>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-slate-500 italic bg-white/70 p-3 rounded-xl border border-amber-100">
                          Direct clinical evaluation initiated without a separate teacher observation record.
                        </p>
                      )}
                    </div>

                    {/* Right: Clinical Interpretation & Recommendations (7 cols) */}
                    <div className="lg:col-span-7 bg-purple-50/40 border border-purple-200/80 rounded-2xl p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-950 flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5 text-purple-700" />
                          Psychologist Clinical Interpretation &amp; Recommendations
                        </span>
                        {item.reviewedBy && (
                          <span className="text-[10px] font-semibold text-purple-700">
                            By {item.reviewedBy}
                          </span>
                        )}
                      </div>

                      {item.professionalInterpretation ? (
                        <div className="space-y-2">
                          <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-1">
                            <span className="font-bold text-purple-900 text-[11px] block uppercase tracking-wider">
                              Clinical Analysis:
                            </span>
                            <p className="text-slate-800 leading-relaxed">
                              {item.professionalInterpretation}
                            </p>
                          </div>

                          {item.recommendations && (
                            <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-1">
                              <span className="font-bold text-amber-900 text-[11px] block uppercase tracking-wider">
                                Actionable Interventions &amp; IEP Steps:
                              </span>
                              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                                {item.recommendations}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white/80 p-4 rounded-xl border border-purple-100 text-center space-y-2 text-slate-500">
                          <p className="italic">
                            No clinical interpretation added yet for this completed evaluation.
                          </p>
                          <button
                            onClick={() => {
                              selectAssessment(item);
                              setActiveSubTab('editor');
                            }}
                            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Brain className="w-3.5 h-3.5" />
                            <span>Add Interpretation Now</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        Protocol: <strong className="text-slate-700">{item.protocolTitle}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          selectAssessment(item);
                          setActiveSubTab('editor');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{item.hasInterpretation ? 'Edit Interpretation' : 'Add Interpretation'}</span>
                      </button>

                      {onSelectAssessmentResult && (
                        <button
                          onClick={() => onSelectAssessmentResult(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Scores</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (onGenerateReport) {
                            onGenerateReport({
                              studentName: item.studentName,
                              clinicalInterpretation: item.professionalInterpretation || '',
                              recommendations: item.recommendations || '',
                            });
                          } else {
                            setActiveTab('student_report_preview');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View / Generate Report</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 mx-auto">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Interpretations Found</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No completed screenings match "${searchQuery}". Try searching for another student or teacher name.`
                  : 'No evaluations match the selected filter.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
