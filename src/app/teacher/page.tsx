import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TeacherDashboardPage() {
  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-space-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Good Morning, Sarah</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Here is your daily overview of student wellness.</p>
        </div>
        <Button asChild variant="primary" className="shadow-sm">
          <Link href="/teacher/add-concern" className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-lg">add</span>
            Add Concern
          </Link>
        </Button>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* My Classes Widget */}
        <div className="md:col-span-8 bg-surface rounded-xl border border-outline-variant p-space-md shadow-sm flex flex-col gap-space-md">
          <div className="flex justify-between items-center border-b border-outline-variant pb-space-sm">
            <h3 className="font-title-lg text-title-lg text-on-surface">My Classes</h3>
            <button className="text-primary hover:text-primary-container font-label-md text-label-md transition-colors">View All</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {/* Class Card 1 */}
            <div className="border border-outline-variant rounded-lg p-space-md hover:border-primary transition-colors cursor-pointer bg-surface-container-lowest">
              <div className="flex justify-between items-start mb-space-sm">
                <h4 className="font-title-md text-title-md text-on-surface">Grade 10 - Biology</h4>
                <span className="bg-secondary-container/30 text-on-secondary-container px-2 py-1 rounded-full font-label-md text-[10px]">24 Students</span>
              </div>
              <div className="flex items-center gap-space-sm mt-space-sm">
                <span className="material-symbols-outlined text-outline text-sm">schedule</span>
                <span className="font-body-md text-body-md text-on-surface-variant">10:00 AM - 11:30 AM</span>
              </div>
              <div className="mt-space-md flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant">Wellness Trend</span>
                <span className="material-symbols-outlined text-primary">trending_up</span>
              </div>
            </div>
            {/* Class Card 2 */}
            <div className="border border-outline-variant rounded-lg p-space-md hover:border-primary transition-colors cursor-pointer bg-surface-container-lowest">
              <div className="flex justify-between items-start mb-space-sm">
                <h4 className="font-title-md text-title-md text-on-surface">Grade 9 - History</h4>
                <span className="bg-secondary-container/30 text-on-secondary-container px-2 py-1 rounded-full font-label-md text-[10px]">28 Students</span>
              </div>
              <div className="flex items-center gap-space-sm mt-space-sm">
                <span className="material-symbols-outlined text-outline text-sm">schedule</span>
                <span className="font-body-md text-body-md text-on-surface-variant">1:00 PM - 2:30 PM</span>
              </div>
              <div className="mt-space-md flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant">Wellness Trend</span>
                <span className="material-symbols-outlined text-tertiary">trending_flat</span>
              </div>
            </div>
            {/* Class Card 3 */}
            <div className="border border-outline-variant rounded-lg p-space-md hover:border-primary transition-colors cursor-pointer bg-surface-container-lowest">
              <div className="flex justify-between items-start mb-space-sm">
                <h4 className="font-title-md text-title-md text-on-surface">Grade 11 - Math</h4>
                <span className="bg-secondary-container/30 text-on-secondary-container px-2 py-1 rounded-full font-label-md text-[10px]">22 Students</span>
              </div>
              <div className="flex items-center gap-space-sm mt-space-sm">
                <span className="material-symbols-outlined text-outline text-sm">schedule</span>
                <span className="font-body-md text-body-md text-on-surface-variant">3:00 PM - 4:00 PM</span>
              </div>
              <div className="mt-space-md flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant">Wellness Trend</span>
                <span className="material-symbols-outlined text-primary">trending_up</span>
              </div>
            </div>
          </div>
        </div>
        {/* Recent Concerns Widget */}
        <div className="md:col-span-4 bg-surface rounded-xl border border-outline-variant p-space-md shadow-sm flex flex-col gap-space-md">
          <div className="flex justify-between items-center border-b border-outline-variant pb-space-sm">
            <h3 className="font-title-lg text-title-lg text-on-surface">Recent Concerns</h3>
          </div>
          <div className="flex flex-col">
            {/* Concern Item 1 */}
            <div className="py-space-sm border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors px-space-xs rounded flex gap-space-sm items-start">
              <div className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0 mt-1">
                <span className="material-symbols-outlined text-sm">warning</span>
              </div>
              <div>
                <div className="flex justify-between items-center w-full">
                  <h4 className="font-title-md text-title-md text-on-surface">Liam Davis</h4>
                  <span className="font-label-md text-label-md text-outline">2h ago</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mt-1">Noticed significant withdrawal during group activities today. Reluctant to participate.</p>
                <span className="inline-block mt-2 bg-tertiary-container/10 text-tertiary px-2 py-0.5 rounded-full font-label-md text-[10px]">Academic Stress</span>
              </div>
            </div>
            {/* Concern Item 2 */}
            <div className="py-space-sm border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors px-space-xs rounded flex gap-space-sm items-start">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 mt-1">
                <span className="material-symbols-outlined text-sm">info</span>
              </div>
              <div>
                <div className="flex justify-between items-center w-full">
                  <h4 className="font-title-md text-title-md text-on-surface">Emma Wilson</h4>
                  <span className="font-label-md text-label-md text-outline">Yesterday</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mt-1">Follow up on previous peer interaction concern. Seems to be improving slightly.</p>
                <span className="inline-block mt-2 bg-secondary-container/30 text-secondary px-2 py-0.5 rounded-full font-label-md text-[10px]">Social Interaction</span>
              </div>
            </div>
          </div>
          <button className="mt-auto w-full bg-surface border border-outline-variant text-primary py-space-sm rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors">
            View All Concerns
          </button>
        </div>
      </div>
    </>
  )
}
