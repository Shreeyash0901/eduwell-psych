import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function TakeAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Mock assessment details based on the id
  const assessmentName = id === "SDQ" ? "Emotional Wellbeing Scale" : "Assessment";
  
  return (
    <div className="flex-1 flex justify-center p-space-lg w-full max-w-[1280px] mx-auto">
      <div className="max-w-3xl w-full flex flex-col gap-space-lg">
        
        {/* Assessment Context Header */}
        <div className="bg-surface border border-outline-variant rounded-xl p-space-lg shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-space-sm mb-space-md">
            <div>
              <h1 className="font-title-lg text-title-lg text-on-surface mb-1">{assessmentName}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Student: <span className="font-medium text-on-surface">Alex Santos</span>
              </p>
            </div>
            <div className="bg-surface-container px-3 py-1 rounded-full border border-outline-variant">
              <span className="font-label-md text-label-md text-primary">In Progress</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="font-label-md text-label-md text-on-surface-variant">Question 7 of 20</span>
              <span className="font-label-md text-label-md text-on-surface-variant">35% Completed</span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out" style={{ width: '35%' }}></div>
            </div>
          </div>
        </div>
        
        {/* Question Canvas */}
        <div className="bg-surface border border-outline-variant rounded-xl p-space-lg shadow-sm flex flex-col gap-space-xl">
          <div className="text-center py-space-md">
            <h2 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-on-surface leading-tight">
              "Student shows frustration when tasks become difficult."
            </h2>
          </div>
          
          {/* Likert Scale Options */}
          <div className="flex flex-col gap-space-sm">
            {['Never', 'Rarely', 'Sometimes', 'Often', 'Always'].map((option, index) => {
              const isSelected = option === 'Sometimes';
              const value = option.toLowerCase();
              return (
                <label key={option} className={`relative flex items-center p-space-md bg-surface border rounded-lg cursor-pointer transition-colors group ${isSelected ? 'border-primary' : 'border-outline-variant hover:bg-surface-container-low hover:border-primary'}`}>
                  <input 
                    className="peer sr-only" 
                    name="q7" 
                    type="radio" 
                    value={value} 
                    defaultChecked={isSelected} 
                  />
                  <div className={`w-5 h-5 border-2 rounded-full mr-space-md flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary' : 'border-outline group-hover:border-primary'}`}>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[14px] text-on-primary icon-fill-1">circle</span>
                    )}
                  </div>
                  <span className={`font-body-lg text-body-lg transition-colors ${isSelected ? 'text-primary font-medium' : 'text-on-surface group-hover:text-primary'}`}>
                    {option}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
        
        {/* Action Area */}
        <div className="flex justify-between items-center mt-space-sm">
          <Button variant="outline" className="px-6 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Previous
          </Button>
          <Link href={`/psychologist/assessments/results/${id}`}>
            <Button variant="primary" className="px-6 py-3 flex items-center gap-2 shadow-sm">
              Next
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Button>
          </Link>
        </div>
        
      </div>
    </div>
  )
}
