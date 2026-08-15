"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { api } from "@/lib/mock-api"
import type { Student, Observation, AssessmentResult } from "@/lib/mock-api"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function loadData() {
      const data = await api.getStudents()
      setStudents(data)
    }
    loadData()
  }, [])

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 p-margin-mobile md:p-gutter max-w-container-max mx-auto w-full flex flex-col gap-space-lg">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-on-background">Students</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
          View student information, observations and assessment history.
        </p>
      </div>

      {/* Filters Section */}
      <section className="bg-surface rounded-xl border border-outline-variant p-space-md flex flex-col md:flex-row gap-space-md items-end shadow-sm">
        <div className="w-full md:flex-1">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-space-sm">Search Student</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-outline-variant bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md text-on-surface" 
              placeholder="Name or ID..." 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="w-full md:w-48">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-space-sm">Grade</label>
          <select className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md text-on-surface appearance-none">
            <option value="">All Grades</option>
            <option value="9">Grade 9</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
        </div>
        
        <div className="w-full md:w-48">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-space-sm">Class</label>
          <select className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md text-on-surface appearance-none">
            <option value="">All Classes</option>
            <option value="homeroom-a">Homeroom A</option>
            <option value="homeroom-b">Homeroom B</option>
          </select>
        </div>
        
        <button className="w-full md:w-auto h-10 px-space-md bg-surface border border-outline-variant rounded-lg text-primary font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center justify-center gap-space-sm">
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
          More Filters
        </button>
      </section>

      {/* Data Table */}
      <section className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-resting">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <th className="px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant">Student</th>
                <th className="px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant">Class</th>
                <th className="px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant">Concerns</th>
                <th className="px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant">Assessments</th>
                <th className="px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant">Last Assessment</th>
                <th className="px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant">Status</th>
                <th className="px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-surface-container-low transition-colors group h-14">
                  <td className="px-space-md py-space-sm">
                    <div className="flex items-center gap-space-sm">
                      <Avatar fallback={student.name.substring(0, 2).toUpperCase()} size="sm" />
                      <div>
                        <div className="font-title-md text-title-md text-on-surface">{student.name}</div>
                        <div className="font-label-md text-label-md text-on-surface-variant">ID: {student.id.replace('STU-', '')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-space-md py-space-sm font-body-md text-body-md text-on-surface">
                    {student.grade} - {student.section}
                  </td>
                  <td className="px-space-md py-space-sm">
                    {student.attentionLevel === 'High Priority' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-error-container text-on-error-container font-label-md text-label-md gap-1">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        2 (Anxiety)
                      </span>
                    ) : student.attentionLevel === 'Attention Required' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-tertiary-container/10 text-tertiary font-label-md text-label-md gap-1">
                        <span className="material-symbols-outlined text-[14px]">flag</span>
                        1 (Attendance)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-surface-variant text-on-surface font-label-md text-label-md">
                        None
                      </span>
                    )}
                  </td>
                  <td className="px-space-md py-space-sm font-body-md text-body-md text-on-surface">
                    1 Completed
                  </td>
                  <td className="px-space-md py-space-sm font-body-md text-body-md text-on-surface-variant">
                    Oct 12, 2026
                  </td>
                  <td className="px-space-md py-space-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-secondary-container/30 text-primary-container font-label-md text-label-md">
                      {student.status}
                    </span>
                  </td>
                  <td className="px-space-md py-space-sm text-right">
                    <Link href={`/psychologist/students/${student.id}`}>
                      <button className="px-3 py-1.5 border border-outline-variant rounded-lg text-primary font-label-md text-label-md hover:border-primary transition-colors bg-surface">
                        View Profile
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
              
              {/* Hardcoded fallback entries from HTML to match visually if DB is small */}
              {filteredStudents.length < 3 && search === "" && (
                <>
                  <tr className="hover:bg-surface-container-low transition-colors group h-14">
                    <td className="px-space-md py-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <Avatar fallback="ET" size="sm" />
                        <div>
                          <div className="font-title-md text-title-md text-on-surface">Emma Thompson</div>
                          <div className="font-label-md text-label-md text-on-surface-variant">ID: 94821</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-space-md py-space-sm font-body-md text-body-md text-on-surface">10A - Science</td>
                    <td className="px-space-md py-space-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-error-container text-on-error-container font-label-md text-label-md gap-1">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        2 (Anxiety)
                      </span>
                    </td>
                    <td className="px-space-md py-space-sm font-body-md text-body-md text-on-surface">3 Completed</td>
                    <td className="px-space-md py-space-sm font-body-md text-body-md text-on-surface-variant">Oct 12, 2026</td>
                    <td className="px-space-md py-space-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-tertiary-container/10 text-tertiary font-label-md text-label-md">
                        Review Required
                      </span>
                    </td>
                    <td className="px-space-md py-space-sm text-right">
                      <Link href={`/psychologist/students/STU-94821`}>
                        <button className="px-3 py-1.5 border border-outline-variant rounded-lg text-primary font-label-md text-label-md hover:border-primary transition-colors bg-surface">
                          View Profile
                        </button>
                      </Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors group h-14">
                    <td className="px-space-md py-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <Avatar fallback="MJ" size="sm" />
                        <div>
                          <div className="font-title-md text-title-md text-on-surface">Michael Johnson</div>
                          <div className="font-label-md text-label-md text-on-surface-variant">ID: 94822</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-space-md py-space-sm font-body-md text-body-md text-on-surface">11B - History</td>
                    <td className="px-space-md py-space-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-surface-variant text-on-surface font-label-md text-label-md">
                        None
                      </span>
                    </td>
                    <td className="px-space-md py-space-sm font-body-md text-body-md text-on-surface">1 Completed</td>
                    <td className="px-space-md py-space-sm font-body-md text-body-md text-on-surface-variant">Sep 05, 2026</td>
                    <td className="px-space-md py-space-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-secondary-container/30 text-primary-container font-label-md text-label-md">
                        Active
                      </span>
                    </td>
                    <td className="px-space-md py-space-sm text-right">
                      <Link href={`/psychologist/students/STU-94822`}>
                        <button className="px-3 py-1.5 border border-outline-variant rounded-lg text-primary font-label-md text-label-md hover:border-primary transition-colors bg-surface">
                          View Profile
                        </button>
                      </Link>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-space-md py-space-sm border-t border-outline-variant flex items-center justify-between bg-surface">
          <span className="font-label-md text-label-md text-on-surface-variant">Showing {filteredStudents.length} students</span>
          <div className="flex gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-outline hover:bg-surface-container-low disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-on-primary font-label-md text-label-md">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface hover:bg-surface-container-low font-label-md text-label-md">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface hover:bg-surface-container-low font-label-md text-label-md">3</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
