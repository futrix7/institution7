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
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  Plus,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ExportDialog } from "@/components/admin/export-dialog"
import { RecordPaymentSheet } from "@/components/admin/record-payment-sheet"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/sonner"
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { tooltipStyle, axisStyle, gridStyle, CHART_PALETTE } from "@/lib/chart-theme"

type PaymentStatus = "Paid" | "Pending" | "Partial" | "Overdue" | "Rejected"

interface Payment {
  id: string
  studentName: string
  course: string
  amount: string
  amountRaw: number
  date: string
  method: string
  status: PaymentStatus
  /** What the student says they paid against — the UPI reference, if they gave one. */
  reference: string
  /** Which installments this row settles, when it is linked to any. */
  installmentIds: string[]
  /** Shared by every row minted from one student transaction. */
  groupKey: string
}

interface WeeklyDatum {
  week: string
  amount: number
}

function statusConfig(status: PaymentStatus) {
  switch (status) {
    case "Paid":
      return { className: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-500/25", icon: CheckCircle2 }
    case "Pending":
      return { className: "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 hover:bg-amber-500/25", icon: Clock }
    case "Partial":
      return { className: "bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 hover:bg-sky-500/25", icon: Receipt }
    case "Overdue":
      return { className: "bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 hover:bg-rose-500/25", icon: XCircle }
    // A refused or reversed claim. Muted rather than red: nothing is outstanding
    // here, the claim simply did not stand up. It is already excluded from the
    // revenue figures, which sum status = 'Paid'.
    case "Rejected":
      return { className: "bg-muted text-muted-foreground hover:bg-muted", icon: XCircle }
  }
}

function getWeekNumber(dateStr: string): number {
  const d = new Date(dateStr)
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1)
  return Math.ceil((d.getDate() + firstDay.getDay()) / 7)
}

