"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Lock, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/sonner"

export default function AdminUpdatePasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session))
      setChecking(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      toast("Password update failed: " + error.message, { variant: "destructive" })
      setLoading(false)
      return
    }

    toast("Password updated! Please sign in.", { variant: "success" })
    router.push("/auth/admin/login")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10">
            <Shield className="size-7 text-amber-600 dark:text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Password Reset</CardTitle>
          <CardDescription>
            Choose a new password for your admin account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {checking ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Checking session...
            </div>
          ) : !hasSession ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                This reset link is invalid or has expired. Please request a new one.
              </div>
              <Link href="/auth/admin/reset-password">
                <Button className="h-10 w-full gap-2">
                  Request New Link
                </Button>
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    className="h-10 pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter new password"
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
                disabled={loading || !password || password !== confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/auth/admin/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to Admin Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}