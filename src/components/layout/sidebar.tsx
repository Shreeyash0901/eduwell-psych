"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", href: "/psychologist/dashboard", icon: "dashboard" },
  { name: "Students", href: "/psychologist/students", icon: "groups" },
  { name: "Assessments", href: "/psychologist/assessments", icon: "assignment" },
  { name: "Observations", href: "/psychologist/observations", icon: "visibility" },
  { name: "Reports", href: "/psychologist/reports", icon: "analytics" },
  { name: "Settings", href: "/psychologist/settings", icon: "settings" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 glass-card border-r border-white/20 hidden md:flex flex-col relative z-20">
      <div className="h-20 flex items-center px-6 border-b border-white/20">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mr-3">
          <span className="material-symbols-outlined text-white text-xl">psychology</span>
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-tertiary">
          EduWell
        </span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-secondary hover:bg-white/50"
              )}
            >
              <span className={cn("material-symbols-outlined", isActive ? "filled" : "")}>
                {item.icon}
              </span>
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/20">
        <div className="bg-gradient-to-br from-primary/10 to-tertiary-container/10 p-4 rounded-xl border border-white/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            <span className="font-semibold text-sm text-on-surface">AI Insights</span>
          </div>
          <p className="text-xs text-secondary mb-3 leading-relaxed">
            3 new patterns detected across Grade 4 students.
          </p>
          <button className="text-xs font-medium text-primary hover:underline">View Insights &rarr;</button>
        </div>
      </div>
    </aside>
  )
}
