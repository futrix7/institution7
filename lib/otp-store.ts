const otpStore = new Map<string, { code: string; expiresAt: number }>()

export function setOtp(email: string, code: string, expiresAt: number) {
  otpStore.set(email.toLowerCase(), { code, expiresAt })
}

export function verifyOtp(email: string, code: string): { valid: boolean; reason?: string } {
  const record = otpStore.get(email.toLowerCase())

  if (!record) {
    return { valid: false, reason: "No OTP found. Please request a new one." }
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase())
    return { valid: false, reason: "OTP has expired. Please request a new one." }
  }

  if (record.code !== code) {
    return { valid: false, reason: "Invalid OTP. Please try again." }
  }

  otpStore.delete(email.toLowerCase())
  return { valid: true }
}
