import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function StartAssessmentPage() {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-space-lg p-space-lg md:p-space-xl">
      {/* Header Section */}
      <header className="flex flex-col gap-space-sm mb-space-md">
        <Link 
          href="/psychologist/assessments"
          className="self-start text-primary hover:text-on-primary-fixed-variant transition-colors flex items-center gap-space-xs font-label-md text-label-md mb-space-sm"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Cancel Setup
        </Link>
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-primary text-3xl icon-fill-1">assignment</span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">General Wellness Screener</h1>
        </div>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          This assessment evaluates a student's baseline emotional well-being, stress levels, and overall academic engagement. Results will be stored securely in the student's clinical file.
        </p>
      </header>
      
      {/* Main Configuration Card (Bento-style layout) */}
      <section className="bg-surface border border-outline-variant rounded-xl shadow-sm p-space-lg md:p-space-xl flex flex-col gap-space-lg relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full pointer-events-none -z-0"></div>
        
        <div className="relative z-10 flex flex-col gap-space-lg w-full">
          {/* Step Indicator */}
          <div className="flex items-center gap-space-sm pb-space-sm border-b border-outline-variant">
            <span className="bg-primary text-on-primary font-title-md text-title-md w-8 h-8 rounded-full flex items-center justify-center shadow-sm">1</span>
            <h2 className="font-title-lg text-title-lg text-on-surface">Select Student</h2>
          </div>
          
          {/* Search & Select */}
          <div className="flex flex-col gap-space-sm">
            <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="student-search">Search by Name or ID</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-outline">search</span>
              <input 
                className="w-full h-10 pl-10 pr-space-md bg-surface border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" 
                id="student-search" 
                placeholder="e.g., Jane Doe, 94821" 
                type="text"
                defaultValue="Alex Santos"
              />
            </div>
          </div>
          
          {/* Selected Student Display (Placeholder State) */}
          <div className="border border-outline-variant rounded-lg p-space-md bg-surface-container-low flex items-center justify-between mt-space-sm">
            <div className="flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-title-lg text-title-lg">
                AS
              </div>
              <div className="flex flex-col">
                <span className="font-title-md text-title-md text-on-surface">Alex Santos</span>
                <span className="font-label-md text-label-md text-on-surface-variant">Grade 10 • ID: 10482</span>
              </div>
            </div>
            <button className="text-error hover:text-on-error-container p-2 rounded-full hover:bg-error-container/20 transition-colors" title="Remove Student">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        
        <div className="relative z-10 mt-space-lg flex justify-end pt-space-lg border-t border-outline-variant">
          <Link href="/psychologist/assessments/SDQ/take">
            <Button variant="primary" className="px-space-lg h-12 shadow-sm flex items-center gap-space-sm">
              Begin Assessment
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