export default function PaymentsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [exportOpen, setExportOpen] = useState(false)
  const [recordOpen, setRecordOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [payments, setPayments] = useState<Payment[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyDatum[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  // Written onto the payment row, so the student can see why a claim was refused
  // and what to correct. Required for a rejection: "rejected" on its own leaves
  // them with nothing to act on, and the whole point of releasing the claim is
  // that they can pay again.
  const [verificationNote, setVerificationNote] = useState("")
  const [verifying, setVerifying] = useState(false)
  const rowsPerPage = 8

  // Only rows still awaiting a decision can be selected. A Paid row has already
  // been through this and is reversed from the installments page instead, which
  // is the action that knows how to give the money back.
  const pendingPayments = payments.filter((p) => p.status === "Pending")
  const selectedPayments = payments.filter((p) => selected.includes(p.id))
  const selectedTotal = selectedPayments.reduce((sum, p) => sum + p.amountRaw, 0)

  function toggleSelected(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  /**
   * Confirms or rejects a student's claim.
   *
   * This action did not exist before, which is the whole reason "I verified the
   * payment but the student still shows it as unpaid" happened: the only way to
   * clear a Pending payment was to add a second, separate Paid row by hand, which
   * left the claim itself still pending and the installment untouched.
   *
   * Selecting a group key rather than a row id is deliberate — a student who pays
   * three installments in one transaction gets three rows, and checking the UPI
   * reference once should settle all three.
   */
  async function handleVerify(approve: boolean) {
    if (selected.length === 0 || verifying) return
    setVerifying(true)

    // Every row sharing a selected row's group, so a multi-installment payment is
    // decided as the single transaction it actually was.
    const groups = new Set(selectedPayments.map((p) => p.groupKey))
    const paymentIds = payments.filter((p) => groups.has(p.groupKey)).map((p) => p.id)

    try {
      // The endpoint verifies the admin session server-side; without the token
      // it cannot tell an administrator from an anonymous visitor.
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      if (!token) {
        toast("Your session has expired. Please sign in again.", { variant: "destructive" })
        return
      }

      const res = await fetch("/api/installments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentIds, approve, note: verificationNote.trim() }),
      })

      const json = (await res.json()) as { error?: string; settled?: number; amount?: number }

      if (!res.ok) {
        toast(json.error ?? "We couldn't record that decision.", { variant: "destructive" })
        return
      }

      if (approve) {
        const settled = json.settled ?? 0
        const amount = json.amount ?? 0
        toast(
          settled > 0
            ? `Verified ₹${amount.toLocaleString("en-IN")} and settled ${settled} installment${settled === 1 ? "" : "s"}.`
            : "Payment verified. It is not linked to an installment, so no schedule changed.",
          { variant: "success" }
        )
      } else {
        toast("Rejected. The student can submit the payment again.", { variant: "success" })
      }

      setSelected([])
      setVerificationNote("")
      setReloadKey((k) => k + 1)
    } catch {
      toast("We couldn't record that decision. Nothing was changed — please try again.", {
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("id, student_name, course_slug, amount, payment_date, method, status, description, installment_id, receipt_no")
        .order("payment_date", { ascending: false })
        
      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError)
        setLoading(false)
        return
      }

      const { data: coursesData } = await supabase
        .from("courses")
        .select("slug, name")

      const courseMap = new Map<string, string>()
      if (coursesData) {
        coursesData.forEach((c) => courseMap.set(c.slug, c.name))
      }

      const mapped: Payment[] = (paymentsData || []).map((p) => ({
        id: p.id,
        studentName: p.student_name,
        course: p.course_slug ? (courseMap.get(p.course_slug) || p.course_slug) : "N/A",
        amount: `₹${Number(p.amount).toLocaleString("en-IN")}`,
        amountRaw: Number(p.amount),
        date: new Date(p.payment_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        method: p.method,
        status: p.status as PaymentStatus,
        // The student-facing claim, shown so an admin has the UPI reference in
        // front of them instead of having to open the database to check it.
        reference: p.description ?? "",
        installmentIds: p.installment_id ? [p.installment_id] : [],
        groupKey: p.receipt_no ?? p.id,
      }))

      setPayments(mapped)

      // Revenue is only what has actually been verified. This summed every row
      // the query returned, so a Pending claim and now a Rejected one both landed
      // in the chart as income — the dashboard reported money the institute had
      // not received, and unmarking an installment did not remove it either,
      // because its row was simply gone rather than reversed.
      const weekMap = new Map<number, number>()
      for (const p of paymentsData || []) {
        if (p.status !== "Paid") continue
        const wk = getWeekNumber(p.payment_date)
        weekMap.set(wk, (weekMap.get(wk) || 0) + Number(p.amount))
      }

      const weekLabels: Record<number, string> = { 1: "Week 1", 2: "Week 2", 3: "Week 3", 4: "Week 4", 5: "Week 5" }
      const wd: WeeklyDatum[] = Array.from(weekMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([wk, amt]) => ({ week: weekLabels[wk] || `Week ${wk}`, amount: amt }))
      setWeeklyData(wd)

      setLoading(false)
    }

    fetchData()
  }, [reloadKey])

  const filteredPayments = payments.filter(
    (p) =>
      p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.course.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage)
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading payments...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-xs text-muted-foreground">Payment history and records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setRecordOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Weekly Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis dataKey="week" tick={axisStyle} />
              <YAxis tick={axisStyle} tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Amount"]} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {weeklyData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Showing {paginatedPayments.length} of {filteredPayments.length} payments
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  className="pl-8 w-64"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Date Range
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* The decision an admin has to make on every claimed payment. Without
              it a Pending row could only ever be cleared by hand-editing the
              database, and the installment it paid for stayed unpaid. */}
          {pendingPayments.length > 0 && (
            <div className="mb-4 space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    {pendingPayments.length} payment{pendingPayments.length === 1 ? "" : "s"} awaiting verification
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Check each UPI reference, then verify. Verifying marks the installment
                    paid and moves the student&rsquo;s balance.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selected.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {selected.length} selected · {selectedTotal.toLocaleString("en-IN")}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selected.length === 0 || verifying || !verificationNote.trim()}
                    onClick={() => handleVerify(false)}
                    title={verificationNote.trim() ? undefined : "Give a reason so the student knows what to correct"}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    disabled={selected.length === 0 || verifying}
                    onClick={() => handleVerify(true)}
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Verify &amp; mark paid
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="verificationNote" className="text-xs">
                  Note (required to reject)
                </Label>
                <Input
                  id="verificationNote"
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  placeholder="e.g. UPI reference not found in the bank statement"
                  className="h-9 text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Saved to the payment record. On a rejection the student sees it on their
                  payment history, and the claim is released so they can pay again.
                </p>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Payment ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPayments.map((payment) => {
                const cfg = statusConfig(payment.status)
                const Icon = cfg.icon
                const selectable = payment.status === "Pending"
                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {selectable && (
                        <input
                          type="checkbox"
                          aria-label={`Select ${payment.id} for verification`}
                          checked={selected.includes(payment.id)}
                          onChange={() => toggleSelected(payment.id)}
                          className="size-4 accent-primary"
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.id}
                      {payment.reference && (
                        <p className="max-w-48 truncate font-sans text-xs text-muted-foreground" title={payment.reference}>
                          {payment.reference}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{payment.studentName}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.course}</TableCell>
                    <TableCell className="text-right font-medium">{payment.amount}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.date}</TableCell>
                    <TableCell className="capitalize">{payment.method}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("gap-1", cfg.className)}>
                        <Icon className="h-3 w-3" />
                        {payment.status === "Pending"
                          ? "Awaiting verification"
                          : payment.status === "Rejected"
                            ? "Rejected / reversed"
                            : payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        rows={payments.map((p) => ({
          ID: p.id,
          Student: p.studentName,
          Course: p.course,
          Amount: p.amount,
          Date: p.date,
          Method: p.method,
          Status: p.status,
        }))}
        filename="payments-report"
      />
      <RecordPaymentSheet
        open={recordOpen}
        onOpenChange={setRecordOpen}
        onSuccess={() => setReloadKey((k) => k + 1)}
      />
    </div>
  )
}
