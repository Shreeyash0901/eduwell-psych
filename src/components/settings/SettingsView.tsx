import React, { useState } from 'react';
import { SchoolProfileSection } from './SchoolProfileSection';
import { SchoolApiSettingsSection } from './SchoolApiSettingsSection';
import { UsersRolesSection } from './UsersRolesSection';
import { ClassesSectionsSection } from './ClassesSectionsSection';
import { ComingSoonSection } from './ComingSoonSection';

type SettingsSection =
  | 'school_profile'
  | 'school_api'
  | 'users_roles'
  | 'classes_sections'
  | 'assessment_settings'
  | 'report_settings'
  | 'notifications';

export const SettingsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('school_profile');

  const navTabs: { id: SettingsSection; label: string }[] = [
    { id: 'school_profile', label: 'School Profile' },
    { id: 'school_api', label: 'School API & Sync' },
    { id: 'users_roles', label: 'Users & Roles' },
    { id: 'classes_sections', label: 'Classes & Sections' },
    { id: 'assessment_settings', label: 'Assessment Settings' },
    { id: 'report_settings', label: 'Report Settings' },
    { id: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Manage your school configurations, users, and assessment preferences.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* Left Side: Navigation Tabs */}
        <div className="lg:col-span-3 space-y-1">
          <nav className="space-y-1">
            {navTabs.map((tab) => {
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-150 font-medium cursor-pointer ${
                    isActive
                      ? 'bg-blue-50/90 text-blue-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Active Section */}
        <div className="lg:col-span-9">
          {activeSection === 'school_profile' && <SchoolProfileSection />}
          {activeSection === 'school_api' && <SchoolApiSettingsSection />}
          {activeSection === 'users_roles' && <UsersRolesSection />}
          {activeSection === 'classes_sections' && <ClassesSectionsSection />}
          {activeSection === 'assessment_settings' && (
            <ComingSoonSection
              title="Assessment Settings"
              subtitle="Global assessment defaults for this school."
              items={[
                {
                  name: 'Auto-Calculate Domain Baselines',
                  description: 'Generate real-time psychological percentiles upon protocol submission.',
                },
              ]}
            />
          )}
          {activeSection === 'report_settings' && (
            <ComingSoonSection
              title="Report Settings"
              subtitle="Report formatting and district watermark preferences."
              items={[
                {
                  name: 'Include Official District Header & Watermark',
                  description: 'Attach district verification seal on all exported psychological reports.',
                },
              ]}
            />
          )}
          {activeSection === 'notifications' && (
            <ComingSoonSection
              title="Notifications"
              subtitle="In-app and email notification preferences for staff."
              items={[
                {
                  name: 'New Observation Alerts',
                  description: 'Notify psychologists when a new observation is submitted by a teacher.',
                },
                {
                  name: 'Assessment Review Reminders',
                  description: 'Remind psychologists to review pending assessment results.',
                },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
};