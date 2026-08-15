import * as React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopHeader } from "@/components/layout/top-header"

export default function PsychologistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden relative w-full">
      {/* Background blobs from index.html */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-20 w-[30rem] h-[30rem] bg-tertiary-container/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-secondary-container/30 rounded-full blur-3xl"></div>
      </div>

      <Sidebar />
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <TopHeader />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
