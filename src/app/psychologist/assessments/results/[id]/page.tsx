import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AssessmentResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="flex-1 p-space-lg max-w-container-max mx-auto w-full">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-space-lg gap-space-md border-b border-outline-variant pb-space-sm">
        <div>
          <div className="flex items-center gap-space-sm mb-space-xs">
            <Link href="/psychologist/assessments" className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1 rounded-full hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </Link>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">Assessment Result</h2>
          </div>
          <div className="flex items-center gap-space-md text-on-surface-variant">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-sm">person</span>
              <span className="font-body-md text-body-md font-medium text-on-surface">Alex Santos</span>
            </div>
            <span className="w-1 h-1 bg-outline rounded-full"></span>
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              <span className="font-body-md text-body-md">Oct 25, 2023</span>
            </div>
            <span className="w-1 h-1 bg-outline rounded-full"></span>
            <span className="font-label-md text-label-md bg-surface-container-highest px-2 py-1 rounded-full text-on-surface">Screening Result</span>
          </div>
        </div>
        
        <div className="flex gap-space-sm w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none flex items-center justify-center gap-space-xs shadow-none">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Report
          </Button>
          <Link href={`/psychologist/assessments/results/${id}/interpretation`} className="flex-1 md:flex-none">
            <Button variant="primary" className="w-full flex items-center justify-center gap-space-xs shadow-none">
              <span className="material-symbols-outlined text-sm">edit</span>
              Add Notes
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        
        {/* Summary Card (Left Col on Desktop) */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          <div className="bg-surface rounded-xl border border-outline-variant p-space-lg shadow-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="font-title-lg text-title-lg text-on-surface absolute top-space-lg left-space-lg">Overall Score</h3>
            
            <div className="relative w-40 h-40 flex items-center justify-center mt-space-lg">
              {/* Decorative SVG Ring */}
              <svg className="w-full h-full transform -rotate-90 absolute inset-0" viewBox="0 0 100 100">
                <circle className="text-surface-container-highest" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="8"></circle>
                <circle className="text-primary" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeDasharray="282.7" strokeDashoffset="79.1" strokeWidth="8"></circle>
              </svg>
              <div className="text-center z-10 flex flex-col items-center">
                <span className="font-display text-display text-primary">72</span>
                <span className="font-label-md text-label-md text-on-surface-variant">/ 100</span>
              </div>
            </div>
            
            <div className="mt-space-lg w-full">
              <div className="flex items-center gap-space-sm p-space-sm bg-tertiary-container/10 rounded-lg border border-tertiary-container/20">
                <span className="material-symbols-outlined text-tertiary-container">warning</span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-bold text-tertiary-container">Attention Required</span>
                  <span className="font-body-md text-[12px] text-tertiary-container/80 leading-tight">Review recommended for specific domains.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Domain Breakdown (Right Col on Desktop) */}
        <div className="lg:col-span-8 flex flex-col gap-space-md">
          <h3 className="font-title-lg text-title-lg text-on-surface mb-space-xs">Domain Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            
            {/* Emotional Regulation */}
            <div className="bg-surface rounded-xl border border-outline-variant p-space-md shadow-sm hover:border-primary transition-colors">
              <div className="flex justify-between items-center mb-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">mood_bad</span>
                  </div>
                  <h4 className="font-title-md text-title-md text-on-surface">Emotional Regulation</h4>
                </div>
                <span className="font-headline-md text-headline-md text-error">45</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-2 mb-1">
                <div className="bg-error h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <div className="flex justify-between font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider mt-space-xs">
                <span>Concern</span>
                <span>Optimal</span>
              </div>
            </div>
            
            {/* Social Interaction */}
            <div className="bg-surface rounded-xl border border-outline-variant p-space-md shadow-sm hover:border-primary transition-colors">
              <div className="flex justify-between items-center mb-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">diversity_3</span>
                  </div>
                  <h4 className="font-title-md text-title-md text-on-surface">Social Interaction</h4>
                </div>
                <span className="font-headline-md text-headline-md text-primary">82</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-2 mb-1">
                <div className="bg-primary h-2 rounded-full" style={{ width: '82%' }}></div>
              </div>
              <div className="flex justify-between font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider mt-space-xs">
                <span>Concern</span>
                <span>Optimal</span>
              </div>
            </div>
            
            {/* Self Confidence */}
            <div className="bg-surface rounded-xl border border-outline-variant p-space-md shadow-sm hover:border-primary transition-colors">
              <div className="flex justify-between items-center mb-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">psychology</span>
                  </div>
                  <h4 className="font-title-md text-title-md text-on-surface">Self Confidence</h4>
                </div>
                <span className="font-headline-md text-headline-md text-tertiary">68</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-2 mb-1">
                <div className="bg-tertiary h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
              <div className="flex justify-between font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider mt-space-xs">
                <span>Concern</span>
                <span>Optimal</span>
              </div>
            </div>
            
            {/* School Adjustment */}
            <div className="bg-surface rounded-xl border border-outline-variant p-space-md shadow-sm hover:border-primary transition-colors">
              <div className="flex justify-between items-center mb-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">school</span>
                  </div>
                  <h4 className="font-title-md text-title-md text-on-surface">School Adjustment</h4>
                </div>
                <span className="font-headline-md text-headline-md text-primary">90</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-2 mb-1">
                <div className="bg-primary h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
              <div className="flex justify-between font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider mt-space-xs">
                <span>Concern</span>
                <span>Optimal</span>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Footer Note */}
        <div className="lg:col-span-12 mt-space-xl">
          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-space-md flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-on-surface-variant text-sm mt-0.5">info</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Assessment results are screening indicators and should be reviewed by an authorized school psychologist.
            </p>
          </div>
        </div>
        
      </div>
    </div>
  )
}
