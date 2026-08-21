// src/components/settings/PrincipalAuditLogSection.tsx
// School-scoped Activity Audit Log for Principal / Admin role.
// Only events tied to THIS school are surfaced — strict tenant isolation.
// No cross-school data is accessible here; that is exclusively the Super Admin's domain.

import React, { useState, useCallback, useEffect } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Lock,
  Info,
} from 'lucide-react';

interface AuditLog {
  id: number;
  action: string;
  targetType: string | null;
  outcome: string;
  createdAt: string;
  metadata: any;
  actor: { id: number; name: string; email: string; role: string };
}

const LIMIT = 20;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Principal',
  PSYCHOLOGIST: 'Psychologist',
  TEACHER: 'Teacher',
  SUPER_ADMIN: 'Platform Admin',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#3b5bdb',
  PSYCHOLOGIST: '#7950f2',
  TEACHER: '#0ca678',
  TEACHER2: '#e67700',
};

export const PrincipalAuditLogSection: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'SUCCESS' | 'FAILURE'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('take', LIMIT.toString());
      params.set('skip', ((page - 1) * LIMIT).toString());
      if (outcomeFilter !== 'ALL') params.set('outcome', outcomeFilter);

      const res = await fetch(`/api/settings/audit-logs?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs ?? []);
        setTotalCount(data.totalCount ?? 0);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('[PrincipalAuditLog] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, outcomeFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Reset to page 1 when filter changes
  const handleOutcomeChange = (v: 'ALL' | 'SUCCESS' | 'FAILURE') => {
    setOutcomeFilter(v);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" style={{ color: '#3b5bdb' }} />
            School Activity Audit Log
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-lg">
            Immutable record of all actions performed within your school — by all staff members.
            Only events scoped to <strong>your institution</strong> are visible here.
          </p>
        </div>

        <button
          onClick={() => { setPage(1); loadLogs(); }}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Info Banner */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-xl border text-xs"
        style={{ background: 'rgba(59,91,219,0.05)', borderColor: 'rgba(59,91,219,0.18)', color: '#3b5bdb' }}
      >
        <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold">School-Scoped View — </span>
          You can view activity for your school only. Cross-institution audit data is exclusively
          managed by the Platform Administrator.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white border border-slate-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Outcome</span>
          <div className="flex items-center gap-1">
            {(['ALL', 'SUCCESS', 'FAILURE'] as const).map((o) => (
              <button
                key={o}
                onClick={() => handleOutcomeChange(o)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  outcomeFilter === o
                    ? o === 'SUCCESS'
                      ? 'bg-emerald-100 text-emerald-700'
                      : o === 'FAILURE'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-blue-100 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        {lastRefreshed && (
          <div className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="w-3 h-3" />
            <span>Updated {lastRefreshed.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Staff Member</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Skeleton rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[...Array(4)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div
                          className="h-3 rounded animate-pulse"
                          style={{ background: '#f1f5f9', width: j === 0 ? '120px' : j === 1 ? '160px' : j === 2 ? '200px' : '70px' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(59,91,219,0.08)' }}
                      >
                        <Info className="w-6 h-6" style={{ color: '#3b5bdb' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">No audit entries found</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {outcomeFilter !== 'ALL'
                            ? `No ${outcomeFilter.toLowerCase()} events match your filter.`
                            : 'Activity will appear here once staff start using the platform.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const roleColor = ROLE_COLORS[log.actor.role] || '#64748b';
                  const roleLabel = ROLE_LABELS[log.actor.role] || log.actor.role;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Timestamp */}
                      <td className="px-5 py-4 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Actor */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ background: roleColor }}
                          >
                            {log.actor.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900">{log.actor.name}</p>
                            <p
                              className="text-[10px] font-medium"
                              style={{ color: roleColor }}
                            >
                              {roleLabel}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 max-w-xs">
                        <span className="text-xs font-medium text-slate-700 leading-snug line-clamp-2">
                          {log.action}
                        </span>
                      </td>

                      {/* Outcome */}
                      <td className="px-5 py-4">
                        {log.outcome === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                            <CheckCircle2 className="w-3 h-3" />
                            SUCCESS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-100">
                            <XCircle className="w-3 h-3" />
                            FAILURE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, totalCount)} of {totalCount} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-700 bg-white px-3 py-1 rounded-md border border-slate-200">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-slate-400 text-right">
        Audit records are immutable and retained for compliance purposes.
      </p>
    </div>
  );
};
