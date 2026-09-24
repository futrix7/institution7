"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Mail, ArrowLeft, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/sonner"

export default function AdminResetPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/admin/update-password`,
      })

      if (error) {
        setError(error.message)
        toast("Failed to send reset link: " + error.message, { variant: "destructive" })
        setLoading(false)
        return
      }

      setSent(true)
      toast("Reset link sent! Check your email.", { variant: "success" })
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10">
            {sent ? (
              <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Shield className="size-7 text-amber-600 dark:text-amber-500" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {sent ? "Check Your Email" : "Admin Password Reset"}
          </CardTitle>
          <CardDescription>
            {sent
              ? "We've sent a password reset link to your email. Click it to choose a new password."
              : "Enter your email to receive reset instructions"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground break-words">
                Link sent to <span className="font-semibold text-foreground">{email}</span>
              </p>
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground text-center">
                Didn&apos;t receive it? Check your spam folder or try again after a minute.
              </div>
              <Button
                variant="outline"
                className="h-10 w-full gap-2"
                onClick={() => setSent(false)}
                disabled={loading}
              >
                <Mail className="size-4" />
                Use a different email
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
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

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="h-10 w-full gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Send Reset Link
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