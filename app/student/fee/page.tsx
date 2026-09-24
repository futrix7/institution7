"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Clock, CreditCard, ExternalLink, Loader2 } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/sonner"

interface Installment {
  label: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: "Paid" | "Pending"
}

interface Extra {
  label: string
  amount: number
  status: "Paid" | "Pending"
}

interface FeeData {
  course: string
  totalFee: number
  paid: number
  pending: number
  installments: Installment[]
  extras: Extra[]
}

const fallbackFeeDetails: FeeData = {
  course: "Course",
  totalFee: 0,
  paid: 0,
  pending: 0,
  installments: [],
  extras: [],
}

export default function StudentFee() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [feeDetails, setFeeDetails] = useState<FeeData>(fallbackFeeDetails)
  const [feeId, setFeeId] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [courseSlug, setCourseSlug] = useState<string | null>(null)
  const [studentName, setStudentName] = useState("")

  const paidPct = feeDetails.totalFee > 0 ? Math.round((feeDetails.paid / feeDetails.totalFee) * 100) : 0
  const extrasTotal = feeDetails.extras.reduce((sum, e) => sum + e.amount, 0)

  const [payOpen, setPayOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("upi")
  const [paid, setPaid] = useState(false)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    const fetchFeeData = async () => {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: student } = await supabase
        .from("students")
        .select("id, course_slug, full_name")
        .eq("user_id", user.id)
        .single()

      if (!student) { setLoading(false); return }

      setStudentId(student.id)
      setCourseSlug(student.course_slug)
      setStudentName(student.full_name ?? "")

      const { data: fee } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", student.id)
        .single()

      if (!fee) { setLoading(false); return }

      setFeeId(fee.id)

      const [installmentsRes, extrasRes] = await Promise.all([
        supabase.from("fee_installments").select("*").eq("fee_id", fee.id),
        supabase.from("fee_extras").select("*").eq("fee_id", fee.id),
      ])

      const installments: Installment[] = (installmentsRes.data ?? []).map((i) => ({
        label: i.label,
        amount: i.amount,
        dueDate: i.due_date,
        paidDate: i.paid_date,
        status: i.status === "Paid" ? "Paid" : "Pending",
      }))

      const extras: Extra[] = (extrasRes.data ?? []).map((e) => ({
        label: e.label,
        amount: e.amount,
        status: e.status === "Paid" ? "Paid" : "Pending",
      }))

      const courseName = student.course_slug
        ? student.course_slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
        : "Course"

      setFeeDetails({
        course: courseName,
        totalFee: fee.total_fee,
        paid: fee.paid_amount,
        pending: fee.pending_amount,
        installments,
        extras,
      })

      setAmount(fee.pending_amount.toString())
      setLoading(false)
    }

    fetchFeeData()
  }, [])

  const isOverdue = (dueDate: string) => {
    const d = new Date(dueDate)
    return d < new Date()
  }

  const handlePay = async () => {
    if (!amount || Number(amount) <= 0 || !studentId || !feeId) return

    setPaying(true)
    const payAmount = Number(amount)
    const paymentId = `PAY-${Date.now()}`

    const studentNameValue = studentName || feeDetails.course

    const { error: paymentErr } = await supabase.from("payments").insert({
      id: paymentId,
      student_id: studentId,
      student_name: studentNameValue,
      course_slug: courseSlug,
      amount: payAmount,
      payment_date: new Date().toISOString().split("T")[0],
      method,
      status: "Paid",
    })

    if (paymentErr) {
      toast("Payment failed: " + paymentErr.message, { variant: "destructive" })
      setPaying(false)
      return
    }

    const newPaid = feeDetails.paid + payAmount
    const newPending = Math.max(0, feeDetails.totalFee - newPaid)

    const { error: feeErr } = await supabase
      .from("fees")
      .update({ paid_amount: newPaid, pending_amount: newPending })
      .eq("id", feeId)

    if (feeErr) {
      toast("Payment recorded but fee update failed: " + feeErr.message, { variant: "destructive" })
    }

    setPaid(true)
    setTimeout(() => {
      setPayOpen(false)
      setTimeout(() => {
        setPaid(false)
        setPaying(false)
        setFeeDetails((prev) => ({ ...prev, paid: newPaid, pending: newPending }))
      }, 300)
    }, 1500)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:px-8 lg:py-10">
        <div className="flex items-center justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Fee Details</h1>
          <p className="text-sm lg:text-base text-muted-foreground">{feeDetails.course}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/student/profile/payments" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
            <ExternalLink className="size-4" />
            <span className="hidden sm:inline">View Payment History</span>
            <span className="sm:hidden">History</span>
          </Link>
          <Dialog open={payOpen} onOpenChange={setPayOpen}>
            <DialogTrigger render={<Button size="sm" className="gap-1.5 px-3 py-2 text-sm h-auto" />}>
              <CreditCard className="size-4" />
              Pay Now
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Make a Payment</DialogTitle>
              </DialogHeader>
              {paid ? (
                <div className="py-8 text-center space-y-3">
                  <div className="size-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="size-8 text-emerald-600" />
                  </div>
                  <p className="font-semibold text-emerald-600">Payment Successful!</p>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="pay-amount">Amount (₹)</Label>
                    <Input
                      id="pay-amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <div className="space-y-2">
                      {[
                        { value: "upi", label: "UPI" },
                        { value: "cash", label: "Cash" },
                        { value: "bank", label: "Bank Transfer" },
                      ].map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="method"
                            value={opt.value}
                            checked={method === opt.value}
                            onChange={(e) => setMethod(e.target.value)}
                            className="accent-primary"
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" onClick={handlePay} disabled={!amount || Number(amount) <= 0}>
                    Confirm Payment
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6">
            <div>
              <p className="text-sm lg:text-base text-muted-foreground">Total Fee</p>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">₹{feeDetails.totalFee.toLocaleString()}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm lg:text-base text-muted-foreground">Paid</p>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-600 tracking-tight">₹{feeDetails.paid.toLocaleString()}</p>
            </div>
          </div>
          <Progress value={paidPct} className="h-2.5 lg:h-3 mb-2" />
          <div className="flex justify-between text-sm lg:text-base">
            <span className="text-muted-foreground">{paidPct}% paid</span>
            <span className="text-amber-600 font-medium">₹{feeDetails.pending.toLocaleString()} remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Installments */}
      <Card>
        <CardContent className="p-5 sm:p-6 lg:p-8">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-4 lg:mb-6">Installment Schedule</h2>
          <div className="space-y-3">
            {feeDetails.installments.map((inst, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-border p-3 sm:p-4 lg:p-5">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  {inst.status === "Paid" ? (
                    <CheckCircle2 className="size-5 lg:size-6 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="size-5 lg:size-6 text-amber-600 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm lg:text-base font-medium truncate">{inst.label}</p>
                    <p className="text-xs lg:text-sm text-muted-foreground truncate">
                      Due: {inst.dueDate}{inst.paidDate ? ` · Paid: ${inst.paidDate}` : ""}
                    </p>
                    {inst.status === "Pending" && isOverdue(inst.dueDate) && (
                      <p className="text-[11px] lg:text-xs text-red-600 font-medium mt-0.5">Overdue</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm lg:text-base font-bold">₹{inst.amount.toLocaleString()}</p>
                  {inst.status === "Pending" && isOverdue(inst.dueDate) ? (
                    <Badge variant="destructive" className="text-[10px] lg:text-xs">Overdue</Badge>
                  ) : (
                    <Badge variant="secondary" className={`text-[10px] lg:text-xs ${inst.status === "Paid" ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"}`}>
                      {inst.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Extras */}
      <Card>
        <CardContent className="p-5 sm:p-6 lg:p-8">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-4 lg:mb-6">Additional Charges</h2>
          <div className="space-y-3">
            {feeDetails.extras.map((extra, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-border p-3 sm:p-4 lg:p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                  <p className="text-sm lg:text-base font-medium">{extra.label}</p>
                </div>
                <p className="text-sm lg:text-base font-bold">₹{extra.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-sm lg:text-base">
              <span className="text-muted-foreground">Extras Total</span>
              <span className="font-bold">₹{extrasTotal.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
