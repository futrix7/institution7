"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Megaphone, Pin, Calendar, User, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Announcement {
  id: string
  title: string
  message: string
  date: string
  author: string
  priority: "high" | "medium" | "low"
  pinned: boolean
  target: string
}

const priorityConfig: Record<string, { className: string; label: string }> = {
  high: { className: "bg-red-500/15 text-red-600", label: "Important" },
  medium: { className: "bg-amber-500/15 text-amber-600", label: "Info" },
  low: { className: "bg-blue-500/15 text-blue-600", label: "Notice" },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnnouncements() {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("pinned", { ascending: false })
        .order("published_date", { ascending: false })

      if (!error && data) {
        setAnnouncements(
          data.map((a) => ({
            id: a.id,
            title: a.title,
            message: a.message,
            date: formatDate(a.published_date),
            author: a.author_name || "Admin",
            priority: a.priority,
            pinned: a.pinned,
            target: a.target,
          }))
        )
      }
      setLoading(false)
    }
    fetchAnnouncements()
  }, [])

  const pinned = announcements.filter((a) => a.pinned)
  const others = announcements.filter((a) => !a.pinned)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-lg sm:text-xl font-bold">Announcements</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Stay updated with institute notices</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{announcements.length}</p>
            <p className="text-[11px] text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-amber-600">{pinned.length}</p>
            <p className="text-[11px] text-muted-foreground">Pinned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-red-600">{announcements.filter((a) => a.priority === "high").length}</p>
            <p className="text-[11px] text-muted-foreground">Important</p>
          </CardContent>
        </Card>
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Pin className="size-3.5 text-amber-600" />
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pinned</h2>
          </div>
          <div className="space-y-2.5">
            {pinned.map((a) => {
              const pCfg = priorityConfig[a.priority]
              return (
                <Card key={a.id} className="border-amber-500/20">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Megaphone className="size-4 text-amber-600 shrink-0" />
                        <p className="text-xs sm:text-sm font-medium truncate">{a.title}</p>
                      </div>
                      <Badge variant="secondary" className={`text-[10px] shrink-0 ${pCfg.className}`}>{pCfg.label}</Badge>
                    </div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mb-2 line-clamp-2">{a.message}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="size-2.5" />{a.date}</span>
                      <span className="flex items-center gap-1"><User className="size-2.5" />{a.author}</span>
                      <Badge variant="outline" className="text-[9px]">{a.target}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* All Others */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">All Announcements</h2>
        <div className="space-y-2.5">
          {others.map((a) => {
            const pCfg = priorityConfig[a.priority]
            return (
              <Card key={a.id}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-xs sm:text-sm font-medium">{a.title}</p>
                    <Badge variant="secondary" className={`text-[10px] shrink-0 ${pCfg.className}`}>{pCfg.label}</Badge>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mb-2 line-clamp-2">{a.message}</p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="size-2.5" />{a.date}</span>
                    <span className="flex items-center gap-1"><User className="size-2.5" />{a.author}</span>
                    <Badge variant="outline" className="text-[9px]">{a.target}</Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
