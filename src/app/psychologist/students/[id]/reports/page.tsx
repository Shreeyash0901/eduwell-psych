import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function StudentReportsPage() {
  return (
    <Card className="rounded-xl overflow-hidden shadow-sm">
      <div className="p-space-md border-b border-outline-variant bg-surface flex justify-between items-center">
        <h3 className="font-title-lg text-title-lg text-on-surface">Document History</h3>
        <div className="flex items-center gap-space-sm">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input 
              type="text" 
              placeholder="Search reports..." 
              className="pl-10 pr-4 py-2 border border-outline-variant rounded-lg font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-10 w-64 bg-surface-container-lowest text-on-surface" 
            />
          </div>
          <Button variant="outline" className="p-2 border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors min-w-0 h-10 w-10">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-lowest">
              <th className="p-space-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Report Title</th>
              <th className="p-space-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Type</th>
              <th className="p-space-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Date Generated</th>
              <th className="p-space-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Created By</th>
              <th className="p-space-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md text-on-surface">
            <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group">
              <td className="p-space-md flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                <span className="font-medium">Term 2 Academic &amp; Wellness Summary</span>
              </td>
              <td className="p-space-md">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-[12px] font-medium border border-primary/20">Comprehensive</span>
              </td>
              <td className="p-space-md text-on-surface-variant">Oct 12, 2023</td>
              <td className="p-space-md flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-bold">DR</div>
                <span>Dr. Sarah Jenkins</span>
              </td>
              <td className="p-space-md text-right">
                <div className="flex items-center justify-end gap-space-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-1" title="View">
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                  </button>
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-1" title="Download PDF">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group">
              <td className="p-space-md flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-tertiary text-[20px]">assignment_turned_in</span>
                <span className="font-medium">Behavioral Observation Log - Q3</span>
              </td>
              <td className="p-space-md">
                <span className="bg-tertiary/10 text-tertiary px-2 py-1 rounded text-[12px] font-medium border border-tertiary/20">Observation</span>
              </td>
              <td className="p-space-md text-on-surface-variant">Sep 28, 2023</td>
              <td className="p-space-md flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-bold">DR</div>
                <span>Dr. Sarah Jenkins</span>
              </td>
              <td className="p-space-md text-right">
                <div className="flex items-center justify-end gap-space-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-1" title="View">
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                  </button>
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-1" title="Download PDF">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr className="hover:bg-surface-container-low transition-colors group">
              <td className="p-space-md flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[20px]">poll</span>
                <span className="font-medium">Initial Cognitive Assessment Results</span>
              </td>
              <td className="p-space-md">
                <span className="bg-secondary/10 text-secondary px-2 py-1 rounded text-[12px] font-medium border border-secondary/20">Assessment</span>
              </td>
              <td className="p-space-md text-on-surface-variant">Aug 15, 2023</td>
              <td className="p-space-md flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center text-[10px] font-bold">ML</div>
                <span>Mark Loman</span>
              </td>
              <td className="p-space-md text-right">
                <div className="flex items-center justify-end gap-space-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-1" title="View">
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                  </button>
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-1" title="Download PDF">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}
