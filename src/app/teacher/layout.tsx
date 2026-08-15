import Link from "next/link"
import Image from "next/image"

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen font-body-md text-body-md bg-background text-on-background w-full">
      {/* TopNavBar (Mobile) */}
      <header className="md:hidden bg-surface dark:bg-surface-dim font-body-md text-body-md w-full sticky top-0 z-50 flex justify-between items-center px-space-lg h-16 shadow-sm border-b border-outline-variant">
        <div className="font-display text-headline-md font-bold text-primary dark:text-primary-fixed-dim">
          EduWell Psych
        </div>
        <div className="flex gap-space-sm items-center text-primary dark:text-primary-fixed-dim">
          <button className="p-space-sm rounded-full hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-lg">notifications</span>
          </button>
          <button className="p-space-sm rounded-full hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-lg">help</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant">
            {/* Fallback styling since img asset from prototype is requested directly */}
            <img 
              alt="Teacher profile" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjlGpOC9I4iyBnHTR0WXHI4qQj5ecGEcBTCMl0jslHR7vgMUHEH_qTCG0jR6OnDCjW--CLcIOUCGE1Ttx1fY49o8gu5pqHXTGOMZu2w-_lbY_kSC_u_qsSQim4VcNupV8LOiNufHC5XT2ofqPjdTNUlcP_vM5ew3-6plPylgWuubNNj7bdili0PQKOIriW06F7hUlv11t-X5y7VrE9fhd0vLYSfP_twYZBxG5DD2tpJcA-ipNvjAh6BA"
            />
          </div>
        </div>
      </header>

      {/* SideNavBar for Desktop */}
      <nav className="hidden md:flex bg-surface-container-low dark:bg-inverse-surface font-label-md text-label-md h-screen w-64 sticky left-0 top-0 border-r border-outline-variant dark:border-outline flex-col p-space-md gap-space-sm">
        <div className="flex items-center gap-space-sm mb-space-lg px-space-sm">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xl">
            E
          </div>
          <div>
            <h1 className="font-title-lg text-title-lg font-bold text-primary dark:text-primary-fixed-dim">EduWell Psych</h1>
            <p className="text-on-surface-variant text-xs">Educator Suite</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-space-xs">
          <Link href="/teacher" className="flex items-center gap-space-sm px-space-md py-space-sm bg-secondary-container text-on-secondary-container rounded-lg font-semibold transition-transform">
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            Dashboard
          </Link>
          <Link href="#" className="flex items-center gap-space-sm px-space-md py-space-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[20px]">group</span>
            My Classes
          </Link>
          <Link href="#" className="flex items-center gap-space-sm px-space-md py-space-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[20px]">assignment</span>
            Assessments
          </Link>
        </div>
        <div className="mt-auto flex flex-col gap-space-xs pt-space-md border-t border-outline-variant">
          <Link href="#" className="flex items-center gap-space-sm px-space-md py-space-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[20px]">help</span>
            Help Center
          </Link>
          <Link href="/psychologist/dashboard" className="flex items-center gap-space-sm px-space-md py-space-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[20px]">switch_account</span>
            Switch Role
          </Link>
          <Link href="#" className="flex items-center gap-space-sm px-space-md py-space-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign Out
          </Link>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1280px] mx-auto p-margin-mobile md:p-gutter flex flex-col gap-space-lg overflow-y-auto pb-24 md:pb-gutter">
        {children}
      </main>
    </div>
  )
}
