import React, { useState } from 'react';
import { toast } from 'sonner';
import { ActiveTab } from '../../types';
import {
  Building2,
  Upload,
  CheckCircle2,
  Shield,
  Users,
  Layers,
  ClipboardList,
  FileText
} from 'lucide-react';

interface SettingsViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

type SettingsSection =
  | 'school_profile'
  | 'users_roles'
  | 'classes_sections'
  | 'assessment_settings'
  | 'report_settings';

export const SettingsView: React.FC<SettingsViewProps> = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('school_profile');

  // School Profile State
  const [schoolName, setSchoolName] = useState('Westside Academy');
  const [institutionId, setInstitutionId] = useState('WA-9824');
  const [primaryAddress, setPrimaryAddress] = useState('123 Education Lane');
  const [city, setCity] = useState('Springfield');
  const [stateCode, setStateCode] = useState('IL');
  const [zipCode, setZipCode] = useState('62701');

  // Academic Calendar State
  const [academicYear, setAcademicYear] = useState('2024 - 2025');
  const [gradingSystem, setGradingSystem] = useState('Standard Letter (A-F)');

  // Data Privacy State
  const [anonymizeExports, setAnonymizeExports] = useState(true);
  const [require2FA, setRequire2FA] = useState(true);

  const handleSaveChanges = () => {
    toast.success('Settings saved successfully!');
  };

  const handleReset = () => {
    setSchoolName('Westside Academy');
    setInstitutionId('WA-9824');
    setPrimaryAddress('123 Education Lane');
    setCity('Springfield');
    setStateCode('IL');
    setZipCode('62701');
    setAcademicYear('2024 - 2025');
    setGradingSystem('Standard Letter (A-F)');
    setAnonymizeExports(true);
    setRequire2FA(true);
  };

  const navTabs = [
    { id: 'school_profile' as SettingsSection, label: 'School Profile' },
    { id: 'users_roles' as SettingsSection, label: 'Users & Roles' },
    { id: 'classes_sections' as SettingsSection, label: 'Classes & Sections' },
    { id: 'assessment_settings' as SettingsSection, label: 'Assessment Settings' },
    { id: 'report_settings' as SettingsSection, label: 'Report Settings' },
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

        {/* Right Side: Form Card */}
        <div className="lg:col-span-9">
          {activeSection === 'school_profile' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
              {/* Section 1: School Profile */}
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">School Profile</h2>
                <hr className="border-slate-200/80 my-4" />

                <div className="space-y-6">
                  {/* School Crest or Logo */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="w-20 h-20 bg-slate-100/90 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                      <Building2 className="w-9 h-9 text-slate-400" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900">School Crest or Logo</h3>
                      <p className="text-xs text-slate-500">
                        Recommended size : 256×256px (PNG or SVG)
                      </p>
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => alert("Upload dialog: Select an official school crest image file.")}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inputs: School Name & Institution ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        School Name
                      </label>
                      <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Institution ID / Registration Code
                      </label>
                      <input
                        type="text"
                        value={institutionId}
                        onChange={(e) => setInstitutionId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Primary Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Primary Address
                    </label>
                    <input
                      type="text"
                      value={primaryAddress}
                      onChange={(e) => setPrimaryAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* City, State, Zip */}
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 sm:col-span-6">
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <input
                        type="text"
                        value={stateCode}
                        onChange={(e) => setStateCode(e.target.value)}
                        placeholder="State"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="Zip Code"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Academic Calendar Configuration */}
              <div className="pt-2">
                <h2 className="text-base font-bold text-slate-900">
                  Academic Calendar Configuration
                </h2>
                <hr className="border-slate-200/80 my-4" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Current Academic Year
                    </label>
                    <select
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all cursor-pointer"
                    >
                      <option value="2024 - 2025">2024 - 2025</option>
                      <option value="2023 - 2024">2023 - 2024</option>
                      <option value="2025 - 2026">2025 - 2026</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Default Grading System
                    </label>
                    <select
                      value={gradingSystem}
                      onChange={(e) => setGradingSystem(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all cursor-pointer"
                    >
                      <option value="Standard Letter (A-F)">Standard Letter (A-F)</option>
                      <option value="Standards-Based (1-4)">Standards-Based (1-4)</option>
                      <option value="Percentage (0-100)">Percentage (0-100)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Data Privacy & Compliance */}
              <div className="pt-2">
                <h2 className="text-base font-bold text-slate-900">
                  Data Privacy & Compliance
                </h2>
                <hr className="border-slate-200/80 my-4" />

                <div className="space-y-4">
                  {/* Checkbox 1 */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={anonymizeExports}
                      onChange={(e) => setAnonymizeExports(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <div>
                      <span className="block text-xs sm:text-sm font-bold text-slate-900">
                        Enable Strict Anonymization for Aggregated Reports
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">
                        Student PII will be stripped from district-level wellness exports.
                      </span>
                    </div>
                  </label>

                  {/* Checkbox 2 */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={require2FA}
                      onChange={(e) => setRequire2FA(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <div>
                      <span className="block text-xs sm:text-sm font-bold text-slate-900">
                        Require 2FA for Staff Accounts
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">
                        Mandate two-factor authentication for users with Assessment access.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Subtabs for other configurations */}
          {activeSection === 'users_roles' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Users & Roles</h2>
              <hr className="border-slate-200/80 my-4" />
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Dr. Sarah Jenkins</h3>
                    <p className="text-xs text-slate-500">Lead Psychologist • Administrator</p>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-md">Active</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">David Vance</h3>
                    <p className="text-xs text-slate-500">Grade 5 Math Educator • Observer</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-md">Active</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'classes_sections' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Classes & Sections</h2>
              <hr className="border-slate-200/80 my-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['Grade 4, Class B', 'Grade 5, Class A', 'Grade 6, Class C', 'Grade 8, Class B'].map((cls) => (
                  <div key={cls} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                    <h3 className="text-sm font-bold text-slate-900">{cls}</h3>
                    <p className="text-xs text-slate-500 mt-1">28 Enrolled • 1 Active Evaluation Plan</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'assessment_settings' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Assessment Settings</h2>
              <hr className="border-slate-200/80 my-4" />
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Auto-Calculate Domain Baselines</h3>
                    <p className="text-xs text-slate-500">Generate real-time psychological percentiles upon protocol submission.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 accent-blue-600" />
                </label>
              </div>
            </div>
          )}

          {activeSection === 'report_settings' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Report Settings</h2>
              <hr className="border-slate-200/80 my-4" />
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Include Official District Header & Watermark</h3>
                    <p className="text-xs text-slate-500">Attach district verification seal on all exported psychological reports.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 accent-blue-600" />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
