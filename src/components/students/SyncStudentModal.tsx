import React, { useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Search, CheckCircle2, AlertTriangle, User, Building, Calendar, ArrowRight, ShieldCheck, Database } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Student } from '../../types';

interface SyncStudentModalProps {
  onClose: () => void;
  onSyncSuccess: (student: Student, isNew: boolean) => void;
}

export const SyncStudentModal: React.FC<SyncStudentModalProps> = ({
  onClose,
  onSyncSuccess,
}) => {
  const [studentNo, setStudentNo] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewData, setPreviewData] = useState<{
    matchType: string;
    matchedStudentId: number | null;
    normalized: any;
  } | null>(null);

  const handleFetchPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNo.trim()) {
      setError('Please enter a Student ID, Roll No, or Admission Number.');
      return;
    }

    setIsPreviewLoading(true);
    setError(null);
    setPreviewData(null);

    try {
      const res = await fetch('/api/students/sync-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentNo: studentNo.trim(),
          previewOnly: true,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Student not found in external School API.');
      }

      setPreviewData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve student from School API.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleConfirmSync = async () => {
    if (!studentNo.trim()) return;

    setIsSyncing(true);
    setError(null);

    try {
      const res = await fetch('/api/students/sync-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentNo: studentNo.trim(),
          previewOnly: false,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to complete synchronization.');
      }

      toast.success(data.message || 'Student synchronized successfully.');
      onSyncSuccess(data.student, data.isNew);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to complete synchronization.');
      toast.error(err.message || 'Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Synchronize Student from School API"
      description="Fetch real-time student demographics, admission numbers, and enrollment records directly from the external School API (dmwerp.com / rest_school_assist)."
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Step 1: Input Identifier & Search */}
        <form onSubmit={handleFetchPreview} className="space-y-3">
          <FormField
            label="Student Identifier / Admission No / Roll No"
            required
            htmlFor="sync-student-no"
            error={error || undefined}
          >
            <div className="flex gap-2">
              <Input
                id="sync-student-no"
                placeholder="e.g. 123, ADM-2024-001, STU-1004"
                value={studentNo}
                onChange={(e) => {
                  setStudentNo(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isPreviewLoading || isSyncing}
                autoFocus
              />
              <Button
                type="submit"
                disabled={isPreviewLoading || isSyncing || !studentNo.trim()}
                className="shrink-0"
              >
                {isPreviewLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Search className="w-4 h-4 mr-1.5" />
                )}
                {isPreviewLoading ? 'Querying API...' : 'Preview Record'}
              </Button>
            </div>
          </FormField>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in duration-150">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Lookup Failed</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Step 2: Live Preview Card */}
        {previewData && (
          <div className="border border-blue-200 bg-blue-50/40 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  External School API Record Matched
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  previewData.matchType === 'EXISTING_RECORD_UPDATE'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {previewData.matchType === 'EXISTING_RECORD_UPDATE'
                  ? '⚡ Update Existing Student'
                  : '✨ New Student Enrollment'}
              </span>
            </div>

            {/* Normalized Attributes Grid */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
                    {previewData.normalized.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{previewData.normalized.fullName}</h3>
                    <p className="text-slate-500 font-mono text-[11px]">
                      Ext ID: {previewData.normalized.externalStudentId || 'N/A'} • Adm: {previewData.normalized.admissionNo || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 pt-1">
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Class / Grade</span>
                  <span className="font-semibold text-slate-800">
                    {previewData.normalized.className || (previewData.normalized.externalClassId ? `Class ID: ${previewData.normalized.externalClassId}` : 'Unassigned')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Gender</span>
                  <span className="font-semibold text-slate-800">{previewData.normalized.gender || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Email</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {previewData.normalized.email || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Contact Phone</span>
                  <span className="font-semibold text-slate-800">{previewData.normalized.phone || 'None'}</span>
                </div>
                {previewData.normalized.dateOfBirth && (
                  <div className="col-span-2">
                    <span className="text-slate-400 font-medium block text-[11px]">Date of Birth</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(previewData.normalized.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSyncing}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmSync}
                disabled={isSyncing}
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Database className="w-3.5 h-3.5 mr-1.5" />
                )}
                {isSyncing ? 'Synchronizing with Database...' : 'Confirm & Sync Student'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
