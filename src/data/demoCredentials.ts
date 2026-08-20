// src/data/demoCredentials.ts
// Development / Evaluator Demo Account Credentials
// Real user records are seeded in the database via prisma/seed.ts.

import { UserSession } from '../types';

export const demoUsers: UserSession[] = [
  {
    id: 'u-psych',
    name: 'Dr. Sarah Jenkins',
    email: 'dr.jenkins@eduwell.org',
    role: 'psychologist',
    roleTitle: 'Lead School Psychologist',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120',
    schoolName: 'Lincoln High School (District 4)'
  },
  {
    id: 'u-teacher',
    name: 'Sarah Jenkins (Educator)',
    email: 'sarah.teacher@eduwell.org',
    role: 'teacher',
    roleTitle: 'Primary Science & Homeroom Educator',
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=120',
    schoolName: 'Lincoln High School (Grade 9-11)'
  },
  {
    id: 'u-parent',
    name: 'Sarah Johnson',
    email: 'parent.johnson@eduwell.org',
    role: 'parent',
    roleTitle: 'Parent / Guardian of Alex Johnson',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120',
    schoolName: 'Lincoln High School'
  },
  {
    id: 'u-admin',
    name: 'Principal Mercer',
    email: 'principal@eduwell.org',
    role: 'admin',
    roleTitle: 'School Principal',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    schoolName: 'Lincoln Unified District #42'
  },
  {
    id: 'u-super-admin',
    name: 'Platform Super Admin',
    email: 'superadmin@eduwell.platform',
    role: 'super_admin',
    roleTitle: 'Platform Administrator',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120',
    schoolName: 'Platform Control Plane'
  }
];
