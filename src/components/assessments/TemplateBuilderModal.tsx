import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  HelpCircle,
  BarChart2,
  Sliders,
  Play,
  Save,
  Check
} from 'lucide-react';

interface DomainInput {
  tempId: number;
  name: string;
  description: string;
}

interface QuestionOptionInput {
  label: string;
  value: string;
  score: number;
}

interface QuestionInput {
  domainTempId: number;
  questionText: string;
  questionType: string;
  isRequired: boolean;
  options: QuestionOptionInput[];
}

interface ScoringRuleInput {
  minScore: number;
  maxScore: number;
  resultLabel: string;
  attentionLevel: 'OPTIMAL' | 'MONITOR' | 'ATTENTION_REQUIRED';
}

interface TemplateBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated?: () => void;
}

const DEFAULT_LIKERT_OPTIONS: QuestionOptionInput[] = [
  { label: 'Rarely / Never', value: 'rarely', score: 1 },
  { label: 'Sometimes', value: 'sometimes', score: 2 },
  { label: 'Often', value: 'often', score: 3 },
  { label: 'Almost Always', value: 'always', score: 4 },
];

export const TemplateBuilderModal: React.FC<TemplateBuilderModalProps> = ({
  isOpen,
  onClose,
  onTemplateCreated,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Basics
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('BEHAVIORAL');
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [description, setDescription] = useState('');

  // Step 2: Domains
  const [domains, setDomains] = useState<DomainInput[]>([
    { tempId: 1, name: 'Emotional Regulation', description: 'Stress coping and resilience' },
    { tempId: 2, name: 'Focus & Attention', description: 'Classroom concentration and task persistence' },
  ]);

  // Step 3: Questions
  const [questions, setQuestions] = useState<QuestionInput[]>([
    {
      domainTempId: 1,
      questionText: 'Student recovers calmly from unexpected changes in routine.',
      questionType: 'LIKERT',
      isRequired: true,
      options: [...DEFAULT_LIKERT_OPTIONS],
    },
    {
      domainTempId: 2,
      questionText: 'Student remains engaged during independent academic exercises.',
      questionType: 'LIKERT',
      isRequired: true,
      options: [...DEFAULT_LIKERT_OPTIONS],
    },
  ]);

  // Step 4: Scoring Rules
  const [scoringRules, setScoringRules] = useState<ScoringRuleInput[]>([
    { minScore: 2, maxScore: 4, resultLabel: 'Elevated Concern / Attention Required', attentionLevel: 'ATTENTION_REQUIRED' },
    { minScore: 5, maxScore: 6, resultLabel: 'Moderate Wellbeing / Monitor Closely', attentionLevel: 'MONITOR' },
    { minScore: 7, maxScore: 8, resultLabel: 'Healthy Positive Baseline', attentionLevel: 'OPTIMAL' },
  ]);

  // Step 5: Simulator Answers
  const [simulatedAnswers, setSimulatedAnswers] = useState<Record<number, number>>({});

  if (!isOpen) return null;

  const handleAddDomain = () => {
    const nextId = domains.length > 0 ? Math.max(...domains.map((d) => d.tempId)) + 1 : 1;
    setDomains([...domains, { tempId: nextId, name: `Domain ${nextId}`, description: '' }]);
  };

  const handleRemoveDomain = (tempId: number) => {
    if (domains.length <= 1) return;
    setDomains(domains.filter((d) => d.tempId !== tempId));
    // Re-assign questions to first available domain
    const remaining = domains.filter((d) => d.tempId !== tempId);
    if (remaining.length > 0) {
      setQuestions(
        questions.map((q) => (q.domainTempId === tempId ? { ...q, domainTempId: remaining[0].tempId } : q))
      );
    }
  };

  const handleAddQuestion = () => {
    const defaultDomainId = domains[0]?.tempId || 1;
    setQuestions([
      ...questions,
      {
        domainTempId: defaultDomainId,
        questionText: '',
        questionType: 'LIKERT',
        isRequired: true,
        options: [...DEFAULT_LIKERT_OPTIONS],
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const calculateSimulatedTotal = () => {
    return Object.values(simulatedAnswers).reduce((acc, score) => acc + score, 0);
  };

  const getSimulatedResult = () => {
    const total = calculateSimulatedTotal();
    const matched = scoringRules.find((r) => total >= r.minScore && total <= r.maxScore);
    return matched || { resultLabel: 'Score outside defined bands', attentionLevel: 'MONITOR' };
  };

  const handleSubmit = async (publishStatus: 'DRAFT' | 'PUBLISHED') => {
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('Please enter a protocol name in Step 1.');
      setStep(1);
      return;
    }
    if (domains.some((d) => !d.name.trim())) {
      setErrorMsg('All clinical domains must have a title in Step 2.');
      setStep(2);
      return;
    }
    if (questions.some((q) => !q.questionText.trim())) {
      setErrorMsg('All screening questions must have question text in Step 3.');
      setStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim() || undefined,
        category,
        estimatedMinutes: Number(estimatedMinutes) || 15,
        description: description.trim() || undefined,
        status: publishStatus,
        domains: domains.map((d, idx) => ({
          tempId: d.tempId,
          name: d.name.trim(),
          description: d.description.trim() || null,
          displayOrder: idx,
        })),
        questions: questions.map((q, idx) => ({
          domainTempId: q.domainTempId,
          questionText: q.questionText.trim(),
          questionType: q.questionType,
          isRequired: q.isRequired,
          displayOrder: idx,
          options: q.options.map((opt, optIdx) => ({
            label: opt.label.trim(),
            value: opt.value.trim() || `opt_${optIdx + 1}`,
            score: Number(opt.score),
            displayOrder: optIdx,
          })),
        })),
        scoringRules: scoringRules.map((r) => ({
          minScore: Number(r.minScore),
          maxScore: Number(r.maxScore),
          resultLabel: r.resultLabel.trim(),
          attentionLevel: r.attentionLevel,
        })),
      };

      const res = await fetch('/api/assessments/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save template');
      }

      if (onTemplateCreated) onTemplateCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create template:', err);
      setErrorMsg(err.message || 'Server error while saving template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Assessment Protocol Builder
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Design custom psychological and behavioral screening protocols
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Navigation */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold overflow-x-auto">
          {[
            { id: 1, label: '1. Protocol Basics' },
            { id: 2, label: '2. Clinical Domains' },
            { id: 3, label: '3. Questions & Scales' },
            { id: 4, label: '4. Scoring Bands' },
            { id: 5, label: '5. Simulator & Publish' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                step === s.id
                  ? 'bg-blue-700 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: PROTOCOL BASICS */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Protocol Title *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Comprehensive Behavioral Screener"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Internal Protocol Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CBS-24"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Clinical Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="BEHAVIORAL">Behavioral & Classroom Conduct</option>
                    <option value="EMOTIONAL">Emotional Regulation & Mood</option>
                    <option value="SOCIAL">Social Integration & Peer Relations</option>
                    <option value="ACADEMIC_ANXIETY">Academic Anxiety & Stress</option>
                    <option value="GENERAL">General Mental Health Screening</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Estimated Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 15)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical Description & Usage Instructions
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context on when this assessment should be conducted by school staff..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* STEP 2: CLINICAL DOMAINS */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                  Group assessment questions into clinical sub-domains for targeted score breakdown.
                </p>
                <button
                  type="button"
                  onClick={handleAddDomain}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Domain
                </button>
              </div>

              <div className="space-y-3">
                {domains.map((dom, idx) => (
                  <div
                    key={dom.tempId}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-4"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-2">
                      {idx + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Domain Title
                        </label>
                        <input
                          type="text"
                          value={dom.name}
                          onChange={(e) => {
                            const updated = [...domains];
                            updated[idx].name = e.target.value;
                            setDomains(updated);
                          }}
                          placeholder="e.g. Social Integration"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Clinical Scope Description
                        </label>
                        <input
                          type="text"
                          value={dom.description}
                          onChange={(e) => {
                            const updated = [...domains];
                            updated[idx].description = e.target.value;
                            setDomains(updated);
                          }}
                          placeholder="e.g. Peer interactions and classroom belonging"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={domains.length <= 1}
                      onClick={() => handleRemoveDomain(dom.tempId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg transition-colors cursor-pointer mt-2"
                      title="Remove Domain"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: QUESTIONS & SCALES */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                  Add screening questions and map them to their corresponding clinical domain.
                </p>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Question
                </button>
              </div>

              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          Q{qIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={q.questionText}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[qIdx].questionText = e.target.value;
                            setQuestions(updated);
                          }}
                          placeholder="Enter question statement (e.g. Student participates willingly in group activities)..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>

                      <div className="w-44 shrink-0">
                        <select
                          value={q.domainTempId}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[qIdx].domainTempId = parseInt(e.target.value, 10);
                            setQuestions(updated);
                          }}
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                          {domains.map((d) => (
                            <option key={d.tempId} value={d.tempId}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        disabled={questions.length <= 1}
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Options Preview */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className="px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200/60 flex items-center justify-between text-[11px]"
                        >
                          <span className="text-slate-700 font-medium truncate">{opt.label}</span>
                          <span className="text-blue-700 font-bold ml-1">+{opt.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: SCORING RULES */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <p className="text-xs text-slate-500 font-medium">
                Set total score ranges and map them to clinical attention levels.
              </p>

              <div className="space-y-3">
                {scoringRules.map((rule, rIdx) => (
                  <div
                    key={rIdx}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <div className="sm:col-span-4 flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Min Score</label>
                        <input
                          type="number"
                          value={rule.minScore}
                          onChange={(e) => {
                            const updated = [...scoringRules];
                            updated[rIdx].minScore = Number(e.target.value);
                            setScoringRules(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <span className="text-slate-400 font-bold text-xs pt-4">-</span>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Max Score</label>
                        <input
                          type="number"
                          value={rule.maxScore}
                          onChange={(e) => {
                            const updated = [...scoringRules];
                            updated[rIdx].maxScore = Number(e.target.value);
                            setScoringRules(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Interpretation Label</label>
                      <input
                        type="text"
                        value={rule.resultLabel}
                        onChange={(e) => {
                          const updated = [...scoringRules];
                          updated[rIdx].resultLabel = e.target.value;
                          setScoringRules(updated);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Attention Level</label>
                      <select
                        value={rule.attentionLevel}
                        onChange={(e) => {
                          const updated = [...scoringRules];
                          updated[rIdx].attentionLevel = e.target.value as any;
                          setScoringRules(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      >
                        <option value="OPTIMAL">Optimal Baseline</option>
                        <option value="MONITOR">Monitor Closely</option>
                        <option value="ATTENTION_REQUIRED">Attention Required</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: SIMULATOR & PUBLISH */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in duration-100">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-blue-950">Interactive Scoring Simulator</h3>
                  <p className="text-xs text-blue-700 mt-0.5 font-medium">
                    Test response selections to verify your calculated thresholds live before publishing.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 uppercase">Simulated Score:</span>
                  <div className="text-xl font-extrabold text-blue-900">{calculateSimulatedTotal()}</div>
                </div>
              </div>

              {/* Simulation Result Badge */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Calculated Interpretation:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    getSimulatedResult().attentionLevel === 'ATTENTION_REQUIRED'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : getSimulatedResult().attentionLevel === 'MONITOR'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {getSimulatedResult().resultLabel}
                </span>
              </div>

              {/* Question Simulator List */}
              <div className="space-y-3">
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-slate-800">
                      Q{qIdx + 1}: {q.questionText || 'Untitled question'}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = simulatedAnswers[qIdx] === opt.score;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => setSimulatedAnswers({ ...simulatedAnswers, [qIdx]: opt.score })}
                            className={`p-2 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="truncate">{opt.label}</span>
                              <span className="text-[10px] text-slate-400 font-mono">+{opt.score}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Next Step
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit('DRAFT')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit('PUBLISHED')}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Publishing...' : 'Publish Protocol'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
