import Link from "next/link"
import { Button } from "@/components/ui/button"

export function generateStaticParams() {
  return [
    { id: "SDQ" },
    { id: "BASC-3" },
    { id: "res-01" },
    { id: "8472" },
    { id: "1" }
  ];
}

export default async function PsychologistInterpretationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="flex-1 p-space-lg max-w-container-max mx-auto w-full">
      {/* Header Section */}
      <div className="mb-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md border-b border-outline-variant pb-space-sm">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant mb-1">
            <Link href="/psychologist/assessments" className="font-label-md text-label-md hover:text-primary transition-colors">Assessments</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link href={`/psychologist/assessments/results/${id}`} className="font-label-md text-label-md hover:text-primary transition-colors">Student Record #8472</Link>
          </div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Psychologist Interpretation</h2>
        </div>
        <div className="flex gap-space-sm">
          <Button variant="outline" className="flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">save</span> Save Draft
          </Button>
          <Button variant="primary" className="flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">description</span> Generate Report
          </Button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        
        {/* Left Column: Rich Text Areas (Takes up more space) */}
        <div className="lg:col-span-8 flex flex-col gap-gutter">
          
          {/* Interpretation Section */}
          <div className="bg-surface rounded-xl border border-outline-variant p-space-lg shadow-sm flex flex-col h-full min-h-[350px]">
            <div className="flex items-center justify-between mb-space-md border-b border-outline-variant pb-space-sm">
              <h3 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">psychology</span>
                Clinical Interpretation
              </h3>
              <span className="px-2 py-1 bg-surface-container text-on-surface-variant rounded text-[10px] font-semibold uppercase tracking-wider">Required</span>
            </div>
            <div className="flex-1 flex flex-col">
              {/* Formatting Toolbar (Mock) */}
              <div className="flex gap-2 mb-2 p-2 bg-surface-container-low rounded border border-outline-variant text-on-surface-variant">
                <button className="hover:bg-surface-container p-1 rounded"><span className="material-symbols-outlined text-[18px]">format_bold</span></button>
                <button className="hover:bg-surface-container p-1 rounded"><span className="material-symbols-outlined text-[18px]">format_italic</span></button>
                <button className="hover:bg-surface-container p-1 rounded"><span className="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
                <div className="w-px bg-outline-variant mx-1"></div>
                <button className="hover:bg-surface-container p-1 rounded"><span className="material-symbols-outlined text-[18px]">spellcheck</span></button>
              </div>
              <textarea 
                className="flex-1 w-full min-h-[250px] p-space-md bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md text-on-surface resize-y" 
                placeholder="Enter clinical interpretation based on assessment results..."
              ></textarea>
            </div>
          </div>
          
          {/* Recommendations Section */}
          <div className="bg-surface rounded-xl border border-outline-variant p-space-lg shadow-sm flex flex-col h-full min-h-[300px]">
            <div className="flex items-center justify-between mb-space-md border-b border-outline-variant pb-space-sm">
              <h3 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">lightbulb</span>
                Recommendations &amp; Interventions
              </h3>
            </div>
            <div className="flex-1 flex flex-col">
              {/* Formatting Toolbar (Mock) */}
              <div className="flex gap-2 mb-2 p-2 bg-surface-container-low rounded border border-outline-variant text-on-surface-variant">
                <button className="hover:bg-surface-container p-1 rounded"><span className="material-symbols-outlined text-[18px]">format_bold</span></button>
                <button className="hover:bg-surface-container p-1 rounded"><span className="material-symbols-outlined text-[18px]">format_italic</span></button>
                <button className="hover:bg-surface-container p-1 rounded"><span className="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
              </div>
              <textarea 
                className="flex-1 w-full min-h-[200px] p-space-md bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md text-on-surface resize-y" 
                placeholder="Outline actionable recommendations for educators and parents..."
              ></textarea>
            </div>
          </div>
          
        </div>
        
        {/* Right Column: Context/Reference (Bento style smaller cards) */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          
          {/* Student Context Card */}
          <div className="bg-surface rounded-xl border border-outline-variant p-space-md shadow-sm">
            <h4 className="font-title-md text-title-md text-on-surface mb-space-sm border-b border-outline-variant pb-2">Student Context</h4>
            <div className="flex flex-col gap-space-sm">
              <div className="flex justify-between items-center p-2 bg-surface-container-low rounded">
                <span className="font-label-md text-label-md text-on-surface-variant">Name</span>
                <span className="font-body-md text-body-md font-semibold text-on-surface">Alex Mercer</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-surface-container-low rounded">
                <span className="font-label-md text-label-md text-on-surface-variant">Grade</span>
                <span className="font-body-md text-body-md text-on-surface">10th Grade</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-surface-container-low rounded">
                <span className="font-label-md text-label-md text-on-surface-variant">Assessment Date</span>
                <span className="font-body-md text-body-md text-on-surface">Oct 24, 2023</span>
              </div>
            </div>
          </div>
          
          {/* Key Findings Summary (Read Only) */}
          <div className="bg-surface rounded-xl border border-outline-variant p-space-md shadow-sm flex-1">
            <h4 className="font-title-md text-title-md text-on-surface mb-space-sm border-b border-outline-variant pb-2 flex items-center justify-between">
              Assessment Highlights
              <span className="material-symbols-outlined text-outline text-[18px]">open_in_new</span>
            </h4>
            <div className="flex flex-col gap-space-md mt-space-md">
              {/* Metric 1 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-label-md text-label-md text-on-surface-variant">Cognitive Load Index</span>
                  <span className="px-2 py-0.5 bg-error-container text-on-error-container rounded font-label-md text-label-md">Elevated</span>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-2">
                  <div className="bg-error h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              {/* Metric 2 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-label-md text-label-md text-on-surface-variant">Social Engagement</span>
                  <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded font-label-md text-label-md">Average</span>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '55%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Help/Guidelines Card */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-space-md">
            <h4 className="font-title-md text-title-md text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">info</span> Guidelines
            </h4>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Ensure recommendations are specific, measurable, and tailored to the school environment. Avoid overly clinical jargon where possible to aid educator comprehension.
            </p>
          </div>
          
        </div>
      </div>
    </div>
  )
}
