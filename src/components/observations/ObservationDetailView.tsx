import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ObservationRecord, ActiveTab } from '../../types';
import {
  ChevronLeft,
  FileText,
  Zap,
  Hand,
  CheckCircle,
  Sparkles,
  ClipboardList,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface ObservationDetailViewProps {
  observationId: string;
  refreshKey: number;
  canUpdate: boolean;
  onBack: () => void;
  onStartAssessment: (studentName: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const ObservationDetailView: React.FC<ObservationDetailViewProps> = ({
  observationId,
  refreshKey,
  canUpdate,
  onBack,
  onStartAssessment,
}) => {
  const [observation, setObservation] = useState<ObservationRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadObservation = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/observations/${observationId}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.observation) {
        setObservation(data.observation);
        setNotes(data.observation.psychologistNotes || '');
        setAiAnalysis(data.observation.aiAnalysis || '');
      } else {
        setLoadError(data.error || 'Observation record not found.');
      }
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load observation details.');
    } finally {
      setLoading(false);
    }
  }, [observationId]);

  useEffect(() => {
    loadObservation();
  }, [loadObservation, refreshKey]);

  const handleSave = async () => {
    if (!observation) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/observations/${observation.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ psychologistNotes: notes }),
      });
      const data = await res.json();
      if (data.success) {
        setObservation((prev) => (prev ? { ...prev, psychologistNotes: notes } : prev));
        toast.success('Psychologist internal notes saved successfully.');
      } else {
        toast.error(data.error || 'Failed to save notes.');
      }
    } catch (err: any) {
      toast.error('Failed to save notes: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (status: 'Reviewed' | 'Pending Review' | 'Assessed') => {
    if (!observation) return;
    try {
      const res = await fetch(`/api/observations/${observation.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setObservation((prev) => (prev ? { ...prev, status } : prev));
        toast.success(`Observation marked as ${status}.`);
      } else {
        toast.error(data.error || 'Failed to update status.');
      }
    } catch (err: any) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  const handleGenerateAiAnalysis = async () => {
    if (!observation) return;
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/gemini/analyze-observation', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: observation.studentName,
          grade: observation.classGroup,
          narrative: observation.narrative,
          triggers: observation.triggers,
          interventions: observation.interventions,
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      } else if (data.error) {
        setAiError(data.error);
      }
    } catch (err: any) {
      setAiError('Failed to generate AI analysis: ' + err.message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-2 py-24 text-xs text-slate-500 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
          Loading observation record...
        </div>
      </div>
    );
  }

  if (loadError || !observation) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors mb-4"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Observations &gt; Back to List
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumbs and Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Observations &gt; Detail View
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Observation Record {observation.recordNumber}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md">
              Submitted on {observation.date}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
            Back to List
          </button>
          <button
            onClick={() => onStartAssessment(observation.studentName)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 shadow-sm transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            Start Assessment
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column Cards (Status, Student Context, Submission Info) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Card */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Status</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {observation.status}
              </span>
            </div>
            {canUpdate && observation.status !== 'Reviewed' ? (
              <button
                onClick={() => handleUpdateStatus('Reviewed')}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-blue-600 text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Reviewed
              </button>
            ) : (
              <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-2.5 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {observation.status === 'Reviewed'
                  ? 'Reviewed by Lead Psychologist'
                  : 'Status updates require psychologist access'}
              </div>
            )}
          </div>

          {/* Student Context Card */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Student Context
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                {getInitials(observation.studentName)}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">{observation.studentName}</h3>
                <p className="text-xs text-slate-500 font-medium">{observation.classGroup}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs pt-2">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Student ID</span>
                <span className="font-bold text-slate-900">{observation.studentId}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Grade / Class</span>
                <span className="font-bold text-slate-900">{observation.grade || observation.classGroup}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 font-medium">Record No.</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {observation.recordNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Submission Info Card */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Submission Info
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium block mb-0.5">Submitter</span>
                <span className="font-bold text-slate-900">{observation.submitter}</span>
              </div>

              <div>
                <span className="text-slate-500 font-medium block mb-0.5">
                  Date & Time of Incident
                </span>
                <span className="font-bold text-slate-900">{observation.incidentTime}</span>
              </div>

              <div>
                <span className="text-slate-500 font-medium block mb-0.5">Setting / Class</span>
                <span className="font-bold text-slate-900">{observation.setting}</span>
              </div>

              <div>
                <span className="text-slate-500 font-medium block mb-1">Primary Category</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">
                  {observation.concernCategory}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Narrative and Notes Panel */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-6">
          {/* Observation Narrative Title */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80">
            <FileText className="w-5 h-5 text-blue-700" />
            <h2 className="text-lg font-bold text-slate-900">Observation Narrative</h2>
          </div>

          {/* Description of Concern */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Description of Concern
            </h3>
            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-xl text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line">
              {observation.narrative}
            </div>
          </div>

          {/* Antecedent & Interventions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>Antecedent / Triggers</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {observation.triggers}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Hand className="w-4 h-4 text-blue-600" />
                <span>Intervention Attempted</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {observation.interventions}
              </p>
            </div>
          </div>

          {/* AI Observation Analysis (Gemini Integration) */}
          <div className="pt-2 border-t border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">AI Clinical Insights</h3>
              </div>
              <button
                onClick={handleGenerateAiAnalysis}
                disabled={isGeneratingAi}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing Narrative...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate AI Psychological Hypotheses
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

            {aiAnalysis && (
              <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-xl text-xs text-slate-800 leading-relaxed space-y-2 whitespace-pre-line font-medium">
                {aiAnalysis}
              </div>
            )}
          </div>

          {/* Psychologist Internal Notes Form */}
          {canUpdate && (
            <div className="pt-4 border-t border-slate-200/80 space-y-3">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                Psychologist Notes (Internal)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add preliminary notes or analysis here before starting formal assessment..."
                className="w-full p-4 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white resize-y"
              ></textarea>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};