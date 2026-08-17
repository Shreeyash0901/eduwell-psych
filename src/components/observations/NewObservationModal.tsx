import React, { useState } from 'react';
import { Student, ObservationRecord } from '../../types';
import { X, Plus, FileText } from 'lucide-react';

interface NewObservationModalProps {
  students: Student[];
  onClose: () => void;
  onSubmit: (obs: ObservationRecord) => void;
}

export const NewObservationModal: React.FC<NewObservationModalProps> = ({
  students,
  onClose,
  onSubmit,
}) => {
  const [studentId, setStudentId] = useState(students[0]?.id || 's1');
  const [source, setSource] = useState<'Teacher' | 'Parent' | 'Counselor'>('Teacher');
  const [concernCategory, setConcernCategory] = useState<
    'Social/Emotional' | 'Academic' | 'Behavioral' | 'Emotional Regulation'
  >('Emotional Regulation');
  const [submitter, setSubmitter] = useState('Sarah Jenkins (Science Teacher)');
  const [setting, setSetting] = useState('Classroom / Science Lab');
  const [narrative, setNarrative] = useState('');
  const [triggers, setTriggers] = useState('');
  const [interventions, setInterventions] = useState('');

  const selectedStudent = students.find((s) => s.id === studentId) || students[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrative.trim()) {
      alert('Please enter an observation narrative description.');
      return;
    }

    const newRecord: ObservationRecord = {
      id: `obs-${Date.now()}`,
      recordNumber: `#${Math.floor(800 + Math.random() * 100)}`,
      studentId: selectedStudent.studentId,
      studentName: selectedStudent.name,
      classGroup: `${selectedStudent.classGroup} - ${setting}`,
      source,
      concernCategory,
      date: 'Today',
      incidentTime: `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      setting,
      status: 'New',
      submitter,
      narrative,
      triggers: triggers || 'Under evaluation by staff',
      interventions: interventions || 'Monitored by homeroom teacher',
      psychologistNotes: '',
    };

    onSubmit(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-6 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-700" />
            <h2 className="text-xl font-bold text-slate-900">New Observation Record</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Student</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.studentId} - {s.grade})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Observation Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Teacher">Teacher</option>
                <option value="Parent">Parent</option>
                <option value="Counselor">Counselor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Concern Category</label>
              <select
                value={concernCategory}
                onChange={(e) => setConcernCategory(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Emotional Regulation">Emotional Regulation</option>
                <option value="Social/Emotional">Social/Emotional</option>
                <option value="Academic">Academic</option>
                <option value="Behavioral">Behavioral</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Setting / Environment</label>
              <input
                type="text"
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
                placeholder="e.g. Science Lab / Playground"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Observation Narrative Description
            </label>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              rows={3}
              placeholder="Detailed description of classroom incident, behaviors observed, emotional state..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Antecedent / Triggers
              </label>
              <input
                type="text"
                value={triggers}
                onChange={(e) => setTriggers(e.target.value)}
                placeholder="e.g. Group work with fine motor materials"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Intervention Attempted
              </label>
              <input
                type="text"
                value={interventions}
                onChange={(e) => setInterventions(e.target.value)}
                placeholder="e.g. Offered quiet break, verbal redirection"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              File Observation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
