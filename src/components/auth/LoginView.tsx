import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { UserSession, UserRole } from '../../types';
import { demoUsers } from '../../data/demoCredentials';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  BrainCircuit,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Shield,
  BarChart3,
  Users,
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

const FEATURE_BULLETS = [
  { icon: Shield, text: 'FERPA & HIPAA compliant infrastructure' },
  { icon: BarChart3, text: 'Evidence-based psychometric assessments' },
  { icon: Users, text: 'Multi-role RBAC for entire school ecosystem' },
  { icon: Sparkles, text: 'AI-assisted risk classification & reporting' },
];

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; border: string }> = {
  psychologist: { label: 'PSYCHOLOGIST', color: '#3b5bdb', bg: 'rgba(59,91,219,0.12)', border: 'rgba(59,91,219,0.25)' },
  teacher:      { label: 'TEACHER',      color: '#059669', bg: 'rgba(5,150,105,0.12)',   border: 'rgba(5,150,105,0.25)' },
  admin:        { label: 'PRINCIPAL',    color: '#d97706', bg: 'rgba(217,119,6,0.12)',   border: 'rgba(217,119,6,0.25)' },
  super_admin:  { label: 'SUPER ADMIN',  color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.25)' },
  parent:       { label: 'PARENT',       color: '#db2777', bg: 'rgba(219,39,119,0.12)', border: 'rgba(219,39,119,0.25)' },
};

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
  const gsiInitialized = useRef(false);
  const googleClientId = ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string) || '';

  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      if (!response?.credential) {
        setLocalError('No credential token received from Google.');
        toast.error('No credential token received from Google.');
        return;
      }
      setIsGoogleLoading(true);
      setLocalError('');
      clearError();
      try {
        const success = await loginWithGoogle(response.credential);
        if (success) toast.success('Signed in with Google!');
        else toast.error(authError || 'Google authentication failed.');
      } catch (err: any) {
        toast.error(err.message || 'Google authentication error.');
      } finally {
        setIsGoogleLoading(false);
      }
    };

    const initGsi = () => {
      if (window.google?.accounts?.id && googleClientId && googleBtnRef.current && !gsiInitialized.current) {
        try {
          gsiInitialized.current = true;
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard', theme: 'outline', size: 'large',
            text: 'signin_with', shape: 'rectangular', logo_alignment: 'left', width: 320,
          });
        } catch (err) {
          gsiInitialized.current = false;
          console.warn('[AUTH_GSI]', err);
        }
      }
    };

    if (window.google?.accounts?.id) initGsi();
    else {
      const iv = setInterval(() => { if (window.google?.accounts?.id) { clearInterval(iv); initGsi(); } }, 300);
      return () => clearInterval(iv);
    }
  }, [googleClientId, loginWithGoogle, clearError]);

  const handleSelectPreset = (preset: UserSession) => {
    setSelectedPresetId(preset.id);
    setEmail(preset.email);
    setPassword(preset.role === 'super_admin' ? 'SuperAdmin@2024!' : 'password123');
    setLocalError('');
    clearError();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) { setLocalError('Please enter an email.'); toast.error('Please enter an email.'); return; }
    if (!password) { setLocalError('Please enter a password.'); toast.error('Please enter a password.'); return; }
    const success = await login(trimmedEmail, password);
    if (success) toast.success('Welcome back!');
    else toast.error(authError || 'Invalid credentials.');
  };

  const displayedError = localError || authError;

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Left Panel: Brand / Illustration ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] p-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0f1724 0%, #111827 50%, #0d1220 100%)',
        }}
      >
        {/* Ambient glow blobs */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full animate-float" style={{ background: 'radial-gradient(circle, rgba(59,91,219,0.25) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', filter: 'blur(50px)', animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        </div>

        {/* Grid overlay for depth */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3 animate-fade-in">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#3b5bdb,#7950f2)', boxShadow: '0 0 20px rgba(59,91,219,0.5)' }}
          >
            <BrainCircuit style={{ width: '18px', height: '18px', color: '#fff' }} />
          </div>
          <div>
            <div className="text-base font-bold leading-none" style={{ color: '#fff', letterSpacing: '-0.01em' }}>EduWell Psych</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Professional Suite</div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div>
            <h2 className="text-3xl font-extrabold leading-tight" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
              Empowering<br />
              <span style={{ background: 'linear-gradient(120deg,#a5b4fc,#818cf8,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Student Wellbeing
              </span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '340px' }}>
              A clinical-grade platform for school psychologists, educators, and administrators to track, assess, and support every student's mental health journey.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3 stagger">
            {FEATURE_BULLETS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 animate-fade-in">
                <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'rgba(92,124,250,0.15)', border: '1px solid rgba(92,124,250,0.25)' }}>
                  <Icon style={{ width: '13px', height: '13px', color: '#818cf8' }} />
                </div>
                <p className="text-xs font-medium leading-relaxed pt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer tag */}
        <div className="relative z-10 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
            © 2025 EduWell Technologies Inc. · SOC 2 Type II · FERPA · HIPAA
          </p>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10" style={{ background: '#f8f9fc' }}>
        <div className="w-full max-w-md space-y-6 animate-scale-in">
          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3b5bdb,#7950f2)' }}>
              <BrainCircuit style={{ width: '16px', height: '16px', color: '#fff' }} />
            </div>
            <span className="font-bold text-base text-slate-900">EduWell Psych</span>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to your workspace</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Choose a demo account or enter your credentials below.</p>
          </div>

          {/* Error */}
          {displayedError && (
            <div className="p-3.5 rounded-xl flex items-center gap-2 animate-fade-in" style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c' }}>
              <ShieldAlert style={{ width: '15px', height: '15px', flexShrink: 0 }} />
              <span className="text-xs font-semibold">{displayedError}</span>
            </div>
          )}

          {/* RBAC preset cards */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">1-Click Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {demoUsers.filter(p => ['psychologist', 'teacher', 'admin', 'super_admin'].includes(p.role)).map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                const cfg = ROLE_CONFIG[preset.role];
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="p-3 rounded-xl text-left flex flex-col gap-2 transition-all cursor-pointer card-hover"
                    style={{
                      background: isSelected ? '#fff' : '#fff',
                      border: isSelected ? `1.5px solid ${cfg.color}` : '1px solid #e2e8f0',
                      boxShadow: isSelected ? `0 0 0 3px ${cfg.bg}, 0 2px 8px rgba(0,0,0,0.06)` : '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'all 180ms',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <img src={preset.avatarUrl} alt={preset.name} className="w-7 h-7 rounded-full object-cover shrink-0" style={{ border: '1.5px solid #f1f5f9' }} />
                      {isSelected && <CheckCircle2 style={{ width: '14px', height: '14px', color: cfg.color, flexShrink: 0 }} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate leading-tight">{preset.name.split(' ').slice(0, 2).join(' ')}</p>
                      <span
                        className="text-[9px] font-bold mt-0.5 px-1.5 py-0.5 rounded inline-block uppercase tracking-wider"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">or sign in manually</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold text-slate-700 block">Email Address</label>
              <div className="relative">
                <Mail style={{ width: '14px', height: '14px', position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (displayedError) { setLocalError(''); clearError(); } }}
                  placeholder="name@school.org"
                  className="input-base"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-bold text-slate-700 block">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    const pass = selectedPresetId === 'u-super-admin' ? 'SuperAdmin@2024!' : 'password123';
                    setPassword(pass);
                    toast.info(`Demo password set: ${pass}`);
                  }}
                  className="text-[11px] font-semibold transition-colors cursor-pointer"
                  style={{ color: '#3b5bdb' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#1e3a8a')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#3b5bdb')}
                >
                  Use demo password
                </button>
              </div>
              <div className="relative">
                <Lock style={{ width: '14px', height: '14px', position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (displayedError) { setLocalError(''); clearError(); } }}
                  placeholder="••••••••"
                  className="input-base"
                  style={{ paddingLeft: '36px', paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                  style={{ color: '#94a3b8' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#475569')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                >
                  {showPassword ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="cursor-pointer"
                style={{ width: '14px', height: '14px', accentColor: '#3b5bdb' }}
              />
              <label htmlFor="remember" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
                Remember session on this device
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 px-4 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all btn-primary disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading || isGoogleLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" style={{ width: '15px', height: '15px' }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </>
              )}
            </button>
          </form>

          {/* Google SSO */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Or SSO</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="flex justify-center min-h-[44px]">
              <div ref={googleBtnRef} id="googleSignInButton" className="w-full flex justify-center" />
              {!googleClientId && (
                <div className="w-full p-2.5 rounded-xl text-center" style={{ border: '1px dashed #e2e8f0', background: '#f8fafc' }}>
                  <p className="text-[11px] font-medium text-slate-500">
                    Google SSO — configure <code className="text-slate-700 font-mono bg-slate-100 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
