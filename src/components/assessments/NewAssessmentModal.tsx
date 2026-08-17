import React, { useState } from 'react';
import { Student, AssessmentProtocol } from '../../types';
import { X, Play, ClipboardList } from 'lucide-react';

interface NewAssessmentModalProps {
  students: Student[];
  protocols: AssessmentProtocol[];
  onClose: () => void;
  onStart: (studentName: string, protocol: AssessmentProtocol) => void;
}

export const NewAssessmentModal: React.FC<NewAssessmentModalProps> = ({
  students,
  protocols,
  onClose,
  onStart,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || 's2');
  const [selectedProtocolId, setSelectedProtocolId] = useState(protocols[0]?.id || 'p1');

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const selectedProtocol = protocols.find((p) => p.id === selectedProtocolId) || protocols[0];

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(selectedStudent.name, selectedProtocol);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-6 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-700" />
            <h2 className="text-xl font-bold text-slate-900">Initiate Assessment Session</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleStart} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.studentId} • {s.grade} {s.classGroup})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Assessment Protocol</label>
            <select
              value={selectedProtocolId}
              onChange={(e) => setSelectedProtocolId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              {protocols.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.questionCount} Questions • {p.estTime})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
            <h4 className="font-bold text-blue-900">{selectedProtocol.title}</h4>
            <p className="text-slate-600 leading-relaxed font-normal">{selectedProtocol.description}</p>
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
              <Play className="w-3.5 h-3.5 fill-current" />
              Begin Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
