import React, { useState } from 'react';
import { toast } from 'sonner';
import { AssessmentProtocol, Student, ActiveTab } from '../../types';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AssessmentRunnerViewProps {
  protocol: AssessmentProtocol;
  students: Student[];
  selectedStudentName?: string;
  onCompleteAssessment: (studentName: string, answers: Record<number, number>) => void;
  onCancel: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

const ANSWER_OPTIONS = [
  { label: 'Never', value: 1 },
  { label: 'Rarely', value: 2 },
  { label: 'Sometimes', value: 3 },
  { label: 'Often', value: 4 },
  { label: 'Always', value: 5 },
];

export const AssessmentRunnerView: React.FC<AssessmentRunnerViewProps> = ({
  protocol,
  students,
  selectedStudentName = 'Alex Johnson',
  onCompleteAssessment,
  onCancel,
}) => {
  const [currentStudent, setCurrentStudent] = useState<string>(selectedStudentName);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({
    1: 2,
    2: 4,
    3: 3,
    4: 4,
    5: 3,
    6: 2,
    7: 3, // Question 7 default as shown in Screen 5
  });

  const totalQuestions = protocol.questions.length || 20;
  const currentQuestion = protocol.questions[currentIndex] || {
    id: currentIndex + 1,
    text: 'Student shows frustration when tasks become difficult.',
    domain: 'Stress',
  };

  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const handleSelectOption = (value: number) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast.success('Assessment completed successfully!');
      onCompleteAssessment(currentStudent, answers);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

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
                value={currentStudent}
                onChange={(e) => setCurrentStudent(e.target.value)}
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
          {ANSWER_OPTIONS.map((opt) => {
            const isSelected = answers[currentQuestion.id] === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelectOption(opt.value)}
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
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={currentIndex === 0 ? onCancel : handlePrev}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentIndex === 0 ? 'Cancel' : 'Previous'}
        </button>

        <button
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 shadow-sm transition-colors"
        >
          <span>{currentIndex === totalQuestions - 1 ? 'Finish Assessment' : 'Next'}</span>
          {currentIndex === totalQuestions - 1 ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};
