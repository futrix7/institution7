import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin"
import { checkRateAcross } from "@/lib/rate-limit"
import { describeApiFailure, failureResponse, respondWithFailure } from "@/lib/api-response"

const WINDOW_MS = 60 * 60 * 1000
const MAX_ATTEMPTS_PER_IP = 10
const MIN_PASSWORD_LENGTH = 8

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  )
}

/** Constant-time compare so the invite code cannot be recovered by timing. */
function codeMatches(candidate: string, expected: string): boolean {
  const a = Buffer.from(candidate, "utf8")
  const b = Buffer.from(expected, "utf8")
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Creates an administrator account.
 *
 * The invite code is checked here rather than in the browser. A check made in a
 * client component is not a gate at all: the expected value ships in the
 * JavaScript bundle, where anyone can read it. The account and its `admins` row
 * are also written with the service-role key, so the browser never needs write
 * access to the `admins` table.
 */
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured) {
    console.error("[admin-register] SUPABASE_SERVICE_ROLE_KEY is missing from .env.local")
    return NextResponse.json(
      { error: "Admin registration is unavailable right now." },
      { status: 503 }
    )
  }

  const expectedCode = process.env.ADMIN_REG_CODE?.trim()

  if (!expectedCode) {
    console.error("[admin-register] ADMIN_REG_CODE is missing from .env.local")
    return NextResponse.json(
      { error: "Admin registration is not configured. Please contact the institute." },
      { status: 503 }
    )
  }

  let body: {
    fullName?: unknown
    email?: unknown
    phone?: unknown
    password?: unknown
    adminCode?: unknown
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 })
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const phone = typeof body.phone === "string" ? body.phone.trim() : ""
  const password = typeof body.password === "string" ? body.password : ""
  const adminCode = typeof body.adminCode === "string" ? body.adminCode.trim() : ""

  const ip = clientIp(request)
  const scopeKey = email || ip

  try {
    const rate = await checkRateAcross(
      [
        { scope: `admin-reg:code:${scopeKey}`, limit: MAX_ATTEMPTS_PER_IP },
        ...(ip !== "unknown" ? [{ scope: `admin-reg:ip:${ip}`, limit: MAX_ATTEMPTS_PER_IP * 3 }] : []),
      ],
      WINDOW_MS
    )

    if (!rate.allowed) {
      const mins = Math.max(1, Math.ceil(rate.retryInSec / 60))
      return NextResponse.json(
        { error: `Too many attempts. Please try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
        { status: 429 }
      )
    }
  } catch (err) {
    // This path deliberately fails closed: if the throttle cannot be consulted
    // the request is refused rather than admitted unmetered.
    const failure = describeApiFailure(err, "admin-register/rate-limit")
    return failureResponse({ ...failure, status: 503, error: "Admin registration is unavailable right now." })
  }

  if (!codeMatches(adminCode, expectedCode)) {
    return NextResponse.json({ error: "Invalid admin verification code." }, { status: 403 })
  }

  if (!fullName) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 })
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
  }

  if (phone && !/^\d{10}$/.test(phone)) {
    return NextResponse.json({ error: "Enter a valid 10-digit phone number" }, { status: 400 })
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    )
  }

  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json(
      { error: "Password must contain at least one letter and one number." },
      { status: 400 }
    )
  }

  try {
    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      // The invite code is the gate for this flow, so the address does not also
      // need a separate confirmation email.
      email_confirm: true,
      user_metadata: { full_name: fullName, phone, role: "admin" },
    })

    if (createError || !data.user) {
      const message = createError?.message ?? "Could not create the account"

      if (/already been registered|already exists/i.test(message)) {
        return NextResponse.json(
          { error: "An account with that email already exists." },
          { status: 409 }
        )
      }

      console.error("[admin-register] createUser failed:", message)
      return NextResponse.json(
        { error: "We couldn't create the account. Please try again." },
        { status: 500 }
      )
    }

    const { error: insertError } = await supabaseAdmin.from("admins").insert({
      user_id: data.user.id,
      full_name: fullName,
      email,
      phone: phone || null,
      role: "Administrator",
    })

    if (insertError) {
      // Do not leave a credentialed account behind with no admin record, or the
      // person can sign in but will be refused by every admin route.
      await supabaseAdmin.auth.admin.deleteUser(data.user.id).catch(() => {})
      console.error("[admin-register] admins insert failed:", insertError.message)
      return NextResponse.json(
        { error: "We couldn't finish creating the admin record. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return respondWithFailure(err, "admin-register/create")
  }
}
