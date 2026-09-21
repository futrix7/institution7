"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GraduationCap,
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ArrowLeft,
  Check,
  BookOpen,
  MapPin,
  Briefcase,
  Home,
  Building2,
  FileText,
  Clock,
  IndianRupee,
  Monitor,
  Code,
  Globe,
  Database,
  Cloud,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/sonner"
import type { Variants, Transition } from "framer-motion"

const branches = [
  { value: "ramanthapur", label: "Ramanthapur (Main)" },
  { value: "amberpet", label: "Amberpet" },
  { value: "kodad", label: "Kodad" },
]

const courseNames = [
  "DCA", "ADCA", "Tally", "C", "PGDCA", "Java", "Python",
  "PGJPL", "PGPPL", "Data Science", "Java Fullstack", "Python Fullstack",
  "AWS", "Azure", "Power BI", "HTML & CSS", "JavaScript", "Bootstrap",
  "ReactJS", "ADWD",
] as const

interface CourseInfo {
  name: string
  slug: string
  duration: string
  fee: string
  description: string
  category: "basic" | "programming" | "web" | "data" | "cloud"
  popular?: boolean
}

const courseInfo: Record<string, CourseInfo> = {
  "DCA":            { name: "DCA",            slug: "dca",            duration: "40 Days", fee: "₹3,000",  description: "Computer basics, MS-Word, Excel, PowerPoint, Internet", category: "basic" },
  "ADCA":           { name: "ADCA",           slug: "adca",           duration: "2 Months", fee: "₹5,000",  description: "Advanced computer course with Tally Prime & GST", category: "basic" },
  "Tally":          { name: "Tally PRIME",    slug: "tally-prime",    duration: "30 Days", fee: "₹3,500",  description: "Accounting, GST, inventory & payroll management", category: "basic" },
  "C":              { name: "C Language",      slug: "c-language",      duration: "35 Days", fee: "₹3,000",  description: "C programming fundamentals", category: "programming" },
  "PGDCA":          { name: "PGDCA",          slug: "pgdca",          duration: "2 Months", fee: "₹6,000",  description: "Post graduate diploma — MS-Office + C Language", category: "basic" },
  "Java":           { name: "Core Java",       slug: "core-java",       duration: "45 Days", fee: "₹5,000",  description: "Java fundamentals, OOP, collections", category: "programming" },
  "Python":         { name: "Core Python",     slug: "core-python",     duration: "40 Days", fee: "₹5,000",  description: "Python programming from zero to projects", category: "programming" },
  "PGJPL":          { name: "PGJPL",           slug: "pgjpl",           duration: "4 Months", fee: "₹12,000", description: "Complete Java developer — Core to Advanced + JDBC", category: "programming", popular: true },
  "PGPPL":          { name: "PGPPL",           slug: "pgppl",           duration: "4 Months", fee: "₹12,000", description: "Complete Python developer — Core to Advanced", category: "programming", popular: true },
  "Data Science":   { name: "Data Science",    slug: "data-science",    duration: "6 Months", fee: "₹25,000", description: "Data analysis, ML basics, Python & real projects", category: "data", popular: true },
  "Java Fullstack": { name: "Java Fullstack",  slug: "java-full-stack", duration: "6 Months", fee: "₹25,000", description: "Complete Java web developer — Spring Boot", category: "programming", popular: true },
  "Python Fullstack":{ name: "Python Fullstack",slug: "python-full-stack",duration: "6 Months", fee: "₹25,000", description: "Complete Python web developer — Django", category: "programming", popular: true },
  "AWS":            { name: "AWS",             slug: "aws",             duration: "3 Months", fee: "₹15,000", description: "Amazon cloud computing — EC2, S3, deployment", category: "cloud" },
  "Azure":          { name: "Azure",           slug: "azure",           duration: "3 Months", fee: "₹15,000", description: "Microsoft cloud — virtual machines & apps", category: "cloud" },
  "Power BI":       { name: "Power BI",        slug: "power-bi",        duration: "20 Days", fee: "₹4,000",  description: "Data dashboards & business intelligence", category: "data" },
  "HTML & CSS":     { name: "HTML & CSS",      slug: "html",            duration: "20 Days", fee: "₹2,000",  description: "Build beautiful websites from scratch", category: "web" },
  "JavaScript":     { name: "JavaScript",      slug: "javascript",      duration: "20 Days", fee: "₹3,000",  description: "Make websites interactive & dynamic", category: "web" },
  "Bootstrap":      { name: "Bootstrap",       slug: "bootstrap",       duration: "20 Days", fee: "₹2,000",  description: "Quick responsive websites with Bootstrap 5", category: "web" },
  "ReactJS":        { name: "ReactJS",         slug: "reactjs",         duration: "30 Days", fee: "₹6,000",  description: "Modern web apps with React framework", category: "web", popular: true },
  "ADWD":           { name: "A.D.W.D",         slug: "adwd",            duration: "3 Months", fee: "₹8,000",  description: "Full web design — HTML, CSS, JS, Bootstrap", category: "web" },
}

