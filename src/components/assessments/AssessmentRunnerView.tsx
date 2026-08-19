import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AssessmentProtocol, Student, ActiveTab, AssessmentResult } from '../../types';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AssessmentRunnerViewProps {
  protocol: AssessmentProtocol;
  students: Student[];
  selectedStudentName?: string;
  onCompleteAssessment: (studentName: string, answers: Record<number, number>, serverAssessment?: any) => void;
  onCancel: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const AssessmentRunnerView: React.FC<AssessmentRunnerViewProps> = ({
  protocol,
  students,
  selectedStudentName = 'Alex Johnson',
  onCompleteAssessment,
  onCancel,
  setActiveTab,
}) => {
  const [currentStudentName, setCurrentStudentName] = useState<string>(selectedStudentName);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize assessment on mount or when protocol/student changes
  useEffect(() => {
    let cancelled = false;
    const startAssessment = async () => {
      const student = students.find((s) => s.name === currentStudentName);
      if (!student) return;

      setIsLoading(true);
      try {
        const res = await fetch('/api/assessments/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: student.id,
            assessmentTemplateId: Number(protocol.id),
          }),
        });
        const data = await res.json();
        if (data.success && !cancelled) {
          setAssessmentId(data.assessment.id);
          
          const loadedAnswers: Record<number, number> = {};
          if (data.assessment.responses) {
            data.assessment.responses.forEach((r: any) => {
              if (r.selectedOptionId) {
                loadedAnswers[r.questionId] = r.selectedOptionId;
              }
            });
          }
          setAnswers(loadedAnswers);
          
          setCurrentIndex(0);
        } else if (!data.success) {
          toast.error(data.error || 'Failed to start assessment');
        }
      } catch (err) {
        console.error('Error starting assessment:', err);
        toast.error('Network error starting assessment');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    startAssessment();
    return () => { cancelled = true; };
  }, [protocol.id, currentStudentName, students]);

  // Autosave when answers change
  useEffect(() => {
    if (!assessmentId || Object.keys(answers).length === 0) return;

    const timeoutId = setTimeout(async () => {
      try {
        const responsesData = Object.entries(answers).map(([qId, oId]) => ({
          questionId: Number(qId),
          selectedOptionId: oId,
        }));
        
        await fetch(`/api/assessments/${assessmentId}/responses`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responses: responsesData }),
        });
      } catch (e) {
        console.error("Autosave failed", e);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [answers, assessmentId]);

  const totalQuestions = protocol.questions.length || 0;
  const currentQuestion = protocol.questions[currentIndex];

  const progressPercent = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  const handleSelectOption = (optionId: number) => {
    if (currentQuestion) {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
    }
  };

  const handleNext = async () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await submitAssessment();
    }
  };

  const submitAssessment = async () => {
    if (!assessmentId) {
      toast.error('No active assessment session');
      return;
    }
    
    // Validate all required questions answered
    const unanswered = protocol.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions. Missing ${unanswered.length} response(s).`);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Submit responses
      const responsesData = Object.entries(answers).map(([qId, oId]) => ({
        questionId: Number(qId),
        selectedOptionId: oId,
      }));
      
      const res1 = await fetch(`/api/assessments/${assessmentId}/responses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: responsesData }),
      });
      const data1 = await res1.json();
      if (!data1.success) {
        toast.error(data1.error || 'Failed to save responses');
        setIsSubmitting(false);
        return;
      }

      // 2. Complete assessment
      const res2 = await fetch(`/api/assessments/${assessmentId}/complete`, {
        method: 'POST',
      });
      const data2 = await res2.json();
      if (!data2.success) {
        toast.error(data2.error || 'Failed to complete assessment');
        setIsSubmitting(false);
        return;
      }

      toast.success('Assessment completed successfully!');
      
      onCompleteAssessment(currentStudentName, answers, data2.assessment);

    } catch (err) {
      console.error('Error completing assessment:', err);
      toast.error('Network error completing assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Initializing assessment...</div>;
  }

  if (!currentQuestion) {
    return <div className="p-8 text-center text-slate-500">No questions available for this protocol.</div>;
  }

  // Fallback options if none provided from API
  const displayOptions = currentQuestion.options || [
    { id: 1, text: 'Never', score: 1 },
    { id: 2, text: 'Rarely', score: 2 },
    { id: 3, text: 'Sometimes', score: 3 },
    { id: 4, text: 'Often', score: 4 },
    { id: 5, text: 'Always', score: 5 },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Protocol Progress Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{protocol.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-slate-600">Student:</span>
              <select
                value={currentStudentName}
                onChange={(e) => setCurrentStudentName(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.classGroup})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold self-start sm:self-center">
            In Progress
          </span>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span>{progressPercent}% Completed</span>
          </div>

          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="bg-blue-700 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs space-y-8">
        <div className="text-center py-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug max-w-2xl mx-auto">
            &ldquo;{currentQuestion.text}&rdquo;
          </h2>
          <span className="inline-block mt-3 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
            Domain: {currentQuestion.domain}
          </span>
        </div>

        {/* Answer Options Radio List */}
        <div className="space-y-3 max-w-xl mx-auto">
          {displayOptions.map((opt) => {
            const isSelected = answers[currentQuestion.id] === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                className={`w-full p-4 rounded-xl border text-left font-semibold text-sm transition-all duration-150 flex items-center gap-4 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-600/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-blue-700 bg-blue-700' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={currentIndex === 0 ? onCancel : handlePrev}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentIndex === 0 ? 'Cancel' : 'Previous'}
        </button>

        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 shadow-sm transition-colors disabled:opacity-50"
        >
          <span>{isSubmitting ? 'Submitting...' : currentIndex === totalQuestions - 1 ? 'Finish Assessment' : 'Next'}</span>
          {!isSubmitting && (
            currentIndex === totalQuestions - 1 ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )
          )}
        </button>
      </div>
    </div>
  );
};
