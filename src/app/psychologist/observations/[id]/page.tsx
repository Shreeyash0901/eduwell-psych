import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ObservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const recordId = id ? id.replace(/^obs-/i, '') : '101'
  return (
    <div className="p-margin-mobile md:p-gutter max-w-container-max mx-auto w-full flex-1">
      {/* Header & Breadcrumbs */}
      <div className="mb-space-lg flex flex-col gap-space-sm">
        <div className="flex items-center text-label-md font-label-md text-on-surface-variant gap-2">
          <Link href="/psychologist/observations" className="hover:text-primary flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Observations
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface">Detail View</span>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background">Observation Record #{recordId}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Submitted on Oct 24, 2023</p>
          </div>
          
          <div className="flex items-center gap-space-sm w-full sm:w-auto">
            <Link href="/psychologist/observations" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2 shadow-sm">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to List
              </Button>
            </Link>
            <Link href={`/psychologist/assessments/new?student=lm`} className="flex-1 sm:flex-none">
              <Button variant="primary" className="w-full flex items-center justify-center gap-2 shadow-sm">
                <span className="material-symbols-outlined text-[18px]">assignment_add</span>
                Start Assessment
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        
        {/* Left Column (Meta Data) */}
        <div className="flex flex-col gap-gutter lg:col-span-1">
          
          {/* Status Card */}
          <div className="bg-surface rounded-xl p-space-md border border-outline-variant shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant">
              <h3 className="font-title-md text-title-md text-on-surface">Status</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Pending Review
              </span>
            </div>
            <button className="w-full px-4 py-2 border border-primary text-primary rounded-lg font-label-md text-label-md hover:bg-primary-container hover:text-on-primary transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Mark as Reviewed
            </button>
          </div>
          
          {/* Student Info Card */}
          <div className="bg-surface rounded-xl p-space-md border border-outline-variant shadow-sm">
            <h3 className="font-title-md text-title-md text-on-surface mb-4 pb-3 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person</span>
              Student Context
            </h3>
            
            <div className="flex items-center gap-space-md mb-4">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-title-lg text-title-lg">
                LM
              </div>
              <div>
                <div className="font-title-md text-title-md text-on-surface">Liam Miller</div>
                <div className="font-body-md text-body-md text-on-surface-variant">Grade 8 &bull; Homeroom 8B</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                <span className="font-label-md text-label-md text-on-surface-variant">Age</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">13</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                <span className="font-label-md text-label-md text-on-surface-variant">IEP Status</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">None Active</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-label-md text-label-md text-on-surface-variant">Prior Obs. (Term)</span>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md">2</span>
              </div>
            </div>
          </div>
          
          {/* Submission Details Card */}
          <div className="bg-surface rounded-xl p-space-md border border-outline-variant shadow-sm">
            <h3 className="font-title-md text-title-md text-on-surface mb-4 pb-3 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              Submission Info
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-1">Submitter</label>
                <div className="font-body-md text-body-md text-on-surface font-medium">Sarah Jenkins (Science Teacher)</div>
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-1">Date &amp; Time of Incident</label>
                <div className="font-body-md text-body-md text-on-surface font-medium">Oct 23, 2023 - 11:15 AM</div>
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-1">Setting / Class</label>
                <div className="font-body-md text-body-md text-on-surface font-medium">Science Lab</div>
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-1">Primary Category</label>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-tertiary-container/10 text-tertiary font-label-md text-label-md border border-tertiary/20">
                  <span className="material-symbols-outlined text-[14px]">mood_bad</span>
                  Emotional Regulation
                </span>
              </div>
            </div>
          </div>
          
        </div>
        
        {/* Right Column (Main Content Area) */}
        <div className="flex flex-col gap-gutter lg:col-span-2">
          
          {/* Main Description Card */}
          <div className="bg-surface rounded-xl p-space-lg border border-outline-variant shadow-sm flex-1">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant">
              <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-3xl">description</span>
                Observation Narrative
              </h2>
            </div>
            
            <div className="space-y-6">
              
              {/* Description Box */}
              <div>
                <h4 className="font-title-md text-title-md text-on-surface mb-2">Description of Concern</h4>
                <div className="bg-surface-container-low p-space-md rounded-lg border border-surface-container-high font-body-lg text-body-lg text-on-surface leading-relaxed whitespace-pre-line">
                  {`During the group lab experiment, Liam became highly frustrated when his group's apparatus fell apart. Instead of asking for help, he pushed the materials off the desk and put his head down, refusing to speak for the remainder of the 45-minute period. 
                  
When approached, he covered his ears. This is the third similar incident this month during collaborative work tasks, indicating a potential struggle with social problem-solving or frustration tolerance in group settings.`}
                </div>
              </div>
              
              {/* Triggers Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface rounded-lg p-space-md border border-outline-variant">
                  <h4 className="font-title-md text-title-md text-on-surface mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">bolt</span>
                    Antecedent / Triggers
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Group work involving fine motor skills and shared materials; failure of an immediate task.
                  </p>
                </div>
                
                <div className="bg-surface rounded-lg p-space-md border border-outline-variant">
                  <h4 className="font-title-md text-title-md text-on-surface mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">front_hand</span>
                    Intervention Attempted
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Offered alternative independent task (refused); verbal reassurance (ignored); given space.
                  </p>
                </div>
              </div>
              
              {/* Additional Comments Area */}
              <div className="pt-4 border-t border-outline-variant">
                <h4 className="font-title-md text-title-md text-on-surface mb-2">Psychologist Notes (Internal)</h4>
                <textarea 
                  className="w-full h-32 p-space-md bg-surface border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none placeholder:text-on-surface-variant/50" 
                  placeholder="Add preliminary notes or analysis here before starting formal assessment..."
                ></textarea>
                <div className="flex justify-end mt-3">
                  <button className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors shadow-sm">
                    Save Notes
                  </button>
                </div>
              </div>
              
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  )
}
