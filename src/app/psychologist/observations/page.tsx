import Link from "next/link"
import { Button } from "@/components/ui/button"

// Hardcoded observation feed data matching prototype
const observations = [
  {
    id: "obs-1",
    studentInitials: "AJ",
    studentName: "Aiden Jenkins",
    studentColor: "bg-primary-container text-on-primary",
    className: "5A - Math",
    source: "Teacher",
    sourceIcon: "school",
    sourceColor: "bg-secondary-container text-on-secondary-container",
    category: "Social/Emotional",
    date: "Oct 24, 2023",
    status: "New",
    statusColor: "bg-error-container text-on-error-container",
  },
  {
    id: "obs-2",
    studentInitials: "MS",
    studentName: "Mia Sanchez",
    studentColor: "bg-secondary text-on-secondary",
    className: "4B - General",
    source: "Parent",
    sourceIcon: "family_home",
    sourceColor: "bg-surface-variant text-on-surface-variant border border-outline-variant",
    category: "Academic",
    date: "Oct 23, 2023",
    status: "Reviewed",
    statusColor: "bg-tertiary-container text-on-tertiary-container",
  },
  {
    id: "obs-3",
    studentInitials: "EL",
    studentName: "Ethan Lee",
    studentColor: "bg-tertiary text-on-tertiary",
    className: "6C - Science",
    source: "Teacher",
    sourceIcon: "school",
    sourceColor: "bg-secondary-container text-on-secondary-container",
    category: "Behavioral",
    date: "Oct 20, 2023",
    status: "Assessed",
    statusColor: "bg-surface-container-highest text-on-surface",
  }
]

export default function ObservationsListPage() {
  return (
    <div className="p-space-lg md:p-space-xl max-w-container-max mx-auto w-full flex-1">
      {/* Header Section */}
      <div className="mb-space-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-space-md">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background mb-space-xs">Observations Queue</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Review and triage submitted wellness observations.</p>
        </div>
        <div className="flex gap-space-sm w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none flex items-center justify-center gap-space-xs shadow-none">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </Button>
          <Button variant="primary" className="flex-1 md:flex-none flex items-center justify-center gap-space-xs shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Note
          </Button>
        </div>
      </div>

      {/* Filters (Bento Grid Style Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md mb-space-lg">
        <div className="bg-surface rounded-xl border border-outline-variant p-space-md shadow-sm col-span-1 md:col-span-3 flex flex-wrap gap-space-md items-end">
          <div className="flex flex-col gap-space-xs min-w-[150px] flex-1">
            <label className="font-label-md text-label-md text-on-surface-variant">Source</label>
            <select className="w-full h-[40px] bg-surface-container-lowest border border-outline-variant rounded-lg px-3 focus:outline-none focus:border-primary text-body-md text-on-surface">
              <option>All Sources</option>
              <option>Teacher</option>
              <option>Parent</option>
              <option>Self</option>
            </select>
          </div>
          <div className="flex flex-col gap-space-xs min-w-[150px] flex-1">
            <label className="font-label-md text-label-md text-on-surface-variant">Concern Category</label>
            <select className="w-full h-[40px] bg-surface-container-lowest border border-outline-variant rounded-lg px-3 focus:outline-none focus:border-primary text-body-md text-on-surface">
              <option>All Categories</option>
              <option>Behavioral</option>
              <option>Academic</option>
              <option>Social/Emotional</option>
              <option>Attendance</option>
            </select>
          </div>
          <div className="flex flex-col gap-space-xs min-w-[150px] flex-1">
            <label className="font-label-md text-label-md text-on-surface-variant">Grade/Class</label>
            <select className="w-full h-[40px] bg-surface-container-lowest border border-outline-variant rounded-lg px-3 focus:outline-none focus:border-primary text-body-md text-on-surface">
              <option>All Grades</option>
              <option>Grade 4</option>
              <option>Grade 5</option>
              <option>Grade 6</option>
            </select>
          </div>
        </div>
        
        <div className="bg-surface rounded-xl border border-outline-variant p-space-md shadow-sm col-span-1 flex flex-col justify-end">
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Date Range</label>
            <div className="relative">
              <input className="w-full h-[40px] bg-surface-container-lowest border border-outline-variant rounded-lg px-3 focus:outline-none focus:border-primary text-body-md text-on-surface" type="date" />
            </div>
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="font-label-md text-label-md text-on-surface-variant py-3 px-space-md font-semibold">Student</th>
                <th className="font-label-md text-label-md text-on-surface-variant py-3 px-space-md font-semibold">Class</th>
                <th className="font-label-md text-label-md text-on-surface-variant py-3 px-space-md font-semibold">Source</th>
                <th className="font-label-md text-label-md text-on-surface-variant py-3 px-space-md font-semibold">Concern Category</th>
                <th className="font-label-md text-label-md text-on-surface-variant py-3 px-space-md font-semibold">Date</th>
                <th className="font-label-md text-label-md text-on-surface-variant py-3 px-space-md font-semibold">Status</th>
                <th className="font-label-md text-label-md text-on-surface-variant py-3 px-space-md font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md text-on-surface">
              {observations.map((obs) => (
                <tr key={obs.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group">
                  <td className="py-3 px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${obs.studentColor}`}>
                        {obs.studentInitials}
                      </div>
                      <span className="font-medium text-primary group-hover:underline">{obs.studentName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-space-md text-on-surface-variant">{obs.className}</td>
                  <td className="py-3 px-space-md">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${obs.sourceColor}`}>
                      <span className="material-symbols-outlined text-[14px]">{obs.sourceIcon}</span> {obs.source}
                    </span>
                  </td>
                  <td className="py-3 px-space-md">{obs.category}</td>
                  <td className="py-3 px-space-md text-on-surface-variant">{obs.date}</td>
                  <td className="py-3 px-space-md">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${obs.statusColor}`}>
                      {obs.status}
                    </span>
                  </td>
                  <td className="py-3 px-space-md text-right">
                    <Link href={`/psychologist/observations/${obs.id}`} className="text-primary hover:bg-surface-container-highest p-2 rounded-full transition-colors inline-flex">
                      <span className="material-symbols-outlined">visibility</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-surface-container-lowest p-space-md border-t border-outline-variant flex items-center justify-between">
          <span className="font-body-md text-body-md text-on-surface-variant">Showing 1 to 3 of 12 entries</span>
          <div className="flex gap-space-xs">
            <button className="p-1 rounded bg-surface border border-outline-variant text-on-surface-variant disabled:opacity-50"><span className="material-symbols-outlined">chevron_left</span></button>
            <button className="w-8 h-8 rounded bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center">1</button>
            <button className="w-8 h-8 rounded bg-surface border border-outline-variant text-on-surface hover:bg-surface-container-low font-label-md text-label-md flex items-center justify-center">2</button>
            <button className="w-8 h-8 rounded bg-surface border border-outline-variant text-on-surface hover:bg-surface-container-low font-label-md text-label-md flex items-center justify-center">3</button>
            <button className="p-1 rounded bg-surface border border-outline-variant text-on-surface hover:bg-surface-container-low"><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
        </div>
      </div>
    </div>
  )
}
