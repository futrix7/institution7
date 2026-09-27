"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Shield,
  User,
  Mail,
  Phone,
  Lock,
  KeyRound,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { useToast } from "@/components/ui/sonner"
import { describeAuthError } from "@/lib/errors"

const MIN_PASSWORD_LENGTH = 8

export default function AdminRegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [adminCode, setAdminCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const trimmedEmail = email.trim()

    if (!fullName.trim()) {
      setError("Full name is required")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
      setError("Enter a valid email address")
      return
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit phone number")
      return
    }

    if (adminCode.trim().length === 0) {
      setError("Enter the admin verification code.")
      return
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      toast(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, { variant: "destructive" })
      return
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must contain at least one letter and one number.")
      toast("Password must contain at least one letter and one number.", { variant: "destructive" })
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      toast("Passwords do not match.", { variant: "destructive" })
      return
    }

    setLoading(true)

    try {
      // The invite code is validated on the server. Checking it here would ship
      // the expected value to every visitor in the JavaScript bundle.
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: trimmedEmail,
          phone: phone.trim(),
          password,
          adminCode: adminCode.trim(),
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const message = data.error || "We couldn't create the account."
        setError(message)
        toast(message, { variant: "destructive" })
        return
      }

      toast("Admin account created", {
        variant: "success",
        description: "You can sign in to the admin portal now.",
      })
      router.replace("/auth/admin/login")
    } catch (err) {
      console.error("[auth] admin registration crashed:", err)
      const info = describeAuthError(err)
      setError(info.message)
      toast(info.message, { variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10">
            <Shield className="size-7 text-amber-600 dark:text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Registration</CardTitle>
          <CardDescription>Register as an administrator</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your name"
                  className="h-10 pl-10"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="h-10 pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="98765 43210"
                  className="h-10 pl-10"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminCode">Admin Code</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="adminCode"
                  type="text"
                  placeholder="Enter admin verification code"
                  className="h-10 pl-10"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  className="h-10 pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className="h-10 pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-10 w-full gap-2"
              disabled={loading || password !== confirmPassword || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  Register as Admin
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
            <KeyRound className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Admin accounts can only be created with a verification code issued by the
              institute. Ask an existing administrator if you need one.
            </span>
          </p>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/admin/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}