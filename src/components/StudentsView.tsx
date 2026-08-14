import React, { useState } from 'react';
import { Student, ActiveTab } from '../types';
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  ClipboardList,
  Eye,
  AlertTriangle,
  X
} from 'lucide-react';

interface StudentsViewProps {
  students: Student[];
  onSelectStudent: (s: Student) => void;
  onOpenNewAssessment: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  onSelectStudent,
  onOpenNewAssessment,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedProfileModal, setSelectedProfileModal] = useState<Student | null>(null);

  const filtered = students.filter((s) => {
    if (statusFilter !== 'All' && s.status !== statusFilter) return false;
    if (
      search &&
      !s.name.toLowerCase().includes(search.toLowerCase()) &&
      !s.studentId.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Roster</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Manage student psychological profiles, active flags, and assessment timelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewAssessment}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Assessment
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Status Filter:</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            {['All', 'Normal', 'Monitor', 'Attention Required'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-3.5">Student ID</th>
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Grade / Class</th>
                <th className="px-6 py-3.5">IEP Status</th>
                <th className="px-6 py-3.5">Prior Obs.</th>
                <th className="px-6 py-3.5">Wellness Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{s.studentId}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{s.name}</div>
                    <div className="text-xs text-slate-500 font-medium">{s.homeroom}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">
                    {s.grade} ({s.classGroup})
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{s.iepStatus}</td>
                  <td className="px-6 py-4 text-slate-800 font-bold">{s.priorObsCount}</td>
                  <td className="px-6 py-4">
                    {s.status === 'Attention Required' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        Attention Required
                      </span>
                    )}
                    {s.status === 'Monitor' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        Monitor
                      </span>
                    )}
                    {s.status === 'Normal' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        Normal
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedProfileModal(s)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      <span>View Profile</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Profile Quick Modal */}
      {selectedProfileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-700 text-white font-bold text-base flex items-center justify-center">
                  {selectedProfileModal.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedProfileModal.name} ({selectedProfileModal.studentId})
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedProfileModal.grade} • {selectedProfileModal.homeroom}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedProfileModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-500 font-medium block">Age</span>
                <span className="font-bold text-slate-900">{selectedProfileModal.age}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">IEP Status</span>
                <span className="font-bold text-slate-900">{selectedProfileModal.iepStatus}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Prior Obs.</span>
                <span className="font-bold text-slate-900">{selectedProfileModal.priorObsCount}</span>
              </div>
            </div>

            {/* Domain Scores Bar Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Psychological Domain Baseline
              </h4>
              <div className="space-y-2 text-xs">
                {Object.entries(selectedProfileModal.domainScores).map(([key, rawScore]) => {
                  const score = Number(rawScore);
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-bold text-slate-900">{score} / 10</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            score < 5 ? 'bg-amber-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${score * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  onSelectStudent(selectedProfileModal);
                  setSelectedProfileModal(null);
                }}
                className="px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition-colors"
              >
                Open Full Assessment Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
