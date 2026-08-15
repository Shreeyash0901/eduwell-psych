import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ReportsDashboardPage() {
  return (
    <div className="p-margin-mobile md:p-gutter max-w-container-max mx-auto w-full flex-1">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-space-xl gap-4">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-1">Reports Dashboard</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Generate and view analytical reports for academic wellness.</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2 shadow-sm group">
          <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
          Generate New Report
        </Button>
      </div>

      {/* Bento Grid Layout for Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg mb-space-xl">
        
        {/* Student Reports Card */}
        <div className="bg-surface rounded-xl border border-outline-variant p-space-lg flex flex-col hover:shadow-md transition-shadow group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors"></div>
          <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-primary mb-4 border border-outline-variant">
            <span className="material-symbols-outlined">person_search</span>
          </div>
          <h3 className="font-title-lg text-title-lg text-on-surface mb-2">Student Reports</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">Detailed individual wellness and academic assessment profiles for specific students.</p>
          <Link href="#" className="font-title-md text-title-md text-primary flex items-center gap-1 group-hover:gap-2 transition-all w-fit">
            View Templates <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
        
        {/* Class Reports Card */}
        <div className="bg-surface rounded-xl border border-outline-variant p-space-lg flex flex-col hover:shadow-md transition-shadow group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-xl group-hover:bg-tertiary/10 transition-colors"></div>
          <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary mb-4 border border-outline-variant">
            <span className="material-symbols-outlined">groups</span>
          </div>
          <h3 className="font-title-lg text-title-lg text-on-surface mb-2">Class Reports</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">Aggregated data visualizing classroom dynamics, overall wellness trends, and collective performance.</p>
          <Link href="#" className="font-title-md text-title-md text-tertiary flex items-center gap-1 group-hover:gap-2 transition-all w-fit">
            View Templates <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
        
        {/* Grade Reports Card */}
        <div className="bg-surface rounded-xl border border-outline-variant p-space-lg flex flex-col hover:shadow-md transition-shadow group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full blur-xl group-hover:bg-secondary/10 transition-colors"></div>
          <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary mb-4 border border-outline-variant">
            <span className="material-symbols-outlined">domain</span>
          </div>
          <h3 className="font-title-lg text-title-lg text-on-surface mb-2">Grade Reports</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">Broad demographic analysis comparing academic wellness across entire grade levels or cohorts.</p>
          <Link href="#" className="font-title-md text-title-md text-secondary flex items-center gap-1 group-hover:gap-2 transition-all w-fit">
            View Templates <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
        
      </div>
    </div>
  )
}
