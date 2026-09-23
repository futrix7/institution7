import { NextResponse } from "next/server"
import { Resend } from "resend"
import { setOtp } from "@/lib/otp-store"

const resend = new Resend(process.env.RESEND_API_KEY)

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  const code = generateOtp()
  const expiresAt = Date.now() + 10 * 60 * 1000

  setOtp(email, code, expiresAt)

  try {
    const { data, error } = await resend.emails.send({
      from: "TNGC <onboarding@resend.dev>",
      to: email,
      subject: "Your TNGC Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a; text-align: center;">TNGC Computers</h2>
          <p style="font-size: 16px; color: #333;">Your verification code is:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #16a34a;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #666;">This code expires in 10 minutes.</p>
          <p style="font-size: 12px; color: #999;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("OTP send failed:", err)
    const message = err instanceof Error ? err.message : "Failed to send OTP"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
