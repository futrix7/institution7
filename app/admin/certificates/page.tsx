"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Search,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/sonner"

interface Certificate {
  id: string
  studentName: string
  studentId: string
  course: string
  type: string
  issuedDate: string
  credentialId: string
  status: "Issued" | "Pending" | "Rejected" | "Processing" | "Requested"
}

interface StudentOption {
  id: string
  full_name: string
  course_slug: string | null
  courseName: string
}

const statusConfig: Record<string, { className: string; icon: React.ElementType }> = {
  Issued: { className: "bg-emerald-500/15 text-emerald-600", icon: CheckCircle2 },
  Pending: { className: "bg-amber-500/15 text-amber-600", icon: Clock },
  Rejected: { className: "bg-red-500/15 text-red-600", icon: Clock },
  Processing: { className: "bg-blue-500/15 text-blue-600", icon: Clock },
  Requested: { className: "bg-purple-500/15 text-purple-600", icon: Send },
}

export default function AdminCertificatesPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [issueOpen, setIssueOpen] = useState(false)
  const [students, setStudents] = useState<StudentOption[]>([])
  const [selectedStudent, setSelectedStudent] = useState("")
  const [certType, setCertType] = useState("Completion")
  const [issuing, setIssuing] = useState(false)

  async function fetchCertificates() {
    setLoading(true)
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching certificates:", error)
      setLoading(false)
      return
    }

    const mapped: Certificate[] = (data || []).map((row) => ({
      id: row.id,
      studentName: row.student_name,
      studentId: row.student_id,
      course: row.course_slug || "—",
      type: row.type,
      issuedDate: row.issued_date || "—",
      credentialId: row.credential_id || "—",
      status: row.status,
    }))

    setCertificates(mapped)
    setLoading(false)
  }

  async function fetchStudents() {
    const [studentsRes, instRes] = await Promise.all([
      supabase.from("students").select("id, full_name, course_slug").order("full_name"),
      supabase.from("fee_installments").select("fee_id, status"),
    ])

    const installmentRows = instRes.data || []
    const byFee = new Map<string, string[]>()
    installmentRows.forEach((row) => {
      const arr = byFee.get(row.fee_id) || []
      arr.push(row.status)
      byFee.set(row.fee_id, arr)
    })

    const { data: feesData } = await supabase.from("fees").select("id, student_id")
    const eligibleStudents = new Set(
      (feesData || [])
        .filter((f) => {
          const statuses = byFee.get(f.id)
          return !!statuses && statuses.length > 0 && statuses.every((s) => s === "Paid")
        })
        .map((f) => f.student_id)
    )

    const studentsData = (studentsRes.data || []).filter((s) => eligibleStudents.has(s.id))
    if (studentsData.length === 0) {
      setStudents([])
      return
    }

    const courseSlugs = [...new Set(studentsData.map((s) => s.course_slug).filter(Boolean))] as string[]
    let coursesMap: Record<string, string> = {}

    if (courseSlugs.length > 0) {
      const { data: coursesData } = await supabase
        .from("courses")
        .select("slug, name")
        .in("slug", courseSlugs)
      if (coursesData) {
        coursesMap = Object.fromEntries(coursesData.map((c) => [c.slug, c.name]))
      }
    }

    const options: StudentOption[] = studentsData.map((s) => ({
      id: s.id,
      full_name: s.full_name,
      course_slug: s.course_slug,
      courseName: s.course_slug ? coursesMap[s.course_slug] ?? s.course_slug : "—",
    }))

    setStudents(options)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time data fetch
    fetchCertificates()
  }, [])

  useEffect(() => {
    if (issueOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- load student list when dialog opens
      fetchStudents()
    }
  }, [issueOpen])

  async function handleIssueCertificate() {
    if (!selectedStudent) {
      toast("Please select a student", { variant: "destructive" })
      return
    }

    setIssuing(true)

    const student = students.find((s) => s.id === selectedStudent)
    if (!student) {
      toast("Student not found", { variant: "destructive" })
      setIssuing(false)
      return
    }

    const certId = `CERT-${Date.now()}`
    const credentialId = `TNGC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`

    const { error } = await supabase.from("certificates").insert({
      id: certId,
      student_id: student.id,
      student_name: student.full_name,
      course_slug: student.course_slug,
      name: `${student.courseName} ${certType} Certificate`,
      type: certType as "Completion" | "Proficiency" | "Module",
      credential_id: credentialId,
      issued_date: new Date().toISOString().split("T")[0],
      status: "Issued",
    })

    setIssuing(false)

    if (error) {
      toast("Failed to issue certificate: " + error.message, { variant: "destructive" })
      return
    }

    toast("Certificate issued successfully", { variant: "success" })
    setSelectedStudent("")
    setCertType("Completion")
    setIssueOpen(false)
    fetchCertificates()
  }

  const stats = [
    { label: "Issued", value: certificates.filter((c) => c.status === "Issued").length, color: "text-emerald-600" },
    { label: "Pending", value: certificates.filter((c) => c.status === "Pending").length, color: "text-amber-600" },
    { label: "Rejected", value: certificates.filter((c) => c.status === "Rejected").length, color: "text-red-600" },
    { label: "Total", value: certificates.length, color: "text-foreground" },
  ]

  const filtered = certificates.filter(
    (c) =>
      c.studentName.toLowerCase().includes(search.toLowerCase()) ||
      c.course.toLowerCase().includes(search.toLowerCase()) ||
      c.credentialId.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Certificates</h1>
          <p className="text-xs text-muted-foreground">Issue and manage student certificates</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setIssueOpen(true)}>
          <Send className="h-4 w-4" />
          Issue Certificate
        </Button>
      </div>

      <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground truncate">{stat.label}</p>
              <p className={cn("text-sm font-bold shrink-0", stat.color)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Certificates</CardTitle>
              <CardDescription>{filtered.length} certificates found</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-8 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="hidden md:table-cell">Course</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden lg:table-cell">Credential ID</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Award className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No certificates found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((cert) => {
                const cfg = statusConfig[cert.status] || statusConfig.Pending
                const Icon = cfg.icon
                return (
                  <TableRow key={cert.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {cert.studentName.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{cert.studentName}</p>
                          <p className="text-[11px] text-muted-foreground font-mono md:hidden">{cert.studentId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{cert.course}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{cert.type}</TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">{cert.credentialId}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{cert.issuedDate}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("text-[10px] gap-1", cfg.className)}>
                        <Icon className="size-2.5" />
                        {cert.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="size-5" />
              Issue Certificate
            </DialogTitle>
            <DialogDescription>
              Only students who have completed all their installments can receive a certificate
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>Select Student *</Label>
              <Select value={selectedStudent} onValueChange={(v) => setSelectedStudent(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} — {s.courseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {students.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No students have completed all their installments yet.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Certificate Type *</Label>
              <Select value={certType} onValueChange={(v) => setCertType(v ?? "Completion")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completion">Completion</SelectItem>
                  <SelectItem value="Proficiency">Proficiency</SelectItem>
                  <SelectItem value="Module">Module</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleIssueCertificate} disabled={issuing || !selectedStudent}>
              {issuing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Issuing...
                </>
              ) : (
                <>
                  <Award className="size-4" />
                  Issue Certificate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
