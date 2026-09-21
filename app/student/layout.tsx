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
import { motion } from "framer-motion"
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
      className="inline-flex min-h-11 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:min-h-12 sm:w-11"
      aria-label="Toggle theme"
    >
      {mounted
        ? theme === "dark" ? <Sun className="size-4 sm:size-5" /> : <Moon className="size-4 sm:size-5" />
        : <Sun className="size-4 sm:size-5" />
      }
    </button>
  )
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop top nav */}
      <header className="hidden lg:block sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/student/dashboard" className="text-base font-bold tracking-tight">
            Student Portal
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <link.icon className="size-4" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
            <div className="mx-2 h-5 w-px bg-border" />
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className={cn("pb-20 lg:pb-6")}>{children}</main>

      {/* Mobile bottom nav - floating dock */}
      <div className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2 lg:hidden">
        <nav className="flex items-center gap-0.5 rounded-2xl border border-border bg-card/90 px-1.5 py-1 shadow-lg backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[9px] font-medium transition-all sm:min-h-12 sm:px-3 sm:py-2 sm:text-[10px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <link.icon className="relative size-4 sm:size-5" />
                <span className="relative">{link.label}</span>
              </Link>
            )
          })}
          <div className="mx-0.5 h-5 w-px bg-border" />
          <ThemeToggle />
        </nav>
      </div>
    </div>
  )
}