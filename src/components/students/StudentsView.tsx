import React, { useState, useEffect } from 'react';
import { Student, ActiveTab, UserRole, PaginationMeta, StudentFilterLookups } from '../../types';
import { AddStudentModal } from './AddStudentModal';
import {
  Search,
  Filter,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  X,
  CheckCircle2,
  RefreshCw,
  Users,
  GraduationCap,
  Sparkles,
  Calendar,
  Layers,
  Check,
} from 'lucide-react';

interface StudentsViewProps {
  onSelectStudent: (s: Student) => void;
  onOpenFullProfile?: (s: Student) => void;
  onAddStudent?: (s: Student) => void;
  userRole?: UserRole;
  setActiveTab: (tab: ActiveTab) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  onSelectStudent,
  onOpenFullProfile,
  onAddStudent,
  userRole,
  setActiveTab,
}) => {
  // Roster and Pagination State
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [page, setPage] = useState<number>(1);

  // Filter Lookups
  const [lookups, setLookups] = useState<StudentFilterLookups>({
    classes: [],
    sections: [],
    academicSessions: [],
  });

  // Modal and Notification State
  const [selectedProfileModal, setSelectedProfileModal] = useState<Student | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [successNotification, setSuccessNotification] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    setSelectedSectionId('all'); // Reset section when class changes
    setPage(1);
  };

  const handleSectionChange = (newSectionId: string) => {
    setSelectedSectionId(newSectionId);
    setPage(1);
  };

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedClassId('all');
    setSelectedSectionId('all');
    setSelectedStatus('all');
    setPage(1);
  };

  // Fetch filter lookups on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchLookups() {
      try {
        const res = await fetch('/api/lookups/student-filters', {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error(`Lookup request failed with status ${res.status}`);
        }
        const data = await res.json();
        if (data.success && isMounted) {
          setLookups({
            classes: data.classes || [],
            sections: data.sections || [],
            academicSessions: data.academicSessions || [],
          });
        }
      } catch (err) {
        console.error('[STUDENTS_VIEW] Failed to load filter options:', err);
      }
    }

    fetchLookups();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch student roster from backend API
  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (selectedClassId !== 'all') params.set('classId', selectedClassId);
      if (selectedSectionId !== 'all') params.set('sectionId', selectedSectionId);
      if (selectedStatus !== 'all') params.set('isActive', selectedStatus);
      params.set('page', String(page));
      params.set('limit', '10');

      const res = await fetch(`/api/students?${params.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Your session has expired. Please sign in again.');
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
      } else {
        throw new Error(data.error || 'Failed to retrieve students from the database.');
      }
    } catch (err: any) {
      console.error('[STUDENTS_VIEW] Error fetching students:', err);
      setError(err.message || 'Unable to load students. Please check your network connection.');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [debouncedSearch, selectedClassId, selectedSectionId, selectedStatus, page]);

  // Handle local optimistic add student
  const handleStudentAdded = (newStudent: Student) => {
    if (onAddStudent) {
      onAddStudent(newStudent);
    }
    setIsAddStudentOpen(false);
    setSuccessNotification({
      title: 'Student Successfully Enrolled',
      message: `${newStudent.name || newStudent.fullName} (${newStudent.studentId}) has been added to the directory roster.`,
    });

    // Refresh roster from API
    fetchStudents();

    setTimeout(() => {
      setSuccessNotification(null);
    }, 4500);
  };

  // Filter sections by selected class if a specific class is selected
  const availableSections = selectedClassId === 'all'
    ? lookups.sections
    : lookups.sections.filter((sec) => String(sec.classId) === selectedClassId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Roster</h1>
            {lookups.academicSessions.find((s) => s.isCurrent) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Calendar className="w-3 h-3" />
                {lookups.academicSessions.find((s) => s.isCurrent)?.name}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Manage enrolled students, academic classes, demographic records, and assessment timelines.
          </p>
        </div>

        {/* Action Button: Show + Add Student only when user is Admin */}
        {userRole === 'admin' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Student</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Notification Banner */}
      {successNotification && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900">{successNotification.title}</p>
              <p className="text-xs font-medium text-emerald-700">{successNotification.message}</p>
            </div>
          </div>
          <button
            onClick={() => setSuccessNotification(null)}
            aria-label="Dismiss notification"
            className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, ID, admission no..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Class Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
              <label htmlFor="class-filter" className="font-semibold text-slate-600">Class:</label>
              <select
                id="class-filter"
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Classes</option>
                {lookups.classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <label htmlFor="section-filter" className="font-semibold text-slate-600">Section:</label>
              <select
                id="section-filter"
                value={selectedSectionId}
                onChange={(e) => handleSectionChange(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Sections</option>
                {availableSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <label htmlFor="status-filter" className="font-semibold text-slate-600">Status:</label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(search || selectedClassId !== 'all' || selectedSectionId !== 'all' || selectedStatus !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}

            {/* Refresh Button */}
            <button
              onClick={() => fetchStudents()}
              disabled={isLoading}
              title="Refresh Roster"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert State */}
      {error && !isLoading && (
        <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-900">Failed to Load Students</h3>
              <p className="text-xs font-medium text-rose-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchStudents()}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-3.5">Student ID</th>
                <th className="px-6 py-3.5">Full Name</th>
                <th className="px-6 py-3.5">Class / Section</th>
                <th className="px-6 py-3.5">Admission / Reg.</th>
                <th className="px-6 py-3.5">Gender / DOB</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {/* Loading State Skeletons */}
              {isLoading && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-36 mb-1.5"></div>
                        <div className="h-3 bg-slate-100 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 bg-slate-200 rounded-full w-16"></div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div>
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {/* Empty State */}
              {!isLoading && !error && students.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">No Students Found</h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        {search || selectedClassId !== 'all' || selectedSectionId !== 'all' || selectedStatus !== 'all'
                          ? 'No enrolled students match your selected search criteria and filters.'
                          : 'No students have been enrolled in this school directory yet.'}
                      </p>
                      {(search || selectedClassId !== 'all' || selectedSectionId !== 'all' || selectedStatus !== 'all') && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {!isLoading &&
                students.map((s) => {
                  const displayName = s.fullName || s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentId;
                  const displayClass = s.className ? `${s.className}${s.sectionName ? ` (${s.sectionName})` : ''}` : 'Unassigned';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">{s.studentId}</span>
                        {s.source && (
                          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {s.source}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{displayName}</div>
                        {s.email && <div className="text-xs text-slate-500 font-medium">{s.email}</div>}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {displayClass}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                        <div>Adm: {s.admissionNo || '—'}</div>
                        {s.registrationNo && <div>Reg: {s.registrationNo}</div>}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                        <div>{s.gender || '—'}</div>
                        {s.dateOfBirth && <div className="text-slate-400">{s.dateOfBirth}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {s.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            if (onOpenFullProfile) {
                              onOpenFullProfile(s);
                            } else {
                              setSelectedProfileModal(s);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                        >
                          <span>View Profile</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && pagination.total > 0 && (
          <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
            <div>
              Showing{' '}
              <span className="font-bold text-slate-900">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{' '}
              to{' '}
              <span className="font-bold text-slate-900">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-bold text-slate-900">{pagination.total}</span> students
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="px-3 py-1 font-bold text-slate-800 bg-white border border-slate-200 rounded-lg">
                Page {pagination.page} of {pagination.totalPages}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Student Accessible Modal */}
      {isAddStudentOpen && (
        <AddStudentModal
          onClose={() => setIsAddStudentOpen(false)}
          onAddStudent={handleStudentAdded}
        />
      )}

      {/* Student Profile Quick Modal */}
      {selectedProfileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-700 text-white font-bold text-base flex items-center justify-center">
                  {(selectedProfileModal.fullName || selectedProfileModal.name || selectedProfileModal.studentId)
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedProfileModal.fullName || selectedProfileModal.name} ({selectedProfileModal.studentId})
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedProfileModal.className ? `${selectedProfileModal.className}${selectedProfileModal.sectionName ? ` • Section ${selectedProfileModal.sectionName}` : ''}` : 'Unassigned Class'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedProfileModal(null)}
                aria-label="Close modal"
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-500 font-medium block">Admission No.</span>
                <span className="font-bold text-slate-900">{selectedProfileModal.admissionNo || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Gender</span>
                <span className="font-bold text-slate-900">{selectedProfileModal.gender || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Date of Birth</span>
                <span className="font-bold text-slate-900">{selectedProfileModal.dateOfBirth || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Email</span>
                <span className="font-bold text-slate-900 truncate block">{selectedProfileModal.email || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Phone</span>
                <span className="font-bold text-slate-900">{selectedProfileModal.phone || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Source</span>
                <span className="font-bold text-slate-900">{selectedProfileModal.source || 'MANUAL'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedProfileModal(null);
                  setActiveTab('parent_feedback');
                }}
                className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                Open Parent Feedback Form
              </button>
              <button
                onClick={() => {
                  onSelectStudent(selectedProfileModal);
                  setSelectedProfileModal(null);
                }}
                className="px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition-colors cursor-pointer"
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
