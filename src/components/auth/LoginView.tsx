import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { UserSession, UserRole } from '../../types';
import { demoUsers } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Brain,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface LoginViewProps {
  onLogin?: (user: UserSession) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const { login, loginWithGoogle, isLoading, error: authError, clearError } = useAuth();

  const [email, setEmail] = useState('dr.jenkins@eduwell.org');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('u-psych');
  const [localError, setLocalError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleClientId = ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string) || '';

  // Initialize Google Identity Services
  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      if (!response || !response.credential) {
        setLocalError('No credential token received from Google.');
        toast.error('No credential token received from Google.');
        return;
      }

      setIsGoogleLoading(true);
      setLocalError('');
      clearError();

      try {
        const success = await loginWithGoogle(response.credential);
        if (success) {
          toast.success('Signed in with Google successfully!');
        } else {
          toast.error(authError || 'Google authentication failed.');
        }
      } catch (err: any) {
        toast.error(err.message || 'Google authentication error.');
      } finally {
        setIsGoogleLoading(false);
      }
    };

    const initGsi = () => {
      if (window.google?.accounts?.id && googleClientId && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 320,
          });
        } catch (err) {
          console.warn('[AUTH_GSI] GSI initialization warning:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGsi();
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [googleClientId, loginWithGoogle, clearError]);

  const handleSelectPreset = (preset: UserSession) => {
    setSelectedPresetId(preset.id);
    setEmail(preset.email);
    setPassword('password123');
    setLocalError('');
    clearError();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Please enter an email address.');
      toast.error('Please enter an email address.');
      return;
    }

    if (!password) {
      setLocalError('Please enter a password.');
      toast.error('Please enter a password.');
      return;
    }

    const success = await login(trimmedEmail, password);

    if (success) {
      toast.success('Signed in successfully!');
      if (onLogin) {
        // Handled by AuthContext state
      }
    } else {
      toast.error(authError || 'Invalid email or password.');
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'psychologist':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'teacher':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'parent':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-700 text-white shadow-md shadow-blue-700/20 mb-2">
            <Brain className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            EduWell Psych
          </h1>
          <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">
            Professional Suite for School Psychology, Behavioral Tracking &amp; Academic Wellness
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80 space-y-6">
          {displayedError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{displayedError}</span>
            </div>
          )}

          {/* Quick RBAC Role Selectors (1-Click Demo Logins) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1-Click Demo Accounts (RBAC Roles)
              </span>
              <span className="text-[11px] font-semibold text-blue-700">
                Select to test permissions
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {demoUsers
                .filter((preset) => preset.role === 'psychologist' || preset.role === 'teacher' || preset.role === 'admin')
                .map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <img
                      src={preset.avatarUrl}
                      alt={preset.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {preset.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        )}
                      </div>
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase border mt-1 ${getRoleBadgeStyle(
                          preset.role
                        )}`}
                      >
                        {preset.role}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Official Google Sign-In Section (Phase 3) */}
          <div className="space-y-3 pt-2">
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold uppercase text-slate-400 tracking-wider absolute">
                Single Sign-On (SSO)
              </span>
            </div>

            <div className="flex flex-col items-center justify-center min-h-[44px]">
              <div ref={googleBtnRef} id="googleSignInButton" className="w-full flex justify-center" />
              {!googleClientId && (
                <div className="w-full p-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google Identity Services (Configure <code className="text-slate-800">VITE_GOOGLE_CLIENT_ID</code>)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold uppercase text-slate-400 tracking-wider absolute">
              Or Sign In With Email
            </span>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-700"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (displayedError) {
                      setLocalError('');
                      clearError();
                    }
                  }}
                  placeholder="name@eduwell.org"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPassword('password123');
                    toast.info('Demo password set: password123');
                  }}
                  className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                >
                  Demo password: password123
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (displayedError) {
                      setLocalError('');
                      clearError();
                    }
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>Remember session on this device</span>
              </label>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full mt-2 py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-700/20 hover:shadow-blue-700/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading || isGoogleLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In with Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
