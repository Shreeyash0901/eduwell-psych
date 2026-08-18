import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';

interface PsychologistInterpretationViewProps {
  studentName?: string;
  recordNumber?: string;
  grade?: string;
  assessmentDate?: string;
  student?: Student;
  assessmentResult?: AssessmentResult;
  onGenerateReport?: (reportData: {
    studentName: string;
    clinicalInterpretation: string;
    recommendations: string;
  }) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const PsychologistInterpretationView: React.FC<PsychologistInterpretationViewProps> = ({
  studentName = 'Alex Mercer',
  recordNumber = '#8472',
  grade = '10th Grade',
  assessmentDate = 'Oct 24, 2023',
  student,
  assessmentResult,
  onGenerateReport,
  setActiveTab,
}) => {
  const [clinicalInterpretation, setClinicalInterpretation] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  const handleSaveDraft = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleGenerateReport = () => {
    if (onGenerateReport) {
      onGenerateReport({
        studentName,
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

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {savedToast && (
        <div className="fixed top-20 right-8 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-semibold z-50 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Draft interpretation saved for {studentName}!</span>
        </div>
      )}

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
              Student Record {recordNumber}
            </span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Psychologist Interpretation
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4 text-blue-600" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleGenerateReport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Clinical Form Inputs (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Clinical Interpretation */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
                <Brain className="w-5 h-5 text-blue-600" />
                <h2>Clinical Interpretation</h2>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100 uppercase tracking-wider">
                Required
              </span>
            </div>

            {/* Custom Rich Formatting Toolbar */}
            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 transition-all">
              <div className="bg-slate-50/80 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 text-slate-600">
                <button
                  type="button"
                  onClick={() => applyFormatting('clinical', 'bold')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('clinical', 'italic')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('clinical', 'list')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
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
                        `${prev}\n[Cognitive Assessment Analysis]: Student exhibits strong verbal problem solving with heightened response latency under timed testing conditions.`
                    )
                  }
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors text-xs font-semibold flex items-center gap-1"
                  title="Insert template note"
                >
                  <Type className="w-3.5 h-3.5" />
                </button>
              </div>

              <textarea
                rows={7}
                value={clinicalInterpretation}
                onChange={(e) => setClinicalInterpretation(e.target.value)}
                placeholder="Enter clinical interpretation based on assessment results..."
                className="w-full p-4 bg-white text-slate-800 placeholder:text-slate-400 text-sm focus:outline-hidden resize-y font-normal"
              />
            </div>
          </div>

          {/* Card 2: Recommendations & Interventions */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h2>Recommendations & Interventions</h2>
            </div>

            {/* Custom Rich Formatting Toolbar */}
            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 transition-all">
              <div className="bg-slate-50/80 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 text-slate-600">
                <button
                  type="button"
                  onClick={() => applyFormatting('recommendations', 'bold')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('recommendations', 'italic')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('recommendations', 'list')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                  title="Numbered List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <textarea
                rows={6}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Outline actionable recommendations for educators and parents..."
                className="w-full p-4 bg-white text-slate-800 placeholder:text-slate-400 text-sm focus:outline-hidden resize-y font-normal"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Context, Highlights & Guidelines (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Student Context */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Student Context</h3>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Name</span>
                <span className="font-bold text-slate-900">{studentName}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Grade</span>
                <span className="font-semibold text-slate-800">{grade}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Assessment Date</span>
                <span className="font-semibold text-slate-800">{assessmentDate}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Assessment Highlights */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Assessment Highlights</h3>
              <button
                onClick={() => setActiveTab('assessment_result')}
                className="text-slate-400 hover:text-blue-600 transition-colors"
                title="View full assessment report"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {assessmentResult && assessmentResult.domains.length > 0 ? (
                assessmentResult.domains.slice(0, 3).map((domain) => (
                  <div key={domain.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{domain.name}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          domain.status === 'CONCERN'
                            ? 'bg-red-50 text-red-700 border border-red-200/60'
                            : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        }`}
                      >
                        {domain.status === 'CONCERN' ? 'Elevated Concern' : 'Optimal'}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          domain.status === 'CONCERN' ? 'bg-red-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, (domain.score / domain.maxScore) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Focus & Attention</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] bg-red-50 text-red-700 border border-red-200/60">
                        Elevated
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="bg-red-600 h-full rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Emotional Regulation</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200/60">
                        Stable
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Card 3: Guidelines Card */}
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Info className="w-4 h-4 text-slate-600 shrink-0" />
              <h4>Guidelines</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Ensure recommendations are specific, measurable, and tailored to the school
              environment. Avoid overly clinical jargon where possible to aid educator
              comprehension.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
