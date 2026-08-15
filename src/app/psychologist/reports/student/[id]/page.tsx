import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function StudentReportPreviewPage() {
  return (
    <div className="flex-1 overflow-y-auto p-margin-mobile md:p-gutter w-full max-w-container-max mx-auto pb-24 md:pb-gutter">
      {/* Header Actions */}
      <div className="flex justify-between items-end mb-space-lg">
        <div>
          <Link href="/psychologist/reports" className="text-on-surface-variant font-label-md text-label-md mb-1 flex items-center gap-2 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Reports
          </Link>
          <h2 className="font-headline-lg text-headline-lg md:text-display font-display text-on-background">Comprehensive Wellness Report</h2>
        </div>
        <div className="gap-space-sm hidden sm:flex">
          <Button variant="outline" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">print</span> Print
          </Button>
          <Button variant="primary" className="flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span> Generate PDF
          </Button>
        </div>
      </div>

      {/* Report Container (Paper-like feel) */}
      <div className="bg-surface rounded-xl border border-outline-variant shadow-sm p-space-lg md:p-space-xl space-y-space-xl">
        {/* Header Section */}
        <div className="flex justify-between items-start border-b border-outline-variant pb-space-lg">
          <div>
            <h3 className="font-title-lg text-title-lg text-on-background mb-1">Confidential Psychological Evaluation</h3>
            <p className="text-on-surface-variant font-body-md text-body-md">Prepared by Dr. Sarah Jenkins, Lead School Psychologist</p>
          </div>
          <div className="text-right">
            <p className="text-on-surface-variant font-label-md text-label-md">Date of Report</p>
            <p className="font-title-md text-title-md text-on-background">October 24, 2024</p>
          </div>
        </div>

        {/* Bento Grid: Student Info & Reason */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {/* Student Information Card */}
          <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-lg p-space-md">
            <h4 className="font-title-md text-title-md text-primary mb-space-md flex items-center gap-2 border-b border-outline-variant pb-2">
              <span className="material-symbols-outlined text-primary">person</span> Student Information
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-md">
              <div>
                <p className="text-on-surface-variant font-label-md text-label-md">Name</p>
                <p className="font-body-md text-body-md text-on-background font-medium">Elijah Vance</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-label-md text-label-md">Grade</p>
                <p className="font-body-md text-body-md text-on-background font-medium">8th Grade</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-label-md text-label-md">Age / DOB</p>
                <p className="font-body-md text-body-md text-on-background font-medium">13 / Sep 12, 2011</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-label-md text-label-md">Student ID</p>
                <p className="font-body-md text-body-md text-on-background font-medium">#883492</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-on-surface-variant font-label-md text-label-md">Primary Educator</p>
                <p className="font-body-md text-body-md text-on-background font-medium">Mr. Thompson</p>
              </div>
            </div>
          </div>
          {/* Reason for Assessment */}
          <div className="bg-surface-container-low rounded-lg p-space-md border border-outline-variant">
            <h4 className="font-title-md text-title-md text-on-background mb-space-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant">psychology</span> Referral Reason
            </h4>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Referred by primary educator due to observed decline in academic engagement, increased instances of distractibility during prolonged tasks, and mild peer withdrawal over the past six weeks.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-md text-label-md">
              <span className="material-symbols-outlined text-sm">priority_high</span> Routine Assessment
            </div>
          </div>
        </div>

        {/* Observations & Scores (Asymmetric) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Teacher Observations */}
          <div className="lg:col-span-4 space-y-space-md">
            <h4 className="font-title-lg text-title-lg text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">visibility</span> Teacher Observations
            </h4>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-space-md shadow-sm h-[calc(100%-2.5rem)]">
              <ul className="space-y-4">
                <li className="border-b border-outline-variant pb-3 last:border-0 last:pb-0">
                  <p className="font-label-md text-label-md text-primary mb-1">Academic Engagement</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">Often requires redirection during independent work. Participates well in group discussions.</p>
                </li>
                <li className="border-b border-outline-variant pb-3 last:border-0 last:pb-0">
                  <p className="font-label-md text-label-md text-primary mb-1">Social Interaction</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">Polite but reserved. Recently prefers reading alone during unstructured time rather than joining peers.</p>
                </li>
                <li className="border-b border-outline-variant pb-3 last:border-0 last:pb-0">
                  <p className="font-label-md text-label-md text-primary mb-1">Emotional Regulation</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">Generally stable, though expresses visible frustration when faced with complex multi-step math problems.</p>
                </li>
              </ul>
            </div>
          </div>
          {/* Domain Results (Glassmorphism inspired clean bars) */}
          <div className="lg:col-span-8 space-y-space-md">
            <h4 className="font-title-lg text-title-lg text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">bar_chart</span> Domain Results &amp; Standardized Scores
            </h4>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-space-md shadow-sm">
              {/* Assessment Header */}
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-outline-variant">
                <span className="font-title-md text-title-md text-on-background">BASC-3 Summary</span>
                <span className="text-on-surface-variant font-label-md text-label-md">T-Scores (Mean=50, SD=10)</span>
              </div>
              {/* Bar Charts */}
              <div className="space-y-6">
                {/* Metric 1 */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-body-md text-body-md font-medium text-on-background">Hyperactivity</span>
                    <span className="font-label-md text-label-md text-on-surface-variant">T: 62 <span className="bg-surface-variant text-on-surface px-2 py-0.5 rounded ml-2">At Risk</span></span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-tertiary h-full rounded-full" style={{ width: '62%' }}></div>
                  </div>
                </div>
                {/* Metric 2 */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-body-md text-body-md font-medium text-on-background">Attention Problems</span>
                    <span className="font-label-md text-label-md text-on-surface-variant">T: 68 <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded ml-2">Clinically Significant</span></span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-error h-full rounded-full" style={{ width: '68%' }}></div>
                  </div>
                </div>
                {/* Metric 3 */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-body-md text-body-md font-medium text-on-background">Atypicality</span>
                    <span className="font-label-md text-label-md text-on-surface-variant">T: 45 <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded ml-2">Average</span></span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                {/* Metric 4 */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-body-md text-body-md font-medium text-on-background">Withdrawal</span>
                    <span className="font-label-md text-label-md text-on-surface-variant">T: 58 <span className="bg-surface-variant text-on-surface px-2 py-0.5 rounded ml-2">At Risk</span></span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: '58%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interpretation & Recommendations */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-space-md md:p-space-lg shadow-sm">
          <h4 className="font-title-lg text-title-lg text-on-background mb-space-md border-b border-outline-variant pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">psychiatry</span> Interpretation &amp; Recommendations
          </h4>
          <div className="space-y-6">
            <div>
              <h5 className="font-title-md text-title-md text-on-background mb-2">Psychologist Interpretation</h5>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Results indicate elevated scores in Attention Problems and mild elevation in Hyperactivity and Withdrawal domains. The discrepancy between his strong cognitive abilities (WISC-V FSIQ: 115, details on file) and current classroom performance suggests executive functioning challenges rather than a lack of capability. The mild social withdrawal noted by his teacher aligns with the BASC-3 self-report, indicating he may be experiencing mild anxiety related to academic performance which he masks by disengaging.
              </p>
            </div>
            <div>
              <h5 className="font-title-md text-title-md text-on-background mb-3">Actionable Recommendations</h5>
              <ul className="space-y-3">
                <li className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                  <div>
                    <strong className="font-body-md text-body-md font-semibold text-on-background block">Environmental Modifications</strong>
                    <span className="font-body-md text-body-md text-on-surface-variant">Seat near the point of instruction; provide frequent, brief breaks during extended independent work periods.</span>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                  <div>
                    <strong className="font-body-md text-body-md font-semibold text-on-background block">Executive Functioning Support</strong>
                    <span className="font-body-md text-body-md text-on-surface-variant">Implement a visual schedule for complex tasks; require the use of an assignment planner to chunk long-term projects.</span>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                  <div>
                    <strong className="font-body-md text-body-md font-semibold text-on-background block">Social-Emotional Intervention</strong>
                    <span className="font-body-md text-body-md text-on-surface-variant">Recommend 6-week small group counseling focused on academic anxiety management and self-advocacy skills.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Sign-off */}
        <div className="pt-space-lg mt-space-lg border-t border-outline-variant flex justify-between items-end flex-wrap gap-4">
          <div>
            <div className="h-12 w-auto mb-2 relative">
                {/* Fallback image style text for signature since we don't have the exact image asset locally easily accessible as component, although I could use an img tag to the absolute URL in the prototype */}
               <img alt="Signature" className="h-12 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfyrQ28Gf8p9gj_D8X_kD5FZHEFNq0oVax1XbDmtA4onRKj1ocp6tjdFCu9VIT0YcnHVq0_0OtlGT_zQTmWJo5Ce66OdM9So1oYRFlsBK6_3RvDxZAdx3BswSBqSFj9olUetXnLddB9AfQO6YvOhvy6RIGTfo5wG9CDQcHoQHBCp9GoyWgpNM_wAoA-FSVKw0B0G_6AuMZ8dQvDmJCw6Lu1lUyIG5DgyImWX3hIS5_2x1HxvBxaibqgg"/>
            </div>
            <p className="font-title-md text-title-md text-on-background">Dr. Sarah Jenkins, Ph.D.</p>
            <p className="text-on-surface-variant font-label-md text-label-md">Licensed School Psychologist, License #SP48291</p>
          </div>
          <div className="flex gap-space-sm sm:hidden w-full justify-end mt-4">
            <Button variant="outline" className="flex-1 flex justify-center items-center gap-2">
              <span className="material-symbols-outlined text-sm">print</span> Print
            </Button>
            <Button variant="primary" className="flex-1 flex justify-center items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span> PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
