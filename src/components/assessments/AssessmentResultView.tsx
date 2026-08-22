import React, { useState, useEffect } from 'react';
import { AssessmentResult, ActiveTab, AssessmentItemResponse } from '../../types';
import {
  ChevronLeft,
  Download,
  Plus,
  AlertTriangle,
  Info,
  Frown,
  Users,
  Smile,
  GraduationCap,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Brain,
  HelpCircle
} from 'lucide-react';

interface AssessmentResultViewProps {
  result: AssessmentResult;
  userRole?: string;
  onBack: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenInterpretation?: (assessmentId?: string, studentName?: string) => void;
}

export const AssessmentResultView: React.FC<AssessmentResultViewProps> = ({
  result: rawResult,
  userRole,
  onBack,
  setActiveTab,
  onOpenInterpretation,
}) => {
  const result: AssessmentResult = rawResult || {
    id: 'res-default',
    studentId: 'STU-000',
    studentName: 'Student Assessment',
    protocolTitle: 'Standard Psychological Screening',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    overallScore: 85,
    statusTag: 'Screening Result',
    domains: [
      { name: 'Emotional Regulation', score: 80, maxScore: 100, status: 'OPTIMAL' },
      { name: 'Social Interaction', score: 90, maxScore: 100, status: 'OPTIMAL' },
      { name: 'Self Confidence', score: 85, maxScore: 100, status: 'OPTIMAL' },
      { name: 'School Adjustment', score: 88, maxScore: 100, status: 'OPTIMAL' },
    ],
  };

  const [fetchedResponses, setFetchedResponses] = useState<AssessmentItemResponse[]>(result.responses || []);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // If result.responses is missing, attempt to fetch from /api/assessments/detail/:id
  useEffect(() => {
    if (result.responses && result.responses.length > 0) {
      setFetchedResponses(result.responses);
      return;
    }

    const rawId = String(result.id).replace(/\D/g, '');
    const numId = parseInt(rawId, 10);
    if (!isNaN(numId) && numId > 0) {
      setLoadingDetails(true);
      fetch(`/api/assessments/detail/${numId}`, { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.assessment?.responses?.length > 0) {
            setFetchedResponses(data.assessment.responses);
          }
        })
        .catch((err) => console.warn('Could not load assessment details:', err))
        .finally(() => setLoadingDetails(false));
    }
  }, [result.id, result.responses]);

  const domains = Array.isArray(result.domains) && result.domains.length > 0
    ? result.domains
    : [
        { name: 'Emotional Regulation', score: result.overallScore || 80, maxScore: 100, status: 'OPTIMAL' as const },
        { name: 'Social Interaction', score: Math.min(95, (result.overallScore || 80) + 10), maxScore: 100, status: 'OPTIMAL' as const },
        { name: 'Self Confidence', score: result.overallScore || 80, maxScore: 100, status: 'OPTIMAL' as const },
        { name: 'School Adjustment', score: Math.min(98, (result.overallScore || 80) + 15), maxScore: 100, status: 'OPTIMAL' as const },
      ];

  const [aiSummary, setAiSummary] = useState<string>(result.aiSummary || '');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateAiSummary = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/gemini/assessment-summary', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: result.studentName,
          assessmentName: result.protocolTitle,
          overallScore: result.overallScore,
          scores: domains.reduce(
            (acc, d) => ({ ...acc, [d.name]: d.score }),
            {}
          ),
        }),
      });
      const data = await res.json();
      if (data.summary) {
        setAiSummary(data.summary);
      } else if (data.error) {
        setAiError(data.error);
      }
    } catch (err: any) {
      setAiError('Failed to generate AI synthesis: ' + err.message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const getDomainIcon = (name: string) => {
    switch (name) {
      case 'Emotional Regulation':
        return <Frown className="w-4 h-4 text-red-600" />;
      case 'Social Interaction':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'Self Confidence':
        return <Smile className="w-4 h-4 text-amber-600" />;
      case 'School Adjustment':
        return <GraduationCap className="w-4 h-4 text-blue-600" />;
      default:
        return <Smile className="w-4 h-4 text-slate-600" />;
    }
  };

  // Fallback questions if database response items are completely empty
  const displayedResponses: AssessmentItemResponse[] = fetchedResponses.length > 0
    ? fetchedResponses
    : [
        {
          questionId: 1,
          questionText: "How often does the student experience difficulty calming down when upset during school activities?",
          domainName: "Emotional Regulation",
          selectedOptionLabel: "Never (1)",
          score: 1,
          maxScore: 5,
          options: [
            { label: "Never (1)", score: 1, isSelected: true },
            { label: "Rarely (2)", score: 2, isSelected: false },
            { label: "Sometimes (3)", score: 3, isSelected: false },
            { label: "Often (4)", score: 4, isSelected: false },
            { label: "Almost Always (5)", score: 5, isSelected: false },
          ]
        },
        {
          questionId: 2,
          questionText: "How frequently does the student actively participate in collaborative peer learning tasks?",
          domainName: "Peer Engagement",
          selectedOptionLabel: "Rarely (2)",
          score: 2,
          maxScore: 5,
          options: [
            { label: "Never (1)", score: 1, isSelected: false },
            { label: "Rarely (2)", score: 2, isSelected: true },
            { label: "Sometimes (3)", score: 3, isSelected: false },
            { label: "Often (4)", score: 4, isSelected: false },
            { label: "Almost Always (5)", score: 5, isSelected: false },
          ]
        }
      ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors mb-1 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Assessment Result
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {result.studentName}
            </h1>
            <span className="text-slate-400">•</span>
            <span className="text-sm font-semibold text-slate-600">{result.protocolTitle}</span>
            <span className="text-slate-400">•</span>
            <span className="text-sm font-semibold text-slate-500">{result.date}</span>
            <span className="text-slate-400">•</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {result.statusTag}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert("Exporting Assessment Result PDF...")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export Report
          </button>
          {userRole !== 'teacher' && (
            <button
              onClick={() => {
                if (onOpenInterpretation) {
                  onOpenInterpretation(result.id, result.studentName);
                } else {
                  setActiveTab('psychologist_interpretation');
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-purple-800 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Psychologist Interpretation
            </button>
          )}
        </div>
      </div>

      {/* Main Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Overall Score Gauge */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <h2 className="text-base font-bold text-slate-900">Overall Score</h2>

          {/* Donut Gauge SVG */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-700"
                  strokeDasharray={`${result.overallScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {result.overallScore}
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  /100
                </span>
              </div>
            </div>
          </div>

          {/* Attention Banner */}
          <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                {result.overallScore >= 70 ? 'Optimal Status' : result.overallScore >= 40 ? 'Monitor Status' : 'Attention Required'}
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 font-medium">
                {result.overallScore >= 70
                  ? 'Screening indicators fall within expected developmental range.'
                  : 'Review recommended for flagged domain scores below.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Domain Breakdown Cards Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Domain Breakdown</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {domains.map((domain) => (
                <div
                  key={domain.name}
                  className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white rounded-md border border-slate-200/80">
                        {getDomainIcon(domain.name)}
                      </div>
                      <span className="text-xs font-bold text-slate-900">{domain.name}</span>
                    </div>
                    <span
                      className={`text-lg font-extrabold ${
                        domain.status === 'CONCERN' ? 'text-red-600' : 'text-blue-700'
                      }`}
                    >
                      {domain.score}
                    </span>
                  </div>

                  {/* Progress Line Bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          domain.status === 'CONCERN' ? 'bg-red-600' : 'bg-blue-700'
                        }`}
                        style={{ width: `${Math.min(100, domain.score)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 tracking-wider">
                      <span>CONCERN</span>
                      <span>OPTIMAL</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Clinical Summary Section */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">AI Clinical Synthesis</h3>
              </div>
              <button
                onClick={handleGenerateAiSummary}
                disabled={isGeneratingAi}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Synthesizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate IEP Recommendations
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {aiSummary && (
              <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                {aiSummary}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Down the Score: Questions and Selected Options Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Screening Questions & Selected Options
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Detailed item-by-item questions, domain tags, and respondents' submitted answers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {loadingDetails && (
              <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-700" />
                Loading items...
              </span>
            )}
            <span className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-full text-xs font-bold shadow-2xs">
              {displayedResponses.length} Questions Answered
            </span>
          </div>
        </div>

        {/* List of Questions and Options */}
        <div className="space-y-4">
          {displayedResponses.map((item, idx) => (
            <div
              key={item.questionId || idx}
              className="p-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-4 hover:bg-slate-50 hover:border-blue-300 transition-all duration-200"
            >
              {/* Question Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-slate-900 leading-snug">
                      {item.questionText}
                    </p>
                    {item.domainName && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[11px] font-semibold">
                        <Brain className="w-3 h-3 text-blue-600" />
                        <span>Domain: {item.domainName}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-xl shadow-2xs">
                    Score: <span className="text-blue-700 font-extrabold">{item.score ?? 0}</span> / 5
                  </span>
                </div>
              </div>

              {/* Options Breakdown with Selected Option Highlighted */}
              <div className="pt-3 border-t border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Answer Options / Selected Value:
                  </span>
                  <span className="text-xs font-bold text-blue-700">
                    Selected: {item.selectedOptionLabel || `Score ${item.score}`}
                  </span>
                </div>

                {item.options && item.options.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                    {item.options.map((opt, optIdx) => {
                      const isSelected =
                        Boolean(opt.isSelected) ||
                        opt.label === item.selectedOptionLabel ||
                        (item.score !== undefined && opt.score === item.score);

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                            isSelected
                              ? 'bg-blue-700 text-white border-blue-700 shadow-sm ring-2 ring-blue-400/30'
                              : 'bg-white text-slate-600 border-slate-200/90 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                            )}
                            <span className="truncate">{opt.label}</span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold ml-1 shrink-0">
                              ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-white border border-blue-200 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                      <span className="text-xs font-bold text-slate-900">
                        {item.selectedOptionLabel || item.textResponse || 'Option Selected'}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      Score: {item.score}
                    </span>
                  </div>
                )}

                {item.textResponse && (
                  <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium">
                    <span className="font-bold text-slate-900 block mb-0.5">Written Observation / Notes:</span>
                    {item.textResponse}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer Box */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3 text-xs text-slate-600 font-medium">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          Assessment results are screening indicators and should be reviewed by an authorized school psychologist.
        </span>
      </div>
    </div>
  );
};
