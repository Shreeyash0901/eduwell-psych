import React from 'react';
import { Loader2, AlertTriangle, Inbox, ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export const SectionLoading: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-14 text-slate-400">
    <Loader2 className="w-6 h-6 animate-spin mb-3" />
    <p className="text-xs font-semibold">{label}</p>
  </div>
);

export const SectionError: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center px-6">
    <AlertTriangle className="w-8 h-8 text-rose-500 mb-3" />
    <p className="text-sm font-bold text-slate-800">Something went wrong</p>
    <p className="text-xs text-slate-500 mt-1 max-w-md">{message}</p>
    {onRetry && (
      <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
        Retry
      </Button>
    )}
  </div>
);

export const SectionEmpty: React.FC<{ title?: string; message?: string }> = ({
  title = 'Nothing here yet',
  message = 'No records are available for this section.',
}) => (
  <div className="flex flex-col items-center justify-center py-10 text-center px-6">
    <Inbox className="w-8 h-8 text-slate-300 mb-3" />
    <p className="text-sm font-bold text-slate-700">{title}</p>
    <p className="text-xs text-slate-500 mt-1">{message}</p>
  </div>
);

export const SectionPermissionDenied: React.FC<{
  title?: string;
  message?: string;
}> = ({
  title = 'Admin access required',
  message = 'You do not have permission to view or modify this section. Please contact an admin.',
}) => (
  <div className="flex flex-col items-center justify-center py-10 text-center px-6 border border-slate-200 rounded-2xl bg-white">
    <ShieldAlert className="w-8 h-8 text-amber-500 mb-3" />
    <p className="text-sm font-bold text-slate-800">{title}</p>
    <p className="text-xs text-slate-500 mt-1 max-w-md">{message}</p>
  </div>
);

export const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, children, actions, className = '' }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6 ${className}`}>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>}
      </div>
      {actions}
    </div>
    {children}
  </div>
);