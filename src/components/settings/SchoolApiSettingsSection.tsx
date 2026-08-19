import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Server, CheckCircle2, AlertTriangle, RefreshCw, Shield, Clock, ExternalLink, Activity } from 'lucide-react';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';

interface SchoolApiConfigData {
  id?: number;
  baseUrl: string;
  schoolCode: string;
  appVersion: string;
  appOs: string;
  isEnabled: boolean;
  lastTestedAt: string | null;
  lastSyncAt: string | null;
}

interface AuditLogEntry {
  id: number;
  action: string;
  status: string;
  targetIdentifier?: string | null;
  errorMessage?: string | null;
  metadata?: any;
  createdAt: string;
  actorName: string;
}

export const SchoolApiSettingsSection: React.FC = () => {
  const [config, setConfig] = useState<SchoolApiConfigData>({
    baseUrl: 'http://dmwerp.com/rest_school_assist/',
    schoolCode: 'test',
    appVersion: '1.1',
    appOs: 'web',
    isEnabled: true,
    lastTestedAt: null,
    lastSyncAt: null,
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  // Fetch Config and Audit Logs on Mount
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      try {
        const [cfgRes, logsRes] = await Promise.all([
          fetch('/api/school-api/config', { credentials: 'include' }),
          fetch('/api/school-api/audit-logs', { credentials: 'include' }),
        ]);

        const cfgData = await cfgRes.json();
        const logsData = await logsRes.json();

        if (!cancelled) {
          if (cfgData.success && cfgData.config) {
            setConfig(cfgData.config);
          }
          if (logsData.success && logsData.logs) {
            setAuditLogs(logsData.logs);
          }
        }
      } catch (err) {
        console.error('[SCHOOL_API_SETTINGS] Failed to load config:', err);
        toast.error('Failed to load School API configuration.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/school-api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setConfig(data.config);
      toast.success('School API configuration saved successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/school-api/test', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Connection verified successfully.' : 'Connection test failed.'),
        latencyMs: data.latencyMs,
      });

      if (data.success) {
        toast.success(`Connection verified (${data.latencyMs}ms)!`);
        // Refresh audit logs & tested timestamp
        setConfig((prev) => ({ ...prev, lastTestedAt: new Date().toISOString() }));
      } else {
        toast.error(data.message || 'Connection test failed.');
      }

      // Reload audit logs
      const logsRes = await fetch('/api/school-api/audit-logs', { credentials: 'include' });
      const logsData = await logsRes.json();
      if (logsData.success && logsData.logs) {
        setAuditLogs(logsData.logs);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error executing connection test.',
      });
      toast.error('Connection test failed.');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400 text-xs font-medium">Loading School API Settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">External School API Integration</h2>
              <p className="text-xs text-slate-500 font-medium">
                Configure external WCF/REST endpoints (dmwerp.com / rest_school_assist) for automated student roster synchronization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                config.isEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${config.isEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {config.isEnabled ? 'Active Integration' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveConfig} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="API Base URL" required htmlFor="baseUrl">
              <Input
                id="baseUrl"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                placeholder="http://dmwerp.com/rest_school_assist/"
                required
              />
            </FormField>

            <FormField label="School Code (Sent to API)" required htmlFor="schoolCode">
              <Input
                id="schoolCode"
                value={config.schoolCode}
                onChange={(e) => setConfig({ ...config, schoolCode: e.target.value })}
                placeholder="test"
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="App Version" htmlFor="appVersion">
              <Input
                id="appVersion"
                value={config.appVersion}
                onChange={(e) => setConfig({ ...config, appVersion: e.target.value })}
                placeholder="1.1"
              />
            </FormField>

            <FormField label="Calling Client Identifier (App OS)" htmlFor="appOs">
              <Input
                id="appOs"
                value={config.appOs}
                onChange={(e) => setConfig({ ...config, appOs: e.target.value })}
                placeholder="web"
              />
            </FormField>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.isEnabled}
                  onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                  className="rounded text-blue-700 focus:ring-blue-500 h-4 w-4"
                />
                Enable School API Synchronization
              </label>
            </div>
          </div>

          {/* Connection status and actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Last Tested:{' '}
                  <strong className="text-slate-700">
                    {config.lastTestedAt ? new Date(config.lastTestedAt).toLocaleString() : 'Never'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Last Sync:{' '}
                  <strong className="text-slate-700">
                    {config.lastSyncAt ? new Date(config.lastSyncAt).toLocaleString() : 'Never'}
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleTestConnection}
                disabled={isTesting || !config.isEnabled}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Testing Connection...' : 'Test Connection'}
              </Button>

              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </form>

        {/* Test Result Callout */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
              testResult.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border border-rose-200 text-rose-900'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{testResult.success ? 'Connection Test Passed' : 'Connection Test Failed'}</p>
              <p className="mt-0.5 text-xs opacity-90">{testResult.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Audit Logs Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900">API Operation &amp; Synchronization Audit Log</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Non-sensitive audit trail</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Actor</th>
                <th className="px-4 py-2.5">Target Identifier</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{log.action}</td>
                    <td className="px-4 py-3 text-slate-600">{log.actorName}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-700">
                      {log.targetIdentifier || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {log.errorMessage || (log.metadata?.latencyMs ? `${log.metadata.latencyMs}ms latency` : 'Completed successfully')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No School API audit logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