const categoryConfig = {
  basic:       { icon: Monitor,  color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-950/40",     label: "Computer Basics" },
  programming: { icon: Code,     color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40",  label: "Programming" },
  web:         { icon: Globe,    color: "text-emerald-600 dark:text-emerald-400",bg: "bg-emerald-50 dark:bg-emerald-950/40",label: "Web Development" },
  data:        { icon: Database, color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/40",    label: "Data & Analytics" },
  cloud:       { icon: Cloud,    color: "text-sky-600 dark:text-sky-400",       bg: "bg-sky-50 dark:bg-sky-950/40",        label: "Cloud Computing" },
}

const statusOptions = [
  { value: "Student",   icon: GraduationCap },
  { value: "Housewife", icon: Home },
  { value: "Employed",  icon: Briefcase },
  { value: "Business",  icon: Building2 },
]

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
}

const courseCardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.3, ease: "easeOut" as Transition["ease"] },
  }),
}

export default function UserRegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [fatherName, setFatherName] = useState("")
  const [branch, setBranch] = useState("")
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [presentStatus, setPresentStatus] = useState("")
  const [parentMobile, setParentMobile] = useState("")
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [signature, setSignature] = useState("")

  const steps = [
    { id: 1, title: "Personal Info",     icon: User,      description: "Tell us about yourself" },
    { id: 2, title: "Choose Course",      icon: BookOpen,  description: "Select branch & course" },
    { id: 3, title: "Final Details",      icon: FileText,  description: "Review & submit" },
  ]

  const totalSteps = steps.length
  const currentStepData = steps[step - 1]
  const progress = (step / totalSteps) * 100

  function goNext() {
    if (step >= totalSteps) return
    if (step === 1 && (!fullName || !fatherName || !email || !phone)) return
    if (step === 2 && (!branch || selectedCourses.length === 0)) return
    setDirection(1)
    setStep((s) => s + 1)
  }

  function goPrev() {
    if (step > 1) {
      setDirection(-1)
      setStep((s) => s - 1)
    }
  }

  function toggleCourse(courseName: string) {
    setSelectedCourses((prev) =>
      prev.includes(courseName)
        ? prev.filter((c) => c !== courseName)
        : [...prev, courseName]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast("Passwords do not match", "error")
      return
    }

    if (!agreeTerms) {
      toast("Please agree to the terms", "error")
      return
    }

    setSubmitting(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (authError) {
      toast("Registration failed: " + authError.message, "error")
      setSubmitting(false)
      return
    }

    const userId = authData.user?.id
    if (!userId) {
      toast("Registration failed: no user ID", "error")
      setSubmitting(false)
      return
    }

    const { count } = await supabase
      .from("students")
      .select("id", { count: "exact", head: true })

    const studentId = `STU-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(3, "0")}`
    const primaryCourse = selectedCourses[0]
    const courseSlug = courseInfo[primaryCourse]?.slug || primaryCourse.toLowerCase().replace(/\s+/g, "-")

    const { error: studentError } = await supabase.from("students").insert({
      id: studentId,
      user_id: userId,
      full_name: fullName,
      email,
      phone,
      father_name: fatherName,
      father_phone: parentMobile || null,
      branch_id: branch || null,
      course_slug: courseSlug,
      status: "Active",
    })

    if (studentError) {
      toast("Failed to create student record: " + studentError.message, "error")
      setSubmitting(false)
      return
    }

    const feeNumeric = courseInfo[primaryCourse]
      ? parseInt(courseInfo[primaryCourse].fee.replace(/[₹,]/g, ""))
      : 0

    await supabase.from("fees").insert({
      student_id: studentId,
      course_slug: courseSlug,
      total_fee: feeNumeric,
      paid_amount: 0,
      pending_amount: feeNumeric,
    })

    if (feeNumeric > 0) {
      const { data: feeRow } = await supabase
        .from("fees")
        .select("id")
        .eq("student_id", studentId)
        .single()

      if (feeRow) {
        const months = 3
        const perMonth = Math.ceil(feeNumeric / months)
        const now = new Date()
        const installments = Array.from({ length: months }, (_, i) => ({
          fee_id: feeRow.id,
          label: `Installment ${i + 1} of ${months}`,
          amount: perMonth,
          due_date: new Date(now.getFullYear(), now.getMonth() + i + 1, 1).toISOString().split("T")[0],
          status: "Pending" as const,
        }))
        await supabase.from("fee_installments").insert(installments)
      }
    }

    toast("Account created successfully! Please sign in.", "success")
    router.push("/auth/user/login")
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="mb-6 text-center lg:mb-4">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 lg:size-14">
            <GraduationCap className="size-6 text-primary lg:size-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">
            Create Your Account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join TNGC and start your learning journey
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-foreground/5">
          <div className="flex flex-col lg:flex-row">
            <div className="hidden w-72 border-r border-border bg-muted/30 p-6 lg:flex lg:flex-col">
              <div className="flex-1 space-y-1">
                {steps.map((s, i) => {
                  const isActive = step === s.id
                  const isCompleted = step > s.id
                  const Icon = s.icon
                  return (
                    <div key={s.id} className="relative">
                      <div
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200",
                          isActive && "bg-primary/10",
                          isCompleted && "opacity-60"
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : isCompleted
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                          )}
                        >
                          {isCompleted ? <Check className="size-4" /> : <Icon className="size-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className={cn("text-sm font-semibold", isActive ? "text-foreground" : "text-muted-foreground")}>
                            {s.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                        </div>
                      </div>
                      {i < steps.length - 1 && <div className="ml-7 h-1 w-px bg-border" />}
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 rounded-xl bg-primary/5 p-4">
                <p className="text-xs font-medium text-muted-foreground">Already have an account?</p>
                <Link href="/auth/user/login" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  Sign in <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>

            <div className="flex flex-1 flex-col">
              <div className="border-b border-border px-4 py-3 lg:hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">Step {step} of {totalSteps}</span>
                  <span className="text-xs font-semibold text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div className="h-full rounded-full bg-primary" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">{currentStepData.title}</p>
              </div>

              <div className="hidden px-6 pt-5 lg:block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Step {step} of {totalSteps}</span>
                  <span className="text-xs font-medium text-primary">{currentStepData.title}</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div className="h-full rounded-full bg-primary" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
                </div>
              </div>

              <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
                <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
                  <div className="flex-1 overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction}>
                      <motion.div
                        key={`step-${step}`}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="space-y-4"
                      >
                        {step === 1 && (
                          <>
                            <div className="mb-4">
                              <h2 className="text-lg font-bold text-foreground">Personal Information</h2>
                              <p className="text-sm text-muted-foreground">Let&apos;s start with your basic details</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="fullName">Full Name *</Label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input id="fullName" placeholder="e.g. Rahul Sharma" className="h-10 pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="fatherName">Father&apos;s / Husband&apos;s Name *</Label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input id="fatherName" placeholder="e.g. Suresh Sharma" className="h-10 pl-10" value={fatherName} onChange={(e) => setFatherName(e.target.value)} required />
                              </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="email">Email Address *</Label>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input id="email" type="email" placeholder="you@example.com" className="h-10 pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="phone">Mobile Number *</Label>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input id="phone" type="tel" inputMode="numeric" maxLength={10} placeholder="98765 43210" className="h-10 pl-10" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} required />
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {step === 2 && (
                          <>
                            <div className="mb-4">
                              <h2 className="text-lg font-bold text-foreground">Choose Your Course</h2>
                              <p className="text-sm text-muted-foreground">Select your branch and courses</p>
                            </div>

                            <div className="space-y-2">
                              <Label>Preferred Branch *</Label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground z-10" />
                                <Select value={branch} onValueChange={(v) => setBranch(v ?? "")}>
                                  <SelectTrigger className="pl-10">
                                    <SelectValue placeholder="Select your nearest branch" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {branches.map((b) => (
                                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-4">
                              {(Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>).map((catKey) => {
                                const cat = categoryConfig[catKey]
                                const catCourses = courseNames.filter((c) => courseInfo[c].category === catKey)
                                if (catCourses.length === 0) return null
                                const CatIcon = cat.icon

                                return (
                                  <div key={catKey}>
                                    <div className={cn("mb-2 flex items-center gap-2 rounded-lg px-3 py-1.5", cat.bg)}>
                                      <CatIcon className={cn("size-3.5", cat.color)} />
                                      <span className={cn("text-xs font-semibold", cat.color)}>{cat.label}</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                      {catCourses.map((courseKey, idx) => {
                                        const course = courseInfo[courseKey]
                                        const selected = selectedCourses.includes(courseKey)
                                        const CourseIcon = cat.icon
                                        return (
                                          <motion.button
                                            key={courseKey}
                                            type="button"
                                            custom={idx}
                                            variants={courseCardVariants}
                                            initial="hidden"
                                            animate="visible"
                                            whileTap={{ scale: 0.97 }}
                                            whileHover={{ scale: 1.01 }}
                                            onClick={() => toggleCourse(courseKey)}
                                            className={cn(
                                              "group relative flex items-start gap-2.5 rounded-xl border-2 p-3 text-left transition-all",
                                              selected
                                                ? "border-primary bg-primary/5 shadow-sm"
                                                : "border-border bg-background hover:border-primary/30"
                                            )}
                                          >
                                            <div className={cn(
                                              "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                                              selected ? "bg-primary text-primary-foreground" : cat.bg
                                            )}>
                                              {selected ? <Check className="size-4" /> : <CourseIcon className={cn("size-4", cat.color)} />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-1.5">
                                                <span className={cn("text-sm font-bold", selected ? "text-primary" : "text-foreground")}>
                                                  {course.name}
                                                </span>
                                                {course.popular && (
                                                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">POPULAR</span>
                                                )}
                                              </div>
                                              <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{course.description}</p>
                                              <div className="mt-1.5 flex items-center gap-2.5">
                                                <span className="flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
                                                  <Clock className="size-2.5" />{course.duration}
                                                </span>
                                                <span className="flex items-center gap-0.5 text-[11px] font-bold text-primary">
                                                  <IndianRupee className="size-2.5" />{course.fee.replace("₹", "")}
                                                </span>
                                              </div>
                                            </div>
                                          </motion.button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {selectedCourses.length > 0 && (
                              <div className="rounded-xl bg-primary/5 p-3 text-center">
                                <p className="text-xs text-muted-foreground">
                                  Selected: <span className="font-semibold text-primary">{selectedCourses.join(", ")}</span>
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {step === 3 && (
                          <>
                            <div className="mb-4">
                              <h2 className="text-lg font-bold text-foreground">Final Details</h2>
                              <p className="text-sm text-muted-foreground">Complete your registration</p>
                            </div>

                            <div className="space-y-2">
                              <Label>Present Status *</Label>
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {statusOptions.map((opt) => {
                                  const Icon = opt.icon
                                  const selected = presentStatus === opt.value
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => setPresentStatus(opt.value)}
                                      className={cn(
                                        "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                                        selected
                                          ? "border-primary bg-primary/10 text-primary"
                                          : "border-border bg-background text-foreground hover:border-primary/40"
                                      )}
                                    >
                                      <Icon className="size-4 shrink-0" />
                                      {opt.value}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="parentMobile">Parent&apos;s Mobile Number *</Label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input id="parentMobile" type="tel" inputMode="numeric" maxLength={10} placeholder="98765 43210" className="h-10 pl-10" value={parentMobile} onChange={(e) => setParentMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} required />
                              </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="password">Password *</Label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input id="password" type="password" placeholder="Create a password" className="h-10 pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Re-enter password"
                                    className={cn(
                                      "h-10 pl-10",
                                      confirmPassword && confirmPassword !== password
                                        ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                                        : confirmPassword && confirmPassword === password
                                          ? "border-emerald-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                                          : ""
                                    )}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                  />
                                </div>
                                {confirmPassword && confirmPassword !== password && (
                                  <p className="text-xs text-red-500">Passwords do not match</p>
                                )}
                                {confirmPassword && confirmPassword === password && (
                                  <p className="text-xs text-emerald-500">Passwords match</p>
                                )}
                              </div>
                            </div>

                            <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
                              I confirm that all the details I entered above are true. I agree to follow
                              the institute&apos;s rules. I understand that once I pay the fee, it cannot be
                              refunded or changed.
                            </div>

                            <div className="flex items-start gap-2">
                              <input id="agree" type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary" />
                              <Label htmlFor="agree" className="text-sm font-normal leading-snug text-muted-foreground">
                                I agree to the above declaration and{" "}
                                <Link href="/terms" className="text-primary hover:underline whitespace-nowrap">Terms of Service</Link>
                                {" "}and{" "}
                                <Link href="/privacy" className="text-primary hover:underline whitespace-nowrap">Privacy Policy</Link>
                              </Label>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="signature">Type your full name as signature *</Label>
                              <Input id="signature" placeholder="Type your full name" className="h-10" value={signature} onChange={(e) => setSignature(e.target.value)} required />
                            </div>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                    <Button type="button" variant="outline" onClick={goPrev} className="gap-1.5" disabled={submitting}>
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>

                    <div className="flex-1" />

                    {step < totalSteps ? (
                      <Button
                        type="button"
                        onClick={goNext}
                        className="gap-1.5 px-6"
                        disabled={
                          (step === 1 && (!fullName || !fatherName || !email || !phone)) ||
                          (step === 2 && (!branch || selectedCourses.length === 0))
                        }
                      >
                        Continue <ArrowRight className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="gap-1.5 px-6"
                        disabled={
                          submitting ||
                          !presentStatus ||
                          !parentMobile || parentMobile.length !== 10 ||
                          !password || password !== confirmPassword ||
                          !agreeTerms || !signature
                        }
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Check className="size-4" />
                            Create Account
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </form>

                <p className="mt-4 text-center text-sm text-muted-foreground lg:hidden">
                  Already have an account?{" "}
                  <Link href="/auth/user/login" className="font-medium text-primary hover:underline">Sign in</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
