import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-margin-mobile md:p-gutter w-full max-w-container-max mx-auto pb-24 md:pb-gutter">
      <header className="mb-space-lg">
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background mb-space-sm">Settings</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Manage your school configurations, users, and assessment preferences.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-gutter">
        {/* Settings Navigation (Internal) */}
        <aside className="lg:w-64 flex-shrink-0">
          <nav className="flex lg:flex-col gap-space-xs overflow-x-auto lg:overflow-visible pb-space-sm lg:pb-0 scrollbar-hide">
            <button className="whitespace-nowrap px-space-md py-2 text-left font-label-md text-label-md text-primary bg-surface-container-high rounded-lg font-semibold border-l-4 border-primary lg:border-l-4 lg:border-b-0 border-b-4 lg:border-b-0 border-transparent lg:border-primary border-b-primary lg:border-b-transparent">
              School Profile
            </button>
            <button className="whitespace-nowrap px-space-md py-2 text-left font-label-md text-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-lg transition-colors border-l-4 border-transparent">
              Users &amp; Roles
            </button>
            <button className="whitespace-nowrap px-space-md py-2 text-left font-label-md text-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-lg transition-colors border-l-4 border-transparent">
              Classes &amp; Sections
            </button>
            <button className="whitespace-nowrap px-space-md py-2 text-left font-label-md text-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-lg transition-colors border-l-4 border-transparent">
              Assessment Settings
            </button>
            <button className="whitespace-nowrap px-space-md py-2 text-left font-label-md text-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-lg transition-colors border-l-4 border-transparent">
              Report Settings
            </button>
          </nav>
        </aside>

        {/* Settings Content Area */}
        <div className="flex-1">
          {/* School Profile Form */}
          <section className="bg-surface rounded-xl border border-outline-variant p-space-lg shadow-sm">
            <h3 className="font-title-lg text-title-lg text-on-surface border-b border-outline-variant pb-space-sm mb-space-lg">School Profile</h3>
            <form className="space-y-space-lg max-w-2xl">
              {/* Logo Upload */}
              <div className="flex items-center gap-space-md">
                <div className="w-24 h-24 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center overflow-hidden">
                  <span className="material-symbols-outlined text-outline text-4xl">domain</span>
                </div>
                <div>
                  <h4 className="font-title-md text-title-md text-on-surface">School Crest or Logo</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-space-sm">Recommended size: 256x256px (PNG or SVG)</p>
                  <Button variant="outline" type="button" className="font-label-md">
                    Upload Image
                  </Button>
                </div>
              </div>

              {/* General Information Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-md text-label-md text-on-surface" htmlFor="school-name">School Name</label>
                  <input className="h-10 px-3 bg-surface border border-outline-variant rounded focus:outline-none focus:border-2 focus:border-primary font-body-md text-body-md text-on-surface" id="school-name" type="text" defaultValue="Westside Academy" />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-md text-label-md text-on-surface" htmlFor="school-id">Institution ID / Registration Code</label>
                  <input className="h-10 px-3 bg-surface border border-outline-variant rounded focus:outline-none focus:border-2 focus:border-primary font-body-md text-body-md text-on-surface" id="school-id" type="text" defaultValue="WA-9824" />
                </div>
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="address">Primary Address</label>
                <input className="h-10 px-3 bg-surface border border-outline-variant rounded focus:outline-none focus:border-2 focus:border-primary font-body-md text-body-md text-on-surface mb-2" id="address" type="text" defaultValue="123 Education Lane" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
                  <input className="col-span-2 h-10 px-3 bg-surface border border-outline-variant rounded focus:outline-none focus:border-2 focus:border-primary font-body-md text-body-md text-on-surface" placeholder="City" type="text" defaultValue="Springfield" />
                  <input className="h-10 px-3 bg-surface border border-outline-variant rounded focus:outline-none focus:border-2 focus:border-primary font-body-md text-body-md text-on-surface" placeholder="State/Province" type="text" defaultValue="IL" />
                  <input className="h-10 px-3 bg-surface border border-outline-variant rounded focus:outline-none focus:border-2 focus:border-primary font-body-md text-body-md text-on-surface" placeholder="Postal Code" type="text" defaultValue="62701" />
                </div>
              </div>

              {/* Academic Settings */}
              <h4 className="font-title-md text-title-md text-on-surface border-b border-outline-variant pb-space-xs mt-space-lg mb-space-md">Academic Calendar Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-md text-label-md text-on-surface" htmlFor="academic-year">Current Academic Year</label>
                  <select className="h-10 px-3 bg-surface border border-outline-variant rounded focus:outline-none focus:border-2 focus:border-primary font-body-md text-body-md text-on-surface" id="academic-year" defaultValue="2024 - 2025">
                    <option value="2023 - 2024">2023 - 2024</option>
                    <option value="2024 - 2025">2024 - 2025</option>
                    <option value="2025 - 2026">2025 - 2026</option>
                  </select>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-md text-label-md text-on-surface" htmlFor="grading-system">Default Grading System</label>
                  <select className="h-10 px-3 bg-surface border border-outline-variant rounded focus:outline-none focus:border-2 focus:border-primary font-body-md text-body-md text-on-surface" id="grading-system" defaultValue="Standard Letter (A-F)">
                    <option value="Standard Letter (A-F)">Standard Letter (A-F)</option>
                    <option value="Numeric (0-100)">Numeric (0-100)</option>
                    <option value="Standards-Based (1-4)">Standards-Based (1-4)</option>
                  </select>
                </div>
              </div>

              {/* Data & Privacy */}
              <h4 className="font-title-md text-title-md text-on-surface border-b border-outline-variant pb-space-xs mt-space-lg mb-space-md">Data Privacy &amp; Compliance</h4>
              <div className="flex flex-col gap-space-sm">
                <label className="flex items-start gap-space-sm cursor-pointer group">
                  <input defaultChecked className="mt-1 w-4 h-4 text-primary bg-surface border-outline-variant rounded focus:ring-primary focus:ring-2" type="checkbox" />
                  <div>
                    <span className="block font-body-md text-body-md text-on-surface font-semibold group-hover:text-primary transition-colors">Enable Strict Anonymization for Aggregated Reports</span>
                    <span className="block font-label-md text-label-md text-on-surface-variant">Student PII will be stripped from district-level wellness exports.</span>
                  </div>
                </label>
                <label className="flex items-start gap-space-sm cursor-pointer group">
                  <input defaultChecked className="mt-1 w-4 h-4 text-primary bg-surface border-outline-variant rounded focus:ring-primary focus:ring-2" type="checkbox" />
                  <div>
                    <span className="block font-body-md text-body-md text-on-surface font-semibold group-hover:text-primary transition-colors">Require 2FA for Staff Accounts</span>
                    <span className="block font-label-md text-label-md text-on-surface-variant">Mandate two-factor authentication for users with Assessment access.</span>
                  </div>
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end items-center gap-space-md pt-space-lg border-t border-outline-variant mt-space-xl">
                <button className="px-space-md py-2 font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors" type="button">
                  Cancel
                </button>
                <Button variant="primary" type="submit" className="shadow-sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
