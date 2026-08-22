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
  searchQuery?: string;
}

export const ObservationsView: React.FC<ObservationsViewProps> = ({
  refreshKey,
  onSelectObservation,
  onOpenNewNote,
  setActiveTab,
  searchQuery = '',
}) => {
  const [sourceFilter, setSourceFilter] = useState<string>('All Sources');
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');
  const [gradeFilter, setGradeFilter] = useState<string>('All Grades');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

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
      if (gradeFilter !== 'All Grades') params.set('grade', gradeFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('page', String(page));
      params.set('limit', String(pageSize));

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
  }, [sourceFilter, categoryFilter, gradeFilter, searchQuery, page, pageSize]);

  useEffect(() => {
    loadObservations();
  }, [loadObservations, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [sourceFilter, categoryFilter, gradeFilter, pageSize]);

  const displayedObservations = observations.filter((obs) => {
    if (dateFilter && !obs.date.toLowerCase().includes(dateFilter.toLowerCase())) return false;
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
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'Assessed':
      case 'Assessment Started':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
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

  const shownFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const shownTo = Math.min(page * pageSize, total);

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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full bg-white border border-slate-200/70 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
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
              className="w-full bg-white border border-slate-200/70 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
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
              className="w-full bg-white border border-slate-200/70 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
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
              className="w-full bg-white border border-slate-200/70 rounded-xl pl-3.5 pr-9 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Observations Queue Table */}
      <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {error && (
          <div className="p-3 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
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
                  <tr key={obs.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
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
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs ${getStatusBadgeClass(
                          obs.hasAssessmentStarted || obs.status === 'Assessed' ? 'Assessment Started' : obs.status
                        )}`}
                      >
                        {obs.hasAssessmentStarted || obs.status === 'Assessed'
                          ? 'Assessment Started'
                          : obs.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onSelectObservation(obs)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition-all inline-flex items-center justify-center shadow-xs cursor-pointer"
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
        <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-4">
            <span>
              {total === 0
                ? 'No entries found'
                : `Showing ${shownFrom} to ${shownTo} of ${total} entries`}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-blue-700 text-white font-bold text-xs shadow-2xs">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};