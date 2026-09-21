"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Mail, ArrowLeft, Send } from "lucide-react"

export default function AdminResetPasswordPage() {
  const [email, setEmail] = useState("")

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10">
            <Shield className="size-7 text-amber-600 dark:text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Password Reset</CardTitle>
          <CardDescription>
            Enter your email to receive reset instructions
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
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

            <Button type="submit" className="h-10 w-full gap-2">
              <Send className="size-4" />
              Send Reset Link
            </Button>
          </form>

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
