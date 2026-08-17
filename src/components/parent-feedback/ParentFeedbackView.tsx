import React, { useState } from 'react';
import { Student, ObservationRecord, ActiveTab } from '../../types';
import {
  Home,
  Send,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Copy,
  Check,
  ArrowLeft,
  Share2
} from 'lucide-react';

interface ParentFeedbackViewProps {
  students: Student[];
  selectedStudentName?: string;
  onSubmitFeedback: (newObs: ObservationRecord) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const ParentFeedbackView: React.FC<ParentFeedbackViewProps> = ({
  students,
  selectedStudentName = 'Alex Johnson',
  onSubmitFeedback,
  setActiveTab,
}) => {
  const [currentStudentName, setCurrentStudentName] = useState<string>(selectedStudentName);
  const [noticedAtHome, setNoticedAtHome] = useState('');
  const [optionalComments, setOptionalComments] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRecordNumber, setSubmittedRecordNumber] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const currentStudent =
    students.find((s) => s.name.toLowerCase() === currentStudentName.toLowerCase()) ||
    students[0] || {
      id: 'STU-4055',
      studentId: 'STU-4055',
      name: currentStudentName,
      grade: 'Grade 5',
      classGroup: '5A',
    };

  const studentFirstName = currentStudent.name.split(' ')[0] || 'the student';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticedAtHome.trim()) {
      alert('Please describe what you have noticed at home before submitting.');
      return;
    }

    const recNum = `OBS-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedRecordNumber(recNum);

    const fullNarrative = optionalComments.trim()
      ? `${noticedAtHome.trim()}\n\nAdditional Parent Notes: ${optionalComments.trim()}`
      : noticedAtHome.trim();

    const newObservation: ObservationRecord = {
      id: `obs-${Date.now()}`,
      recordNumber: recNum,
      studentId: currentStudent.studentId,
      studentName: currentStudent.name,
      classGroup: currentStudent.classGroup || '5A',
      source: 'Parent',
      concernCategory: 'Behavioral',
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      incidentTime: 'Home Environment',
      setting: 'Home / Family Context',
      status: 'New',
      submitter: 'Parent / Guardian',
      narrative: fullNarrative,
      triggers: 'Observed during evening routines / home tasks',
      interventions: 'Parent monitoring & home support',
      psychologistNotes: 'Submitted via EduWell Parent Feedback portal. Awaiting review.',
      aiAnalysis:
        'Parent-reported home observations indicate environmental stress indicators. Cross-referencing with classroom observation history recommended.',
    };

    onSubmitFeedback(newObservation);
    setIsSubmitted(true);
  };

  const handleCopyLink = () => {
    const url = window.location.origin + '/parent-feedback';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleReset = () => {
    setNoticedAtHome('');
    setOptionalComments('');
    setIsSubmitted(false);
  };

  return (
    <div className="min-h-full py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-start sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {currentStudent.name}
            </h1>
            {students.length > 1 && (
              <div className="relative inline-block">
                <select
                  value={currentStudent.name}
                  onChange={(e) => setCurrentStudentName(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  title="Switch Student"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.grade})
                    </option>
                  ))}
                </select>
                <span className="inline-flex items-center text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-200 cursor-pointer transition-colors">
                  Change Student <ChevronDown className="w-3 h-3 ml-1" />
                </span>
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500">
            School Request / Observation Form
          </p>
        </div>

        {/* Brand Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyLink}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            title="Copy shareable parent link"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Share Link</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 text-blue-700 font-bold text-sm sm:text-base">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-2xs">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <span>EduWell Psych</span>
          </div>
        </div>
      </div>

      {/* Main Feedback Form Card */}
      {!isSubmitted ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card Header */}
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg sm:text-xl">
                <Home className="w-5 h-5 text-blue-600 shrink-0" />
                <h2>Parent Feedback</h2>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm mt-2.5 leading-relaxed">
                Please provide your observations regarding {studentFirstName}&apos;s behavior and
                well-being at home. This information helps us create a comprehensive understanding of
                their needs.
              </p>
            </div>

            <hr className="border-slate-200/80" />

            {/* Question 1: What have you noticed at home? */}
            <div>
              <label
                htmlFor="noticed-at-home"
                className="block text-sm sm:text-base font-bold text-slate-900 mb-2"
              >
                What have you noticed at home?
              </label>
              <textarea
                id="noticed-at-home"
                rows={5}
                value={noticedAtHome}
                onChange={(e) => setNoticedAtHome(e.target.value)}
                placeholder="Describe any changes in mood, sleeping patterns, interactions with family members, or homework habits..."
                className="w-full px-4 py-3 bg-white border border-slate-300/80 rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all resize-y"
                required
              />
              <p className="text-xs text-slate-500 mt-1.5 font-normal">
                Your detailed observations are invaluable to our assessment.
              </p>
            </div>

            {/* Question 2: Optional Comments */}
            <div>
              <label
                htmlFor="optional-comments"
                className="block text-sm sm:text-base font-bold text-slate-900 mb-2"
              >
                Optional Comments
              </label>
              <textarea
                id="optional-comments"
                rows={4}
                value={optionalComments}
                onChange={(e) => setOptionalComments(e.target.value)}
                placeholder="Any other context or specific incidents you would like to share..."
                className="w-full px-4 py-3 bg-white border border-slate-300/80 rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all resize-y"
              />
            </div>

            <hr className="border-slate-200/80" />

            {/* Form Footer Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <span className="text-xs text-slate-400 font-medium">
                Confidential parent submission • Encrypted for school psychological review
              </span>

              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-lg text-sm shadow-xs transition-colors cursor-pointer"
              >
                <span>Submit Feedback</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Confirmation State */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-8 sm:p-12 text-center space-y-6 animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              Thank You for Your Feedback!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Your observations for <span className="font-semibold text-slate-800">{currentStudent.name}</span> have been securely submitted and added to the psychological observation review queue.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Reference Code:</span>
              <span className="font-mono font-bold text-blue-700">{submittedRecordNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Student:</span>
              <span className="font-semibold text-slate-800">{currentStudent.name} ({currentStudent.grade})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Status:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-red-100 text-red-700">
                New Observation
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Submit Another Response
            </button>
            <button
              onClick={() => setActiveTab('observations')}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition-colors"
            >
              View in Observations Queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
