"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CalendarCheck,
  Wallet,
  Award,
  Clock,
  BookOpen,
  Bell,
  Loader2,
} from "lucide-react"
import Link from "next/link"

interface StudentRow {
  id: number
  user_id: string
  name: string
  course: string
  branch: string
}

interface FeeRow {
  amount_paid: number
}

interface AnnouncementRow {
  title: string
  date: string
  type: string
}

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true)
  const [studentInfo, setStudentInfo] = useState<{
    name: string
    id: string
    course: string
    branch: string
  } | null>(null)
  const [stats, setStats] = useState<
    { label: string; value: string; icon: typeof CalendarCheck; color: string; bg: string; href: string }[]
  >([])
  const [recentNotices, setRecentNotices] = useState<AnnouncementRow[]>([])
  const [courseProgress, setCourseProgress] = useState<
    { name: string; pct: number; label: string }[]
  >([])

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: student } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (!student) {
        setLoading(false)
        return
      }

      const { data: fees } = await supabase
        .from("fees")
        .select("amount_paid")
        .eq("student_id", student.id)

      const totalPaid = fees?.reduce((sum: number, f: FeeRow) => sum + f.amount_paid, 0) ?? 0

      const { count: attendanceCount } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("student_id", student.id)
        .eq("status", "present")

      const { count: totalDays } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("student_id", student.id)

      const { count: certCount } = await supabase
        .from("certificates")
        .select("*", { count: "exact", head: true })
        .eq("student_id", student.id)

      const { data: announcements } = await supabase
        .from("announcements")
        .select("title, date, type")
        .order("date", { ascending: false })
        .limit(5)

      const attendancePct =
        totalDays && totalDays > 0
          ? Math.round((attendanceCount ?? 0) / totalDays) * 100
          : 0

      setStudentInfo({
        name: student.name ?? "Student",
        id: student.id,
        course: student.course ?? "",
        branch: student.branch ?? "",
      })

      setStats([
        { label: "Attendance", value: `${attendancePct}%`, icon: CalendarCheck, color: "text-emerald-600", bg: "bg-emerald-500/10", href: "/student/attendance" },
        { label: "Fee Paid", value: `₹${totalPaid.toLocaleString()}`, icon: Wallet, color: "text-violet-600", bg: "bg-violet-500/10", href: "/student/fee" },
        { label: "Certificates", value: String(certCount ?? 0), icon: Award, color: "text-amber-600", bg: "bg-amber-500/10", href: "/student/profile/certificates" },
        { label: "Hours", value: String(totalDays ?? 0), icon: Clock, color: "text-blue-600", bg: "bg-blue-500/10", href: "/student/profile/payments" },
      ])

      setRecentNotices(
        (announcements ?? []).map((a: AnnouncementRow) => ({
          title: a.title,
          date: a.date,
          type: a.type,
        }))
      )

      const courseName = student.course ?? "Course"
      setCourseProgress([
        { name: `${courseName} Basics`, pct: 100, label: "Completed" },
        { name: `${courseName} Framework`, pct: 72, label: "72%" },
        { name: `${courseName} Frontend`, pct: 45, label: "45%" },
        { name: "Database & SQL", pct: 28, label: "28%" },
      ])

      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!studentInfo) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        No student data found.
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Welcome */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex size-12 sm:size-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-base sm:text-lg font-bold shrink-0">
              {studentInfo.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold truncate">Welcome, {studentInfo.name.split(" ")[0]}!</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">{studentInfo.course} &middot; {studentInfo.branch}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-2.5 mb-2">
                  <div className={`size-8 sm:size-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`size-4 sm:size-5 ${s.color}`} />
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Course Progress */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="size-5 text-primary" />
              <h2 className="text-sm sm:text-base font-semibold">Course Progress</h2>
            </div>
            <div className="space-y-3.5">
              {courseProgress.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                    <span>{item.name}</span>
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  <Progress value={item.pct} className="h-1.5 sm:h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="size-5 text-primary" />
              <h2 className="text-sm sm:text-base font-semibold">Today&apos;s Classes</h2>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">No classes scheduled.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notices */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              <h2 className="text-sm sm:text-base font-semibold">Recent Notices</h2>
            </div>
            <Badge variant="secondary" className="text-[10px]">{recentNotices.length} new</Badge>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recentNotices.map((notice, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-2.5 sm:p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium truncate">{notice.title}</p>
                  <p className="text-[11px] text-muted-foreground">{notice.date}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] ml-2 shrink-0">{notice.type}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
