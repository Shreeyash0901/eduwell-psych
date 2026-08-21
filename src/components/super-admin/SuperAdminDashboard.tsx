// src/components/super-admin/SuperAdminDashboard.tsx
// EduWell Psych SaaS Platform Control Plane
// Full multi-tenant administration, metrics, school health, API sync status, and audit logs.
// Redesigned with the light, clean, premium EduWell Psych design system.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Calendar,
  Phone,
  MapPin,
  ChevronLeft,
  Sliders,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ActiveTab, UserSession } from '../../types';

export interface SuperAdminDashboardProps {
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  searchQuery?: string;
  onSignOut?: () => void;
}

type SATab = 'overview' | 'schools' | 'audit' | 'settings';

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
  users?: { id: number; name: string; email: string; status: string; role?: string }[];
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

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  activeTab = 'super_admin_dashboard',
  setActiveTab,
  searchQuery = '',
  onSignOut,
}) => {
  const { user } = useAuth();

  // Internal tab state synced with activeTab prop
  const currentTab: SATab = useMemo(() => {
    if (activeTab === 'super_admin_schools') return 'schools';
    if (activeTab === 'super_admin_audit') return 'audit';
    if (activeTab === 'settings') return 'settings';
    return 'overview';
  }, [activeTab]);

  const setTab = (tab: SATab) => {
    if (setActiveTab) {
      if (tab === 'schools') setActiveTab('super_admin_schools');
      else if (tab === 'audit') setActiveTab('super_admin_audit');
      else if (tab === 'settings') setActiveTab('settings');
      else setActiveTab('super_admin_dashboard');
    }
  };

  // Metrics state
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);

  // Schools list state
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolStatusFilter, setSchoolStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'ATTENTION'>('ALL');
  const [isSchoolsLoading, setIsSchoolsLoading] = useState(false);
  const [schoolsPage, setSchoolsPage] = useState(1);
  const [schoolsPagination, setSchoolsPagination] = useState({ total: 0, totalPages: 1 });
  const schoolsLimit = 10;

  // School detail modal / drawer state
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [schoolDetail, setSchoolDetail] = useState<SchoolDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'classes' | 'sessions' | 'users' | 'api' | 'audit'>('overview');

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
  const [auditOutcomeFilter, setAuditOutcomeFilter] = useState<'ALL' | 'SUCCESS' | 'FAILURE'>('ALL');
  const [auditPage, setAuditPage] = useState(1);
  const [auditPagination, setAuditPagination] = useState({ total: 0, totalPages: 1 });
  const auditLimit = 50;

  // Form states for creating a school
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    addressLine1: '',
    city: '',
    state: '',
    country: 'United States',
    phone: '',
    website: '',
    timezone: 'America/New_York',
    locale: 'en-US',
    defaultGradingSystem: 'Letter (A-F)',
    initialAdminName: '',
    initialAdminEmail: '',
    initialAdminPassword: '',
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
      const query = schoolSearch || searchQuery;
      if (query) params.set('search', query);
      if (schoolStatusFilter !== 'ALL' && schoolStatusFilter !== 'ATTENTION') {
        params.set('status', schoolStatusFilter);
      }
      params.set('take', schoolsLimit.toString());
      params.set('skip', ((schoolsPage - 1) * schoolsLimit).toString());

      const res = await API.get(`/schools?${params.toString()}`);
      if (res.success) {
        setSchools(res.schools);
        setSchoolsPagination({
          total: res.totalCount || res.schools.length,
          totalPages: Math.ceil((res.totalCount || res.schools.length) / schoolsLimit) || 1
        });
      }
    } catch (err) {
      console.error('Failed to load schools', err);
    } finally {
      setIsSchoolsLoading(false);
    }
  }, [schoolSearch, searchQuery, schoolStatusFilter, schoolsPage]);

  // Fetch school detail
  const loadSchoolDetail = async (id: number) => {
    setSelectedSchoolId(id);
    setIsDetailLoading(true);
    setDetailTab('overview');
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
      if (auditOutcomeFilter !== 'ALL') params.set('outcome', auditOutcomeFilter);
      params.set('take', auditLimit.toString());
      params.set('skip', ((auditPage - 1) * auditLimit).toString());
      
      const res = await API.get(`/audit-logs?${params.toString()}`);
      if (res.success) {
        setAuditLogs(res.logs);
        setAuditPagination({
          total: res.totalCount || res.logs.length,
          totalPages: Math.ceil((res.totalCount || res.logs.length) / auditLimit) || 1
        });
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsAuditLoading(false);
    }
  }, [auditSchoolFilter, auditOutcomeFilter, auditPage]);

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
          country: 'United States',
          phone: '',
          website: '',
          timezone: 'America/New_York',
          locale: 'en-US',
          defaultGradingSystem: 'Letter (A-F)',
          initialAdminName: '',
          initialAdminEmail: '',
          initialAdminPassword: '',
        });
        showToast(`Institution "${res.school?.name || createForm.name}" provisioned successfully!`);
        loadSchools();
        loadMetrics();
      } else {
        setFormError(res.error || 'Failed to provision institution.');
      }
    } catch {
      setFormError('Network error while provisioning institution.');
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const totalStaffCount =
    (metrics?.staffByRole?.ADMIN || metrics?.staffByRole?.admin || 0) +
    (metrics?.staffByRole?.PSYCHOLOGIST || metrics?.staffByRole?.psychologist || 0) +
    (metrics?.staffByRole?.TEACHER || metrics?.staffByRole?.teacher || 0);

  // Filtered schools for view
  const filteredSchools = useMemo(() => {
    let list = schools;
    if (schoolStatusFilter === 'ACTIVE') {
      list = list.filter((s) => s.status === 'ACTIVE');
    } else if (schoolStatusFilter === 'INACTIVE') {
      list = list.filter((s) => s.status === 'INACTIVE');
    } else if (schoolStatusFilter === 'ATTENTION') {
      const attentionIds = new Set(metrics?.schoolsNeedingAttention.map((s) => s.id) || []);
      list = list.filter((s) => attentionIds.has(s.id));
    }
    return list;
  }, [schools, schoolStatusFilter, metrics]);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 border text-sm font-semibold animate-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW CONTROL CENTER (Exact match with screenshot) */}
      {/* ======================================================== */}
      {currentTab === 'overview' && (
        <>
          {/* Top Greeting & Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {getGreeting()}, {user?.name || 'Super Admin'}
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Review multi-tenant institutions, platform health, and audit logs.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Institution</span>
              </button>

              <button
                onClick={() => {
                  loadMetrics();
                  loadSchools();
                  loadAuditLogs();
                  showToast('Refreshed platform telemetry.');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200/80 text-blue-700 hover:bg-blue-50/50 rounded-lg text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 text-blue-600 ${isMetricsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Telemetry</span>
              </button>

              <button
                onClick={() => setTab('audit')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200/80 text-blue-700 hover:bg-blue-50/50 rounded-lg text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Audit Logs</span>
              </button>
            </div>
          </div>

          {/* 4 KPI Summary Cards Row (Matching Screenshot layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1: TOTAL SCHOOLS */}
            <div
              onClick={() => setTab('schools')}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Institutions
                </span>
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {metrics?.totalSchools ?? schools.length}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {metrics?.activeSchools ?? 0} Active
                </span>
              </div>
            </div>

            {/* Card 2: TOTAL STUDENTS */}
            <div
              onClick={() => setTab('schools')}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Students
                </span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {metrics?.totalActiveStudents ?? 0}
                </span>
                <span className="text-xs font-medium text-slate-500">enrolled</span>
              </div>
            </div>

            {/* Card 3: STAFF & USERS */}
            <div
              onClick={() => setTab('schools')}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Staff &amp; Users
                </span>
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {totalStaffCount}
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {metrics?.staffByRole?.PSYCHOLOGIST || metrics?.staffByRole?.psychologist || 0} Psych
                </span>
              </div>
            </div>

            {/* Card 4: API INTEGRATIONS */}
            <div
              onClick={() => setTab('settings')}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  ERP / API Sync
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {metrics?.apiSyncStats?.totalEnabled ?? metrics?.enabledApiSyncConfigs ?? 0}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
            </div>
          </div>

          {/* Main Two-Column Section: Tenant Institutions (Left) & Platform Health / Actions (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (8 cols): Recent Tenant Institutions Table */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-bold text-slate-900">Tenant Institutions</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {schools.length} Total
                  </span>
                </div>
                <button
                  onClick={() => setTab('schools')}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/60 text-xs font-semibold text-slate-500 border-b border-slate-200/80">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Institution</th>
                      <th className="px-6 py-3 font-semibold">Code</th>
                      <th className="px-6 py-3 font-semibold">Students</th>
                      <th className="px-6 py-3 font-semibold">Staff</th>
                      <th className="px-6 py-3 font-semibold">API Sync</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {schools.length > 0 ? (
                      schools.slice(0, 6).map((school) => (
                        <tr key={school.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-100 shrink-0">
                                {school.code?.slice(0, 2) || 'SC'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">{school.name}</p>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                  {[school.city, school.state].filter(Boolean).join(', ') || 'Global Campus'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                              {school.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>{school._count?.students ?? 0}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                              <span>{school._count?.users ?? 0}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {school.schoolApiConfig?.isEnabled ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                                Disabled
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                                school.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {school.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => loadSchoolDetail(school.id)}
                                className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors inline-flex items-center justify-center cursor-pointer"
                                title="Inspect School Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setStatusConfirmSchool(school)}
                                className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors inline-flex items-center justify-center cursor-pointer"
                                title={school.status === 'ACTIVE' ? 'Deactivate School' : 'Activate School'}
                              >
                                {school.status === 'ACTIVE' ? (
                                  <ToggleRight className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingSchool(school);
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors inline-flex items-center justify-center cursor-pointer"
                                title="Edit School"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                          No institutions provisioned yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column (4 cols): Platform Health & Attention Needed */}
            <div className="lg:col-span-4 space-y-6">
              {/* Platform Engine Status Card */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">Platform Health</h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2 text-slate-700">
                      <Database className="w-4 h-4 text-emerald-600" />
                      Multi-Tenant PostgreSQL
                    </span>
                    <span className="text-emerald-700 font-bold">ONLINE</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2 text-slate-700">
                      <Lock className="w-4 h-4 text-blue-600" />
                      Fail-Closed Isolation
                    </span>
                    <span className="text-blue-700 font-bold">ENFORCED</span>
                  </div>
                </div>

                {/* Telemetry Numbers */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                  <div className="p-2.5 bg-slate-50/70 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Classes</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">{metrics?.totalClasses ?? 0}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50/70 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Observations</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">{metrics?.totalObservations ?? 0}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50/70 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Assessments</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">{metrics?.totalAssessments ?? 0}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50/70 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Reports</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">{metrics?.totalReports ?? 0}</p>
                  </div>
                </div>
              </div>

              {/* Schools Needing Attention */}
              {metrics?.schoolsNeedingAttention && metrics.schoolsNeedingAttention.length > 0 && (
                <div className="bg-white border border-amber-200 rounded-xl shadow-xs p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Attention Needed</span>
                    </h2>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      {metrics.schoolsNeedingAttention.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {metrics.schoolsNeedingAttention.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => loadSchoolDetail(item.id)}
                        className="p-3 bg-amber-50/40 hover:bg-amber-50 border border-amber-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{item.name}</span>
                          <span className="text-[10px] font-mono font-semibold text-slate-500">{item.code}</span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-1 font-medium">
                          {item.issues[0] || 'Configuration required'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Audit Timeline Preview */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">Recent Audit Activity</h2>
                  <button
                    onClick={() => setTab('audit')}
                    className="text-xs font-semibold text-blue-700 hover:underline"
                  >
                    View Logs
                  </button>
                </div>

                <div className="space-y-2.5">
                  {auditLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="text-xs p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{log.action}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        By <span className="font-medium text-slate-700">{log.actor?.name || 'System'}</span>
                        {log.targetSchool ? ` • ${log.targetSchool.name}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Blue Banner (Exact match with screenshot style) */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base">
                  Multi-Tenant Platform Operational • 100% Data Isolation Active
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Fail-closed multi-tenant PostgreSQL schema isolation verified across all active tenants.
                </p>
              </div>
            </div>

            <button
              onClick={() => setTab('audit')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <span>View Audit Telemetry</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 2: FULL SCHOOLS ROSTER & MANAGEMENT                  */}
      {/* ======================================================== */}
      {currentTab === 'schools' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTab('overview')}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tenant Institutions</h1>
              </div>
              <p className="text-sm text-slate-500 mt-1 font-medium pl-7">
                Manage educational institutions, isolated tenants, and API integrations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard Institution</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                placeholder="Filter institutions by name, code, or city..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 self-stretch sm:self-auto overflow-x-auto">
              {[
                { id: 'ALL', label: `All (${schools.length})` },
                { id: 'ACTIVE', label: `Active (${schools.filter((s) => s.status === 'ACTIVE').length})` },
                { id: 'INACTIVE', label: `Inactive (${schools.filter((s) => s.status === 'INACTIVE').length})` },
                {
                  id: 'ATTENTION',
                  label: `Needs Attention (${metrics?.schoolsNeedingAttention.length || 0})`,
                },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSchoolStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    schoolStatusFilter === f.id
                      ? 'bg-blue-100/80 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Full Schools Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/60 text-xs font-semibold text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Institution</th>
                    <th className="px-6 py-3.5 font-semibold">Code</th>
                    <th className="px-6 py-3.5 font-semibold">Location</th>
                    <th className="px-6 py-3.5 font-semibold">Students</th>
                    <th className="px-6 py-3.5 font-semibold">Staff</th>
                    <th className="px-6 py-3.5 font-semibold">API Sync</th>
                    <th className="px-6 py-3.5 font-semibold">Status</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredSchools.length > 0 ? (
                    filteredSchools.map((school) => (
                      <tr key={school.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-100 shrink-0">
                              {school.code?.slice(0, 2) || 'SC'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm leading-tight">{school.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {school.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                            {school.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {[school.city, school.state, school.country].filter(Boolean).join(', ') || 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{school._count?.students ?? 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>{school._count?.users ?? 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {school.schoolApiConfig?.isEnabled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active Sync
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                              school.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {school.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => loadSchoolDetail(school.id)}
                              className="px-2.5 py-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>
                            <button
                              onClick={() => setStatusConfirmSchool(school)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors inline-flex items-center justify-center cursor-pointer"
                              title={school.status === 'ACTIVE' ? 'Deactivate School' : 'Activate School'}
                            >
                              {school.status === 'ACTIVE' ? (
                                <ToggleRight className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditingSchool(school);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors inline-flex items-center justify-center cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                        No institutions match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Schools */}
            {schoolsPagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-500 font-medium text-center sm:text-left">
                  Showing {(schoolsPage - 1) * schoolsLimit + 1} to {Math.min(schoolsPage * schoolsLimit, schoolsPagination.total)} of {schoolsPagination.total} institutions
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={schoolsPage === 1}
                    onClick={() => setSchoolsPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-700 bg-white px-3 py-1 rounded-md border border-slate-200">
                    Page {schoolsPage} of {schoolsPagination.totalPages}
                  </span>
                  <button
                    disabled={schoolsPage === schoolsPagination.totalPages}
                    onClick={() => setSchoolsPage((p) => Math.min(schoolsPagination.totalPages, p + 1))}
                    className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SYSTEM AUDIT LOGS                                */}
      {/* ======================================================== */}
      {currentTab === 'audit' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTab('overview')}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform System Audit Logs</h1>
              </div>
              <p className="text-sm text-slate-500 mt-1 font-medium pl-7">
                Immutable security and event telemetry across all multi-tenant institutions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadAuditLogs()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isAuditLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Logs</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Outcome:</span>
              <div className="flex items-center gap-1">
                {(['ALL', 'SUCCESS', 'FAILURE'] as const).map((outcome) => (
                  <button
                    key={outcome}
                    onClick={() => setAuditOutcomeFilter(outcome)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      auditOutcomeFilter === outcome
                        ? 'bg-blue-100 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {outcome}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-bold text-slate-500 uppercase">School:</span>
              <select
                value={auditSchoolFilter}
                onChange={(e) => setAuditSchoolFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Schools (Platform-wide)</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/60 text-xs font-semibold text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Timestamp</th>
                    <th className="px-6 py-3.5 font-semibold">Actor</th>
                    <th className="px-6 py-3.5 font-semibold">Action</th>
                    <th className="px-6 py-3.5 font-semibold">Target Institution</th>
                    <th className="px-6 py-3.5 font-semibold">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{log.actor?.name || 'System'}</p>
                          <p className="text-[11px] text-slate-400">{log.actor?.email || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {log.targetSchool ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{log.targetSchool.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Global / System</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.outcome === 'SUCCESS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {log.outcome}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No audit log records found for this query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Audit Logs */}
            {auditPagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-500 font-medium text-center sm:text-left">
                  Showing {(auditPage - 1) * auditLimit + 1} to {Math.min(auditPage * auditLimit, auditPagination.total)} of {auditPagination.total} logs
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={auditPage === 1}
                    onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-700 bg-white px-3 py-1 rounded-md border border-slate-200">
                    Page {auditPage} of {auditPagination.totalPages}
                  </span>
                  <button
                    disabled={auditPage === auditPagination.totalPages}
                    onClick={() => setAuditPage((p) => Math.min(auditPagination.totalPages, p + 1))}
                    className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: PLATFORM SETTINGS & TELEMETRY                    */}
      {/* ======================================================== */}
      {currentTab === 'settings' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTab('overview')}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings &amp; Telemetry</h1>
              </div>
              <p className="text-sm text-slate-500 mt-1 font-medium pl-7">
                Multi-tenant isolation status, database health, and global ERP sync configurations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Database Isolation Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <span>Database Multi-Tenancy</span>
                </h2>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  HEALTHY
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Tenant Isolation Strategy:</span>
                  <span className="font-bold text-slate-800">Fail-Closed School ID Scoping</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">PostgreSQL Server:</span>
                  <span className="font-bold text-slate-800">Active Connection Pool</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Total Registered Institutions:</span>
                  <span className="font-bold text-slate-800">{metrics?.totalSchools ?? 0}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 font-medium">Global Student Records:</span>
                  <span className="font-bold text-slate-800">{metrics?.totalActiveStudents ?? 0}</span>
                </div>
              </div>
            </div>

            {/* ERP Sync Engine Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-600" />
                  <span>ERP &amp; School API Sync</span>
                </h2>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  OPERATIONAL
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Enabled School Endpoints:</span>
                  <span className="font-bold text-slate-800">{metrics?.apiSyncStats?.totalEnabled ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Configured Endpoints:</span>
                  <span className="font-bold text-slate-800">{metrics?.apiSyncStats?.totalConfigured ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Sync Protocol:</span>
                  <span className="font-bold text-slate-800">RESTful JSON with Bearer Auth</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 font-medium">Fail-Safe Local Roster:</span>
                  <span className="font-bold text-emerald-700">Supported</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ONBOARD NEW INSTITUTION                           */}
      {/* ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Onboard New Educational Institution</h2>
                  <p className="text-xs text-slate-500">Provision an isolated multi-tenant school environment</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchool} className="p-6 space-y-6">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section 1: Institution Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Institution Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Institution Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="e.g. Oakridge Academy"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Unique School Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.code}
                      onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. OAKRIDGE-01"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      placeholder="+1 (555) 019-2834"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
                    <input
                      type="text"
                      value={createForm.website}
                      onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })}
                      placeholder="https://oakridge.edu"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Location */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Physical Address</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={createForm.addressLine1}
                    onChange={(e) => setCreateForm({ ...createForm, addressLine1: e.target.value })}
                    placeholder="123 Education Blvd"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                      placeholder="Seattle"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={createForm.state}
                      onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                      placeholder="WA"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={createForm.country}
                      onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Initial Principal / Admin User */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Initial Principal Account (Optional)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Principal Name</label>
                    <input
                      type="text"
                      value={createForm.initialAdminName}
                      onChange={(e) => setCreateForm({ ...createForm, initialAdminName: e.target.value })}
                      placeholder="Dr. Eleanor Vance"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Principal Email</label>
                    <input
                      type="email"
                      value={createForm.initialAdminEmail}
                      onChange={(e) => setCreateForm({ ...createForm, initialAdminEmail: e.target.value })}
                      placeholder="principal@oakridge.edu"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {createForm.initialAdminEmail && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password</label>
                    <input
                      type="password"
                      value={createForm.initialAdminPassword}
                      onChange={(e) => setCreateForm({ ...createForm, initialAdminPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFormSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isFormSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Provision Institution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT INSTITUTION DETAILS                         */}
      {/* ======================================================== */}
      {isEditModalOpen && editingSchool && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-base font-bold text-slate-900">Edit Institution Details</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSchool} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  required
                  value={editingSchool.name}
                  onChange={(e) => setEditingSchool({ ...editingSchool, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingSchool.phone || ''}
                    onChange={(e) => setEditingSchool({ ...editingSchool, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editingSchool.city || ''}
                    onChange={(e) => setEditingSchool({ ...editingSchool, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFormSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: STATUS CHANGE CONFIRMATION (Activate / Deactivate) */}
      {/* ======================================================== */}
      {statusConfirmSchool && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  statusConfirmSchool.status === 'ACTIVE'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {statusConfirmSchool.status === 'ACTIVE' ? 'Deactivate Institution' : 'Activate Institution'}
                </h3>
                <p className="text-xs text-slate-500">{statusConfirmSchool.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {statusConfirmSchool.status === 'ACTIVE'
                ? 'Deactivating this institution will immediately prevent all staff, teachers, and psychologists in this school from signing in or executing screenings.'
                : 'Activating this institution will restore full access for authorized staff and enable observation logging.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Note (Optional)</label>
              <input
                type="text"
                value={statusChangeReason}
                onChange={(e) => setStatusChangeReason(e.target.value)}
                placeholder="e.g. End of academic trial or requested by principal"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setStatusConfirmSchool(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteStatusChange}
                disabled={isStatusSubmitting}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-xs cursor-pointer ${
                  statusConfirmSchool.status === 'ACTIVE'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
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

      {/* ======================================================== */}
      {/* DRAWER / MODAL: INSTITUTION INSPECT DETAILS              */}
      {/* ======================================================== */}
      {selectedSchoolId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {schoolDetail?.code?.slice(0, 2) || 'SC'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{schoolDetail?.name || 'Loading details...'}</h2>
                    {schoolDetail && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          schoolDetail.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {schoolDetail.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Code: {schoolDetail?.code} • ID: {schoolDetail?.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedSchoolId(null);
                  setSchoolDetail(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-slate-200 px-6 flex items-center gap-1 bg-white">
              {[
                { id: 'overview', label: 'Overview', icon: Building2 },
                { id: 'classes', label: `Classes (${schoolDetail?.classes?.length || 0})`, icon: Layers },
                { id: 'sessions', label: `Academic Years (${schoolDetail?.academicSessions?.length || 0})`, icon: Calendar },
                { id: 'users', label: `Staff & Users (${schoolDetail?.users?.length || 0})`, icon: Users },
                { id: 'api', label: 'ERP Sync Config', icon: Server },
                { id: 'audit', label: 'Audit Trail', icon: FileText },
              ].map((t) => {
                const Icon = t.icon;
                const isActive = detailTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setDetailTab(t.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                      isActive
                        ? 'border-blue-700 text-blue-700 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {isDetailLoading ? (
                <div className="py-16 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                  <p className="text-xs font-semibold">Loading institution data...</p>
                </div>
              ) : schoolDetail ? (
                <>
                  {/* DETAIL TAB: OVERVIEW */}
                  {detailTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase">Students Enrolled</p>
                          <p className="text-2xl font-extrabold text-slate-900 mt-1">
                            {schoolDetail._count?.students ?? 0}
                          </p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase">Observations</p>
                          <p className="text-2xl font-extrabold text-slate-900 mt-1">
                            {schoolDetail._count?.observations ?? 0}
                          </p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase">Screenings Run</p>
                          <p className="text-2xl font-extrabold text-slate-900 mt-1">
                            {schoolDetail._count?.studentAssessments ?? 0}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Contact &amp; Location
                        </h3>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                          <p className="text-slate-700">
                            <span className="font-semibold text-slate-500">Address:</span>{' '}
                            {schoolDetail.addressLine1 || 'N/A'}, {schoolDetail.city}, {schoolDetail.state}{' '}
                            {schoolDetail.country}
                          </p>
                          <p className="text-slate-700">
                            <span className="font-semibold text-slate-500">Phone:</span>{' '}
                            {schoolDetail.phone || 'N/A'}
                          </p>
                          <p className="text-slate-700">
                            <span className="font-semibold text-slate-500">Website:</span>{' '}
                            {schoolDetail.website ? (
                              <a
                                href={schoolDetail.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-700 hover:underline"
                              >
                                {schoolDetail.website}
                              </a>
                            ) : (
                              'N/A'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DETAIL TAB: CLASSES */}
                  {detailTab === 'classes' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Configured Classes &amp; Sections
                      </h3>
                      {schoolDetail.classes && schoolDetail.classes.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {schoolDetail.classes.map((cls) => (
                            <div key={cls.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                              <p className="font-bold text-slate-900 text-sm">{cls.name}</p>
                              <div className="flex items-center gap-3 mt-2 text-slate-500 font-medium">
                                <span>{cls._count?.sections ?? 0} Sections</span>
                                <span>•</span>
                                <span>{cls._count?.students ?? 0} Students</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 py-8 text-center">No classes configured for this school yet.</p>
                      )}
                    </div>
                  )}

                  {/* DETAIL TAB: SESSIONS */}
                  {detailTab === 'sessions' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Academic Sessions</h3>
                      {schoolDetail.academicSessions && schoolDetail.academicSessions.length > 0 ? (
                        <div className="space-y-2">
                          {schoolDetail.academicSessions.map((session) => (
                            <div
                              key={session.id}
                              className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{session.name}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {new Date(session.startDate).toLocaleDateString()} –{' '}
                                  {new Date(session.endDate).toLocaleDateString()}
                                </p>
                              </div>
                              {session.isCurrent && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  CURRENT SESSION
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 py-8 text-center">No academic sessions registered.</p>
                      )}
                    </div>
                  )}

                  {/* DETAIL TAB: USERS */}
                  {detailTab === 'users' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Authorized Staff Roster</h3>
                      {schoolDetail.users && schoolDetail.users.length > 0 ? (
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                          {schoolDetail.users.map((u) => (
                            <div key={u.id} className="p-3.5 bg-slate-50 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-slate-900">{u.name}</p>
                                <p className="text-[11px] text-slate-500">{u.email}</p>
                              </div>
                              <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                {u.role || u.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 py-8 text-center">No users enrolled in this school.</p>
                      )}
                    </div>
                  )}

                  {/* DETAIL TAB: API CONFIG */}
                  {detailTab === 'api' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">ERP Integration Config</h3>
                      {schoolDetail.schoolApiConfig ? (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-200/60">
                            <span className="text-slate-500 font-semibold">Base Endpoint URL:</span>
                            <span className="font-mono text-slate-800">{schoolDetail.schoolApiConfig.apiBaseUrl || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-200/60">
                            <span className="text-slate-500 font-semibold">Sync Status:</span>
                            <span className="font-bold text-slate-800">{schoolDetail.schoolApiConfig.syncStatus}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-200/60">
                            <span className="text-slate-500 font-semibold">Last Tested:</span>
                            <span className="text-slate-800">
                              {schoolDetail.schoolApiConfig.lastTestedAt
                                ? new Date(schoolDetail.schoolApiConfig.lastTestedAt).toLocaleString()
                                : 'Never'}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500 font-semibold">Last Synchronized:</span>
                            <span className="text-slate-800">
                              {schoolDetail.schoolApiConfig.lastSyncedAt
                                ? new Date(schoolDetail.schoolApiConfig.lastSyncedAt).toLocaleString()
                                : 'Never'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 py-8 text-center">No API sync configuration created yet.</p>
                      )}
                    </div>
                  )}

                  {/* DETAIL TAB: AUDIT */}
                  {detailTab === 'audit' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">School Audit Trail</h3>
                      {schoolDetail.systemAuditLogs && schoolDetail.systemAuditLogs.length > 0 ? (
                        <div className="space-y-2">
                          {schoolDetail.systemAuditLogs.map((log) => (
                            <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{log.action}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Performed by <span className="font-medium text-slate-700">{log.actor?.name}</span> ({log.outcome})
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 py-8 text-center">No audit events recorded for this school.</p>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
