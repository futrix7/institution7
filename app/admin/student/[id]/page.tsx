"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  ArrowLeft,
  UserCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Download,
  CheckCircle2,
  Clock,
  Award,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

interface StudentData {
  name: string
  id: string
  email: string
  phone: string
  dob: string
  address: string
  course: string
  branch: string
  joinDate: string
  batchTime: string
  fatherName: string
  fatherPhone: string
  motherName: string
  status: "Active" | "Inactive" | "Pending"
}

interface Installment {
  label: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: "Paid" | "Pending"
}

interface Payment {
  id: string
  date: string
  amount: number
  mode: string
  status: "Paid" | "Pending"
  for: string
}

interface AttendanceMonth {
  month: string
  present: number
  absent: number
  leave: number
  pct: number
}

interface AttendanceData {
  overall: number
  present: number
  absent: number
  leave: number
  months: AttendanceMonth[]
}

interface Certificate {
  id: string
  name: string
  issuedDate: string | null
  status: "Issued" | "Processing" | "Pending" | "Rejected" | "Requested"
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Active: "default",
  Pending: "secondary",
  Inactive: "destructive",
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [student, setStudent] = useState<StudentData | null>(null)
  const [installments, setInstallments] = useState<Installment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    overall: 0,
    present: 0,
    absent: 0,
    leave: 0,
    months: [],
  })
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [totalFee, setTotalFee] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const { data: studentRow, error: studentError } = await supabase
        .from("students")
        .select("id, full_name, email, phone, date_of_birth, address, course_slug, branch_id, enrollment_date, batch_time, father_name, father_phone, mother_name, status")
        .eq("id", id)
        .single()

      if (studentError || !studentRow) {
        console.error("Error fetching student:", studentError)
        setNotFound(true)
        setLoading(false)
        return
      }

      let courseName = studentRow.course_slug ?? ""
      let branchName = studentRow.branch_id ?? ""

      if (studentRow.course_slug) {
        const { data: courseData } = await supabase
          .from("courses")
          .select("name")
          .eq("slug", studentRow.course_slug)
          .single()
        if (courseData) courseName = courseData.name
      }

      if (studentRow.branch_id) {
        const { data: branchData } = await supabase
          .from("branches")
          .select("name")
          .eq("id", studentRow.branch_id)
          .single()
        if (branchData) branchName = branchData.name
      }

      setStudent({
        name: studentRow.full_name,
        id: studentRow.id,
        email: studentRow.email,
        phone: studentRow.phone,
        dob: studentRow.date_of_birth ?? "",
        address: studentRow.address ?? "",
        course: courseName,
        branch: branchName,
        joinDate: studentRow.enrollment_date,
        batchTime: studentRow.batch_time ?? "",
        fatherName: studentRow.father_name ?? "",
        fatherPhone: studentRow.father_phone ?? "",
        motherName: studentRow.mother_name ?? "",
        status: studentRow.status as StudentData["status"],
      })

      const { data: feesRows } = await supabase
        .from("fees")
        .select("id, total_fee, paid_amount")
        .eq("student_id", id)

      if (feesRows && feesRows.length > 0) {
        const fTotal = feesRows.reduce((sum: number, f: Record<string, number>) => sum + (f.total_fee ?? 0), 0)
        const fPaid = feesRows.reduce((sum: number, f: Record<string, number>) => sum + (f.paid_amount ?? 0), 0)
        setTotalFee(fTotal)
        setPaidAmount(fPaid)

        const feeIds = feesRows.map((f) => f.id)
        const { data: instRows } = await supabase
          .from("fee_installments")
          .select("label, amount, due_date, paid_date, status")
          .in("fee_id", feeIds)
          .order("due_date", { ascending: true })

        if (instRows) {
          setInstallments(
            instRows.map((i) => ({
              label: i.label,
              amount: i.amount,
              dueDate: i.due_date,
              paidDate: i.paid_date,
              status: i.status === "Paid" ? "Paid" : "Pending",
            }))
          )
        }
      }

      const { data: paymentRows } = await supabase
        .from("payments")
        .select("id, amount, payment_date, method, status, description")
        .eq("student_id", id)
        .order("payment_date", { ascending: false })

      if (paymentRows) {
        setPayments(
          paymentRows.map((p) => ({
            id: p.id,
            date: p.payment_date,
            amount: p.amount,
            mode: p.method,
            status: p.status === "Paid" ? "Paid" : "Pending",
            for: p.description ?? "",
          }))
        )
      }

      const { data: attRows } = await supabase
        .from("attendance")
        .select("date, status")
        .eq("student_id", id)
        .order("date", { ascending: false })

      if (attRows) {
        const totalRecords = attRows.length
        const presentCount = attRows.filter((a) => a.status === "Present").length
        const absentCount = attRows.filter((a) => a.status === "Absent").length
        const leaveCount = attRows.filter((a) => a.status === "Leave").length
        const overallPct = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0

        const monthMap: Record<string, { present: number; absent: number; leave: number; total: number }> = {}
        for (const row of attRows) {
          const d = new Date(row.date)
          const key = `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`
          if (!monthMap[key]) {
            monthMap[key] = { present: 0, absent: 0, leave: 0, total: 0 }
          }
          monthMap[key].total++
          if (row.status === "Present") monthMap[key].present++
          if (row.status === "Absent") monthMap[key].absent++
          if (row.status === "Leave") monthMap[key].leave++
        }

        const months: AttendanceMonth[] = Object.entries(monthMap)
          .slice(0, 6)
          .map(([month, data]) => ({
            month,
            present: data.present,
            absent: data.absent,
            leave: data.leave,
            pct: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
          }))

        setAttendanceData({
          overall: overallPct,
          present: presentCount,
          absent: absentCount,
          leave: leaveCount,
          months,
        })
      }

      const { data: certRows } = await supabase
        .from("certificates")
        .select("id, name, issued_date, status")
        .eq("student_id", id)
        .order("created_at", { ascending: false })

      if (certRows) {
        setCertificates(
          certRows.map((c) => ({
            id: c.id,
            name: c.name,
            issuedDate: c.issued_date,
            status: c.status as Certificate["status"],
          }))
        )
      }

      setLoading(false)
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !student) {
    return (
      <div className="space-y-4">
        <Link href="/admin/student" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Students
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-semibold">Student not found</p>
            <p className="text-sm text-muted-foreground mt-1">No student found with ID: {id}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pendingFee = totalFee - paidAmount
  const paidPct = totalFee > 0 ? Math.round((paidAmount / totalFee) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/admin/student" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to Students
      </Link>

      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="h-20 sm:h-28 bg-gradient-to-br from-primary/20 to-primary/5" />
        <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-9 sm:-mt-10">
            <div className="relative self-center sm:self-auto">
              <div className="flex size-18 sm:size-20 items-center justify-center rounded-full border-4 border-background bg-muted text-xl sm:text-2xl font-bold" style={{ width: "5rem", height: "5rem" }}>
                {student.name.split(" ").map((n) => n[0]).join("")}
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left pb-1">
              <h1 className="text-lg sm:text-xl font-bold">{student.name}</h1>
              <p className="text-xs text-muted-foreground">{student.id}</p>
            </div>
            <div className="flex gap-2 self-center sm:self-auto">
              <Badge variant="secondary" className="text-[11px] sm:text-xs">{student.course}</Badge>
              <Badge variant="secondary" className="text-[11px] sm:text-xs">{student.branch}</Badge>
              <Badge variant={statusVariant[student.status]} className="text-[11px] sm:text-xs">{student.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fee">Fee</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 sm:p-5">
                <h2 className="text-sm sm:text-base font-semibold mb-3">Personal Information</h2>
                <div className="divide-y divide-border">
                  {[
                    { icon: Mail, label: "Email", value: student.email },
                    { icon: Phone, label: "Phone", value: student.phone },
                    { icon: Calendar, label: "Date of Birth", value: student.dob },
                    { icon: MapPin, label: "Address", value: student.address },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-2.5 sm:gap-3 py-2.5 sm:py-3">
                      <div className="size-8 sm:size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <row.icon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">{row.label}</p>
                        <p className="text-xs sm:text-sm truncate">{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-5">
                <h2 className="text-sm sm:text-base font-semibold mb-3">Course Details</h2>
                <div className="divide-y divide-border">
                  {[
                    { icon: BookOpen, label: "Course", value: student.course },
                    { icon: MapPin, label: "Branch", value: student.branch },
                    { icon: Calendar, label: "Join Date", value: student.joinDate },
                    { icon: UserCircle, label: "Batch Time", value: student.batchTime },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-2.5 sm:gap-3 py-2.5 sm:py-3">
                      <div className="size-8 sm:size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <row.icon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">{row.label}</p>
                        <p className="text-xs sm:text-sm truncate">{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <h2 className="text-sm sm:text-base font-semibold mb-3">Parent / Guardian</h2>
              <div className="grid sm:grid-cols-3 gap-1 sm:gap-4 divide-y sm:divide-y-0 divide-border">
                {[
                  { icon: UserCircle, label: "Father's Name", value: student.fatherName },
                  { icon: Phone, label: "Father's Phone", value: student.fatherPhone },
                  { icon: UserCircle, label: "Mother's Name", value: student.motherName },
                ].map((row) => (
                  <div key={row.label} className="sm:px-4 first:sm:pl-0 py-2.5 sm:py-0">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="size-8 sm:size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <row.icon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">{row.label}</p>
                        <p className="text-xs sm:text-sm truncate">{row.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4 sm:p-5 text-center">
                <div className="inline-flex size-20 sm:size-24 items-center justify-center rounded-full border-4 border-primary/30 bg-primary/10 mb-2 sm:mb-3">
                  <p className="text-2xl sm:text-3xl font-bold text-primary">{attendanceData.overall}%</p>
                </div>
                <p className="text-xs sm:text-sm font-medium">Overall Attendance</p>
                <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-emerald-600">{attendanceData.present}</p>
                    <p className="text-[10px] text-muted-foreground">Present</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-red-600">{attendanceData.absent}</p>
                    <p className="text-[10px] text-muted-foreground">Absent</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-amber-600">{attendanceData.leave}</p>
                    <p className="text-[10px] text-muted-foreground">Leave</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-4 sm:p-5">
                  <h3 className="text-sm font-semibold mb-3">Monthly Breakdown</h3>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {attendanceData.months.map((m) => (
                      <div key={m.month} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                        <p className="text-xs sm:text-sm font-medium">{m.month}</p>
                        <p className={cn("text-xs sm:text-sm font-bold", m.pct >= 85 ? "text-emerald-600" : m.pct >= 75 ? "text-amber-600" : "text-red-600")}>{m.pct}%</p>
                      </div>
                    ))}
                    {attendanceData.months.length === 0 && (
                      <p className="text-xs text-muted-foreground col-span-2">No attendance data available.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Fee Tab */}
        <TabsContent value="fee" className="space-y-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Fee</p>
                  <p className="text-2xl sm:text-3xl font-bold">₹{totalFee.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-muted-foreground">Paid</p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-600">₹{paidAmount.toLocaleString()}</p>
                </div>
              </div>
              <Progress value={paidPct} className="h-2 sm:h-2.5 mb-1.5 sm:mb-2" />
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">{paidPct}% paid</span>
                <span className="text-amber-600 font-medium">₹{pendingFee.toLocaleString()} remaining</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <h3 className="text-sm font-semibold mb-3">Installment Schedule</h3>
              <div className="space-y-2.5">
                {installments.map((inst, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border p-2.5 sm:p-3">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      {inst.status === "Paid" ? (
                        <CheckCircle2 className="size-4 sm:size-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="size-4 sm:size-5 text-amber-600 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{inst.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Due: {inst.dueDate}{inst.paidDate ? ` · Paid: ${inst.paidDate}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs sm:text-sm font-bold">₹{inst.amount.toLocaleString()}</p>
                      <Badge variant="secondary" className={`text-[10px] ${inst.status === "Paid" ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"}`}>
                        {inst.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {installments.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No installment data available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">Total Paid</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-600">₹{paidAmount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-600">₹{pendingFee.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment For</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Mode</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.for}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{p.date}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{p.mode}</TableCell>
                      <TableCell className="font-medium">₹{p.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("text-[10px]", p.status === "Paid" ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600")}>
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <p className="text-muted-foreground">No payment records found.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="space-y-4">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold">{certificates.length}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold text-emerald-600">{certificates.filter((c) => c.status === "Issued").length}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">Issued</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{certificates.filter((c) => c.status === "Processing").length}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">Processing</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2.5">
            {certificates.map((cert) => (
              <Card key={cert.id}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="size-9 sm:size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Award className="size-4 sm:size-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs sm:text-sm font-medium truncate">{cert.name}</p>
                        <Badge variant="secondary" className={cn("text-[10px] shrink-0", cert.status === "Issued" ? "bg-emerald-500/15 text-emerald-600" : "bg-blue-500/15 text-blue-600")}>
                          {cert.status}
                        </Badge>
                      </div>
                      {cert.status === "Issued" && cert.issuedDate && (
                        <p className="text-[10px] text-muted-foreground font-mono">Issued: {cert.issuedDate}</p>
                      )}
                    </div>
                    {cert.status === "Issued" && (
                      <Button variant="outline" size="sm" className="gap-1 shrink-0">
                        <Download className="size-3" />
                        <span className="hidden sm:inline">Download</span>
                        <span className="sm:hidden">PDF</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {certificates.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No certificates found.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
