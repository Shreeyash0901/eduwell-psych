import { api } from "@/lib/mock-api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Hardcoding the library items from the prototype to match the UI perfectly
const libraryItems = [
  {
    id: "SDQ",
    title: "Emotional Wellbeing Inventory",
    icon: "mood",
    description: "Comprehensive evaluation of current emotional states, anxiety indicators, and general mood resilience in the academic context.",
    domains: "Anxiety, Mood, Stress",
    questions: "25 Items",
    estTime: "15-20 mins"
  },
  {
    id: "BASC-3",
    title: "Behavioral Observation Scale",
    icon: "psychology",
    description: "Structured framework for documenting classroom behaviors, identifying triggers, and tracking intervention responses over time.",
    domains: "Conduct, Regulation",
    questions: "30 Items",
    estTime: "25 mins"
  },
  {
    id: "APA",
    title: "Attention Profile Assessor",
    icon: "center_focus_strong",
    description: "Targeted screening for executive functioning challenges, working memory deficits, and sustained attention difficulties during tasks.",
    domains: "Focus, Exec. Function",
    questions: "45 Items",
    estTime: "30-40 mins"
  }
]

export default async function AssessmentLibraryPage() {
  return (
    <div className="flex-1 p-space-lg max-w-[1280px] mx-auto w-full">
      {/* Page Header */}
      <div className="mb-space-lg">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-space-xs">Assessment Library</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Conduct structured student assessments and review results. Select an assessment protocol below to begin a new session.
        </p>
      </div>

      {/* Bento Grid of Assessments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {libraryItems.map((item) => (
          <Card key={item.id} className="p-space-md flex flex-col hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="flex items-start justify-between mb-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined icon-fill-1">{item.icon}</span>
                </div>
                <h2 className="font-title-md text-title-md text-on-surface">{item.title}</h2>
              </div>
            </div>
            
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-md line-clamp-2 flex-1">
              {item.description}
            </p>
            
            <div className="bg-surface-container-low rounded-lg p-space-sm mb-space-md">
              <div className="flex justify-between items-center mb-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant">Domains</span>
                <span className="font-label-md text-label-md text-on-surface">{item.domains}</span>
              </div>
              <div className="flex justify-between items-center mb-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant">Questions</span>
                <span className="font-label-md text-label-md text-on-surface">{item.questions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-label-md text-label-md text-on-surface-variant">Est. Time</span>
                <span className="font-label-md text-label-md text-on-surface">{item.estTime}</span>
              </div>
            </div>
            
            <Button variant="primary" className="w-full gap-space-xs">
              <span className="material-symbols-outlined text-sm">play_arrow</span>
              Start Assessment
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
