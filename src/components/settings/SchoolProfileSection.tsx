import React, { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Building2, Save, Upload, CalendarDays } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FormField } from '../ui/FormField';
import { Select } from '../ui/Select';
import { useAuth } from '../../context/AuthContext';
import { SectionLoading, SectionError, SectionCard } from './SectionState';

interface SchoolProfileData {
  id: number;
  name: string;
  code: string;
  status: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
}

interface SchoolSettingsData {
  defaultGradingSystem: string | null;
  anonymizeExports: boolean;
  require2FA: boolean;
  timezone: string;
  locale: string;
}

interface CurrentAcademicSession {
  id: number;
  name: string;
}

const GRADING_SYSTEMS = [
  'Standard Letter (A-F)',
  'Standards-Based (1-4)',
  'Percentage (0-100)',
];

const TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Asia/Kolkata', 'Europe/London'];

const LOCALES = ['en-US', 'en-GB', 'en-IN'];

export const SchoolProfileSection: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [profile, setProfile] = useState<SchoolProfileData | null>(null);
  const [settings, setSettings] = useState<SchoolSettingsData | null>(null);
  const [currentSession, setCurrentSession] = useState<CurrentAcademicSession | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const saveInFlight = useRef(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/settings/school-profile', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load school profile.');
      }
      setProfile(data.school);
      setSettings(data.settings);
      setCurrentSession(data.currentAcademicSession);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load school profile.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = (patch: Partial<SchoolProfileData>) =>
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  const updateSettings = (patch: Partial<SchoolSettingsData>) =>
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!profile?.name || !profile.name.trim()) {
      errors.name = 'School name is required.';
    }
    if (profile?.website && !/^https?:\/\/[^\s]+$/.test(profile.website.trim())) {
      errors.website = 'Website must start with http:// or https://.';
    }
    if (profile?.phone && !/^[+0-9()\-\s]{7,20}$/.test(profile.phone.trim())) {
      errors.phone = 'Enter a valid phone number (7–20 digits/symbols).';
    }
    if (profile?.postalCode && !/^[A-Za-z0-9\-\s]{3,10}$/.test(profile.postalCode.trim())) {
      errors.postalCode = 'Enter a valid postal code.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    if (saveInFlight.current) {
      toast.warning('A save is already in progress.');
      return;
    }

    saveInFlight.current = true;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/settings/school-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: profile?.name,
          addressLine1: profile?.addressLine1,
          addressLine2: profile?.addressLine2,
          city: profile?.city,
          state: profile?.state,
          postalCode: profile?.postalCode,
          country: profile?.country,
          phone: profile?.phone,
          website: profile?.website,
          logoUrl: profile?.logoUrl,
          defaultGradingSystem: settings?.defaultGradingSystem,
          anonymizeExports: settings?.anonymizeExports,
          require2FA: settings?.require2FA,
          timezone: settings?.timezone,
          locale: settings?.locale,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save school profile.');
      }
      setProfile(data.school);
      setSettings(data.settings);
      toast.success('School profile saved successfully.');
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save school profile.');
      toast.error(err.message || 'Failed to save school profile.');
    } finally {
      saveInFlight.current = false;
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <SectionCard title="School Profile"><SectionLoading label="Loading school profile..." /></SectionCard>;
  }

  if (loadError) {
    return (
      <SectionCard title="School Profile">
        <SectionError message={loadError} onRetry={loadProfile} />
      </SectionCard>
    );
  }

  if (!profile || !settings) {
    return (
      <SectionCard title="School Profile">
        <SectionError message="School profile data is unavailable." onRetry={loadProfile} />
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="School Profile"
        subtitle="This profile belongs to your authenticated school only and cannot be changed to another tenant."
        actions={
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            {profile.code}
          </span>
        }
      >
        {!isAdmin && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
            Read-only view. Only the school Principal can modify school profile settings.
          </div>
        )}

        {/* School crest / logo */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 bg-slate-100/90 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt={`${profile.name} crest`} className="w-full h-full object-contain rounded-2xl" />
            ) : (
              <Building2 className="w-9 h-9 text-slate-400" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">School Crest or Logo</h3>
            <p className="text-xs text-slate-500">
              Recommended size: 256×256px (PNG or SVG). Logo URL is stored on the server; no file upload endpoint exists yet.
            </p>
            <div className="pt-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!isAdmin}
                onClick={() => {
                  const url = window.prompt('Paste the public logo image URL (256×256px):', profile.logoUrl || '');
                  if (url !== null) {
                    updateProfile({ logoUrl: url.trim() || null });
                  }
                }}
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                {profile.logoUrl ? 'Change Logo URL' : 'Set Logo URL'}
              </Button>
            </div>
          </div>
        </div>

        {/* School identity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="School Name" required htmlFor="school-name" error={fieldErrors.name}>
            <Input
              id="school-name"
              value={profile.name}
              hasError={!!fieldErrors.name}
              onChange={(e) => {
                updateProfile({ name: e.target.value });
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
              }}
              disabled={!isAdmin}
              required
            />
          </FormField>

          <FormField
            label="Institution Code (Login Identifier)"
            helperText="Read-only — this code is the unique login identifier for this school."
            htmlFor="school-code"
          >
            <Input id="school-code" value={profile.code} disabled />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Primary Address" htmlFor="address-line1">
            <Input
              id="address-line1"
              value={profile.addressLine1 || ''}
              onChange={(e) => updateProfile({ addressLine1: e.target.value })}
              disabled={!isAdmin}
              placeholder="123 Education Lane"
            />
          </FormField>

          <FormField label="Address Line 2" htmlFor="address-line2">
            <Input
              id="address-line2"
              value={profile.addressLine2 || ''}
              onChange={(e) => updateProfile({ addressLine2: e.target.value })}
              disabled={!isAdmin}
              placeholder="Suite / Floor"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 sm:col-span-6">
            <FormField label="City" htmlFor="city">
              <Input id="city" value={profile.city || ''} onChange={(e) => updateProfile({ city: e.target.value })} disabled={!isAdmin} placeholder="Springfield" />
            </FormField>
          </div>
          <div className="col-span-6 sm:col-span-2">
            <FormField label="State" htmlFor="state">
              <Input id="state" value={profile.state || ''} onChange={(e) => updateProfile({ state: e.target.value })} disabled={!isAdmin} placeholder="IL" />
            </FormField>
          </div>
          <div className="col-span-6 sm:col-span-2">
            <FormField label="Postal Code" htmlFor="postal-code" error={fieldErrors.postalCode}>
              <Input
                id="postal-code"
                value={profile.postalCode || ''}
                hasError={!!fieldErrors.postalCode}
                onChange={(e) => {
                  updateProfile({ postalCode: e.target.value });
                  if (fieldErrors.postalCode) setFieldErrors((prev) => ({ ...prev, postalCode: '' }));
                }}
                disabled={!isAdmin}
                placeholder="62701"
              />
            </FormField>
          </div>
          <div className="col-span-6 sm:col-span-2">
            <FormField label="Country" htmlFor="country">
              <Input id="country" value={profile.country || ''} onChange={(e) => updateProfile({ country: e.target.value })} disabled={!isAdmin} placeholder="USA" />
            </FormField>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Phone" htmlFor="phone" error={fieldErrors.phone}>
            <Input
              id="phone"
              value={profile.phone || ''}
              hasError={!!fieldErrors.phone}
              onChange={(e) => {
                updateProfile({ phone: e.target.value });
                if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
              }}
              disabled={!isAdmin}
              placeholder="+1-555-0100"
            />
          </FormField>

          <FormField label="Website" htmlFor="website" error={fieldErrors.website}>
            <Input
              id="website"
              value={profile.website || ''}
              hasError={!!fieldErrors.website}
              onChange={(e) => {
                updateProfile({ website: e.target.value });
                if (fieldErrors.website) setFieldErrors((prev) => ({ ...prev, website: '' }));
              }}
              disabled={!isAdmin}
              placeholder="https://www.westside.edu"
            />
          </FormField>
        </div>
      </SectionCard>

      {/* Academic Calendar (real persisted data) */}
      <SectionCard
        title="Academic Calendar"
        subtitle="The current academic year/session is read from the persisted academic sessions table and cannot be edited from this page."
        actions={<CalendarDays className="w-5 h-5 text-slate-300" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Current Academic Session" helperText="Source: academic_sessions table (is_current = true)">
            <Input
              value={currentSession ? currentSession.name : 'No active session configured'}
              disabled
              placeholder="2024 - 2025"
            />
          </FormField>

          <FormField label="Default Grading System" htmlFor="grading-system" helperText="Stored in school_settings.">
            <Select
              id="grading-system"
              value={settings.defaultGradingSystem || ''}
              disabled={!isAdmin}
              onChange={(e) => updateSettings({ defaultGradingSystem: e.target.value })}
              options={GRADING_SYSTEMS.map((g) => ({ label: g, value: g }))}
            />
          </FormField>
        </div>
      </SectionCard>

      {/* Data Privacy & Compliance */}
      <SectionCard title="Data Privacy & Compliance" subtitle="These flags are persisted per-school in the school_settings table.">
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.anonymizeExports}
              onChange={(e) => updateSettings({ anonymizeExports: e.target.checked })}
              disabled={!isAdmin}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
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

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.require2FA}
              onChange={(e) => updateSettings({ require2FA: e.target.checked })}
              disabled={!isAdmin}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <FormField label="Timezone" htmlFor="timezone" helperText="IANA timezone used for report timestamps.">
            <Select
              id="timezone"
              value={settings.timezone}
              disabled={!isAdmin}
              onChange={(e) => updateSettings({ timezone: e.target.value })}
              options={TIMEZONES.map((t) => ({ label: t, value: t }))}
            />
          </FormField>
          <FormField label="Locale" htmlFor="locale" helperText="BCP-47 locale used for formatting.">
            <Select
              id="locale"
              value={settings.locale}
              disabled={!isAdmin}
              onChange={(e) => updateSettings({ locale: e.target.value })}
              options={LOCALES.map((l) => ({ label: l, value: l }))}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          {saveError && <p className="text-xs font-semibold text-rose-600 mr-auto">{saveError}</p>}
          {isAdmin && (
            <Button type="button" onClick={handleSave} isLoading={isSaving} disabled={isSaving}>
              <Save className="w-4 h-4 mr-1.5" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </SectionCard>
    </div>
  );
};