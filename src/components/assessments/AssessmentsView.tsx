import React, { useState, useEffect } from 'react';
import { AssessmentProtocol, ActiveTab } from '../../types';
import {
  Smile,
  Brain,
  Target,
  Play,
  Plus,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
  Sparkles,
  ArrowRight,
  Send,
  AlertCircle,
  FileCheck,
  Users,
} from 'lucide-react';
import { TemplateBuilderModal } from './TemplateBuilderModal';

interface AssignedAssessmentItem {
  id: number;
  studentId: string;
  studentName: string;
  grade: string;
  protocolId: string;
  protocolTitle: string;
  domains: string[];
  questionCount: number;
  estTime: string;
  questions: any[];
  respondentType: string;
  assignedToTeacher?: string;
  status: string;
  dueDate: string | null;
  instructions: string;
  assignedBy: string;
  createdAt: string;
}

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

interface AssessmentsViewProps {
  protocols: AssessmentProtocol[];
  userRole?: string;
  onStartProtocol: (protocol: AssessmentProtocol, studentName?: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onRefreshProtocols?: () => void;
  onSelectForInterpretation?: (item: CompletedAssessmentItem) => void;
  onSelectAssessmentResult?: (item: CompletedAssessmentItem) => void;
}

export const AssessmentsView: React.FC<AssessmentsViewProps> = ({
  protocols,
  userRole,
  onStartProtocol,
  setActiveTab,
  onRefreshProtocols,
  onSelectForInterpretation,
  onSelectAssessmentResult,
}) => {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [assignedAssessments, setAssignedAssessments] = useState<AssignedAssessmentItem[]>([]);
  const [completedAssessments, setCompletedAssessments] = useState<CompletedAssessmentItem[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 6;

  const isTeacher = userRole?.toLowerCase() === 'teacher';

  const fetchAssigned = async () => {
    setLoadingAssigned(true);
    try {
      const [assignedRes, completedRes] = await Promise.all([
        fetch('/api/assessments/assigned', { credentials: 'include' }),
        fetch('/api/assessments/completed', { credentials: 'include' }),
      ]);
      const assignedData = await assignedRes.json();
      const completedData = await completedRes.json();

      if (assignedData.success && Array.isArray(assignedData.assessments)) {
        setAssignedAssessments(assignedData.assessments);
      }
      if (completedData.success && Array.isArray(completedData.assessments)) {
        setCompletedAssessments(completedData.assessments);
      }
    } catch (err) {
      console.error('[AssessmentsView] failed to load assessments:', err);
    } finally {
      setLoadingAssigned(false);
    }
  };

  useEffect(() => {
    fetchAssigned();
  }, []);

  const totalPages = Math.ceil(protocols.length / limit) || 1;
  const paginatedProtocols = protocols.slice((page - 1) * limit, page * limit);

  const getProtocolIcon = (id: string) => {
    switch (id) {
      case 'p1':
        return <Smile className="w-5 h-5 text-blue-600" />;
      case 'p2':
        return <Brain className="w-5 h-5 text-blue-600" />;
      case 'p3':
        return <Target className="w-5 h-5 text-blue-600" />;
      default:
        return <Brain className="w-5 h-5 text-blue-600" />;
    }
  };

  const handleStartAssigned = (item: AssignedAssessmentItem) => {
    const protocolObj: AssessmentProtocol = {
      id: item.protocolId,
      title: item.protocolTitle,
      description: item.instructions || `Assigned assessment for ${item.studentName}`,
      domains: item.domains || ['Emotional Regulation', 'Social Integration'],
      questionCount: item.questionCount || item.questions?.length || 5,
      estTime: item.estTime || '10 mins',
      questions: item.questions || [],
      assignedAssessmentId: item.id,
    };

    onStartProtocol(protocolObj, item.studentName);
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Header Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Assessment &amp; Screening Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-3xl">
            {isTeacher
              ? 'Complete assigned student screenings and review submitted evaluations for your assigned classes.'
              : 'Conduct standardized clinical screenings, assign editable evaluations to teachers, students, or parents, and synthesize results.'}
          </p>
        </div>

        {!isTeacher && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBuilderOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Protocol</span>
            </button>

            <button
              onClick={() => setActiveTab('psychologist_interpretation')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <Brain className="w-4 h-4 text-indigo-600" />
              <span>Clinical Interpretation</span>
            </button>
          </div>
        )}
      </div>

      {/* HIGHLIGHTED SECTION: Assigned & Pending Assessments */}
      {assignedAssessments.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 border-2 border-indigo-400/80 rounded-3xl p-6 sm:p-7 shadow-[0_8px_32px_rgba(79,70,229,0.12)] relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
              </span>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Active Assigned Assessments</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-2xs">
                  {assignedAssessments.length} Active
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Evaluations assigned to teachers, parents, or students pending submission
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedAssessments.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-indigo-100/90 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      <Users className="w-3 h-3" />
                      Assigned to {item.respondentType}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3" />
                      Due {item.dueDate || 'Soon'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-2.5 group-hover:text-indigo-600 transition-colors">
                    {item.protocolTitle}
                  </h3>

                  <div className="mt-2 text-xs space-y-1.5">
                    <p className="font-semibold text-slate-800">
                      Student: <span className="text-blue-700">{item.studentName}</span> ({item.studentId})
                    </p>
                    
                    {item.respondentType === 'TEACHER' && (
                      <div className="flex items-center gap-1 text-[11px] text-indigo-900 bg-indigo-50/70 border border-indigo-100 px-2 py-1 rounded-lg">
                        <span className="font-bold text-indigo-700">Teacher:</span>
                        <span className="font-medium truncate">{item.assignedToTeacher || 'Class Teacher'}</span>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400">
                      Assigned by: <span className="font-medium text-slate-600">{item.assignedBy}</span>
                    </p>
                    {item.instructions && (
                      <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg mt-2 border border-slate-100 line-clamp-2">
                        &ldquo;{item.instructions}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {item.questionCount} Questions
                  </span>
                  <button
                    onClick={() => handleStartAssigned(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Complete Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HIGHLIGHTED SECTION: Submitted Assessments Awaiting / With Clinical Interpretation */}
      {completedAssessments.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
                <Brain className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Submitted Assessment Results</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                    {completedAssessments.length} Completed
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Scored evaluations ready for psychologist review and clinical interpretation
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {completedAssessments.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between space-y-4 hover:border-purple-300 hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        item.hasInterpretation
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      {item.hasInterpretation ? 'Interpretation Added' : 'Needs Interpretation'}
                    </span>

                    <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                      Score: <span className="text-blue-700">{item.overallScore}</span>/100
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-2.5 group-hover:text-purple-700 transition-colors">
                    {item.protocolTitle}
                  </h3>

                  <div className="mt-2 text-xs space-y-1">
                    <p className="font-bold text-slate-900">
                      Student: <span className="text-blue-700">{item.studentName}</span> ({item.studentId})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {item.grade} {item.section && `• Section ${item.section}`} • Completed {new Date(item.completedAt).toLocaleDateString()}
                    </p>
                    {item.professionalInterpretation && (
                      <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg mt-2 border border-slate-200 line-clamp-2">
                        &ldquo;{item.professionalInterpretation}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      if (onSelectAssessmentResult) {
                        onSelectAssessmentResult(item);
                      } else {
                        setActiveTab('assessment_result');
                      }
                    }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                      isTeacher
                        ? 'w-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-center justify-center shadow-xs inline-flex items-center gap-1.5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>View Scores</span>
                  </button>

                  {!isTeacher && (
                    <button
                      onClick={() => {
                        if (onSelectForInterpretation) {
                          onSelectForInterpretation(item);
                        } else {
                          setActiveTab('psychologist_interpretation');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      <Brain className="w-3.5 h-3.5" />
                      <span>{item.hasInterpretation ? 'Edit Clinical Note' : 'Add Interpretation'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protocol Cards Grid Section Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-bold text-slate-900">Standardized Protocol Library</h2>
        <span className="text-xs font-semibold text-slate-500">
          Showing {protocols.length} Available Protocols
        </span>
      </div>

      {/* Protocol Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {paginatedProtocols.map((protocol) => (
          <div
            key={protocol.id}
            className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all duration-300 group"
          >
            <div className="space-y-4">
              {/* Icon & Title */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-2xl shrink-0 group-hover:scale-105 transition-transform">
                  {getProtocolIcon(protocol.id)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {protocol.title}
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 mt-1 inline-block">
                    Active Protocol
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {protocol.description}
              </p>

              {/* Protocol Metadata Box */}
              <div className="bg-slate-50/70 rounded-2xl p-4 space-y-2.5 border border-slate-200/60 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium">Domain:</span>
                  <span className="text-slate-900 font-semibold text-right leading-tight">
                    {protocol.domains.join(', ')}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium">Questions:</span>
                  <span className="text-slate-900 font-bold text-right">{protocol.questionCount} Items</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium">Est. Duration:</span>
                  <span className="text-slate-900 font-bold text-right">{protocol.estTime}</span>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-6">
              <button
                onClick={() => onStartProtocol(protocol)}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch / Assign Screening</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm mt-6">
          <span className="text-xs text-slate-500 font-medium">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, protocols.length)} of {protocols.length} protocols
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1 rounded-md border border-slate-200">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Visual Assessment Template Builder Modal */}
      <TemplateBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onTemplateCreated={onRefreshProtocols}
      />
    </div>
  );
};
