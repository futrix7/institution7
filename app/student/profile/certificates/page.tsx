"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Award, Download, CheckCircle2, Clock, Eye, Send, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/sonner"
import { supabase } from "@/lib/supabase"

interface Certificate {
  id: string
  name: string
  course: string
  issuedDate: string
  credentialId: string
  status: "Issued" | "Processing" | "Requested"
  issueBy: string
  type: "Completion" | "Proficiency" | "Module"
}

const statusConfig: Record<string, { className: string; icon: React.ElementType }> = {
  Issued: { className: "bg-emerald-500/15 text-emerald-600", icon: CheckCircle2 },
  Processing: { className: "bg-blue-500/15 text-blue-600", icon: Clock },
  Requested: { className: "bg-amber-500/15 text-amber-600", icon: Clock },
}

export default function StudentCertificates() {
  const { toast } = useToast()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [studentName, setStudentName] = useState("")
  const [tab, setTab] = useState("all")
  const [reqOpen, setReqOpen] = useState(false)
  const [reqType, setReqType] = useState("Completion")
  const [reqNotes, setReqNotes] = useState("")
  const [viewCert, setViewCert] = useState<Certificate | null>(null)

  async function fetchCertificates() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: student } = await supabase
        .from("students")
        .select("id, full_name")
        .eq("user_id", user.id)
        .single()

      if (!student) {
        setLoading(false)
        return
      }

      setStudentName(student.full_name)

      const { data } = await supabase
        .from("certificates")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })

      if (data) {
        const slugs = [...new Set(data.map((c) => c.course_slug).filter(Boolean))] as string[]
        const { data: courses } = slugs.length
          ? await supabase.from("courses").select("slug, name").in("slug", slugs)
          : { data: null }
        const courseMap = new Map((courses ?? []).map((c) => [c.slug, c.name]))

        setCertificates(
          data.map((c) => ({
            id: c.id,
            name: c.name,
            course: (c.course_slug && courseMap.get(c.course_slug)) || c.course_slug || "Course",
            issuedDate: c.issued_date || "—",
            credentialId: c.credential_id || "—",
            status: c.status as Certificate["status"],
            issueBy: c.issued_by || "TNGC Computers",
            type: c.type,
          }))
        )
      }
    } catch (err) {
      console.error("Failed to fetch certificates:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time data fetch
    fetchCertificates()
  }, [])

  const filtered = tab === "all" ? certificates : certificates.filter((c) => {
    if (tab === "issued") return c.status === "Issued"
    return c.status !== "Issued"
  })

  const issued = certificates.filter((c) => c.status === "Issued").length

  const handleDownload = (cert: Certificate) => {
    const studentDisplay = studentName || "Student"

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${cert.name}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; margin: 0; padding: 40px; color: #1a202c; }
  .cert { max-width: 800px; margin: 0 auto; border: 4px double #16a34a; padding: 48px; text-align: center; }
  .brand { font-size: 28px; font-weight: 700; color: #16a34a; letter-spacing: 2px; }
  .sub { font-size: 12px; letter-spacing: 3px; color: #718096; text-transform: uppercase; margin-top: 4px; }
  .line { border-top: 2px solid #16a34a; margin: 20px auto; width: 120px; }
  .intro { font-size: 13px; color: #718096; text-transform: uppercase; letter-spacing: 2px; }
  .name { font-size: 34px; font-weight: 700; margin: 8px 0 16px; border-bottom: 2px solid #e2e8f0; display: inline-block; padding: 0 24px 8px; }
  .body { font-size: 15px; color: #4a5568; }
  .course { font-size: 20px; font-weight: 700; color: #16a34a; margin: 6px 0; }
  .meta { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; color: #718096; text-align: center; gap: 20px; }
  .meta div { flex: 1; }
  .meta strong { display: block; color: #1a202c; font-size: 14px; margin-top: 6px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="cert">
    <div class="brand">TNGC Computers</div>
    <div class="sub">Certificate of ${cert.type}</div>
    <hr class="line" />
    <p class="intro">This is to certify that</p>
    <p class="name">${studentDisplay}</p>
    <p class="body">has successfully completed the course</p>
    <p class="course">${cert.course}</p>
    <p class="body">with satisfactory performance and has been awarded this certificate.</p>
    <div class="meta">
      <div>Credential ID<strong>${cert.credentialId}</strong></div>
      <div>Date Issued<strong>${cert.issuedDate}</strong></div>
      <div>Issued By<strong>${cert.issueBy}</strong></div>
    </div>
  </div>
  <script>window.onload = function () { window.print(); }</script>
</body>
</html>`

    const win = window.open("", "_blank", "width=900,height=700")
    if (!win) {
      toast("Please allow pop-ups to download certificates", { variant: "destructive" })
      return
    }
    win.document.write(html)
    win.document.close()
    win.focus()
  }

  const handleRequest = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast("Please log in", { variant: "destructive" })
      return
    }

    const { data: student } = await supabase
      .from("students")
      .select("id, full_name, course_slug")
      .eq("user_id", user.id)
      .single()

    if (!student) {
      toast("Student profile not found", { variant: "destructive" })
      return
    }

    const certId = `CERT-${Date.now()}`
    const { error } = await supabase.from("certificates").insert({
      id: certId,
      student_id: student.id,
      student_name: student.full_name,
      course_slug: student.course_slug,
      name: `${reqType} Certificate`,
      type: reqType,
      status: "Requested",
    })

    if (error) {
      toast("Failed to submit request: " + error.message, { variant: "destructive" })
      return
    }

    toast(`Certificate request submitted for ${reqType}`, { variant: "success" })
    setReqOpen(false)
    setReqType("Completion")
    setReqNotes("")
    fetchCertificates()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <Link href="/student/profile" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" />
        Back to Profile
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold">Certificates</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{issued} certificates issued</p>
        </div>
        <Dialog open={reqOpen} onOpenChange={setReqOpen}>
          <DialogTrigger render={<Button size="sm" className="gap-1" />}>
            <Send className="size-3" />
            Request
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request a Certificate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Certificate Type</Label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option>Completion</option>
                  <option>Proficiency</option>
                  <option>Module</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="req-notes">Reason / Notes</Label>
                <textarea
                  id="req-notes"
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  rows={3}
                  placeholder="Why do you need this certificate?"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
              <Button className="w-full" onClick={handleRequest}>
                Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold">{certificates.length}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{issued}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Issued</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{certificates.length - issued}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start gap-1 h-9">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="issued">Issued</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Certificate Cards */}
      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No certificates found.
            </CardContent>
          </Card>
        )}
        {filtered.map((cert) => {
          const cfg = statusConfig[cert.status]
          const Icon = cfg.icon
          return (
            <Card key={cert.id}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="size-9 sm:size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Award className="size-4 sm:size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs sm:text-sm font-medium truncate">{cert.name}</p>
                      <Badge variant="secondary" className={`text-[10px] shrink-0 gap-1 ${cfg.className}`}>
                        <Icon className="size-2.5" />
                        {cert.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-1">{cert.course} &middot; {cert.issueBy}</p>
                    {cert.status === "Issued" && (
                      <p className="text-[10px] text-muted-foreground font-mono">ID: {cert.credentialId} &middot; {cert.issuedDate}</p>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {cert.status === "Issued" && (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => setViewCert(cert)}>
                        <Eye className="size-3" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    )}
                    {cert.status === "Issued" && (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => handleDownload(cert)}>
                        <Download className="size-3" />
                        <span className="hidden sm:inline">Download</span>
                        <span className="sm:hidden">PDF</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Certificate Preview Dialog */}
      <Dialog open={!!viewCert} onOpenChange={(open) => !open && setViewCert(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewCert && (
            <>
              <DialogHeader>
                <DialogTitle>Certificate Preview</DialogTitle>
              </DialogHeader>
              <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-b from-primary/5 to-white p-6 space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-lg font-bold tracking-wider text-primary">TNGC</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Teja Nagendra Government College</p>
                </div>
                <div className="text-center space-y-2 py-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">This is to certify that</p>
                  <p className="text-lg font-bold">{studentName || "Student"}</p>
                  <p className="text-xs text-muted-foreground">has successfully completed</p>
                  <p className="text-sm font-semibold">{viewCert.course}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center text-xs">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-muted-foreground text-[10px]">Credential ID</p>
                    <p className="font-mono font-semibold">{viewCert.credentialId}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-muted-foreground text-[10px]">Date Issued</p>
                    <p className="font-semibold">{viewCert.issuedDate}</p>
                  </div>
                </div>
              </div>
              <Button className="w-full gap-1 mt-2" onClick={() => handleDownload(viewCert)}>
                <Download className="size-3" />
                Download Certificate
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
