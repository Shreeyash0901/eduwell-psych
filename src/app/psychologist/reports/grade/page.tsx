import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function GradeReportPage() {
  return (
    <div className="flex-1 overflow-y-auto p-margin-mobile md:p-gutter w-full max-w-container-max mx-auto pb-24 md:pb-gutter">
      {/* Header Section */}
      <header className="mb-space-lg">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div>
            <div className="flex items-center gap-space-sm mb-space-xs">
              <Link href="/psychologist/reports" className="text-secondary font-label-md hover:text-primary transition-colors flex items-center">
                <span className="material-symbols-outlined text-[16px] mr-1">arrow_back</span>
                All Grades
              </Link>
            </div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Grade 5 Wellness Report</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">Aggregate cohort overview for Fall Term 2024</p>
          </div>
          <div className="flex gap-space-sm">
            <Button variant="outline" className="flex items-center gap-space-xs shadow-sm">
              <span className="material-symbols-outlined text-sm">download</span>
              Export PDF
            </Button>
            <Button variant="primary" className="flex items-center gap-space-xs shadow-sm">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filter
            </Button>
          </div>
        </div>
      </header>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-space-lg">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-space-md shadow-sm">
          <div className="flex items-center gap-space-sm mb-space-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-primary">class</span>
            <h3 className="font-title-md text-title-md">Classes Evaluated</h3>
          </div>
          <p className="font-display text-display text-on-surface">12</p>
          <p className="font-label-md text-label-md text-primary mt-space-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
            2 pending completion
          </p>
        </div>
        {/* Card 2 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-space-md shadow-sm">
          <div className="flex items-center gap-space-sm mb-space-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-primary">group</span>
            <h3 className="font-title-md text-title-md">Students Assessed</h3>
          </div>
          <p className="font-display text-display text-on-surface">284</p>
          <p className="font-label-md text-label-md text-on-surface-variant mt-space-xs">out of 310 enrolled</p>
        </div>
        {/* Card 3 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-space-md shadow-sm">
          <div className="flex items-center gap-space-sm mb-space-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-primary">done_all</span>
            <h3 className="font-title-md text-title-md">Assessment Coverage</h3>
          </div>
          <p className="font-display text-display text-on-surface">91.6%</p>
          <div className="w-full bg-surface-variant h-2 rounded-full mt-space-sm overflow-hidden">
            <div className="bg-primary h-full" style={{ width: '91.6%' }}></div>
          </div>
        </div>
      </section>

      {/* Main Bento Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Domain Distribution (Takes 2 cols on LG) */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-space-lg shadow-sm">
          <div className="flex justify-between items-center mb-space-lg pb-space-sm border-b border-outline-variant">
            <h3 className="font-title-lg text-title-lg text-on-surface">Domain Distribution</h3>
            <span className="font-label-md text-label-md text-on-surface-variant">Grade 5 Cohort</span>
          </div>
          <div className="flex flex-col gap-space-md">
            {/* Emotional Reg */}
            <div>
              <div className="flex justify-between mb-space-xs">
                <span className="font-body-md text-body-md text-on-surface">Emotional Regulation</span>
                <span className="font-label-md text-label-md text-on-surface-variant">72% Optimal</span>
              </div>
              <div className="flex h-6 rounded-md overflow-hidden bg-surface-variant">
                <div className="bg-primary" style={{ width: '72%' }} title="Optimal"></div>
                <div className="bg-secondary" style={{ width: '20%' }} title="Developing"></div>
                <div className="bg-error" style={{ width: '8%' }} title="Needs Support"></div>
              </div>
            </div>
            {/* Social Integration */}
            <div>
              <div className="flex justify-between mb-space-xs">
                <span className="font-body-md text-body-md text-on-surface">Social Integration</span>
                <span className="font-label-md text-label-md text-on-surface-variant">65% Optimal</span>
              </div>
              <div className="flex h-6 rounded-md overflow-hidden bg-surface-variant">
                <div className="bg-primary" style={{ width: '65%' }}></div>
                <div className="bg-secondary" style={{ width: '25%' }}></div>
                <div className="bg-error" style={{ width: '10%' }}></div>
              </div>
            </div>
            {/* Academic Resilience */}
            <div>
              <div className="flex justify-between mb-space-xs">
                <span className="font-body-md text-body-md text-on-surface">Academic Resilience</span>
                <span className="font-label-md text-label-md text-on-surface-variant">80% Optimal</span>
              </div>
              <div className="flex h-6 rounded-md overflow-hidden bg-surface-variant">
                <div className="bg-primary" style={{ width: '80%' }}></div>
                <div className="bg-secondary" style={{ width: '15%' }}></div>
                <div className="bg-error" style={{ width: '5%' }}></div>
              </div>
            </div>
          </div>
          <div className="flex gap-space-md mt-space-lg pt-space-md border-t border-outline-variant">
            <div className="flex items-center gap-space-xs">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="font-label-md text-label-md text-on-surface-variant">Optimal</span>
            </div>
            <div className="flex items-center gap-space-xs">
              <div className="w-3 h-3 rounded-full bg-secondary"></div>
              <span className="font-label-md text-label-md text-on-surface-variant">Developing</span>
            </div>
            <div className="flex items-center gap-space-xs">
              <div className="w-3 h-3 rounded-full bg-error"></div>
              <span className="font-label-md text-label-md text-on-surface-variant">Needs Support</span>
            </div>
          </div>
        </div>

        {/* Focus Areas */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-space-lg shadow-sm">
          <div className="mb-space-lg pb-space-sm border-b border-outline-variant">
            <h3 className="font-title-lg text-title-lg text-on-surface">Priority Focus Areas</h3>
          </div>
          <div className="flex flex-col gap-space-sm">
            <div className="p-space-md bg-error-container/20 border border-error-container rounded-lg">
              <div className="flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-error mt-1">warning</span>
                <div>
                  <h4 className="font-title-md text-title-md text-on-surface">Class 5B: Social Integration</h4>
                  <p className="font-body-sm text-body-md text-on-surface-variant mt-space-xs">A cluster of 8 students showing elevated peer conflict scores.</p>
                </div>
              </div>
            </div>
            <div className="p-space-md bg-surface-container border border-outline-variant rounded-lg">
              <div className="flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-secondary mt-1">info</span>
                <div>
                  <h4 className="font-title-md text-title-md text-on-surface">Grade-wide: Anxiety Trends</h4>
                  <p className="font-body-sm text-body-md text-on-surface-variant mt-space-xs">Slight uptick (+4%) in reported test anxiety compared to Fall 2023.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
