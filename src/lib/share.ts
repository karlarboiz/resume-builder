import { createHmac, timingSafeEqual } from "node:crypto"

function secret() {
  const value = process.env.AUTH_SECRET
  if (!value) throw new Error("AUTH_SECRET is not set")
  return value
}

export function signValue(purpose: string, value: string) {
  return createHmac("sha256", secret()).update(`${purpose}:${value}`).digest("hex")
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function shareCookieName(resumeId: string) {
  return `resume_share_${resumeId}`
}

export function printToken(resumeId: string) {
  return signValue("print", resumeId)
}
