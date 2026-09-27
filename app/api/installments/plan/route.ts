import { NextResponse } from "next/server"
import { authenticateAdminRequest, isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin"
import { describeRpcFailure, failureResponse } from "@/lib/api-response"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Builds or rebuilds a course fee schedule.
 *
 * The dialog used to insert the rows itself, dividing with
 * `Math.ceil(remaining / count)` and writing that same figure `count` times. A
 * ₹10,000 fee over three installments became 3 × ₹3,334 = ₹10,002, so the
 * schedule no longer summed to the course fee and the last student to be
 * invoiced was billed the overshoot. The split now happens in SQL, where the
 * final installment absorbs the remainder and the parts always add back up.
 */
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured) {
    console.error("[installments/plan] SUPABASE_SERVICE_ROLE_KEY is missing from .env.local")
    return NextResponse.json(
      { error: "This action is unavailable right now." },
      { status: 503 }
    )
  }

  const auth = await authenticateAdminRequest(request)

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: { feeId?: unknown; count?: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 })
  }

  const feeId = typeof body.feeId === "string" ? body.feeId.trim() : ""
  const count = typeof body.count === "number" ? body.count : Number(body.count)

  if (!UUID_PATTERN.test(feeId)) {
    return NextResponse.json({ error: "That fee record could not be identified." }, { status: 400 })
  }

  if (!Number.isInteger(count) || count < 1 || count > 12) {
    return NextResponse.json(
      { error: "Choose between 1 and 12 installments." },
      { status: 400 }
    )
  }

  try {
    const { error } = await supabaseAdmin.rpc("replace_installment_plan", {
      p_fee_id: feeId,
      p_count: count,
    })

    if (error) {
      // 22023 covers both the range check and "this fee already has a payment
      // against it and cannot be rescheduled". The second is worth reporting
      // verbatim: an admin who has already taken money cannot un-schedule it.
      // Anything else goes through describeRpcFailure, which separates "the
      // migration is missing" from an ordinary failure so the admin is not told
      // to retry a schedule build that cannot succeed.
      return failureResponse(
        describeRpcFailure(
          error,
          "installments/plan",
          "We couldn't build that schedule. Nothing was changed — please try again."
        )
      )
    }

    return NextResponse.json({ success: true, count })
  } catch (err) {
    console.error("[installments/plan] crashed:", err)
    return NextResponse.json(
      { error: "We couldn't build that schedule. Nothing was changed — please try again." },
      { status: 500 }
    )
  }
}
