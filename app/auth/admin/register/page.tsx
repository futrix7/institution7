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
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/sonner"

const ADMIN_REG_CODE = process.env.NEXT_PUBLIC_ADMIN_REG_CODE || "TNGC-ADMIN-2024"

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
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (adminCode !== ADMIN_REG_CODE) {
      setError("Invalid admin verification code.")
      toast("Invalid admin verification code.", { variant: "destructive" })
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      toast("Password must be at least 6 characters.", { variant: "destructive" })
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      toast("Passwords do not match.", { variant: "destructive" })
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, role: "admin" },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      toast("Registration failed: " + signUpError.message, { variant: "destructive" })
      setLoading(false)
      return
    }

    const userId = data.user?.id

    if (userId) {
      const { error: adminError } = await supabase.from("admins").insert({
        user_id: userId,
        full_name: fullName,
        email,
        phone: phone || null,
        role: "Administrator",
        admin_code: adminCode,
      })

      if (adminError) {
        console.warn("Admin record insert failed:", adminError.message)
      }
    }

    toast("Admin account created! Please check your email to confirm.", { variant: "success" })
    router.push("/auth/admin/login")
  }

  async function handleGoogleSignIn() {
    setOauthLoading(true)
    setError("")

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/admin/login`,
      },
    })

    if (error) {
      setError(error.message)
      toast("Google sign-in failed: " + error.message, { variant: "destructive" })
      setOauthLoading(false)
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
                  placeholder="Admin Name"
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
                  placeholder="admin@tngc.edu"
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="h-10 w-full gap-2"
            onClick={handleGoogleSignIn}
            disabled={oauthLoading}
          >
            {oauthLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <svg className="size-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {oauthLoading ? "Redirecting..." : "Continue with Google"}
          </Button>

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