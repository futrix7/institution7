"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Download,
  Wallet,
  PiggyBank,
  CreditCard,
  BarChart3,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExportDialog } from "@/components/admin/export-dialog";
import { supabase } from "@/lib/supabase";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const EXPENSE_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];
const BRANCH_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa"];

interface SummaryCard {
  title: string;
  value: string;
  icon: typeof IndianRupee;
  change: string;
  trend: "up" | "down";
  color: string;
  bgColor: string;
}

interface MonthlyDatum {
  month: string;
  revenue: number;
  expenses: number;
}

interface ExpenseItem {
  name: string;
  value: number;
  percentage: number;
}

interface CourseRevenueItem {
  name: string;
  amount: string;
  percentage: number;
}

interface BranchDatum {
  branch: string;
  revenue: number;
}

interface RecentTransaction {
  date: string;
  description: string;
  category: string;
  amount: string;
  type: "income" | "expense";
}

function formatCurrencyINR(value: number): string {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export default function AdminFinancePage() {
  const [exportOpen, setExportOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [summaryCards, setSummaryCards] = useState<SummaryCard[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyDatum[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseItem[]>([]);
  const [courseRevenue, setCourseRevenue] = useState<CourseRevenueItem[]>([]);
  const [branchData, setBranchData] = useState<BranchDatum[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);

  const handleVerify = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.valid) {
        setAuthenticated(true);
        setPin("");
      } else {
        setError(true);
        setPin("");
      }
    } catch {
      setError(true);
      setPin("");
    } finally {
      setLoading(false);
    }
  }, [pin]);

  useEffect(() => {
    if (!authenticated) return;

    async function fetchFinanceData() {
      setDataLoading(true);

      const [transactionsResult, paymentsResult, coursesResult, branchesResult] = await Promise.all([
        supabase.from("transactions").select("*"),
        supabase.from("payments").select("id, student_name, course_slug, amount, payment_date, method, status, branch_id"),
        supabase.from("courses").select("slug, name"),
        supabase.from("branches").select("id, name"),
      ]);

      const transactions = transactionsResult.data || [];
      const payments = paymentsResult.data || [];

      const courseMap = new Map<string, string>();
      if (coursesResult.data) {
        coursesResult.data.forEach((c) => courseMap.set(c.slug, c.name));
      }

      const branchMap = new Map<string, string>();
      if (branchesResult.data) {
        branchesResult.data.forEach((b) => branchMap.set(b.id, b.name));
      }

      // Summary
      const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const netProfit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;

      setSummaryCards([
        {
          title: "Total Revenue",
          value: formatCurrencyINR(totalIncome),
          icon: IndianRupee,
          change: "",
          trend: "up",
          color: "text-emerald-500",
          bgColor: "bg-emerald-500/10",
        },
        {
          title: "Total Expenses",
          value: formatCurrencyINR(totalExpenses),
          icon: CreditCard,
          change: "",
          trend: "down",
          color: "text-red-500",
          bgColor: "bg-red-500/10",
        },
        {
          title: "Net Profit",
          value: formatCurrencyINR(netProfit),
          icon: Wallet,
          change: "",
          trend: "up",
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
        },
        {
          title: "Profit Margin",
          value: `${profitMargin}%`,
          icon: PiggyBank,
          change: "",
          trend: "up",
          color: "text-violet-500",
          bgColor: "bg-violet-500/10",
        },
      ]);

      // Monthly data (last 6 months)
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const now = new Date();
      const monthlyMap = new Map<string, { revenue: number; expenses: number }>();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = monthNames[d.getMonth()];
        monthlyMap.set(key, { revenue: 0, expenses: 0 });
      }

      for (const t of transactions) {
        const d = new Date(t.date);
        const key = monthNames[d.getMonth()];
        if (monthlyMap.has(key)) {
          const entry = monthlyMap.get(key)!;
          if (t.type === "income") {
            entry.revenue += Number(t.amount);
          } else {
            entry.expenses += Number(t.amount);
          }
        }
      }

      setMonthlyData(Array.from(monthlyMap.entries()).map(([month, vals]) => ({ month, ...vals })));

      // Expense breakdown
      const expenseMap = new Map<string, number>();
      for (const t of transactions) {
        if (t.type === "expense") {
          expenseMap.set(t.category, (expenseMap.get(t.category) || 0) + Number(t.amount));
        }
      }

      const totalExpenseAmt = Array.from(expenseMap.values()).reduce((s, v) => s + v, 0);
      const expenseItems: ExpenseItem[] = Array.from(expenseMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({
          name,
          value,
          percentage: totalExpenseAmt > 0 ? Math.round((value / totalExpenseAmt) * 100) : 0,
        }));
      setExpenseBreakdown(expenseItems);

      // Course revenue
      const courseRevMap = new Map<string, number>();
      for (const p of payments) {
        const slug = p.course_slug || "unknown";
        courseRevMap.set(slug, (courseRevMap.get(slug) || 0) + Number(p.amount));
      }

      const totalCourseRev = Array.from(courseRevMap.values()).reduce((s, v) => s + v, 0);
      const courseRevItems: CourseRevenueItem[] = Array.from(courseRevMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([slug, amount]) => ({
          name: courseMap.get(slug) || slug,
          amount: formatCurrencyINR(amount),
          percentage: totalCourseRev > 0 ? Math.round((amount / totalCourseRev) * 100) : 0,
        }));
      setCourseRevenue(courseRevItems);

      // Branch data
      const branchRevMap = new Map<string, number>();
      for (const p of payments) {
        const bId = p.branch_id || "unknown";
        branchRevMap.set(bId, (branchRevMap.get(bId) || 0) + Number(p.amount));
      }

      const branchItems: BranchDatum[] = Array.from(branchRevMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([bId, revenue]) => ({
          branch: branchMap.get(bId) || "Unknown",
          revenue,
        }));
      setBranchData(branchItems);

      // Recent transactions
      const recentTxns: RecentTransaction[] = transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
        .map((t) => ({
          date: new Date(t.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          description: t.description,
          category: t.category,
          amount: formatCurrencyINR(Number(t.amount)),
          type: t.type,
        }));
      setRecentTransactions(recentTxns);

      setDataLoading(false);
    }

    fetchFinanceData();
  }, [authenticated]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
          <p className="text-xs text-muted-foreground">
            Complete financial overview
          </p>
        </div>
        {authenticated && (
          <Button variant="outline" className="gap-2" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        )}
      </div>

      {/* OTP Gate */}
      {!authenticated && (
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 p-8 rounded-xl border bg-card shadow-lg">
              <div className="rounded-full bg-primary/10 p-3">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-lg font-semibold">Finance Access Protected</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit PIN to view financial data
                </p>
              </div>
              <InputOTP
                maxLength={6}
                value={pin}
                onChange={(val) => { setPin(val); setError(false); }}
                onComplete={(val) => { setPin(val); }}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              {error && (
                <p className="text-sm text-red-500">Incorrect PIN. Please try again.</p>
              )}
              <Button
                onClick={handleVerify}
                disabled={pin.length < 6 || loading}
                className="w-full"
              >
                {loading ? "Verifying..." : "Verify PIN"}
              </Button>
            </div>
          </div>

          {/* Blurred content behind */}
          <CardContent className="blur-sm select-none pointer-events-none">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {["Total Revenue", "Total Expenses", "Net Profit", "Profit Margin"].map((title) => (
                <Card key={title}>
                  <CardContent className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground truncate">{title}</p>
                    <p className="text-sm font-bold shrink-0">—</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 h-[350px] rounded-lg bg-muted/30" />
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="h-[300px] rounded-lg bg-muted/30" />
              <div className="h-[300px] rounded-lg bg-muted/30" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actual Content - shown after auth */}
      {authenticated && (
        <>
          {dataLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading financial data...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {summaryCards.map((stat) => (
                  <Card key={stat.title}>
                    <CardContent className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground truncate">{stat.title}</p>
                      <p className="text-sm font-bold shrink-0">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Monthly Revenue vs Expenses Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Monthly Revenue vs Expenses</CardTitle>
                      <CardDescription>Comparative trend for the last 6 months</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Total: {formatCurrencyINR(summaryCards[0] ? parseInt(summaryCards[0].value.replace(/[₹,]/g, "")) || 0 : 0)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="month"
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(value) => [`₹${(Number(value) / 1000).toFixed(0)}K`, ""]}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorExpenses)"
                        name="Expenses"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Expense Breakdown & Branch-wise Revenue */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Expense Breakdown Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                    <CardDescription>Category-wise expense distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={expenseBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {expenseBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                          formatter={(value) => [`₹${(Number(value) / 1000).toFixed(0)}K`, ""]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {expenseBreakdown.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                            />
                            <span>{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">₹{(item.value / 1000).toFixed(0)}K</span>
                            <Badge variant="secondary">{item.percentage}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Branch-wise Revenue Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Branch-wise Revenue</CardTitle>
                    <CardDescription>Revenue comparison across branches</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={branchData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          type="number"
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                          tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
                        />
                        <YAxis
                          type="category"
                          dataKey="branch"
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                          width={100}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                          formatter={(value) => [`₹${(Number(value) / 100000).toFixed(1)}L`, "Revenue"]}
                        />
                        <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                          {branchData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={BRANCH_COLORS[index % BRANCH_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-3">
                      {branchData.map((branch) => (
                        <div key={branch.branch} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{branch.branch}</span>
                          <span className="text-sm text-muted-foreground">
                            ₹{(branch.revenue / 100000).toFixed(1)}L
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue by Course */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Course</CardTitle>
                  <CardDescription>Course-wise revenue breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {courseRevenue.map((course) => (
                    <div key={course.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate pr-2">
                          {course.name}
                        </span>
                        <span className="text-muted-foreground whitespace-nowrap">
                          {course.amount}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={course.percentage} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {course.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Transactions Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Transactions</CardTitle>
                      <CardDescription>Latest financial transactions</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTransactions.map((txn, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{txn.date}</TableCell>
                          <TableCell>{txn.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{txn.category}</Badge>
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-semibold",
                              txn.type === "income"
                                ? "text-emerald-500"
                                : "text-red-500"
                            )}
                          >
                            {txn.type === "income" ? "+" : "-"}{txn.amount}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={txn.type === "income" ? "default" : "destructive"}
                            >
                              {txn.type === "income" ? (
                                <TrendingUp className="mr-1 h-3 w-3" />
                              ) : (
                                <TrendingDown className="mr-1 h-3 w-3" />
                              )}
                              {txn.type}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
