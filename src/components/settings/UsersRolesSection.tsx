import React, { useEffect, useState, useCallback } from 'react';
import { UserPlus, ShieldCheck, GraduationCap } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { SectionLoading, SectionError, SectionEmpty, SectionCard, SectionPermissionDenied } from './SectionState';

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  classAccess: string[];
  sectionAccess: { className: string; sectionName: string }[];
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  PSYCHOLOGIST: 'Psychologist',
  TEACHER: 'Teacher',
};

export const UsersRolesSection: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) {
      setPermissionDenied(true);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    setPermissionDenied(false);
    try {
      const res = await fetch('/api/settings/users', { credentials: 'include' });
      if (res.status === 403) {
        setPermissionDenied(true);
        setIsLoading(false);
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load users.');
      }
      setUsers(data.users || []);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (isLoading) {
    return <SectionCard title="Users & Roles"><SectionLoading label="Loading users..." /></SectionCard>;
  }

  if (permissionDenied) {
    return (
      <SectionCard title="Users & Roles">
        <SectionPermissionDenied />
      </SectionCard>
    );
  }

  if (loadError) {
    return (
      <SectionCard title="Users & Roles">
        <SectionError message={loadError} onRetry={loadUsers} />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Users & Roles"
      subtitle="Real user records scoped to your school. Invitations require a dedicated invitation API that has not been implemented yet."
      actions={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled
          title="Invitations require a backend invitation API that is not yet available."
        >
          <UserPlus className="w-3.5 h-3.5 mr-1.5" />
          Invite User
        </Button>
      }
    >
      {users.length === 0 ? (
        <SectionEmpty
          title="No users found"
          message="No staff accounts are registered for this school."
        />
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900">{u.name}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      u.role === 'ADMIN'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : u.role === 'PSYCHOLOGIST'
                        ? 'bg-violet-100 text-violet-800 border-violet-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{u.email}</p>

                {u.classAccess.length > 0 || u.sectionAccess.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {u.classAccess.map((cls) => (
                      <span key={`c-${cls}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-semibold text-slate-600">
                        <GraduationCap className="w-3 h-3 text-slate-400" />
                        {cls} (all sections)
                      </span>
                    ))}
                    {u.sectionAccess.map((sec) => (
                      <span key={`s-${sec.className}-${sec.sectionName}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-semibold text-slate-600">
                        <GraduationCap className="w-3 h-3 text-slate-400" />
                        {sec.className} / {sec.sectionName}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <span
                className={`shrink-0 px-2.5 py-1 text-xs font-bold rounded-md ${
                  u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {u.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-slate-100">
        <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
          Password hashes, Google identifiers, and student-sensitive information are never exposed in settings responses.
        </p>
      </div>
    </SectionCard>
  );
};