import React, { useState } from 'react';
import { Student, AssessmentProtocol, ActiveTab } from '../../types';
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Search,
  X,
  Check
} from 'lucide-react';

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
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(() => {
    if (selectedStudentName) {
      const match = students.find(
        (s) => s.name.toLowerCase() === selectedStudentName.toLowerCase()
      );
      if (match) return match;
    }
    return students[0] || null;
  });

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

  const currentProtocol: AssessmentProtocol = protocol || {
    id: 'p0',
    title: 'General Wellness Screener',
    description:
      "This assessment evaluates a student's baseline emotional well-being, stress levels, and overall academic engagement. Results will be stored securely in the student's clinical file.",
    domains: ['Emotional Regulation', 'Academic Stress', 'Engagement'],
    questionCount: 20,
    estTime: '10-15 mins',
    questions: [
      { id: 1, text: 'Student expresses positive anticipation when starting daily class tasks.', domain: 'Engagement' },
      { id: 2, text: 'Student manages frustration constructively during challenging assignments.', domain: 'Emotional Regulation' },
      { id: 3, text: 'Student demonstrates signs of elevated test anxiety before examinations.', domain: 'Academic Stress' },
      { id: 4, text: 'Student actively seeks support when experiencing emotional difficulty.', domain: 'Emotional Regulation' },
      { id: 5, text: 'Student maintains consistent focus during 20-minute structured exercises.', domain: 'Engagement' },
    ],
  };

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

  const handleBegin = () => {
    if (!selectedStudent) return;
    onStartAssessment(selectedStudent.name, currentProtocol);
  };

  return (
    <div className="min-h-full py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cancel Setup</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
            <ClipboardList className="w-4 h-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {currentProtocol.title}
          </h1>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed max-w-2xl mt-2 font-normal">
          This assessment evaluates a student&apos;s baseline emotional well-being, stress levels, and
          overall academic engagement. Results will be stored securely in the student&apos;s clinical file.
        </p>
      </div>

      {/* Main Setup Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6 relative">
        {/* Step Indicator */}
        <div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xs">
              1
            </div>
            <h2 className="text-base font-bold text-slate-900">Select Student</h2>
          </div>
          <hr className="border-slate-200/80 my-4" />
        </div>

        {/* Search Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600">
            Search by Name or ID
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., Jane Doe, 94821"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
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
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 flex items-center justify-between transition-all">
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
          <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
            No student selected. Search by name or ID above.
          </div>
        )}

        <hr className="border-slate-200/80 my-4" />

        {/* Footer Action */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleBegin}
            disabled={!selectedStudent}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Begin Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
