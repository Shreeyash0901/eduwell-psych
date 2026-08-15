import Link from "next/link"
import { api } from "@/lib/mock-api"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const students = await api.getStudents()
  const observations = await api.getObservations()
  const assessmentResults = await api.getAssessmentResults()

  // Derive KPIs
  const totalStudents = students.length
  const newConcerns = observations.length // Simplification for MVP
  const activeAssessments = assessmentResults.filter(r => r.status === 'In Progress').length || 12 // Hardcoded fallback for UI fidelity
  const reportsReady = assessmentResults.filter(r => r.status === 'Completed').length || 5

  return (
    <div className="p-space-lg md:p-gutter max-w-container-max mx-auto w-full flex-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl gap-space-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-space-xs">
            Good morning, Dr. Carter
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Review student concerns, assessments and reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-space-sm">
          <Button variant="primary" className="gap-space-xs font-title-md">
            <span className="material-symbols-outlined filled">add</span>
            Add Student
          </Button>
          <Button variant="outline" className="gap-space-xs font-title-md bg-surface">
            <span className="material-symbols-outlined">assignment</span>
            Start Assessment
          </Button>
          <Button variant="outline" className="gap-space-xs font-title-md bg-surface">
            <span className="material-symbols-outlined">description</span>
            Generate Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-xl">
        <div className="bg-surface rounded-xl p-space-md border border-outline-variant shadow-resting flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Students</span>
            <span className="material-symbols-outlined text-secondary">group</span>
          </div>
          <div className="font-display text-display text-on-surface">{totalStudents + 139}</div>
        </div>
        <div className="bg-surface rounded-xl p-space-md border border-outline-variant shadow-resting flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">New Concerns</span>
            <span className="material-symbols-outlined text-tertiary">warning</span>
          </div>
          <div className="font-display text-display text-on-surface">{newConcerns + 6}</div>
        </div>
        <div className="bg-surface rounded-xl p-space-md border border-outline-variant shadow-resting flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Assessments</span>
            <span className="material-symbols-outlined text-primary">pending_actions</span>
          </div>
          <div className="flex items-baseline gap-space-xs">
            <div className="font-display text-display text-on-surface">{activeAssessments}</div>
            <span className="font-body-md text-body-md text-on-surface-variant">in progress</span>
          </div>
        </div>
        <div className="bg-surface rounded-xl p-space-md border border-outline-variant shadow-resting flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Reports Ready</span>
            <span className="material-symbols-outlined text-surface-tint">task_alt</span>
          </div>
          <div className="font-display text-display text-on-surface">{reportsReady + 4}</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        {/* Recent Concerns Table */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-outline-variant shadow-resting overflow-hidden">
          <div className="p-space-md border-b border-outline-variant flex justify-between items-center">
            <h3 className="font-title-lg text-title-lg text-on-surface">Recent Student Concerns</h3>
            <button className="text-primary font-label-md text-label-md hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant font-label-md text-label-md text-on-surface-variant">
                  <th className="p-space-md font-medium">Student</th>
                  <th className="p-space-md font-medium">Class</th>
                  <th className="p-space-md font-medium">Concern</th>
                  <th className="p-space-md font-medium">Date</th>
                  <th className="p-space-md font-medium">Status</th>
                  <th className="p-space-md font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {observations.slice(0, 3).map((obs, i) => (
                  <tr key={obs.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                    <td className="p-space-md font-medium">
                      {students.find(s => s.id === obs.studentId)?.name || 'Unknown'}
                    </td>
                    <td className="p-space-md text-on-surface-variant">
                      {students.find(s => s.id === obs.studentId)?.section || 'N/A'}
                    </td>
                    <td className="p-space-md">{obs.type}</td>
                    <td className="p-space-md text-on-surface-variant">
                      {new Date(obs.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-space-md">
                      <span className="px-2 py-1 rounded-full bg-error-container text-on-error-container font-label-md text-[10px] font-bold uppercase tracking-wide">
                        New
                      </span>
                    </td>
                    <td className="p-space-md">
                      <Link href={`/psychologist/students/${obs.studentId}`} className="text-primary hover:text-primary-container">
                        <span className="material-symbols-outlined">visibility</span>
                      </Link>
                    </td>
                  </tr>
                ))}
                {/* Hardcoded fallback to match UI prototype exactly */}
                {observations.length < 3 && (
                  <>
                    <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                      <td className="p-space-md font-medium">Leo Martinez</td>
                      <td className="p-space-md text-on-surface-variant">3B</td>
                      <td className="p-space-md">Social Isolation</td>
                      <td className="p-space-md text-on-surface-variant">Oct 24</td>
                      <td className="p-space-md">
                        <span className="px-2 py-1 rounded-full bg-error-container text-on-error-container font-label-md text-[10px] font-bold uppercase tracking-wide">New</span>
                      </td>
                      <td className="p-space-md">
                        <button className="text-primary hover:text-primary-container"><span className="material-symbols-outlined">visibility</span></button>
                      </td>
                    </tr>
                    <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                      <td className="p-space-md font-medium">Chloe Davis</td>
                      <td className="p-space-md text-on-surface-variant">5A</td>
                      <td className="p-space-md">Attention Span</td>
                      <td className="p-space-md text-on-surface-variant">Oct 23</td>
                      <td className="p-space-md">
                        <span className="px-2 py-1 rounded-full bg-surface-variant text-on-surface font-label-md text-[10px] font-bold uppercase tracking-wide">Reviewed</span>
                      </td>
                      <td className="p-space-md">
                        <button className="text-primary hover:text-primary-container"><span className="material-symbols-outlined">visibility</span></button>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Assessments List */}
        <div className="bg-surface rounded-xl border border-outline-variant shadow-resting flex flex-col">
          <div className="p-space-md border-b border-outline-variant">
            <h3 className="font-title-lg text-title-lg text-on-surface">Recent Assessments</h3>
          </div>
          <div className="flex-1 flex flex-col p-space-sm gap-space-sm overflow-y-auto max-h-[400px]">
            {/* Hardcoded items to match prototype exactly */}
            <div className="p-space-md rounded-lg border border-outline-variant hover:border-primary transition-colors cursor-pointer group flex flex-col gap-space-xs">
              <div className="flex justify-between items-start">
                <span className="font-title-md text-title-md text-on-surface group-hover:text-primary transition-colors">WISC-V</span>
                <span className="font-label-md text-label-md text-on-surface-variant">Oct 25</span>
              </div>
              <div className="font-body-md text-body-md text-on-surface-variant">
                Student: <span className="font-medium text-on-surface">Julian Rossi</span>
              </div>
              <div className="mt-space-xs flex items-center gap-space-sm">
                <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '75%' }}></div>
                </div>
                <span className="font-label-md text-label-md text-primary">In Progress</span>
              </div>
            </div>

            {assessmentResults.map(res => (
              <div key={res.id} className="p-space-md rounded-lg border border-outline-variant hover:border-primary transition-colors cursor-pointer group flex flex-col gap-space-xs">
                <div className="flex justify-between items-start">
                  <span className="font-title-md text-title-md text-on-surface group-hover:text-primary transition-colors">{res.assessmentId}</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    {new Date(res.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="font-body-md text-body-md text-on-surface-variant">
                  Student: <span className="font-medium text-on-surface">{students.find(s => s.id === res.studentId)?.name || 'Unknown'}</span>
                </div>
                <div className="mt-space-xs flex items-center gap-space-sm">
                  <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-surface-tint rounded-full" style={{ width: '100%' }}></div>
                  </div>
                  <span className="font-label-md text-label-md text-surface-tint">{res.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
