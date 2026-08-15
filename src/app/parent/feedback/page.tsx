import { Button } from "@/components/ui/button"

export default function ParentFeedbackPage() {
  return (
    <div className="font-body-md text-body-md text-on-background min-h-screen flex flex-col items-center py-space-xl px-margin-mobile md:px-gutter bg-background">
      {/* Header Section */}
      <header className="w-full max-w-container-max flex flex-col md:flex-row justify-between items-start md:items-center mb-space-lg">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-space-xs">Alex Johnson</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">School Request / Observation Form</p>
        </div>
        <div className="mt-space-md md:mt-0 flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
          <span className="font-title-md text-title-md text-primary">EduWell Psych</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-3xl flex-grow">
        <form className="bg-surface rounded-xl border border-outline-variant p-space-lg md:p-space-xl shadow-sm">
          <div className="mb-space-lg border-b border-outline-variant pb-space-lg">
            <h2 className="font-title-lg text-title-lg text-on-surface mb-space-md flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary">home</span>
              Parent Feedback
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Please provide your observations regarding Alex's behavior and well-being at home. This information helps us create a comprehensive understanding of their needs.
            </p>
          </div>

          <div className="space-y-space-lg">
            {/* Question 1 */}
            <div>
              <label className="block font-title-md text-title-md text-on-surface mb-space-sm" htmlFor="home-observations">What have you noticed at home?</label>
              <textarea 
                className="w-full rounded-lg border border-outline-variant bg-surface p-space-md font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors resize-y" 
                id="home-observations" 
                name="home-observations" 
                placeholder="Describe any changes in mood, sleeping patterns, interactions with family members, or homework habits..." 
                rows={6}
              ></textarea>
              <p className="mt-space-xs font-label-md text-label-md text-on-surface-variant">Your detailed observations are invaluable to our assessment.</p>
            </div>
            
            {/* Question 2 */}
            <div>
              <label className="block font-title-md text-title-md text-on-surface mb-space-sm" htmlFor="optional-comments">Optional Comments</label>
              <textarea 
                className="w-full rounded-lg border border-outline-variant bg-surface p-space-md font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors resize-y" 
                id="optional-comments" 
                name="optional-comments" 
                placeholder="Any other context or specific incidents you would like to share..." 
                rows={4}
              ></textarea>
            </div>
          </div>

          {/* Action Area */}
          <div className="mt-space-xl pt-space-lg border-t border-outline-variant flex justify-end">
            <Button variant="primary" type="submit" className="font-title-md text-title-md px-space-lg py-3 h-auto flex items-center gap-space-sm shadow-sm active:scale-95 transition-transform">
              Submit Feedback
              <span className="material-symbols-outlined">send</span>
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
