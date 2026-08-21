import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import {
  BrainCircuit,
  Building2,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Shield,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  GraduationCap,
  HeartHandshake,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface InviteDetails {
  token: string;
  email: string;
  role: string;
  schoolName: string;
  schoolCode: string;
  invitedBy: string;
  expiresAt: string;
  isExistingUser: boolean;
  defaultName: string;
}

interface AcceptInviteViewProps {
  onSuccess?: () => void;
}

export const AcceptInviteView: React.FC<AcceptInviteViewProps> = ({ onSuccess }) => {
  const { checkSession } = useAuth();

  const [token, setToken] = useState<string>('');
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // Extract token from URL hash or query string
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');

    let extractedToken = urlParams.get('token') || hashParams.get('token');
    if (!extractedToken) {
      const match = hash.match(/token=([^&]+)/) || hash.match(/#\/?join\/([^?&]+)/) || hash.match(/#\/?invite\/([^?&]+)/);
      if (match) {
        extractedToken = match[1];
      }
    }

    if (!extractedToken || extractedToken.startsWith('#') || extractedToken.length < 5) {
      setVerifyError('No invitation token detected. Please check the link sent by your Principal.');
      setIsLoading(false);
      return;
    }

    setToken(extractedToken);

    const verifyToken = async () => {
      setIsLoading(true);
      setVerifyError(null);
      try {
        const res = await fetch(`/api/auth/invitation/verify?token=${encodeURIComponent(extractedToken)}`);
        const data = await res.json();
        if (res.ok && data.success && data.invitation) {
          setInvite(data.invitation);
          if (data.invitation.defaultName) {
            setFullName(data.invitation.defaultName);
          }
        } else {
          setVerifyError(data.error || 'Invitation is invalid or has expired.');
        }
      } catch (err: any) {
        setVerifyError('Network error while verifying your invitation.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/invitation/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token,
          fullName: fullName.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Account activated successfully!');
        await checkSession();
        // Clear join hash parameter and navigate to appropriate dashboard
        window.history.replaceState(null, '', window.location.pathname);
        if (data.user?.role?.toLowerCase() === 'teacher') {
          window.location.hash = '#teacher_dashboard';
        } else {
          window.location.hash = '#dashboard';
        }
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      } else {
        toast.error(data.error || 'Failed to complete signup.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error submitting form.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toUpperCase()) {
      case 'PSYCHOLOGIST':
        return {
          label: 'School Psychologist',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: BrainCircuit,
        };
      case 'TEACHER':
        return {
          label: 'Educator / Teacher',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: GraduationCap,
        };
      case 'ADMIN':
        return {
          label: 'Principal / Admin',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Shield,
        };
      default:
        return {
          label: role,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: User,
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Verifying your staff invitation...</p>
        </div>
      </div>
    );
  }

  if (verifyError || !invite) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-md w-full p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Invitation Link Invalid</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {verifyError || 'This staff invite link has expired or has already been used.'}
            </p>
          </div>
          <a
            href="/#login"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Return to Sign In
          </a>
        </div>
      </div>
    );
  }

  const roleMeta = getRoleBadge(invite.role);
  const RoleIcon = roleMeta.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md mb-2">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Join {invite.schoolName}</h1>
          <p className="text-xs text-slate-500 font-medium">
            You were invited by <span className="font-bold text-slate-700">{invite.invitedBy}</span> to join EduWell Psych.
          </p>
        </div>

        {/* Assigned Role & Tenant Card */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">{invite.schoolName}</p>
              <p className="text-[11px] text-slate-500 font-medium">{invite.email}</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-2xs shrink-0 ${roleMeta.color}`}
          >
            <RoleIcon className="w-3.5 h-3.5" />
            {roleMeta.label}
          </span>
        </div>

        {/* Setup Account Form */}
        <form onSubmit={handleAcceptInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Dr. Sarah Jenkins"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              disabled
              value={invite.email}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Create Password</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Confirm Password</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Show password</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Activating Account...' : 'Complete Registration & Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-400 pt-2 border-t border-slate-100">
          Protected by EduWell FERPA &amp; HIPAA Compliant Security Shield.
        </p>
      </div>
    </div>
  );
};
