import { api } from "@/lib/mock-api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function StudentAssessmentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const results = await api.getAssessmentResults(id)
  
  // We fetch assessments to get the titles, but here we can just show the results we have.
  // The API mock has results with assessmentId like 'BASC-3'.
  
  return (
    <Card className="p-space-md md:p-space-lg flex flex-col gap-space-md shadow-sm">
      <div className="flex justify-between items-center mb-space-sm">
        <h3 className="font-title-lg text-title-lg text-on-surface">Conducted Assessments</h3>
        <Button variant="primary" className="gap-space-xs rounded-lg">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Assessment
        </Button>
      </div>

      {/* Bento-style Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-md">
        <div className="bg-surface-container-low rounded-lg p-space-md border border-outline-variant flex flex-col justify-center">
          <span className="font-label-md text-label-md text-on-surface-variant mb-1">Total Assessments</span>
          <span className="font-headline-lg text-headline-lg text-primary">{results.length > 0 ? results.length : 12}</span>
        </div>
        <div className="bg-surface-container-low rounded-lg p-space-md border border-outline-variant flex flex-col justify-center">
          <span className="font-label-md text-label-md text-on-surface-variant mb-1">Last Assessment</span>
          <span className="font-title-md text-title-md text-on-surface">
            {results.length > 0 ? new Date(results[0].date).toLocaleDateString() : "Oct 12, 2023"}
          </span>
        </div>
        <div className="bg-surface-container-low rounded-lg p-space-md border border-outline-variant flex flex-col justify-center">
          <span className="font-label-md text-label-md text-on-surface-variant mb-1">Avg Score Trend</span>
          <div className="flex items-center gap-1 text-primary">
            <span className="material-symbols-outlined text-[20px]">trending_up</span>
            <span className="font-title-md text-title-md">Improving</span>
          </div>
        </div>
      </div>

      {/* Assessments Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant">
              <th className="font-label-md text-label-md text-on-surface-variant py-space-sm px-space-xs font-semibold">Assessment Name</th>
              <th className="font-label-md text-label-md text-on-surface-variant py-space-sm px-space-xs font-semibold">Date</th>
              <th className="font-label-md text-label-md text-on-surface-variant py-space-sm px-space-xs font-semibold">Score</th>
              <th className="font-label-md text-label-md text-on-surface-variant py-space-sm px-space-xs font-semibold">Indicator</th>
              <th className="font-label-md text-label-md text-on-surface-variant py-space-sm px-space-xs font-semibold">Status</th>
              <th className="font-label-md text-label-md text-on-surface-variant py-space-sm px-space-xs font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md text-on-surface">
            {results.length > 0 ? (
              results.map((res) => {
                const avgScore = Math.round(res.domainScores.reduce((acc, curr) => acc + curr.score, 0) / res.domainScores.length)
                const hasAttention = res.domainScores.some(ds => ds.level === 'Attention Required' || ds.level === 'High Priority')
                
                return (
                  <tr key={res.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group">
                    <td className="py-3 px-space-xs font-medium">{res.assessmentId}</td>
                    <td className="py-3 px-space-xs text-on-surface-variant">{new Date(res.date).toLocaleDateString()}</td>
                    <td className="py-3 px-space-xs">{avgScore}/100</td>
                    <td className="py-3 px-space-xs">
                      <Badge variant={hasAttention ? 'monitoring' : 'normal'}>
                        {hasAttention ? 'Monitor' : 'Normal'}
                      </Badge>
                    </td>
                    <td className="py-3 px-space-xs">{res.status}</td>
                    <td className="py-3 px-space-xs text-right">
                      <button className="text-primary hover:text-primary-container font-label-md text-label-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1 w-full">
                        View Results <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              // Mock data if no results for demo
              <>
                <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group">
                  <td className="py-3 px-space-xs font-medium">Emotional Wellbeing Scale</td>
                  <td className="py-3 px-space-xs text-on-surface-variant">Oct 12, 2023</td>
                  <td className="py-3 px-space-xs">78/100</td>
                  <td className="py-3 px-space-xs">
                    <Badge variant="monitoring">Monitor</Badge>
                  </td>
                  <td className="py-3 px-space-xs">Completed</td>
                  <td className="py-3 px-space-xs text-right">
                    <button className="text-primary hover:text-primary-container font-label-md text-label-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1 w-full">
                      View Results <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
