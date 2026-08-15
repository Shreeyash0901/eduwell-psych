import * as React from "react"
import { Avatar } from "@/components/ui/avatar"

export function TopHeader() {
  return (
    <header className="h-20 glass-card border-b border-white/20 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="relative w-96">
        <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline">search</span>
        <input 
          type="text" 
          placeholder="Search students, assessments..." 
          className="w-full h-10 pl-10 pr-4 rounded-full bg-white/50 border border-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <button className="w-10 h-10 rounded-full hover:bg-white/50 flex items-center justify-center text-secondary relative transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
        </button>
        <div className="h-8 w-px bg-outline-variant/50 mx-2"></div>
        <div className="flex items-center gap-3 cursor-pointer hover:bg-white/50 p-2 rounded-xl transition-colors">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-on-surface">Dr. Evelyn Carter</p>
            <p className="text-xs text-secondary">School Psychologist</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
            EC
          </div>
        </div>
      </div>
    </header>
  )
}
