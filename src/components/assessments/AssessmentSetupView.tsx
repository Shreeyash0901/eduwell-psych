import React, { useState } from 'react';
import { Student, AssessmentProtocol, ActiveTab } from '../../types';
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Search,
  X,
  Check,
  Plus,
  Trash2,
  Edit3,
  Send,
  Sparkles,
  Users,
  Clock,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface AssessmentSetupViewProps {
  students: Student[];
  protocol?: AssessmentProtocol;
  selectedStudentName?: string;
  onStartAssessment: (studentName: string, protocol: AssessmentProtocol) => void;
  onCancel: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const AssessmentSetupView: React.FC<AssessmentSetupViewProps> = ({
  students,
  protocol,
  selectedStudentName,
  onStartAssessment,
  onCancel,
  setActiveTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [respondent, setRespondent] = useState<'PSYCHOLOGIST' | 'TEACHER' | 'STUDENT' | 'PARENT'>('PSYCHOLOGIST');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [instructions, setInstructions] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isEditingQuestions, setIsEditingQuestions] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionDomain, setNewQuestionDomain] = useState('Emotional Regulation');

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(() => {
    if (selectedStudentName) {
      const match = students.find(
        (s) => s.name.toLowerCase() === selectedStudentName.toLowerCase()
      );
      if (match) return match;
    }
    return students[0] || null;
  });

  const defaultProtocol: AssessmentProtocol = protocol || {
    id: '1',
    title: 'Emotional & Behavioral Wellbeing Inventory',
    description:
      "This assessment evaluates a student's baseline emotional well-being, stress levels, and overall academic engagement. Results will be stored securely in the student's clinical file.",
    domains: ['Emotional Regulation', 'Academic Stress', 'Social Integration', 'Engagement'],
    questionCount: 5,
    estTime: '10-15 mins',
    questions: [
      { id: 1, text: 'Student expresses positive anticipation when starting daily class tasks.', domain: 'Engagement' },
      { id: 2, text: 'Student manages frustration constructively during challenging assignments.', domain: 'Emotional Regulation' },
      { id: 3, text: 'Student demonstrates signs of elevated test anxiety before examinations.', domain: 'Academic Stress' },
      { id: 4, text: 'Student actively seeks peer or teacher support when experiencing emotional difficulty.', domain: 'Social Integration' },
      { id: 5, text: 'Student maintains consistent focus during structured independent exercises.', domain: 'Emotional Regulation' },
    ],
  };

  const [questions, setQuestions] = useState<any[]>(defaultProtocol.questions || []);

  React.useEffect(() => {
    if (selectedStudentName) {
      const match = students.find(
        (s) => s.name.toLowerCase() === selectedStudentName.toLowerCase()
      );
      if (match) {
        setSelectedStudent(match);
      }
    }
  }, [selectedStudentName, students]);

  const filteredStudents = searchQuery.trim()
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.grade.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    const newQ = {
      id: Date.now(),
      text: newQuestionText.trim(),
      domain: newQuestionDomain,
    };
    setQuestions([...questions, newQ]);
    setNewQuestionText('');
  };

  const handleRemoveQuestion = (id: number | string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleUpdateQuestionText = (id: number | string, text: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, text } : q)));
  };

  const handleAssignOrStart = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student first.');
      return;
    }

    const updatedProtocol: AssessmentProtocol = {
      ...defaultProtocol,
      questions,
      questionCount: questions.length,
    };

    // If Psychologist administered, launch directly in the runner
    if (respondent === 'PSYCHOLOGIST') {
      onStartAssessment(selectedStudent.name, updatedProtocol);
      return;
    }

    // If assigned to Teacher, Student, or Parent, dispatch assignment to server
    setIsAssigning(true);
    try {
      const res = await fetch('/api/assessments/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentId: selectedStudent.id || selectedStudent.studentId,
          assessmentTemplateId: defaultProtocol.id || '1',
          respondentType: respondent,
          dueDate,
          instructions,
          customQuestions: questions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          `Assessment assigned to ${respondent.toLowerCase()} successfully! Due by ${dueDate}.`
        );
        setActiveTab('assessments');
      } else {
        toast.error(data.error || 'Failed to assign assessment.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error while assigning assessment.');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="min-h-full py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cancel Setup</span>
        </button>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {defaultProtocol.title}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Configure respondent parameters or customize screening questions.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            Editable Assessment
          </span>
        </div>
      </div>

      {/* Main Setup Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 sm:p-8 space-y-8 relative">
        {/* Step 1: Student Selection */}
        <div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xs">
              1
            </div>
            <h2 className="text-base font-bold text-slate-900">Select Student</h2>
          </div>
          <hr className="border-slate-100 my-4" />

          {/* Search Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600">
              Search by Name or Student ID
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., Alex Morgan, STU-1001"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
            </div>

            {/* Search Results Dropdown */}
            {searchQuery.trim() && filteredStudents.length > 0 && (
              <div className="mt-1 bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 max-h-48 overflow-y-auto z-10 relative">
                {filteredStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedStudent(s);
                      setSearchQuery('');
                    }}
                    className="w-full p-3 text-left flex items-center justify-between hover:bg-blue-50/60 transition-colors text-xs cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{s.name}</span>
                      <span className="text-slate-500 font-medium">
                        {s.grade} • ID: {s.studentId}
                      </span>
                    </div>
                    {selectedStudent?.id === s.id && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Student Card */}
          {selectedStudent ? (
            <div className="mt-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-blue-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  {getInitials(selectedStudent.name)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {selectedStudent.grade} • ID: {selectedStudent.studentId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Remove student"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="mt-3 p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
              No student selected. Search above or select from roster.
            </div>
          )}
        </div>

        {/* Step 2: Assessment Details & Assignment Target */}
        <div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xs">
              2
            </div>
            <h2 className="text-base font-bold text-slate-900">Assignment Parameters</h2>
          </div>
          <hr className="border-slate-100 my-4" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600">
                Respondent (Who will complete this?)
              </label>
              <select
                value={respondent}
                onChange={(e) => setRespondent(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer"
              >
                <option value="PSYCHOLOGIST">Psychologist (Administered Live)</option>
                <option value="TEACHER">Teacher (Assigned Rating Scale)</option>
                <option value="STUDENT">Student (Self-Report Questionnaire)</option>
                <option value="PARENT">Parent (Observer Scale)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600">
                Instructions for Respondent (Optional)
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g., Please complete this behavioral rating scale based on student's performance during morning group sessions over the past 2 weeks."
                rows={2}
                className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Editable Questions Customizer */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xs">
                3
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Custom Questions &amp; Items</h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {questions.length} questions in protocol. You can customize, add, or remove questions for this student.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingQuestions(!isEditingQuestions)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>{isEditingQuestions ? 'Done Editing' : 'Customize Questions'}</span>
            </button>
          </div>
          <hr className="border-slate-100 my-4" />

          {/* Questions list */}
          <div className="space-y-2.5">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    {isEditingQuestions ? (
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => handleUpdateQuestionText(q.id, e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                      />
                    ) : (
                      <p className="text-xs font-medium text-slate-800 leading-relaxed">{q.text}</p>
                    )}
                    <span className="inline-block mt-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {q.domain}
                    </span>
                  </div>
                </div>

                {isEditingQuestions && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(q.id)}
                    className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                    title="Remove question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add custom question input */}
          {isEditingQuestions && (
            <div className="mt-4 p-4 rounded-xl bg-blue-50/40 border border-blue-100 space-y-3">
              <span className="text-xs font-bold text-blue-900 block">Add Custom Question</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Type new question text..."
                  className="sm:col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                />
                <select
                  value={newQuestionDomain}
                  onChange={(e) => setNewQuestionDomain(e.target.value)}
                  className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  {defaultProtocol.domains.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Question
              </button>
            </div>
          )}
        </div>

        <hr className="border-slate-100 my-4" />

        {/* Footer Action */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            {respondent === 'PSYCHOLOGIST' ? (
              <span>Will launch live screening session.</span>
            ) : (
              <span className="flex items-center gap-1 text-indigo-700 font-semibold">
                <Users className="w-3.5 h-3.5" />
                Will notify {respondent.toLowerCase()} with custom rating scale.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAssignOrStart}
            disabled={!selectedStudent || isAssigning}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAssigning ? (
              <span>Assigning Assessment...</span>
            ) : respondent === 'PSYCHOLOGIST' ? (
              <>
                <span>Begin Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Assign to {respondent === 'TEACHER' ? 'Teacher' : respondent === 'STUDENT' ? 'Student' : 'Parent'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
