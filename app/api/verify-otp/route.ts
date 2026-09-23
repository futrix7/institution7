import { NextResponse } from "next/server"
import { verifyOtp } from "@/lib/otp-store"

export async function POST(request: Request) {
  const { email, code } = await request.json()

  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
  }

  const result = verifyOtp(email, code)

  if (result.valid) {
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: result.reason }, { status: 400 })
}
