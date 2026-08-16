import Link from "next/link"
import { api } from "@/lib/mock-api"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function generateStaticParams() {
  return [
    { id: "STU-8821" },
    { id: "STU-4402" },
    { id: "STU-9011" },
    { id: "STU-94821" },
    { id: "STU-94822" },
    { id: "8821" },
    { id: "1" }
  ];
}

export default async function StudentProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const student = (await api.getStudent(id)) || (await api.getStudent("STU-8821"))

  if (!student) {
    return <div>Student not found</div>
  }

  return (
    <div className="flex-1 p-space-lg w-full max-w-container-max mx-auto flex flex-col gap-space-lg">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
        <Link href="/psychologist/students" className="hover:text-primary transition-colors">Students</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-on-surface">{student.name}</span>
      </nav>

      {/* Student Identity Header */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-space-lg shadow-resting flex flex-col md:flex-row md:items-center justify-between gap-space-md relative overflow-hidden">
        {/* Decorative subtle background element */}
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-surface-container to-transparent opacity-50 pointer-events-none"></div>
        
        <div className="flex items-center gap-space-lg z-10">
          <Avatar fallback={student.name.substring(0, 2).toUpperCase()} size="lg" className="w-24 h-24 border-2 border-surface shadow-sm ring-1 ring-outline-variant text-3xl" />
          
          <div className="flex flex-col gap-space-xs">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">{student.name}</h2>
            <div className="flex flex-wrap items-center gap-x-space-md gap-y-space-xs font-body-md text-body-md text-on-surface-variant">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">school</span> {student.grade}</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span>{student.section}</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="font-label-md text-label-md text-secondary">ID: #{student.id.replace('STU-', '')}</span>
            </div>
            
            {/* Status Chip */}
            <div className="mt-space-xs">
              <Badge variant={student.attentionLevel === 'High Priority' ? 'urgent' : student.attentionLevel === 'Attention Required' ? 'monitoring' : 'stable'}>
                {student.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-space-sm z-10 w-full md:w-auto mt-space-md md:mt-0">
          <Button variant="outline" className="flex-1 md:flex-none gap-space-xs bg-surface-container-lowest">
            <span className="material-symbols-outlined text-[18px]">summarize</span>
            Generate Report
          </Button>
          <Button variant="primary" className="flex-1 md:flex-none gap-space-xs shadow-sm">
            <span className="material-symbols-outlined text-[18px]">play_circle</span>
            Start Assessment
          </Button>
        </div>
      </section>

      {/* Page Level Tabs */}
      <div className="border-b border-outline-variant flex gap-space-lg overflow-x-auto no-scrollbar">
        <Link href={`/psychologist/students/${id}`} className="font-title-md text-title-md text-on-surface-variant hover:text-primary focus:text-primary transition-all pb-space-sm whitespace-nowrap px-1">
          Overview
        </Link>
        <Link href={`/psychologist/students/${id}/observations`} className="font-title-md text-title-md text-on-surface-variant hover:text-primary transition-all pb-space-sm whitespace-nowrap px-1">
          Observations
        </Link>
        <Link href={`/psychologist/students/${id}/assessments`} className="font-title-md text-title-md text-on-surface-variant hover:text-primary transition-all pb-space-sm whitespace-nowrap px-1">
          Assessments
        </Link>
        <Link href={`/psychologist/students/${id}/reports`} className="font-title-md text-title-md text-on-surface-variant hover:text-primary transition-all pb-space-sm whitespace-nowrap px-1">
          Reports
        </Link>
      </div>

      {children}
    </div>
  )
}
