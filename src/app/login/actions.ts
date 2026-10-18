"use server"

import { signIn } from "@/auth"
import { z } from "zod"

export type MagicLinkState = { error?: string; sent?: boolean }

function isRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  )
}

export async function requestMagicLink(_state: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const email = String(formData.get("email") || "").trim()
  if (!z.email().safeParse(email).success) {
    return { error: "Enter a valid email address." }
  }
  try {
    await signIn("nodemailer", { email, redirect: false, redirectTo: "/dashboard" })
  } catch (error) {
    if (isRedirect(error)) throw error
    return { error: error instanceof Error ? error.message : "Could not send the sign-in link." }
  }
  return { sent: true }
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" })
}

export async function signInWithGitHub() {
  await signIn("github", { redirectTo: "/dashboard" })
}
