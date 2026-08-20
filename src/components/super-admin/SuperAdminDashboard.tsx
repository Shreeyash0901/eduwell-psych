// src/components/super-admin/SuperAdminDashboard.tsx
// EduWell Psych SaaS Platform Control Plane
// Full multi-tenant administration, metrics, school health, API sync status, and audit logs.

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  Activity,
  LogOut,
  TrendingUp,
  RefreshCw,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Database,
  Server,
  Layers,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  X,
  Sparkles,
  ArrowUpRight,
  Lock,
  Globe,
  Radio,
  BookOpen,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SuperAdminDashboardProps {
  onSignOut: () => void;
}

type SATab = 'overview' | 'schools' | 'audit';

interface Metrics {
  totalSchools: number;
  activeSchools: number;
  inactiveSchools: number;
  totalActiveStudents: number;
  staffByRole: Record<string, number>;
  enabledApiSyncConfigs: number;
  totalObservations: number;
  totalAssessments: number;
  totalReports: number;
  totalClasses: number;
  apiSyncStats: {
    totalConfigured: number;
    totalEnabled: number;
    healthySyncs: number;
  };
  schoolsNeedingAttention: {
    id: number;
    name: string;
    code: string;
    status: string;
    issues: string[];
    studentCount: number;
    staffCount: number;
  }[];
  recentAuditLogs: AuditLog[];
}

interface SchoolItem {
  id: number;
  name: string;
  code: string;
  status: string;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  phone?: string | null;
  website?: string | null;
  createdAt: string;
  updatedAt: string;
  schoolApiConfig?: {
    isEnabled: boolean;
    syncStatus: string;
    lastTestedAt: string | null;
    lastSyncedAt: string | null;
    appVersion: string | null;
    apiBaseUrl: string | null;
  } | null;
  schoolSettings?: {
    timezone: string;
    locale: string;
    defaultGradingSystem: string;
  } | null;
  users?: { id: number; name: string; email: string; status: string }[];
  _count?: {
    users: number;
    students: number;
    observations: number;
    studentAssessments: number;
    reports: number;
    classes: number;
    sections: number;
  };
}

interface SchoolDetail extends SchoolItem {
  schoolSettings?: {
    timezone: string;
    locale: string;
    defaultGradingSystem: string;
    academicYearStartMonth?: number;
    academicYearEndMonth?: number;
  } | null;
  classes?: { id: number; name: string; _count: { sections: number; students: number } }[];
  academicSessions?: { id: number; name: string; startDate: string; endDate: string; isCurrent: boolean }[];
  systemAuditLogs?: { id: number; action: string; outcome: string; createdAt: string; actor: { id: number; name: string; email: string; role: string } }[];
}

interface AuditLog {
  id: number;
  action: string;
  targetType: string | null;
  targetId: number | null;
  targetSchoolId: number | null;
  outcome: string;
  createdAt: string;
  actor: { id: number; name: string; email: string; role: string };
  targetSchool: { id: number; name: string; code: string } | null;
}

