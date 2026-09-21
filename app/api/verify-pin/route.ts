import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { pin } = await request.json()

  if (pin === process.env.FINANCE_PIN) {
    return NextResponse.json({ valid: true })
  }

  return NextResponse.json({ valid: false }, { status: 401 })
}
