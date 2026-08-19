import React, { useState } from 'react';
import { AssessmentResult, ActiveTab } from '../../types';
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
  AlertCircle
} from 'lucide-react';

interface AssessmentResultViewProps {
  result: AssessmentResult;
  userRole?: string;
  onBack: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const AssessmentResultView: React.FC<AssessmentResultViewProps> = ({
  result,
  userRole,
  onBack,
  setActiveTab,
}) => {
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
          scores: result.domains.reduce(
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {result.studentName}
            </h1>
            <span className="text-slate-400">•</span>
            <span className="text-sm font-semibold text-slate-600">{result.date}</span>
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
              onClick={() => setActiveTab('psychologist_interpretation')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 shadow-sm transition-colors cursor-pointer"
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
              <h4 className="text-xs font-bold text-amber-900">Attention Required</h4>
              <p className="text-xs text-amber-800 mt-0.5 font-medium">
                Review recommended for specific domains.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Domain Breakdown Cards Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Domain Breakdown</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.domains.map((domain) => (
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
                        style={{ width: `${domain.score}%` }}
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
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
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
