"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import {
  LayoutDashboard,
  CalendarCheck,
  Wallet,
  Megaphone,
  UserCircle,
  Sun,
  Moon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Home", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Attendance", href: "/student/attendance", icon: CalendarCheck },
  { label: "Fee", href: "/student/fee", icon: Wallet },
  { label: "Notices", href: "/student/announcements", icon: Megaphone },
  { label: "Profile", href: "/student/profile", icon: UserCircle },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Toggle theme"
    >
      {mounted
        ? theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />
        : <Sun className="size-4" />
      }
    </button>
  )
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary px-1 py-0.5 text-primary-foreground text-[10px] font-extrabold">
            TNGC
          </div>
          <span className="text-sm font-bold">Student Portal</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">{children}</main>
      </div>

      {/* Mobile classic bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card lg:hidden">
        <div className="flex items-center justify-around px-1.5 py-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-1 min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors",
                isActive(link.href) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <link.icon className="size-5" />
              <span className="whitespace-nowrap">{link.label}</span>
            </Link>
          ))}
          <div className="mx-0.5 h-6 w-px shrink-0 bg-border" />
          <ThemeToggle />
        </div>
      </nav>
    </div>
  )
}