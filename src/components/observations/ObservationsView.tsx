import React, { useState, useEffect, useCallback } from 'react';
import { ObservationRecord, ActiveTab } from '../../types';
import {
  Download,
  Plus,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface ObservationsViewProps {
  refreshKey: number;
  onSelectObservation: (obs: ObservationRecord) => void;
  onOpenNewNote: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const ObservationsView: React.FC<ObservationsViewProps> = ({
  refreshKey,
  onSelectObservation,
  onOpenNewNote,
  setActiveTab,
}) => {
  const [sourceFilter, setSourceFilter] = useState<string>('All Sources');
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');
  const [gradeFilter, setGradeFilter] = useState<string>('All Grades');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const [observations, setObservations] = useState<ObservationRecord[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadObservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sourceFilter !== 'All Sources') params.set('source', sourceFilter);
      if (categoryFilter !== 'All Categories') params.set('category', categoryFilter);
      params.set('page', String(page));
      params.set('limit', '50');

      const res = await fetch(`/api/observations?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setObservations(data.observations || []);
        setTotal(data.pagination?.total ?? 0);
        setTotalPages(data.pagination?.totalPages ?? 1);
      } else {
        setError(data.error || 'Failed to load observations.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load observations.');
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, categoryFilter, page]);

  useEffect(() => {
    loadObservations();
  }, [loadObservations, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [sourceFilter, categoryFilter]);

  const displayedObservations = observations.filter((obs) => {
    if (gradeFilter !== 'All Grades' && !obs.classGroup.includes(gradeFilter)) return false;
    if (dateFilter && !obs.date.includes(dateFilter)) return false;
    return true;
  });

  const getSourceBadgeClass = (source: string) => {
    switch (source) {
      case 'Teacher':
        return 'bg-blue-100 text-blue-700';
      case 'Parent':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-purple-100 text-purple-700';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-red-100 text-red-700';
      case 'Pending Review':
        return 'bg-amber-100 text-amber-800';
      case 'Reviewed':
        return 'bg-amber-800 text-white';
      case 'Assessed':
        return 'bg-slate-200 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-600',
      'bg-indigo-600',
      'bg-emerald-600',
      'bg-amber-600',
      'bg-purple-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash += name.charCodeAt(i);
    }
    return colors[hash % colors.length];
  };

  const shownFrom = total === 0 ? 0 : (page - 1) * 50 + 1;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Observations Queue</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Review and triage submitted wellness observations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('parent_feedback')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 shadow-2xs transition-colors"
          >
            <Eye className="w-4 h-4 text-indigo-600" />
            Parent Form
          </button>
          <button
            onClick={() => alert("Exporting observations queue CSV...")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export
          </button>
          <button
            onClick={() => setActiveTab('teacher_add_concern')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>
      </div>

      {/* Filter Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="All Sources">All Sources</option>
              <option value="Teacher">Teacher</option>
              <option value="Parent">Parent</option>
              <option value="Counselor">Counselor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Concern Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="All Categories">All Categories</option>
              <option value="Social/Emotional">Social/Emotional</option>
              <option value="Academic">Academic</option>
              <option value="Behavioral">Behavioral</option>
              <option value="Emotional Regulation">Emotional Regulation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Grade/Class</label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="All Grades">All Grades</option>
              <option value="4B">4B</option>
              <option value="5A">5A</option>
              <option value="6C">6C</option>
              <option value="8B">8B</option>
            </select>
          </div>
        </div>

        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Date Filter</label>
          <div className="relative">
            <input
              type="text"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="e.g. Oct 24, 2023"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-9 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Observations Queue Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        {error && (
          <div className="p-3 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Class</th>
                <th className="px-6 py-3.5">Source</th>
                <th className="px-6 py-3.5">Concern Category</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
                      Loading observations...
                    </div>
                  </td>
                </tr>
              ) : displayedObservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-400 font-medium">
                    No observation records match the current filters.
                  </td>
                </tr>
              ) : (
                displayedObservations.map((obs) => (
                  <tr key={obs.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full ${getAvatarColor(
                            obs.studentName
                          )} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                        >
                          {getInitials(obs.studentName)}
                        </div>
                        <span className="font-bold text-slate-900">{obs.studentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{obs.classGroup}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold ${getSourceBadgeClass(
                          obs.source
                        )}`}
                      >
                        {obs.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{obs.concernCategory}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{obs.date}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${getStatusBadgeClass(
                          obs.status
                        )}`}
                      >
                        {obs.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onSelectObservation(obs)}
                        className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="View Observation Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Bar */}
        <div className="px-6 py-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            {total === 0
              ? 'No entries'
              : `Showing ${shownFrom} to ${Math.min(shownFrom + 49, total)} of ${total} entries`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-md border border-slate-200 text-slate-400 hover:text-slate-600 disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded-md bg-blue-700 text-white font-bold text-xs">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};