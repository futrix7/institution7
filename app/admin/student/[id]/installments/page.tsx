"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  IndianRupee,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Banknote,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/sonner"
import { useStudent } from "../layout"

interface Installment {
  id: string
  label: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: "Paid" | "Pending"
  feeId: string
}

interface CollectionRecord {
  id: string
  installmentLabel: string
  amount: number
  collectedDate: string
  method: string
}

export default function StudentInstallmentsPage() {
  const student = useStudent()
  const { toast } = useToast()
  const [installments, setInstallments] = useState<Installment[]>([])
  const [collections, setCollections] = useState<CollectionRecord[]>([])
  const [totalFee, setTotalFee] = useState(0)
  const [collected, setCollected] = useState(0)
  const [loading, setLoading] = useState(true)

  const [collectOpen, setCollectOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null)
  const [collectAmount, setCollectAmount] = useState("")
  const [collectMethod, setCollectMethod] = useState("Cash")
  const [collecting, setCollecting] = useState(false)

  async function fetchData() {
    if (!student) return

    const { data: feesRows } = await supabase
      .from("fees").select("id, total_fee, paid_amount").eq("student_id", student.id)

    if (feesRows && feesRows.length > 0) {
      const fTotal = feesRows.reduce((s, f) => s + (f.total_fee ?? 0), 0)
      const fPaid = feesRows.reduce((s, f) => s + (f.paid_amount ?? 0), 0)
      setTotalFee(fTotal)
      setCollected(fPaid)

      const feeIds = feesRows.map((f) => f.id)
      const { data: instRows } = await supabase
        .from("fee_installments").select("id, label, amount, due_date, paid_date, status, fee_id")
        .in("fee_id", feeIds).order("due_date", { ascending: true })

      if (instRows) {
        setInstallments(instRows.map((i) => ({
          id: i.id,
          label: i.label,
          amount: i.amount,
          dueDate: i.due_date,
          paidDate: i.paid_date,
          status: i.status === "Paid" ? "Paid" : "Pending",
          feeId: i.fee_id,
        })))
      }
    }

    const { data: payRows } = await supabase
      .from("payments").select("id, amount, payment_date, method, description")
      .eq("student_id", student.id)
      .eq("status", "Paid")
      .order("payment_date", { ascending: false })

    if (payRows) {
      setCollections(payRows.map((p) => ({
        id: p.id,
        installmentLabel: p.description ?? "Fee Payment",
        amount: p.amount,
        collectedDate: p.payment_date,
        method: p.method,
      })))
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [student])

  function openCollect(inst: Installment) {
    setSelectedInstallment(inst)
    setCollectAmount(String(inst.amount))
    setCollectMethod("Cash")
    setCollectOpen(true)
  }

  async function handleCollect() {
    if (!selectedInstallment || !student) return
    setCollecting(true)

    const amount = parseInt(collectAmount) || 0

    await supabase.from("payments").insert({
      student_id: student.id,
      amount,
      method: collectMethod,
      status: "Paid",
      description: selectedInstallment.label,
      payment_date: new Date().toISOString().split("T")[0],
    })

    await supabase
      .from("fee_installments")
      .update({ status: "Paid", paid_date: new Date().toISOString().split("T")[0] })
      .eq("id", selectedInstallment.id)

    const { data: feeRow } = await supabase
      .from("fees").select("id, paid_amount").eq("id", selectedInstallment.feeId).single()

    if (feeRow) {
      await supabase
        .from("fees")
        .update({ paid_amount: (feeRow.paid_amount ?? 0) + amount })
        .eq("id", selectedInstallment.feeId)
    }

    toast("Payment collected successfully!", { variant: "success" })
    setCollecting(false)
    setCollectOpen(false)
    setLoading(true)
    fetchData()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
  }

  const pending = installments.filter((i) => i.status === "Pending")
  const paid = installments.filter((i) => i.status === "Paid")
  const pendingAmount = totalFee - collected

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <IndianRupee className="size-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">₹{totalFee.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Fee</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 text-center">
            <Banknote className="size-6 text-emerald-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-emerald-600">₹{collected.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Collected</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 text-center">
            <Clock className="size-6 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-600">₹{pendingAmount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Installments - Collection */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Pending Installments</h3>
            <Badge variant="secondary" className="text-xs">{pending.length}</Badge>
          </div>
          <div className="space-y-2.5">
            {pending.map((inst) => (
              <div key={inst.id} className="flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Clock className="size-4 sm:size-5 text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">{inst.label}</p>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="size-3" />
                      Due: {inst.dueDate}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <p className="text-sm font-bold">₹{inst.amount.toLocaleString()}</p>
                  <Button
                    size="lg"
                    className="gap-1.5 px-4"
                    onClick={() => openCollect(inst)}
                  >
                    <Plus className="size-4" />
                    Collect
                  </Button>
                </div>
              </div>
            ))}
            {pending.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">All installments are paid!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Paid Installments */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Paid Installments</h3>
            <Badge variant="secondary" className="text-xs bg-emerald-500/15 text-emerald-600">{paid.length}</Badge>
          </div>
          <div className="space-y-2.5">
            {paid.map((inst) => (
              <div key={inst.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <CheckCircle2 className="size-4 sm:size-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">{inst.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Paid: {inst.paidDate ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <p className="text-sm font-bold">₹{inst.amount.toLocaleString()}</p>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/15 text-emerald-600">Paid</Badge>
                </div>
              </div>
            ))}
            {paid.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No paid installments yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Collection History */}
      {collections.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 sm:p-5 pb-0">
              <h3 className="text-sm font-semibold">Collection History</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>For</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Method</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-xs">{c.installmentLabel}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">{c.collectedDate}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">{c.method}</TableCell>
                    <TableCell className="font-medium text-xs">₹{c.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Collect Dialog */}
      <Dialog open={collectOpen} onOpenChange={setCollectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Banknote className="size-5 text-primary" />
              Collect Payment
            </DialogTitle>
            <DialogDescription>
              Collecting for: <span className="font-semibold text-foreground">{selectedInstallment?.label}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="collectAmount" className="text-sm font-semibold">Amount (₹)</Label>
              <Input
                id="collectAmount"
                type="number"
                value={collectAmount}
                onChange={(e) => setCollectAmount(e.target.value)}
                className="h-11 text-lg font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                {["Cash", "UPI", "Bank"].map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant={collectMethod === m ? "default" : "outline"}
                    size="lg"
                    onClick={() => setCollectMethod(m)}
                    className="gap-1.5"
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" size="lg" onClick={() => setCollectOpen(false)} disabled={collecting} className="px-6">
              Cancel
            </Button>
            <Button size="lg" onClick={handleCollect} disabled={collecting || !collectAmount} className="gap-2 px-6">
              {collecting ? <Loader2 className="size-5 animate-spin" /> : <Banknote className="size-5" />}
              {collecting ? "Collecting..." : `Collect ₹${parseInt(collectAmount || "0").toLocaleString()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
