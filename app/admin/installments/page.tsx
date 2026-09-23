"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
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
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/sonner"

interface Installment {
  id: string
  feeId: string
  studentId: string
  studentName: string
  course: string
  label: string
  installmentNo: number
  amount: number
  dueDate: string
  paidDate: string | null
  status: "Paid" | "Pending"
  branch: string
}

interface StudentOption {
  id: string
  full_name: string
  course_slug: string | null
  courseName: string
  feeId: string
  total_fee: number
  paid_amount: number
  branch_name: string
}

const statusConfig: Record<string, { className: string; icon: React.ElementType }> = {
  Paid: { className: "bg-emerald-500/15 text-emerald-600", icon: CheckCircle2 },
  Pending: { className: "bg-amber-500/15 text-amber-600", icon: Clock },
  Overdue: { className: "bg-red-500/15 text-red-600", icon: AlertTriangle },
}

export default function InstallmentsPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [installments, setInstallments] = useState<Installment[]>([])
  const [stats, setStats] = useState([
    { label: "Total Collected", value: "₹0", color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Pending", value: "₹0", color: "text-amber-600 dark:text-amber-400" },
    { label: "Overdue", value: "₹0", color: "text-red-600 dark:text-red-400" },
    { label: "This Month", value: "₹0", color: "text-foreground" },
  ])
  const perPage = 10

  const [addOpen, setAddOpen] = useState(false)
  const [students, setStudents] = useState<StudentOption[]>([])
  const [selectedStudent, setSelectedStudent] = useState("")
  const [installmentCount, setInstallmentCount] = useState("3")
  const [creating, setCreating] = useState(false)

  const [payOpen, setPayOpen] = useState(false)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)

  const fetchInstallments = useCallback(async () => {
    setLoading(true)

    const { data: rows, error } = await supabase
      .from("fee_installments")
      .select("*, fees!inner(id, student_id, course_slug)")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching installments:", error)
      setLoading(false)
      return
    }

    if (!rows || rows.length === 0) {
      setInstallments([])
      setLoading(false)
      return
    }

    const studentIds = [...new Set(rows.map((r: any) => r.fees?.student_id).filter(Boolean))] as string[]
    const courseSlugs = [...new Set(rows.map((r: any) => r.fees?.course_slug).filter(Boolean))] as string[]
    const feeIds = [...new Set(rows.map((r: any) => r.fee_id).filter(Boolean))] as string[]

    const [studentsRes, coursesRes] = await Promise.all([
      supabase.from("students").select("id, full_name, branch_id").in("id", studentIds),
      supabase.from("courses").select("slug, name").in("slug", courseSlugs),
    ])

    const studentsMap: Record<string, any> = Object.fromEntries((studentsRes.data || []).map((s: any) => [s.id, s]))
    const coursesMap: Record<string, string> = Object.fromEntries((coursesRes.data || []).map((c: any) => [c.slug, c.name]))

    const branchIds = [...new Set((studentsRes.data || []).map((s: any) => s.branch_id).filter(Boolean))] as string[]
    let branchesMap: Record<string, string> = {}
    if (branchIds.length > 0) {
      const { data: branchRows } = await supabase.from("branches").select("id, name").in("id", branchIds)
      if (branchRows) {
        branchesMap = Object.fromEntries(branchRows.map((b: any) => [b.id, b.name]))
      }
    }

    const installMap = new Map<string, number>()

    const parsed: Installment[] = rows.map((row: any) => {
      const feeId = row.fee_id
      const count = (installMap.get(feeId) || 0) + 1
      installMap.set(feeId, count)

      const student = studentsMap[row.fees?.student_id]
      const branchName = student ? (branchesMap[student.branch_id] || "N/A") : "N/A"
      const courseName = coursesMap[row.fees?.course_slug] || row.fees?.course_slug || "N/A"

      return {
        id: row.id,
        feeId,
        studentId: row.fees?.student_id ?? "N/A",
        studentName: student?.full_name ?? "Unknown",
        course: courseName,
        label: row.label,
        installmentNo: count,
        amount: row.amount,
        dueDate: row.due_date,
        paidDate: row.paid_date,
        status: row.status as "Paid" | "Pending",
        branch: branchName,
      }
    })

    setInstallments(parsed)

    const totalCollected = parsed
      .filter((i) => i.status === "Paid")
      .reduce((sum, i) => sum + i.amount, 0)
    const pendingAmount = parsed
      .filter((i) => i.status === "Pending")
      .reduce((sum, i) => sum + i.amount, 0)
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const thisMonthAmount = parsed
      .filter((i) => i.status === "Paid" && i.paidDate?.startsWith(thisMonth))
      .reduce((sum, i) => sum + i.amount, 0)

    setStats([
      { label: "Total Collected", value: `₹${totalCollected.toLocaleString("en-IN")}`, color: "text-emerald-600 dark:text-emerald-400" },
      { label: "Pending", value: `₹${pendingAmount.toLocaleString("en-IN")}`, color: "text-amber-600 dark:text-amber-400" },
      { label: "Overdue", value: `₹${pendingAmount.toLocaleString("en-IN")}`, color: "text-red-600 dark:text-red-400" },
      { label: "This Month", value: `₹${thisMonthAmount.toLocaleString("en-IN")}`, color: "text-foreground" },
    ])

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchInstallments()
  }, [fetchInstallments])

  async function fetchStudents() {
    const { data: feesData } = await supabase
      .from("fees")
      .select("id, student_id, course_slug, total_fee, paid_amount")

    if (!feesData || feesData.length === 0) {
      setStudents([])
      return
    }

    const studentIds = feesData.map((f) => f.student_id).filter(Boolean) as string[]
    const courseSlugs = feesData.map((f) => f.course_slug).filter(Boolean) as string[]

    const [studentsRes, coursesRes] = await Promise.all([
      supabase.from("students").select("id, full_name, branch_id").in("id", studentIds),
      supabase.from("courses").select("slug, name").in("slug", courseSlugs),
    ])

    const coursesMap: Record<string, string> = Object.fromEntries((coursesRes.data || []).map((c: any) => [c.slug, c.name]))

    const branchIds = [...new Set((studentsRes.data || []).map((s: any) => s.branch_id).filter(Boolean))] as string[]
    let branchesMap: Record<string, string> = {}
    if (branchIds.length > 0) {
      const { data: branchRows } = await supabase.from("branches").select("id, name").in("id", branchIds)
      if (branchRows) {
        branchesMap = Object.fromEntries(branchRows.map((b: any) => [b.id, b.name]))
      }
    }

    const studentsMap: Record<string, any> = Object.fromEntries((studentsRes.data || []).map((s: any) => [s.id, s]))

    const options: StudentOption[] = feesData.map((f) => {
      const s = studentsMap[f.student_id]
      return {
        id: f.student_id,
        full_name: s?.full_name ?? "Unknown",
        course_slug: f.course_slug,
        courseName: coursesMap[f.course_slug] ?? f.course_slug ?? "N/A",
        feeId: f.id,
        total_fee: f.total_fee,
        paid_amount: f.paid_amount,
        branch_name: branchesMap[s?.branch_id] ?? "N/A",
      }
    })

    setStudents(options)
  }

  async function handleCreateInstallments() {
    if (!selectedStudent) {
      toast("Please select a student", { variant: "destructive" })
      return
    }

    setCreating(true)
    const student = students.find((s) => s.id === selectedStudent && s.feeId === selectedStudent)
      || students.find((s) => s.id === selectedStudent)
    if (!student) {
      toast("Student not found", { variant: "destructive" })
      setCreating(false)
      return
    }

    const { data: existing } = await supabase
      .from("fee_installments")
      .select("id")
      .eq("fee_id", student.feeId)
      .limit(1)

    if (existing && existing.length > 0) {
      toast("Installment plan already exists for this student", { variant: "destructive" })
      setCreating(false)
      return
    }

    const count = parseInt(installmentCount)
    const remaining = student.total_fee - student.paid_amount
    const perMonth = Math.ceil(remaining / count)

    const now = new Date()
    const rows = Array.from({ length: count }, (_, i) => ({
      fee_id: student.feeId,
      label: `Installment ${i + 1} of ${count}`,
      amount: perMonth,
      due_date: new Date(now.getFullYear(), now.getMonth() + i + 1, 1).toISOString().split("T")[0],
      status: "Pending" as const,
    }))

    const { error } = await supabase.from("fee_installments").insert(rows)

    setCreating(false)

    if (error) {
      toast("Failed to create installments: " + error.message, { variant: "destructive" })
      return
    }

    toast(`${count}-month installment plan created`, { variant: "success" })
    setSelectedStudent("")
    setInstallmentCount("3")
    setAddOpen(false)
    fetchInstallments()
  }

  async function handleMarkPaid() {
    if (!payingId) return
    setPaying(true)

    const { error } = await supabase
      .from("fee_installments")
      .update({
        status: "Paid",
        paid_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", payingId)

    setPaying(false)

    if (error) {
      toast("Failed to mark as paid: " + error.message, { variant: "destructive" })
      return
    }

    toast("Installment marked as paid", { variant: "success" })
    setPayOpen(false)
    setPayingId(null)
    fetchInstallments()
  }

  const filtered = installments.filter((inst) => {
    const matchesSearch =
      inst.studentName.toLowerCase().includes(search.toLowerCase()) ||
      inst.studentId.toLowerCase().includes(search.toLowerCase()) ||
      inst.course.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "all" || inst.status.toLowerCase() === filter
    return matchesSearch && matchesFilter
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

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
          <h1 className="text-2xl font-bold tracking-tight">Installments</h1>
          <p className="text-xs text-muted-foreground">Track and manage student installment payments</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => { setAddOpen(true); fetchStudents() }}>
          <Plus className="h-4 w-4" />
          Create Plan
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
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Installment Records</h2>
              <p className="text-sm text-muted-foreground">
                Showing {filtered.length} of {installments.length} installments
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search student or course..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                  className="pl-8 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </CardContent>

        <CardContent className="space-y-4">
          <Tabs value={filter} onValueChange={(v) => { setFilter(v ?? "all"); setCurrentPage(1) }}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>
          </Tabs>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="hidden md:table-cell">Course</TableHead>
                <TableHead>Installment</TableHead>
                <TableHead className="hidden sm:table-cell">Amount</TableHead>
                <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                <TableHead className="hidden lg:table-cell">Paid Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((inst) => {
                const cfg = statusConfig[inst.status]
                const Icon = cfg.icon
                return (
                  <TableRow key={inst.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{inst.studentName}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{inst.course}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{inst.course}</TableCell>
                    <TableCell>
                      <span className="font-medium">{inst.label}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-medium">₹{inst.amount.toLocaleString()}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{inst.dueDate}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{inst.paidDate ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("gap-1", cfg.className)}>
                        <Icon className="size-3" />
                        {inst.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inst.status === "Pending" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => { setPayingId(inst.id); setPayOpen(true) }}
                          title="Mark as paid"
                        >
                          <CheckCircle2 className="size-4 text-emerald-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No installments found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages || 1}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5" />
              Create Installment Plan
            </DialogTitle>
            <DialogDescription>
              Set up a monthly installment plan for a student
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
                    <SelectItem key={`${s.feeId}-${s.id}`} value={s.id}>
                      {s.full_name} — {s.courseName} (Fee: ₹{s.total_fee.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Number of Months *</Label>
              <Select value={installmentCount} onValueChange={(v) => setInstallmentCount(v ?? "3")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Months</SelectItem>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="4">4 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedStudent && (() => {
              const s = students.find((st) => st.id === selectedStudent)
              if (!s) return null
              const count = parseInt(installmentCount)
              const remaining = s.total_fee - s.paid_amount
              const perMonth = Math.ceil(remaining / count)
              return (
                <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Fee</span>
                    <span className="font-medium">₹{s.total_fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Already Paid</span>
                    <span className="font-medium">₹{s.paid_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-medium">₹{remaining.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-semibold">Per Month ({count} months)</span>
                    <span className="font-semibold text-primary">₹{perMonth.toLocaleString()}</span>
                  </div>
                </div>
              )
            })()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateInstallments} disabled={creating || !selectedStudent}>
              {creating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Plan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={(open) => { setPayOpen(open); if (!open) setPayingId(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
            <DialogDescription>
              Confirm this installment has been paid?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPayOpen(false); setPayingId(null) }}>Cancel</Button>
            <Button onClick={handleMarkPaid} disabled={paying} className="bg-emerald-600 hover:bg-emerald-700">
              {paying ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
