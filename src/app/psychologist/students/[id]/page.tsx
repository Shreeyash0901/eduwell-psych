import { api } from "@/lib/mock-api"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function StudentOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const student = (await api.getStudent(id)) || (await api.getStudent("STU-8821"))
  const observations = await api.getObservations(student ? student.id : id)
  const results = await api.getAssessmentResults(student ? student.id : id)

  if (!student) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-space-lg pb-space-lg">
      {/* Left Column: Basic Info & Contacts */}
      <div className="md:col-span-4 flex flex-col gap-space-lg">
        <Card className="p-space-md shadow-resting">
          <h3 className="font-title-md text-title-md text-on-surface mb-space-md flex items-center gap-space-xs border-b border-outline-variant pb-space-xs">
            <span className="material-symbols-outlined text-secondary text-[20px]">badge</span>
            Basic Information
          </h3>
          <div className="flex flex-col gap-space-md">
            <div className="flex justify-between items-center">
              <span className="font-label-md text-label-md text-on-surface-variant">Age</span>
              <span className="font-body-md text-body-md text-on-surface font-medium">{student.age}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-label-md text-label-md text-on-surface-variant">Gender</span>
              <span className="font-body-md text-body-md text-on-surface font-medium">{student.gender}</span>
            </div>
            
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-md text-label-md text-on-surface-variant">Homeroom Teacher</span>
              <div className="flex items-center gap-space-sm bg-surface-container-low p-2 rounded-lg border border-outline-variant border-opacity-50">
                <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-md text-label-md">
                  {student.homeroomTeacher.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="font-body-md text-body-md text-on-surface">{student.homeroomTeacher}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-md text-label-md text-on-surface-variant">Primary Contact</span>
              <div className="flex justify-between items-center bg-surface-container-low p-2 rounded-lg border border-outline-variant border-opacity-50">
                <div className="flex flex-col">
                  <span className="font-body-md text-body-md text-on-surface">{student.parentName}</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">{student.parentRelation}</span>
                </div>
                <button className="text-primary hover:bg-surface-container-highest p-1 rounded transition-colors">
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Column: Current Overview & Trends */}
      <div className="md:col-span-8 flex flex-col gap-space-lg">
        {/* Current Status Summary */}
        <Card className="p-space-lg shadow-resting relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-5 rounded-bl-[100px] pointer-events-none"></div>
          
          <div className="flex justify-between items-start mb-space-md relative z-10">
            <div>
              <h3 className="font-title-lg text-title-lg text-on-surface flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-tertiary-container">info</span>
                Current Overview
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Last updated: Today</p>
            </div>
            <Badge variant={student.attentionLevel === 'High Priority' ? 'urgent' : student.attentionLevel === 'Attention Required' ? 'monitoring' : 'normal'}>
              {student.attentionLevel}
            </Badge>
          </div>
          
          <div className="bg-surface-container-low p-space-md rounded-lg border border-outline-variant border-opacity-50 relative z-10">
            <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
              {observations.length > 0 
                ? `${student.name} was observed by ${observations[0].observerName} on ${observations[0].date}: "${observations[0].details}"` 
                : `${student.name} is currently registered under ${student.grade} ${student.section} with no recent critical concerns reported.`}
            </p>
          </div>

          {/* Quick Metric Chips */}
          <div className="flex flex-wrap gap-space-sm mt-space-md relative z-10">
            <div className="flex items-center gap-2 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant border-opacity-50">
              <span className="material-symbols-outlined text-secondary text-[18px]">trending_down</span>
              <span className="font-label-md text-label-md text-on-surface">Focus Level</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant border-opacity-50">
              <span className="material-symbols-outlined text-primary text-[18px]">group</span>
              <span className="font-label-md text-label-md text-on-surface">Social Integration: Stable</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant border-opacity-50">
              <span className="material-symbols-outlined text-tertiary-container text-[18px]">bedtime</span>
              <span className="font-label-md text-label-md text-on-surface">Sleep Quality Flag</span>
            </div>
          </div>
        </Card>

        {/* Mini Assessment Trend */}
        <Card className="p-space-md shadow-resting">
          <div className="flex justify-between items-center mb-space-md border-b border-outline-variant pb-space-xs">
            <h3 className="font-title-md text-title-md text-on-surface flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[20px]">bar_chart</span>
              Recent Assessment Scores
            </h3>
            <button className="text-primary font-label-md text-label-md hover:underline flex items-center">
              View Full History <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
            </button>
          </div>

          <div className="flex flex-col">
            {results.length > 0 ? (
              results.map(res => (
                res.domainScores.map(ds => (
                  <div key={`${res.id}-${ds.domain}`} className="flex items-center justify-between py-space-sm border-b border-outline-variant hover:bg-surface-container-low transition-colors px-space-xs rounded">
                    <div className="flex items-center gap-space-md">
                      <div className="w-10 h-10 rounded bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                        <span className="material-symbols-outlined">menu_book</span>
                      </div>
                      <div>
                        <p className="font-title-md text-title-md text-on-surface">{ds.domain}</p>
                        <p className="font-label-md text-label-md text-on-surface-variant">{res.completedBy} - {new Date(res.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-md">
                      <Badge variant={ds.level === 'Attention Required' || ds.level === 'Monitor' ? 'monitoring' : 'normal'}>
                        {ds.level} ({ds.score}%)
                      </Badge>
                    </div>
                  </div>
                ))
              ))
            ) : (
              <p className="text-on-surface-variant p-4">No recent assessment scores.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