const API = {
  get: (path: string) => fetch(`/api/super-admin${path}`, { credentials: 'include' }).then((r) => r.json()),
  post: (path: string, body: any) =>
    fetch(`/api/super-admin${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  patch: (path: string, body: any) =>
    fetch(`/api/super-admin${path}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
};

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onSignOut }) => {
  const { user } = useAuth();
  const [saTab, setSaTab] = useState<SATab>('overview');

  // Metrics state
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);

  // Schools list state
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolStatusFilter, setSchoolStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isSchoolsLoading, setIsSchoolsLoading] = useState(false);

  // School detail modal / drawer state
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [schoolDetail, setSchoolDetail] = useState<SchoolDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // School create & edit modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolItem | null>(null);

  // Deactivate / Activate confirmation modal
  const [statusConfirmSchool, setStatusConfirmSchool] = useState<SchoolItem | null>(null);
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);

  // Audit log state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditSchoolFilter, setAuditSchoolFilter] = useState<string>('');

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    addressLine1: '',
    city: '',
    state: '',
    country: '',
    phone: '',
    website: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch metrics
  const loadMetrics = useCallback(async () => {
    setIsMetricsLoading(true);
    try {
      const res = await API.get('/metrics');
      if (res.success) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      console.error('Failed to load super admin metrics', err);
    } finally {
      setIsMetricsLoading(false);
    }
  }, []);

  // Fetch schools list
  const loadSchools = useCallback(async () => {
    setIsSchoolsLoading(true);
    try {
      const params = new URLSearchParams();
      if (schoolSearch) params.set('search', schoolSearch);
      if (schoolStatusFilter !== 'ALL') params.set('status', schoolStatusFilter);
      params.set('take', '50');
      const res = await API.get(`/schools?${params.toString()}`);
      if (res.success) {
        setSchools(res.schools);
      }
    } catch (err) {
      console.error('Failed to load schools', err);
    } finally {
      setIsSchoolsLoading(false);
    }
  }, [schoolSearch, schoolStatusFilter]);

  // Fetch school detail
  const loadSchoolDetail = async (id: number) => {
    setSelectedSchoolId(id);
    setIsDetailLoading(true);
    try {
      const res = await API.get(`/schools/${id}`);
      if (res.success) {
        setSchoolDetail(res.school);
      }
    } catch (err) {
      console.error('Failed to load school detail', err);
      showToast('Failed to load school details', 'error');
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Fetch audit logs
  const loadAuditLogs = useCallback(async () => {
    setIsAuditLoading(true);
    try {
      const params = new URLSearchParams();
      if (auditSchoolFilter) params.set('targetSchoolId', auditSchoolFilter);
      params.set('take', '50');
      const res = await API.get(`/audit-logs?${params.toString()}`);
      if (res.success) {
        setAuditLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsAuditLoading(false);
    }
  }, [auditSchoolFilter]);

  useEffect(() => {
    loadMetrics();
    loadSchools();
    loadAuditLogs();
  }, [loadMetrics, loadSchools, loadAuditLogs]);

  // Create school handler
  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsFormSubmitting(true);
    try {
      const res = await API.post('/schools', createForm);
      if (res.success) {
        setIsCreateModalOpen(false);
        setCreateForm({
          name: '',
          code: '',
          addressLine1: '',
          city: '',
          state: '',
          country: '',
          phone: '',
          website: '',
        });
        showToast(`School "${res.school.name}" created successfully!`);
        loadSchools();
        loadMetrics();
      } else {
        setFormError(res.error || 'Failed to create school.');
      }
    } catch {
      setFormError('Network error while creating school.');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Edit school handler
  const handleEditSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;
    setFormError(null);
    setIsFormSubmitting(true);
    try {
      const res = await API.patch(`/schools/${editingSchool.id}`, {
        name: editingSchool.name,
        addressLine1: editingSchool.addressLine1,
        city: editingSchool.city,
        state: editingSchool.state,
        country: editingSchool.country,
        phone: editingSchool.phone,
        website: editingSchool.website,
      });
      if (res.success) {
        setIsEditModalOpen(false);
        setEditingSchool(null);
        showToast('School updated successfully.');
        loadSchools();
        if (selectedSchoolId === editingSchool.id) {
          loadSchoolDetail(editingSchool.id);
        }
      } else {
        setFormError(res.error || 'Failed to update school.');
      }
    } catch {
      setFormError('Network error while updating school.');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Confirm status change (Activate / Deactivate)
  const handleExecuteStatusChange = async () => {
    if (!statusConfirmSchool) return;
    const targetStatus = statusConfirmSchool.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setIsStatusSubmitting(true);
    try {
      const res = await API.patch(`/schools/${statusConfirmSchool.id}/status`, {
        status: targetStatus,
        reason: statusChangeReason || undefined,
      });
      if (res.success) {
        showToast(
          `School "${statusConfirmSchool.name}" is now ${targetStatus === 'ACTIVE' ? 'Activated' : 'Deactivated'}.`
        );
        setStatusConfirmSchool(null);
        setStatusChangeReason('');
        loadSchools();
        loadMetrics();
        if (selectedSchoolId === statusConfirmSchool.id) {
          loadSchoolDetail(statusConfirmSchool.id);
        }
      } else {
        showToast(res.error || 'Failed to change school status.', 'error');
      }
    } catch {
      showToast('Network error while changing status.', 'error');
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-semibold animate-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-700/50 text-emerald-200 shadow-emerald-950/50'
              : 'bg-rose-950/90 border-rose-700/50 text-rose-200 shadow-rose-950/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top SaaS Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-extrabold text-white tracking-tight">EduWell Control Plane</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                Platform Super Admin
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PostgreSQL Multi-Tenant Engine Online
              </span>
              <span>•</span>
              <span>Tenant Fail-Closed Isolation Active</span>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadMetrics();
              loadSchools();
              loadAuditLogs();
              showToast('Refreshed platform telemetry.');
            }}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-850 border border-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isMetricsLoading ? 'animate-spin' : ''}`} />
          </button>

          <div className="h-6 w-px bg-slate-800" />

          <div className="flex items-center gap-3 pl-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-xs text-white ring-2 ring-indigo-500/20">
              SA
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-tight">{user?.name || 'Super Admin'}</p>
              <p className="text-[10px] text-indigo-400 font-medium truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold transition-all cursor-pointer ml-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div className="bg-slate-900/40 border-b border-slate-800/60 px-6 py-2 flex items-center justify-between">
        <nav className="flex items-center gap-1">
          {[
            { id: 'overview', label: 'Control Center Overview', icon: Activity },
            { id: 'schools', label: 'School Tenants Roster', icon: Building2 },
            { id: 'audit', label: 'System Audit Logs', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = saTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSaTab(tab.id as SATab)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Provision School</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* TAB 1: OVERVIEW CONTROL CENTER */}
        {saTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Top SaaS KPI Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Schools */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <span>Schools</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white">{metrics?.totalSchools ?? 0}</div>
                  <div className="flex items-center gap-2 mt-1 text-[11px]">
                    <span className="text-emerald-400 font-bold">{metrics?.activeSchools ?? 0} Active</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-rose-400 font-bold">{metrics?.inactiveSchools ?? 0} Inactive</span>
                  </div>
                </div>
              </div>

              {/* Total Active Students */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <span>Enrolled Students</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white">{metrics?.totalActiveStudents ?? 0}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Across all tenant rosters</div>
                </div>
              </div>

              {/* Staff Breakdown */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <span>Staff Roles</span>
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white">
                    {((metrics?.staffByRole?.ADMIN || 0) +
                      (metrics?.staffByRole?.PSYCHOLOGIST || 0) +
                      (metrics?.staffByRole?.TEACHER || 0))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                    <span className="text-purple-300 font-semibold">{metrics?.staffByRole?.ADMIN || 0} Principals</span>
                    <span>•</span>
                    <span className="text-blue-300 font-semibold">{metrics?.staffByRole?.PSYCHOLOGIST || 0} Psych</span>
                  </div>
                </div>
              </div>

              {/* API Integrations */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <span>ERP / API Sync</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Server className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-emerald-400">
                    {metrics?.apiSyncStats?.totalEnabled ?? 0}
                    <span className="text-xs font-normal text-slate-400 ml-1">
                      / {metrics?.apiSyncStats?.totalConfigured ?? 0}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-400/90 mt-1 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Live endpoints active
                  </div>
                </div>
              </div>

              {/* Screening & Output */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <span>Assessments &amp; Reports</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white">
                    {(metrics?.totalAssessments ?? 0) + (metrics?.totalReports ?? 0)}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span>{metrics?.totalAssessments ?? 0} Assessments</span>
                    <span>•</span>
                    <span>{metrics?.totalReports ?? 0} Reports</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT 2 COLS: Live School Directory Table */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        <span>Tenant Schools Overview</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Real-time status, roster metrics, and API sync states
                      </p>
                    </div>
                    <button
                      onClick={() => setSaTab('schools')}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Full Management View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* School quick table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800/80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">School &amp; Code</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Students</th>
                          <th className="py-3 px-4">Staff</th>
                          <th className="py-3 px-4">ERP Sync</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {schools.slice(0, 5).map((school) => {
                          const isSyncActive = school.schoolApiConfig?.isEnabled;
                          return (
                            <tr key={school.id} className="hover:bg-slate-850/50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-white">{school.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{school.code}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    school.status === 'ACTIVE'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      school.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'
                                    }`}
                                  />
                                  {school.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-300">
                                {school._count?.students ?? 0}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-300">
                                {school._count?.users ?? 0}
                              </td>
                              <td className="py-3 px-4">
                                {isSyncActive ? (
                                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Enabled</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-slate-500">Disabled</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => loadSchoolDetail(school.id)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] transition-all cursor-pointer"
                                >
                                  Dossier
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Multi-Tenant Security & Infrastructure Invariants */}
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Control Plane Architectural Safeguards</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Fail-Closed Middleware</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Tenant endpoints strictly reject SUPER_ADMIN and non-tenant tokens with 403.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>DB CHECK Constraint</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        PostgreSQL enforces SUPER_ADMIN school_id IS NULL; all staff school_id IS NOT NULL.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Audit Log Immortality</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Every tenant creation, deactivation, and settings mutation writes to system_audit_logs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT 1 COL: Schools Needing Attention & Recent Audit Logs */}
              <div className="space-y-6">
                {/* Schools Needing Attention */}
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tenants Needing Review ({metrics?.schoolsNeedingAttention?.length || 0})</span>
                  </h3>
                  {metrics?.schoolsNeedingAttention && metrics.schoolsNeedingAttention.length > 0 ? (
                    <div className="space-y-2.5">
                      {metrics.schoolsNeedingAttention.map((s) => (
                        <div
                          key={s.id}
                          className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/20 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-bold text-xs text-white">{s.name}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {s.issues.map((issue, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[9px] font-semibold"
                                >
                                  {issue}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => loadSchoolDetail(s.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                            title="Inspect School"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/40 text-center text-xs text-slate-500">
                      All provisioned schools are fully active and configured.
                    </div>
                  )}
                </div>

                {/* Live Activity Stream */}
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Live Audit Stream</span>
                    </h3>
                    <button
                      onClick={() => setSaTab('audit')}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(metrics?.recentAuditLogs || []).slice(0, 6).map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs flex items-start gap-2.5"
                      >
                        <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[11px] font-bold text-indigo-300 truncate">
                              {log.action}
                            </span>
                            <span className="text-[9px] text-slate-500 shrink-0">
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            By {log.actor.name} ({log.actor.role})
                            {log.targetSchool ? ` on ${log.targetSchool.name}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCHOOLS DIRECTORY & MANAGEMENT */}
        {saTab === 'schools' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Filter and Action Header */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                    placeholder="Search by school name or code..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center rounded-xl bg-slate-950/80 border border-slate-800 p-1">
                  {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setSchoolStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        schoolStatusFilter === st
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New School</span>
                </button>
              </div>
            </div>

            {/* Schools Full Table */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">School Name &amp; Code</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Lead Principal</th>
                      <th className="py-3.5 px-4">Students</th>
                      <th className="py-3.5 px-4">Staff</th>
                      <th className="py-3.5 px-4">API Sync</th>
                      <th className="py-3.5 px-4">Onboarded</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {schools.map((school) => {
                      const adminUser = school.users?.[0];
                      const isSync = school.schoolApiConfig?.isEnabled;
                      return (
                        <tr key={school.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm">{school.name}</div>
                            <div className="text-[11px] text-indigo-400 font-mono">{school.code}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                school.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  school.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'
                                }`}
                              />
                              {school.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {adminUser ? (
                              <div>
                                <div className="font-semibold text-slate-200">{adminUser.name}</div>
                                <div className="text-[10px] text-slate-400">{adminUser.email}</div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-400 italic">No admin assigned</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-200">
                            {school._count?.students ?? 0}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-200">
                            {school._count?.users ?? 0}
                          </td>
                          <td className="py-3.5 px-4">
                            {isSync ? (
                              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-500">Disabled</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {new Date(school.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => loadSchoolDetail(school.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                                title="View School Dossier"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingSchool(school);
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                                title="Edit School Metadata"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setStatusConfirmSchool(school)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  school.status === 'ACTIVE'
                                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                }`}
                                title={school.status === 'ACTIVE' ? 'Deactivate School' : 'Activate School'}
                              >
                                {school.status === 'ACTIVE' ? (
                                  <ToggleRight className="w-4 h-4" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM AUDIT LOGS */}
        {saTab === 'audit' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Platform System Audit Log</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Immutable record of every administrative and control plane mutation
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={auditSchoolFilter}
                  onChange={(e) => setAuditSchoolFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Schools &amp; Platform</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
                <button
                  onClick={loadAuditLogs}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 transition-colors cursor-pointer"
                  title="Refresh Logs"
                >
                  <RefreshCw className={`w-4 h-4 ${isAuditLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Target Scope</th>
                      <th className="py-3 px-4">Outcome</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-850/50 transition-colors font-mono">
                        <td className="py-3 px-4 font-bold text-indigo-300">{log.action}</td>
                        <td className="py-3 px-4 font-sans text-slate-300">
                          {log.actor.name} <span className="text-slate-500 text-[10px]">({log.actor.role})</span>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-400">
                          {log.targetSchool ? (
                            <span className="text-slate-200 font-medium">{log.targetSchool.name}</span>
                          ) : (
                            <span className="text-slate-600">Platform Global</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.outcome === 'SUCCESS'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {log.outcome}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-sans text-slate-400 text-[11px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: SCHOOL DOSSIER / DETAIL DRAWER */}
      {selectedSchoolId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{schoolDetail?.name || 'School Dossier'}</h3>
                  <p className="text-xs text-indigo-400 font-mono">{schoolDetail?.code}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSchoolId(null);
                  setSchoolDetail(null);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {isDetailLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                  <span>Loading school telemetry dossier...</span>
                </div>
              ) : schoolDetail ? (
                <>
                  {/* Status and Tenant Scope Banner */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tenant Status</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                            schoolDetail.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              schoolDetail.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          {schoolDetail.status}
                        </span>
                        <span className="text-slate-400 text-xs">
                          Created on {new Date(schoolDetail.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setStatusConfirmSchool(schoolDetail)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Toggle Status
                    </button>
                  </div>

                  {/* Operational Telemetry Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Students</p>
                      <p className="text-lg font-black text-white mt-0.5">{schoolDetail._count?.students || 0}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Staff Members</p>
                      <p className="text-lg font-black text-white mt-0.5">{schoolDetail._count?.users || 0}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Classes / Sections</p>
                      <p className="text-lg font-black text-white mt-0.5">
                        {schoolDetail._count?.classes || 0} / {schoolDetail._count?.sections || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Assessments</p>
                      <p className="text-lg font-black text-white mt-0.5">
                        {schoolDetail._count?.studentAssessments || 0}
                      </p>
                    </div>
                  </div>

                  {/* ERP / School API Configuration */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                      <Server className="w-4 h-4 text-emerald-400" />
                      <span>ERP Integration &amp; API Sync Config</span>
                    </h4>
                    {schoolDetail.schoolApiConfig ? (
                      <div className="space-y-1.5 text-slate-400 text-xs">
                        <div className="flex items-center justify-between">
                          <span>Integration Status:</span>
                          <span
                            className={`font-bold ${
                              schoolDetail.schoolApiConfig.isEnabled ? 'text-emerald-400' : 'text-slate-500'
                            }`}
                          >
                            {schoolDetail.schoolApiConfig.isEnabled ? 'ENABLED' : 'DISABLED'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Endpoint URL:</span>
                          <span className="font-mono text-slate-300 text-[11px]">
                            {schoolDetail.schoolApiConfig.apiBaseUrl || 'Not configured'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Last Tested:</span>
                          <span>
                            {schoolDetail.schoolApiConfig.lastTestedAt
                              ? new Date(schoolDetail.schoolApiConfig.lastTestedAt).toLocaleString()
                              : 'Never'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs">No external ERP API integration configured for this school.</p>
                    )}
                  </div>

                  {/* Provisioned Staff Roster */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span>School Staff Accounts</span>
                    </h4>
                    {schoolDetail.users && schoolDetail.users.length > 0 ? (
                      <div className="space-y-2">
                        {schoolDetail.users.map((u) => (
                          <div
                            key={u.id}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-white">{u.name}</span>
                              <span className="text-[10px] text-slate-400 block">{u.email}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                u.role === 'ADMIN'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : u.role === 'PSYCHOLOGIST'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {u.role === 'ADMIN' ? 'PRINCIPAL' : u.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs">No staff accounts provisioned yet.</p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PROVISION / CREATE NEW SCHOOL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Provision School Tenant</h3>
                  <p className="text-xs text-slate-400">Initialize a new isolated educational institution</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700/50 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSchool} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">School Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. St. Jude Regional Academy"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Unique School Code *</label>
                <input
                  type="text"
                  required
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. ST_JUDE_01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">City</label>
                  <input
                    type="text"
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    placeholder="e.g. Springfield"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">State / Region</label>
                  <input
                    type="text"
                    value={createForm.state}
                    onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                    placeholder="e.g. IL"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFormSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isFormSubmitting ? 'Provisioning...' : 'Provision School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM STATUS CHANGE */}
      {statusConfirmSchool && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  statusConfirmSchool.status === 'ACTIVE'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {statusConfirmSchool.status === 'ACTIVE' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {statusConfirmSchool.status === 'ACTIVE'
                    ? `Deactivate ${statusConfirmSchool.name}?`
                    : `Activate ${statusConfirmSchool.name}?`}
                </h3>
                <p className="text-xs text-slate-400">Reversible multi-tenant status operation</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {statusConfirmSchool.status === 'ACTIVE'
                ? 'Deactivating will immediately prevent tenant staff from logging in. All historical records, student observations, and assessments remain fully preserved and isolated.'
                : 'Activating will immediately re-enable portal access for all provisioned staff in this school.'}
            </p>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-400">Optional Reason for Audit Log</label>
              <input
                type="text"
                value={statusChangeReason}
                onChange={(e) => setStatusChangeReason(e.target.value)}
                placeholder="e.g. End of trial period / Contract renewed"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStatusConfirmSchool(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteStatusChange}
                disabled={isStatusSubmitting}
                className={`px-5 py-2 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                  statusConfirmSchool.status === 'ACTIVE'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                {isStatusSubmitting
                  ? 'Updating...'
                  : statusConfirmSchool.status === 'ACTIVE'
                  ? 'Confirm Deactivation'
                  : 'Confirm Activation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
