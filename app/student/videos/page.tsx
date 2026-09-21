"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Play, Clock, Eye, Search, BookOpen, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Video {
  id: string
  title: string
  course: string
  module: string
  duration: string
  views: number
  watched: boolean
  thumbnail: string
  instructor: string
  date: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

export default function StudentVideos() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [moduleFilter, setModuleFilter] = useState("all")
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  useEffect(() => {
    async function fetchVideos() {
      const { data, error } = await supabase
        .from("videos")
        .select("*, courses(name), teachers(full_name)")
        .eq("status", "Published")
        .order("upload_date", { ascending: false })

      if (!error && data) {
        const rows = data as any[]
        setVideos(
          rows.map((v) => ({
            id: v.id,
            title: v.title,
            course: v.courses?.name || "",
            module: v.courses?.name || "",
            duration: v.duration || "—",
            views: v.views || 0,
            watched: false,
            thumbnail: "▶",
            instructor: v.teachers?.full_name || "—",
            date: formatDate(v.upload_date),
          }))
        )
      }
      setLoading(false)
    }
    fetchVideos()
  }, [])

  const modules = [...new Set(videos.map((v) => v.module))]
  const watchedCount = videos.filter((v) => v.watched).length

  const filtered = videos.filter((v) => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) || v.module.toLowerCase().includes(search.toLowerCase())
    const matchModule = moduleFilter === "all" || v.module === moduleFilter
    return matchSearch && matchModule
  })

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
        <h1 className="text-lg sm:text-xl font-bold">Lectures</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Python Full Stack &middot; {watchedCount}/{videos.length} watched</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{videos.length}</p>
            <p className="text-[11px] text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-emerald-600">{watchedCount}</p>
            <p className="text-[11px] text-muted-foreground">Watched</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-amber-600">{videos.length - watchedCount}</p>
            <p className="text-[11px] text-muted-foreground">Remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search lectures..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Module Filter */}
      <Tabs value={moduleFilter} onValueChange={(v) => setModuleFilter(v ?? "all")}>
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          {modules.map((m) => (
            <TabsTrigger key={m} value={m}>{m}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Video Cards */}
      <div className="space-y-2.5">
        {filtered.map((v) => (
          <Card
            key={v.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setSelectedVideo(v)}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="size-12 sm:size-14 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">
                  {v.thumbnail}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs sm:text-sm font-medium truncate">{v.title}</p>
                    {v.watched && (
                      <Badge className="text-[9px] bg-emerald-500/15 text-emerald-600 shrink-0">Watched</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{v.module} &middot; {v.instructor}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="size-2.5" />{v.duration}</span>
                    <span className="flex items-center gap-1"><Eye className="size-2.5" />{v.views} views</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="size-9 shrink-0">
                  <Play className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No lectures found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-3">
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center text-4xl">
                {selectedVideo.thumbnail}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{selectedVideo.module} &middot; {selectedVideo.instructor}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="size-3" />{selectedVideo.duration}</span>
                    <span className="flex items-center gap-1"><Eye className="size-3" />{selectedVideo.views} views</span>
                  </div>
                </div>
                <Button size="sm" className="gap-1.5">
                  <Play className="size-3.5" />
                  {selectedVideo.watched ? "Rewatch" : "Watch Now"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
