"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { FormSheet, FormField } from "@/components/admin/form-sheet"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/sonner"

interface UploadVideoSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UploadVideoSheet({ open, onOpenChange, onSuccess }: UploadVideoSheetProps) {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [course, setCourse] = useState("")
  const [duration, setDuration] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!title.trim()) {
      toast("Please enter a video title", "error")
      return
    }

    setSaving(true)

    const videoId = `VID-${Date.now()}`

    const { error } = await supabase.from("videos").insert({
      id: videoId,
      title: title.trim(),
      url: url.trim() || null,
      course_slug: course || null,
      duration: duration.trim() || null,
      views: 0,
      status: "Published",
    })

    setSaving(false)

    if (error) {
      toast("Failed to upload video: " + error.message, "error")
      return
    }

    toast("Video uploaded successfully", "success")
    setTitle("")
    setUrl("")
    setCourse("")
    setDuration("")
    onOpenChange(false)
    onSuccess()
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Upload Video"
      icon={Upload}
      submitLabel={saving ? "Uploading..." : "Upload"}
      onSubmit={handleSubmit}
    >
      <FormField label="Video Title" htmlFor="title">
        <Input id="title" placeholder="e.g. Python Basics - Variables" value={title} onChange={(e) => setTitle(e.target.value)} />
      </FormField>

      <FormField label="Video URL" htmlFor="url">
        <Input id="url" type="url" placeholder="https://youtube.com/watch?v=..." value={url} onChange={(e) => setUrl(e.target.value)} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Course">
          <Select value={course} onValueChange={(v) => setCourse(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="python-full-stack">Python Full Stack</SelectItem>
              <SelectItem value="java-full-stack">Java Full Stack</SelectItem>
              <SelectItem value="adwd">A.D.W.D</SelectItem>
              <SelectItem value="dca">DCA</SelectItem>
              <SelectItem value="adca">ADCA</SelectItem>
              <SelectItem value="tally-prime">Tally PRIME</SelectItem>
              <SelectItem value="c-language">C Language</SelectItem>
              <SelectItem value="core-python">Core Python</SelectItem>
              <SelectItem value="advanced-excel">Advanced Excel</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Duration" htmlFor="duration">
          <Input id="duration" placeholder="e.g. 45:20" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </FormField>
      </div>
    </FormSheet>
  )
}
