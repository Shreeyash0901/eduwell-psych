// src/components/super-admin/SuperAdminDashboard.tsx
// Super Admin Control Plane — Platform-level dashboard
// No clinical data is displayed here.

import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab } from '../../types';
import {
  LayoutGrid,
  School,
  Users,
  Activity,
  LogOut,
  ShieldCheck,
  TrendingUp,
  Globe,
  ClipboardList,
  ChevronRight,
  Plus,
  ToggleLeft,
  ToggleRight,
  Search,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Eye,
  Edit3,
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
}

interface School {
  id: number;
  name: string;
  code: string;
  status: string;
  createdAt: string;
  _count?: { users: number; students: number };
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
  get: (path: string) => fetch(`/api/super-admin${path}`, { credentials: 'include' }).then(r => r.json()),
  post: (path: string, body: any) =>
    fetch(`/api/super-admin${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json()),
  patch: (path: string, body: any) =>
    fetch(`/api/super-admin${path}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json()),
};

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onSignOut }) => {
  const { user } = useAuth();
  const [saTab, setSaTab] = useState<SATab>('overview');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolTotal, setSchoolTotal] = useState(0);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create School Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', code: '', city: '', country: '' });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchMetrics = useCallback(async () => {
    const data = await API.get('/metrics');
    if (data.success) setMetrics(data.metrics);
  }, []);

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ take: '20', skip: '0' });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const data = await API.get(`/schools?${params.toString()}`);
    if (data.success) {
      setSchools(data.schools);
      setSchoolTotal(data.totalCount);
    }
    setLoading(false);
  }, [search, statusFilter]);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    const data = await API.get('/audit-logs?take=50');
    if (data.success) {
      setAuditLogs(data.logs);
      setAuditTotal(data.totalCount);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (saTab === 'schools') fetchSchools();
    if (saTab === 'audit') fetchAuditLogs();
    if (saTab === 'overview') fetchMetrics();
  }, [saTab, fetchSchools, fetchAuditLogs, fetchMetrics]);

  const handleStatusToggle = async (school: School) => {
    const newStatus = school.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const reason = newStatus === 'INACTIVE'
      ? prompt(`Reason for deactivating "${school.name}"? (optional)`) ?? ''
      : '';
    const data = await API.patch(`/schools/${school.id}/status`, { status: newStatus, reason });
    if (data.success) {
      fetchSchools();
      fetchMetrics();
    } else {
      alert(data.error || 'Failed to update school status.');
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    const data = await API.post('/schools', createForm);
    setCreateLoading(false);
    if (data.success) {
      setShowCreateModal(false);
      setCreateForm({ name: '', code: '', city: '', country: '' });
      fetchSchools();
      fetchMetrics();
      setSaTab('schools');
    } else {
      setCreateError(data.error || 'Failed to create school.');
    }
  };

  const navItems: { id: SATab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'schools', label: 'Schools', icon: School },
    { id: 'audit', label: 'Audit Logs', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-100">EduWell</p>
              <p className="text-xs text-indigo-400 font-medium">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = saTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSaTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User + Signout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white font-bold text-xs">
              {user?.name?.[0] || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-indigo-400 truncate">Platform Administrator</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-100">
              {saTab === 'overview' && 'Platform Overview'}
              {saTab === 'schools' && 'School Management'}
              {saTab === 'audit' && 'Audit Trail'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">EduWell Control Plane · Super Admin</p>
          </div>
          {saTab === 'schools' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              New School
            </button>
          )}
          {saTab !== 'schools' && (
            <button
              onClick={() => { fetchMetrics(); fetchSchools(); fetchAuditLogs(); }}
              className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl text-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          )}
        </div>

        <div className="p-8">
          {/* ── Overview Tab ── */}
          {saTab === 'overview' && (
            <div className="space-y-8">
              {!metrics ? (
                <div className="flex items-center gap-3 text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Loading metrics...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard icon={School} label="Total Schools" value={metrics.totalSchools} color="bg-indigo-600" />
                    <MetricCard icon={CheckCircle2} label="Active Schools" value={metrics.activeSchools} color="bg-emerald-600" />
                    <MetricCard icon={AlertTriangle} label="Inactive Schools" value={metrics.inactiveSchools} color="bg-amber-600" />
                    <MetricCard icon={Users} label="Active Students" value={metrics.totalActiveStudents.toLocaleString()} color="bg-violet-600" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <h2 className="font-semibold text-slate-200 text-sm">Staff by Role</h2>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(metrics.staffByRole).map(([role, count]) => (
                          <div key={role} className="flex items-center justify-between">
                            <span className="text-sm text-slate-400 capitalize">{role.toLowerCase()}</span>
                            <span className="text-sm font-semibold text-slate-200">{count}</span>
                          </div>
                        ))}
                        {Object.keys(metrics.staffByRole).length === 0 && (
                          <p className="text-sm text-slate-600">No staff data.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                      <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-indigo-400" />
                        <h2 className="font-semibold text-slate-200 text-sm">Platform Health</h2>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Active / Total Schools</span>
                          <span className="text-sm font-semibold text-emerald-400">
                            {metrics.activeSchools} / {metrics.totalSchools}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Enabled API Sync Configs</span>
                          <span className="text-sm font-semibold text-slate-200">{metrics.enabledApiSyncConfigs}</span>
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>School Activation Rate</span>
                            <span>{metrics.totalSchools > 0 ? Math.round((metrics.activeSchools / metrics.totalSchools) * 100) : 0}%</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all"
                              style={{ width: `${metrics.totalSchools > 0 ? (metrics.activeSchools / metrics.totalSchools) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-indigo-400" />
                        <h2 className="font-semibold text-slate-200 text-sm">Quick Actions</h2>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => setSaTab('schools')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl transition-colors">
                        <School className="w-4 h-4" /> Manage Schools <ChevronRight className="w-3 h-3" />
                      </button>
                      <button onClick={() => { setSaTab('schools'); setShowCreateModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors">
                        <Plus className="w-4 h-4" /> Add School
                      </button>
                      <button onClick={() => setSaTab('audit')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl transition-colors">
                        <ClipboardList className="w-4 h-4" /> View Audit Logs <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Schools Tab ── */}
          {saTab === 'schools' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchSchools()}
                    placeholder="Search schools..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <button
                  onClick={fetchSchools}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                  <h2 className="font-semibold text-slate-200 text-sm">Schools ({schoolTotal})</h2>
                  {loading && <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />}
                </div>
                {schools.length === 0 && !loading && (
                  <div className="py-12 text-center text-slate-600 text-sm">No schools found.</div>
                )}
                <div className="divide-y divide-slate-800">
                  {schools.map((school) => (
                    <div key={school.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-900 flex items-center justify-center text-indigo-400 font-bold text-sm">
                          {school.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200 text-sm">{school.name}</p>
                          <p className="text-xs text-slate-500">{school.code} · {school._count?.users ?? 0} staff · {school._count?.students ?? 0} students</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          school.status === 'ACTIVE'
                            ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-900/50 text-amber-400 border border-amber-800'
                        }`}>
                          {school.status}
                        </span>
                        <button
                          onClick={() => handleStatusToggle(school)}
                          title={school.status === 'ACTIVE' ? 'Deactivate school' : 'Activate school'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            school.status === 'ACTIVE'
                              ? 'text-emerald-400 hover:bg-emerald-900/30'
                              : 'text-slate-500 hover:bg-slate-800'
                          }`}
                        >
                          {school.status === 'ACTIVE' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Audit Tab ── */}
          {saTab === 'audit' && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                  <h2 className="font-semibold text-slate-200 text-sm">System Audit Log ({auditTotal})</h2>
                  {loading && <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />}
                </div>
                <div className="divide-y divide-slate-800">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${log.outcome === 'SUCCESS' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-medium text-indigo-400">{log.action}</span>
                            {log.targetSchool && (
                              <span className="text-xs text-slate-500">→ {log.targetSchool.name}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{log.actor.name} ({log.actor.email})</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-medium ${log.outcome === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {log.outcome}
                        </span>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {auditLogs.length === 0 && !loading && (
                    <div className="py-12 text-center text-slate-600 text-sm">No audit events recorded.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create School Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="font-bold text-slate-100">Create New School</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-slate-300 text-lg font-bold">×</button>
            </div>
            <form onSubmit={handleCreateSchool} className="p-6 space-y-4">
              {createError && (
                <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-xl p-3">
                  {createError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">School Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Westside Academy"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">School Code * (uppercase, no spaces)</label>
                <input
                  type="text"
                  required
                  value={createForm.code}
                  onChange={(e) => setCreateForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="WESTSIDE"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">City</label>
                  <input
                    type="text"
                    value={createForm.city}
                    onChange={(e) => setCreateForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Country</label>
                  <input
                    type="text"
                    value={createForm.country}
                    onChange={(e) => setCreateForm(f => ({ ...f, country: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="USA"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {createLoading ? 'Creating...' : 'Create School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
