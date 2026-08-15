import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ClassReportPage() {
  return (
    <div className="flex-1 overflow-y-auto p-margin-mobile md:p-gutter w-full max-w-container-max mx-auto pb-24 md:pb-gutter">
      {/* Page Header */}
      <div className="mb-space-lg flex justify-between items-end">
        <div>
          <div className="flex items-center gap-space-sm mb-space-xs">
            <Link href="/psychologist/reports" className="text-secondary font-label-md hover:text-primary transition-colors flex items-center">
              <span className="material-symbols-outlined text-[16px] mr-1">arrow_back</span>
              All Classes
            </Link>
          </div>
          <h2 className="font-headline-lg md:font-display text-on-surface font-bold">Grade 4, Class B</h2>
          <p className="font-body-md text-on-surface-variant mt-1">Assessment &amp; Wellness Aggregate Report &bull; Term 1, 2024</p>
        </div>
        <div className="hidden md:flex gap-space-sm">
          <Button variant="outline" className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
          </Button>
          <Button variant="primary" className="flex items-center gap-space-xs shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Assessment
          </Button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-space-lg">
        
        {/* KPI Card: Total Students */}
        <div className="col-span-12 md:col-span-4 bg-surface rounded-xl p-space-lg border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-space-sm">
            <h3 className="font-title-md text-on-surface">Total Cohort</h3>
            <div className="p-2 bg-surface-container-low rounded-lg text-primary">
              <span className="material-symbols-outlined">group</span>
            </div>
          </div>
          <div>
            <div className="font-display text-[48px] leading-tight font-bold text-on-surface">28</div>
            <p className="font-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
              Active Students
            </p>
          </div>
        </div>
        
        {/* KPI Card: Assessment Status */}
        <div className="col-span-12 md:col-span-8 bg-surface rounded-xl p-space-lg border border-outline-variant shadow-sm">
          <div className="flex justify-between items-center mb-space-md border-b border-outline-variant pb-space-sm">
            <h3 className="font-title-md text-on-surface">Term 1 Assessment Progress</h3>
            <span className="bg-surface-container-low text-primary font-label-md px-2 py-1 rounded-full">85% Completion</span>
          </div>
          <div className="flex gap-space-lg items-end mt-space-md">
            <div className="flex-1">
              <div className="flex justify-between font-label-md text-on-surface-variant mb-space-xs">
                <span>Assessed</span>
                <span className="font-bold text-on-surface">24</span>
              </div>
              <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between font-label-md text-on-surface-variant mb-space-xs">
                <span>Pending</span>
                <span className="font-bold text-on-surface">4</span>
              </div>
              <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-secondary-container rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Score Distribution (Horizontal Bar) */}
        <div className="col-span-12 md:col-span-6 bg-surface rounded-xl p-space-lg border border-outline-variant shadow-sm">
          <div className="flex justify-between items-center mb-space-md border-b border-outline-variant pb-space-sm">
            <h3 className="font-title-md text-on-surface">Overall Wellness Distribution</h3>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>
          <div className="space-y-space-md mt-space-md">
            {/* Normal */}
            <div>
              <div className="flex justify-between font-label-md text-on-surface-variant mb-space-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> Normal Range</span>
                <span className="font-bold text-on-surface">18 Students (75%)</span>
              </div>
              <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            {/* Monitor */}
            <div>
              <div className="flex justify-between font-label-md text-on-surface-variant mb-space-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tertiary-container"></span> Monitor closely</span>
                <span className="font-bold text-on-surface">5 Students (20%)</span>
              </div>
              <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-container rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
            {/* Attention */}
            <div>
              <div className="flex justify-between font-label-md text-on-surface-variant mb-space-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error"></span> Attention Required</span>
                <span className="font-bold text-on-surface">1 Student (5%)</span>
              </div>
              <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-error rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Domain Level Aggregate */}
        <div className="col-span-12 md:col-span-6 bg-surface rounded-xl p-space-lg border border-outline-variant shadow-sm">
          <div className="flex justify-between items-center mb-space-md border-b border-outline-variant pb-space-sm">
            <h3 className="font-title-md text-on-surface">Domain Aggregates (Mean Score)</h3>
            <span className="font-label-md text-on-surface-variant">Max Score: 10</span>
          </div>
          <div className="grid grid-cols-2 gap-space-md mt-space-md">
            <div className="bg-surface-container-low p-space-sm rounded-lg border border-outline-variant">
              <p className="font-label-md text-on-surface-variant mb-1">Emotional Regulation</p>
              <div className="flex items-end gap-2">
                <span className="font-title-lg text-on-surface">7.2</span>
                <span className="material-symbols-outlined text-[16px] text-tertiary-container mb-1">trending_down</span>
              </div>
            </div>
            <div className="bg-surface-container-low p-space-sm rounded-lg border border-outline-variant">
              <p className="font-label-md text-on-surface-variant mb-1">Social Integration</p>
              <div className="flex items-end gap-2">
                <span className="font-title-lg text-on-surface">8.5</span>
                <span className="material-symbols-outlined text-[16px] text-primary mb-1">trending_up</span>
              </div>
            </div>
            <div className="bg-surface-container-low p-space-sm rounded-lg border border-outline-variant">
              <p className="font-label-md text-on-surface-variant mb-1">Academic Anxiety</p>
              <div className="flex items-end gap-2">
                <span className="font-title-lg text-on-surface">4.1</span>
                <span className="material-symbols-outlined text-[16px] text-primary mb-1">trending_flat</span>
              </div>
            </div>
            <div className="bg-surface-container-low p-space-sm rounded-lg border border-outline-variant">
              <p className="font-label-md text-on-surface-variant mb-1">Focus &amp; Attention</p>
              <div className="flex items-end gap-2">
                <span className="font-title-lg text-on-surface">6.8</span>
                <span className="material-symbols-outlined text-[16px] text-tertiary-container mb-1">trending_down</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Students Requiring Attention List */}
        <div className="col-span-12 bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="p-space-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <h3 className="font-title-md text-on-surface">Priority Student Review</h3>
            <button className="text-primary font-label-md hover:underline">View All Students</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="p-space-sm font-label-md text-on-surface-variant pl-space-lg">Student ID</th>
                  <th className="p-space-sm font-label-md text-on-surface-variant">Primary Domain Flag</th>
                  <th className="p-space-sm font-label-md text-on-surface-variant">Status</th>
                  <th className="p-space-sm font-label-md text-on-surface-variant pr-space-lg">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group">
                  <td className="p-space-sm pl-space-lg font-body-md text-on-surface font-medium">STU-4029</td>
                  <td className="p-space-sm font-body-md text-on-surface-variant">Emotional Regulation (Score: 2.1)</td>
                  <td className="p-space-sm">
                    <span className="bg-error-container text-on-error-container font-label-md px-2 py-1 rounded-full text-[10px] uppercase tracking-wider">Attention Required</span>
                  </td>
                  <td className="p-space-sm pr-space-lg">
                    <button className="text-primary font-label-md hover:underline">View Profile</button>
                  </td>
                </tr>
                <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group">
                  <td className="p-space-sm pl-space-lg font-body-md text-on-surface font-medium">STU-4055</td>
                  <td className="p-space-sm font-body-md text-on-surface-variant">Focus &amp; Attention (Score: 3.4)</td>
                  <td className="p-space-sm">
                    <span className="bg-tertiary-container text-on-tertiary-container font-label-md px-2 py-1 rounded-full text-[10px] uppercase tracking-wider bg-opacity-10">Monitor</span>
                  </td>
                  <td className="p-space-sm pr-space-lg">
                    <button className="text-primary font-label-md hover:underline">View Profile</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors group">
                  <td className="p-space-sm pl-space-lg font-body-md text-on-surface font-medium">STU-4102</td>
                  <td className="p-space-sm font-body-md text-on-surface-variant">Social Integration (Score: 4.0)</td>
                  <td className="p-space-sm">
                    <span className="bg-tertiary-container text-on-tertiary-container font-label-md px-2 py-1 rounded-full text-[10px] uppercase tracking-wider bg-opacity-10">Monitor</span>
                  </td>
                  <td className="p-space-sm pr-space-lg">
                    <button className="text-primary font-label-md hover:underline">View Profile</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  )
}
