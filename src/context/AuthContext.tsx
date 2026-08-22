// src/context/AuthContext.tsx
// Global React Authentication Context and useAuth hook for EduWell Psych

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSession, UserRole } from '../types';

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getRoleTitle(role: string): string {
  switch (role.toLowerCase()) {
    case 'psychologist':
      return 'Lead School Psychologist';
    case 'teacher':
      return 'Classroom Educator';
    case 'parent':
      return 'Parent / Guardian';
    case 'admin':
      return 'School Principal';
    case 'super_admin':
      return 'Platform Administrator';
    default:
      return 'School Staff';
  }
}

export function getRoleAvatar(role: string, email?: string): string {
  if (email && (email.includes('jenkins') || email.includes('psych'))) {
    return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120';
  }
  if (email && (email.includes('mercer') || email.includes('admin') || email.includes('chen'))) {
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120';
  }
  switch (role.toLowerCase()) {
    case 'psychologist':
      return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120';
    case 'teacher':
      return 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=120';
    case 'parent':
      return 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120';
    case 'admin':
      return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120';
    case 'super_admin':
      return 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120';
    default:
      return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser({
            id: String(data.user.id),
            name: data.user.name,
            email: data.user.email,
            role: data.user.role as UserRole,
            roleTitle: getRoleTitle(data.user.role),
            avatarUrl: getRoleAvatar(data.user.role, data.user.email),
            schoolName: data.user.schoolName || 'Westside Academy',
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('[AUTH] Could not verify existing session:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error('Server is still initializing or restarting. Please try again in a few seconds.');
      }

      if (!res.ok || !data?.success) {
        const errorMessage = data?.error || 'Invalid email or password.';
        setError(errorMessage);
        return false;
      }

      const loggedInUser: UserSession = {
        id: String(data.user.id),
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as UserRole,
        roleTitle: getRoleTitle(data.user.role),
        avatarUrl: getRoleAvatar(data.user.role, data.user.email),
        schoolName: data.user.schoolName || 'Westside Academy',
      };

      setUser(loggedInUser);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Unable to connect to authentication server.';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMessage = data.error || 'Google authentication failed.';
        setError(errorMessage);
        return false;
      }

      const loggedInUser: UserSession = {
        id: String(data.user.id),
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as UserRole,
        roleTitle: getRoleTitle(data.user.role),
        avatarUrl: getRoleAvatar(data.user.role, data.user.email),
        schoolName: data.user.schoolName || 'Westside Academy',
      };

      setUser(loggedInUser);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Unable to connect to authentication server.';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
    } catch (err) {
      console.error('[AUTH] Logout request failed:', err);
    } finally {
      setUser(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        loginWithGoogle,
        logout,
        checkAuth,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
