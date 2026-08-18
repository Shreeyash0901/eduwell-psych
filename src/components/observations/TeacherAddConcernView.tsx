import React, { useState } from 'react';
import { toast } from 'sonner';
import { Student, ActiveTab, ObservationRecord } from '../../types';
import {
  ArrowLeft,
  User,
  LayoutGrid,
  AlignLeft,
  Target,
  Users,
  BookOpen,
  UserCheck,
  Heart,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';

interface TeacherAddConcernViewProps {
  students: Student[];
  onSubmitObservation: (obs: ObservationRecord) => void;
  onCancel: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

type ConcernCategory = 'Attention' | 'Behaviour' | 'Learning' | 'Social' | 'Emotional' | 'Other';

export const TeacherAddConcernView: React.FC<TeacherAddConcernViewProps> = ({
  students,
  onSubmitObservation,
  onCancel,
  setActiveTab,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || 's2');
  const [selectedCategory, setSelectedCategory] = useState<ConcernCategory>('Attention');
  const [observationDetails, setObservationDetails] = useState('');

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const categories: { id: ConcernCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'Attention', label: 'Attention', icon: <Target className="w-5 h-5" /> },
    { id: 'Behaviour', label: 'Behaviour', icon: <Users className="w-5 h-5" /> },
    { id: 'Learning', label: 'Learning', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'Social', label: 'Social', icon: <UserCheck className="w-5 h-5" /> },
    { id: 'Emotional', label: 'Emotional', icon: <Heart className="w-5 h-5" /> },
    { id: 'Other', label: 'Other', icon: <MoreHorizontal className="w-5 h-5" /> },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!observationDetails.trim()) {
      alert('Please enter observation details before submitting.');
      return;
    }

    const newObs: ObservationRecord = {
      id: `obs-${Date.now()}`,
      recordNumber: `#${Math.floor(8000 + Math.random() * 1000)}`,
      studentId: selectedStudent?.studentId || '10482',
      studentName: selectedStudent?.name || 'Alex Johnson',
      classGroup: `${selectedStudent?.grade || 'Grade 4'} - Classroom`,
      source: 'Teacher',
      concernCategory: selectedCategory,
      date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      incidentTime: `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      setting: 'Classroom',
      status: 'New',
      submitter: 'Primary Educator',
      narrative: observationDetails,
      triggers: 'Observed during instructional lesson',
      interventions: 'Teacher classroom logging',
      psychologistNotes: '',
    };

    onSubmitObservation(newObs);
    toast.success('Observation recorded successfully!');
    setTimeout(() => {
      setActiveTab('observations');
    }, 900);
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Log Observation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Record a new concern or observation for a student.
        </p>
      </div>

      {/* Main Form Card (3 Numbered Steps) */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-7"
      >
        {/* Step 1: Select Student */}
        <div className="space-y-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <User className="w-4 h-4 text-blue-600" />
              <span>1. Select Student</span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Choose the student this observation pertains to.
            </p>
          </div>

          <div className="relative">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 pr-10 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600 appearance-none cursor-pointer transition-colors"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} • {s.grade} ({s.classGroup || s.homeroom}) • ID: {s.studentId}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Step 2: Concern Category */}
        <div className="space-y-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <LayoutGrid className="w-4 h-4 text-blue-600" />
              <span>2. Concern Category</span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Select the primary area of concern.
            </p>
          </div>

          {/* 6 Category Selection Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-600/20 font-bold shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold'
                  }`}
                >
                  <div
                    className={`${
                      isSelected ? 'text-blue-700' : 'text-slate-600'
                    }`}
                  >
                    {cat.icon}
                  </div>
                  <span className="text-xs">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Observation Details */}
        <div className="space-y-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <AlignLeft className="w-4 h-4 text-blue-600" />
              <span>3. Observation Details</span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Provide factual, objective details about the concern.
            </p>
          </div>

          <div className="space-y-1.5">
            <textarea
              rows={5}
              maxLength={500}
              value={observationDetails}
              onChange={(e) => setObservationDetails(e.target.value)}
              placeholder="E.g., Student exhibited difficulty focusing during the math lesson, repeatedly putting head on desk..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
            <div className="text-right text-[11px] text-slate-400 font-medium">
              {observationDetails.length} / 500 characters
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            Submit Observation
          </button>
        </div>
      </form>
    </div>
  );
};
