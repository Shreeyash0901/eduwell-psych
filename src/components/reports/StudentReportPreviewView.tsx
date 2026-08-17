import React from 'react';
import { ActiveTab } from '../../types';
import {
  ArrowLeft,
  Printer,
  Download,
  User,
  Lightbulb,
  Eye,
  BarChart2,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface StudentReportPreviewViewProps {
  onBack: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const StudentReportPreviewView: React.FC<StudentReportPreviewViewProps> = ({
  onBack,
}) => {
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
            <span>Back to Reports</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Comprehensive Wellness Report
          </h1>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            onClick={() => alert('Generating Confidential PDF Report for Elijah Vance...')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Generate PDF</span>
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
              Prepared by Dr. Sarah Jenkins, Lead School Psychologist
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-xs text-slate-400 font-medium block">Date of Report</span>
            <span className="text-sm font-bold text-slate-900 block mt-0.5">
              October 24, 2023
            </span>
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
                <span className="font-bold text-slate-900 text-sm">Elijah Vance</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Grade</span>
                <span className="font-bold text-slate-900 text-sm">8th Grade</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Age / DOB</span>
                <span className="font-bold text-slate-900 text-sm">13 / Sep 12, 2010</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Student ID</span>
                <span className="font-bold text-slate-900 text-sm">#883492</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 font-medium block">Primary Educator</span>
                <span className="font-bold text-slate-900 text-sm">Mr. Thompson</span>
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
                Referred by primary educator due to observed decline in academic engagement,
                increased instances of distractibility during prolonged tasks, and mild peer
                withdrawal over the past six weeks.
              </p>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                <span>!</span>
                <span>Routine Assessment</span>
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Teacher Observations & Standardized Scores */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Teacher Observations */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Teacher Observations</span>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-3 text-xs bg-white">
              <div className="space-y-1">
                <h4 className="font-bold text-blue-950">Academic Engagement</h4>
                <p className="text-slate-600 leading-relaxed font-normal">
                  Often requires redirection during independent work. Participates well in group
                  discussions.
                </p>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-1">
                <h4 className="font-bold text-blue-950">Social Interaction</h4>
                <p className="text-slate-600 leading-relaxed font-normal">
                  Polite but reserved. Recently prefers reading alone during unstructured time
                  rather than joining peers.
                </p>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-1">
                <h4 className="font-bold text-blue-950">Emotional Regulation</h4>
                <p className="text-slate-600 leading-relaxed font-normal">
                  Generally stable, though expresses visible frustration when faced with complex
                  multi-step math problems.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Domain Results & Standardized Scores (BASC-3 Summary) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span>Domain Results & Standardized Scores</span>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-white text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900">BASC-3 Summary</span>
                <span className="text-[11px] text-slate-400 font-medium">
                  T-Scores (Mean=50, SD=10)
                </span>
              </div>

              {/* Metric 1 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Hyperactivity</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600 text-[11px]">T: 62</span>
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      At Risk
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-800 rounded-full" style={{ width: '62%' }}></div>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Attention Problems</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600 text-[11px]">T: 68</span>
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                      Clinically Significant
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600 rounded-full" style={{ width: '68%' }}></div>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Atypicality</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600 text-[11px]">T: 45</span>
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                      Average
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>

              {/* Metric 4 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Withdrawal</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600 text-[11px]">T: 58</span>
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      At Risk
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-700 rounded-full" style={{ width: '58%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Interpretation & Recommendations */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Interpretation &amp; Recommendations</span>
          </div>

          <div className="border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-6 bg-white text-xs">
            {/* Psychologist Interpretation */}
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-slate-900">Psychologist Interpretation</h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                Results indicate elevated scores in Attention Problems and mild elevation in
                Hyperactivity and Withdrawal domains. The discrepancy between his strong cognitive
                abilities (WISC-V FSIQ: 115, details on file) and current classroom performance
                suggests executive functioning challenges rather than a lack of capability. The mild
                social withdrawal noted by his teacher aligns with the BASC-3 self-report,
                indicating he may be experiencing mild anxiety related to academic performance which
                he masks by disengaging.
              </p>
            </div>

            {/* Actionable Recommendations */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-sm text-slate-900">Actionable Recommendations</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Environmental Modifications</span>
                    <p className="text-slate-600 font-normal mt-0.5">
                      Seat near the point of instruction; provide frequent, brief breaks during
                      extended independent work periods.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Executive Functioning Support</span>
                    <p className="text-slate-600 font-normal mt-0.5">
                      Implement a visual schedule for complex tasks; require the use of an
                      assignment planner to chunk long-term projects.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Social-Emotional Intervention</span>
                    <p className="text-slate-600 font-normal mt-0.5">
                      Recommend 6-week small group counseling focused on academic anxiety management
                      and self-advocacy skills.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Signature Block */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="w-40 h-10 border-b border-slate-300 flex items-center justify-center text-slate-500 italic font-serif text-sm">
              Dr. Sarah Jenkins
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900">Dr. Sarah Jenkins, Ph.D.</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Licensed School Psychologist, License #SP48291
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
