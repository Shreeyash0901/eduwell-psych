import React, { useEffect, useState, useCallback } from 'react';
import { UserPlus, ShieldCheck, GraduationCap, X, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
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
  classIds?: number[];
  classAccess: string[];
  sectionIds?: number[];
  sectionAccess: { id?: number; classId?: number; className: string; sectionName: string }[];
}

interface SchoolClassOption {
  id: number;
  name: string;
  sections: { id: number; name: string }[];
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Principal',
  PSYCHOLOGIST: 'Psychologist',
  TEACHER: 'Teacher',
};

export const UsersRolesSection: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [availableClasses, setAvailableClasses] = useState<SchoolClassOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Assign Classes Modal State
  const [editingTeacher, setEditingTeacher] = useState<UserRecord | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState<number[]>([]);
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'TEACHER' | 'PSYCHOLOGIST' | 'ADMIN'>('TEACHER');
  const [invitePassword, setInvitePassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitedSuccessInfo, setInvitedSuccessInfo] = useState<{
    email: string;
    tempPass?: string;
    inviteLink?: string;
    role?: string;
    name?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadUsersAndClasses = useCallback(async () => {
    if (!isAdmin) {
      setPermissionDenied(true);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    setPermissionDenied(false);
    try {
      const [usersRes, classesRes] = await Promise.all([
        fetch('/api/settings/users', { credentials: 'include' }),
        fetch('/api/settings/classes', { credentials: 'include' }),
      ]);

      if (usersRes.status === 403) {
        setPermissionDenied(true);
        setIsLoading(false);
        return;
      }
      const usersData = await usersRes.json();
      const classesData = await classesRes.json();

      if (!usersRes.ok || !usersData.success) {
        throw new Error(usersData.error || 'Failed to load users.');
      }
      setUsers(usersData.users || []);
      if (classesData.success && Array.isArray(classesData.classes)) {
        setAvailableClasses(classesData.classes);
      }
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadUsersAndClasses();
  }, [loadUsersAndClasses]);

  const openClassAssignmentModal = (teacher: UserRecord) => {
    setEditingTeacher(teacher);
    setSelectedClassIds(teacher.classIds || []);
    setSelectedSectionIds(teacher.sectionIds || []);
  };

  const handleSaveClassAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    setIsSavingAccess(true);
    try {
      const res = await fetch(`/api/settings/users/${editingTeacher.id}/class-access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          classIds: selectedClassIds,
          sectionIds: selectedSectionIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Classroom assignments updated!');
        setEditingTeacher(null);
        loadUsersAndClasses();
      } else {
        toast.error(data.error || 'Failed to update classroom assignments.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error saving classroom access.');
    } finally {
      setIsSavingAccess(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error('Please enter both name and email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/settings/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: inviteName.trim(),
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          tempPassword: invitePassword.trim() || undefined,
        }),
      });

      let data: any = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (err) {}

      if (res.ok && data.success) {
        toast.success(data.message || 'Staff member invited successfully!');
        const fullInviteUrl = data.inviteLink
          ? `${window.location.origin}/#join?token=${data.inviteToken}`
          : undefined;

        setInvitedSuccessInfo({
          email: data.user?.email || inviteEmail.trim(),
          tempPass: data.user?.temporaryPassword,
          inviteLink: fullInviteUrl,
          name: data.user?.name || inviteName.trim(),
          role: data.user?.role || inviteRole,
        });

        setInviteName('');
        setInviteEmail('');
        setInvitePassword('');
        setInviteRole('TEACHER');
        loadUsers();
      } else {
        toast.error(data.error || 'Failed to invite user.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error while inviting user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!invitedSuccessInfo) return;
    navigator.clipboard.writeText(`Email: ${invitedSuccessInfo.email}\nPassword: ${invitedSuccessInfo.tempPass}`);
    setCopied(true);
    toast.success('Login credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

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
    <>
      <SectionCard
        title="Users & Roles"
        subtitle="Manage and invite staff members scoped to your school."
        actions={
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              setInvitedSuccessInfo(null);
              setIsInviteOpen(true);
            }}
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
              <div key={u.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors">
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

                  {u.role === 'TEACHER' && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="text-[11px] h-7 px-2.5 bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
                        onClick={() => openClassAssignmentModal(u)}
                      >
                        <GraduationCap className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        <span>Assign Classrooms &amp; Grades</span>
                      </Button>
                      {(!u.classAccess || u.classAccess.length === 0) && (!u.sectionAccess || u.sectionAccess.length === 0) && (
                        <span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                          General school roster
                        </span>
                      )}
                    </div>
                  )}

                  {u.classAccess.length > 0 || u.sectionAccess.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {u.classAccess.map((cls) => (
                        <span key={`c-${cls}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50/80 border border-blue-200 rounded-md text-[10px] font-bold text-blue-700">
                          <GraduationCap className="w-3 h-3 text-blue-500" />
                          {cls} (all sections)
                        </span>
                      ))}
                      {u.sectionAccess.map((sec) => (
                        <span key={`s-${sec.className}-${sec.sectionName}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50/80 border border-blue-200 rounded-md text-[10px] font-bold text-blue-700">
                          <GraduationCap className="w-3 h-3 text-blue-500" />
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

      {/* ── Assign Classes Modal ── */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Assign Classroom Access</h2>
                  <p className="text-xs text-slate-500 font-medium">Teacher: <span className="font-bold text-slate-800">{editingTeacher.name}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClassAccess} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <p className="text-xs text-slate-600">
                Select which classrooms or sections this teacher is allowed to view. Unselected classrooms will be hidden from their roster and dashboards.
              </p>

              {availableClasses.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  No classes created yet in School Settings.
                </div>
              ) : (
                <div className="space-y-3">
                  {availableClasses.map((cls) => {
                    const isWholeClassChecked = selectedClassIds.includes(cls.id);
                    return (
                      <div key={cls.id} className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isWholeClassChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedClassIds((prev) => [...prev, cls.id]);
                              } else {
                                setSelectedClassIds((prev) => prev.filter((id) => id !== cls.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-bold text-slate-900">{cls.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">(All sections)</span>
                        </label>

                        {/* Individual Sections */}
                        {cls.sections && cls.sections.length > 0 && (
                          <div className="pl-6 pt-1 border-t border-slate-200/60 flex flex-wrap gap-2">
                            {cls.sections.map((sec) => {
                              const isSecChecked = selectedSectionIds.includes(sec.id);
                              return (
                                <label
                                  key={sec.id}
                                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border cursor-pointer select-none transition-colors ${
                                    isSecChecked || isWholeClassChecked
                                      ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                                      : 'bg-white text-slate-600 border-slate-200'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    disabled={isWholeClassChecked}
                                    checked={isSecChecked || isWholeClassChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedSectionIds((prev) => [...prev, sec.id]);
                                      } else {
                                        setSelectedSectionIds((prev) => prev.filter((id) => id !== sec.id));
                                      }
                                    }}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span>{sec.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setEditingTeacher(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  disabled={isSavingAccess}
                >
                  {isSavingAccess ? 'Saving...' : 'Save Classroom Access'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Staff Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Invite Staff Member</h2>
                  <p className="text-xs text-slate-500">Add a new user to your school workspace</p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {invitedSuccessInfo ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Invitation Created for {invitedSuccessInfo.name} ({invitedSuccessInfo.role})
                </div>

                {/* Direct Invitation Link for Teacher/Psychologist Signup */}
                {invitedSuccessInfo.inviteLink && (
                  <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
                    <label className="block text-[11px] font-bold text-slate-700">
                      🔗 Invitation Signup Link (Send via Email):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={invitedSuccessInfo.inviteLink}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-blue-700 truncate"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(invitedSuccessInfo.inviteLink!);
                          setCopiedLink(true);
                          toast.success('Invitation link copied! Email this to the staff member.');
                          setTimeout(() => setCopiedLink(false), 2500);
                        }}
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedLink ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      When the educator opens this link, they will enter their details, choose their password, and sign in directly.
                    </p>
                  </div>
                )}

                {/* Direct Credentials info */}
                <div className="space-y-1.5 text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-emerald-100">
                  <p><span className="font-semibold text-slate-500">Email:</span> {invitedSuccessInfo.email}</p>
                  {invitedSuccessInfo.tempPass && (
                    <p><span className="font-semibold text-slate-500">Temporary Password:</span> <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-900">{invitedSuccessInfo.tempPass}</code></p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={copyCredentials}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copied ? 'Copied' : 'Copy All Details'}
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsInviteOpen(false);
                      setInvitedSuccessInfo(null);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Emily Thorne"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. emily.thorne@school.edu"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TEACHER">Teacher (Can log notes & complete ratings)</option>
                    <option value="PSYCHOLOGIST">Psychologist (Clinical lead & reports)</option>
                    <option value="ADMIN">Principal / Admin (School management)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Temporary Password <span className="text-slate-400 font-normal">(Optional - auto-generated if blank)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Inviting...' : 'Send Invitation'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};