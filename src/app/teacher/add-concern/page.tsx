import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TeacherAddConcernPage() {
  return (
    <>
      {/* Header */}
      <div className="mb-space-lg flex items-center gap-space-sm">
        <Link href="/teacher" className="text-on-surface-variant hover:text-primary transition-colors flex items-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Log Observation</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Record a new concern or observation for a student.</p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-surface rounded-xl border border-outline-variant p-space-md md:p-space-lg shadow-sm max-w-3xl">
        <form action="#" className="flex flex-col gap-space-lg" method="POST">
          {/* Step 1: Select Student */}
          <div className="flex flex-col gap-space-sm">
            <label className="font-title-md text-title-md text-on-surface flex items-center gap-2" htmlFor="student-select">
              <span className="material-symbols-outlined text-primary text-[20px]">person</span>
              1. Select Student
            </label>
            <p className="font-body-md text-body-md text-on-surface-variant mb-1">Choose the student this observation pertains to.</p>
            <div className="relative">
              <select className="w-full h-10 px-3 bg-surface border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface appearance-none outline-none transition-colors" id="student-select" name="student" defaultValue="">
                <option disabled value="">Search or select a student...</option>
                <option value="1">Alice Johnson (Grade 4)</option>
                <option value="2">Bobby Tables (Grade 5)</option>
                <option value="3">Charlie Brown (Grade 3)</option>
                <option value="4">Diana Prince (Grade 6)</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-2 text-on-surface-variant pointer-events-none">arrow_drop_down</span>
            </div>
          </div>

          <hr className="border-t border-outline-variant/50" />

          {/* Step 2: Concern Category */}
          <div className="flex flex-col gap-space-sm">
            <label className="font-title-md text-title-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">category</span>
              2. Concern Category
            </label>
            <p className="font-body-md text-body-md text-on-surface-variant mb-2">Select the primary area of concern.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-space-sm">
              <label className="cursor-pointer">
                <input className="peer sr-only" name="category" type="radio" value="attention" />
                <div className="flex flex-col items-center justify-center p-space-md border border-outline-variant rounded-lg bg-surface peer-checked:bg-surface-container-low peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary transition-all hover:bg-surface-container-lowest">
                  <span className="material-symbols-outlined text-secondary mb-2">psychology</span>
                  <span className="font-label-md text-label-md text-on-surface text-center">Attention</span>
                </div>
              </label>
              <label className="cursor-pointer">
                <input className="peer sr-only" name="category" type="radio" value="behaviour" />
                <div className="flex flex-col items-center justify-center p-space-md border border-outline-variant rounded-lg bg-surface peer-checked:bg-surface-container-low peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary transition-all hover:bg-surface-container-lowest">
                  <span className="material-symbols-outlined text-secondary mb-2">groups</span>
                  <span className="font-label-md text-label-md text-on-surface text-center">Behaviour</span>
                </div>
              </label>
              <label className="cursor-pointer">
                <input className="peer sr-only" name="category" type="radio" value="learning" />
                <div className="flex flex-col items-center justify-center p-space-md border border-outline-variant rounded-lg bg-surface peer-checked:bg-surface-container-low peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary transition-all hover:bg-surface-container-lowest">
                  <span className="material-symbols-outlined text-secondary mb-2">menu_book</span>
                  <span className="font-label-md text-label-md text-on-surface text-center">Learning</span>
                </div>
              </label>
              <label className="cursor-pointer">
                <input className="peer sr-only" name="category" type="radio" value="social" />
                <div className="flex flex-col items-center justify-center p-space-md border border-outline-variant rounded-lg bg-surface peer-checked:bg-surface-container-low peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary transition-all hover:bg-surface-container-lowest">
                  <span className="material-symbols-outlined text-secondary mb-2">diversity_3</span>
                  <span className="font-label-md text-label-md text-on-surface text-center">Social</span>
                </div>
              </label>
              <label className="cursor-pointer">
                <input className="peer sr-only" name="category" type="radio" value="emotional" />
                <div className="flex flex-col items-center justify-center p-space-md border border-outline-variant rounded-lg bg-surface peer-checked:bg-surface-container-low peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary transition-all hover:bg-surface-container-lowest">
                  <span className="material-symbols-outlined text-secondary mb-2">favorite</span>
                  <span className="font-label-md text-label-md text-on-surface text-center">Emotional</span>
                </div>
              </label>
              <label className="cursor-pointer">
                <input className="peer sr-only" name="category" type="radio" value="other" />
                <div className="flex flex-col items-center justify-center p-space-md border border-outline-variant rounded-lg bg-surface peer-checked:bg-surface-container-low peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary transition-all hover:bg-surface-container-lowest">
                  <span className="material-symbols-outlined text-secondary mb-2">more_horiz</span>
                  <span className="font-label-md text-label-md text-on-surface text-center">Other</span>
                </div>
              </label>
            </div>
          </div>

          <hr className="border-t border-outline-variant/50" />

          {/* Step 3: Observation Detail */}
          <div className="flex flex-col gap-space-sm">
            <label className="font-title-md text-title-md text-on-surface flex items-center gap-2" htmlFor="observation-text">
              <span className="material-symbols-outlined text-primary text-[20px]">notes</span>
              3. Observation Details
            </label>
            <p className="font-body-md text-body-md text-on-surface-variant mb-1">Provide factual, objective details about the concern.</p>
            <textarea className="w-full p-3 bg-surface border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface outline-none transition-colors resize-y" id="observation-text" name="observation" placeholder="E.g., Student exhibited difficulty focusing during the math lesson, repeatedly putting head on desk..." rows={5}></textarea>
            <p className="font-label-md text-label-md text-on-surface-variant mt-1 text-right">0 / 500 characters</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-space-md mt-space-sm pt-space-md border-t border-outline-variant/50">
            <Button variant="outline" type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="shadow-sm">
              Submit Observation
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
