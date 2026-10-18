"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { passwordMatches } from "@/lib/services"
import { shareCookieName, signValue } from "@/lib/share"

export async function unlockResume(formData: FormData) {
  const slug = String(formData.get("slug") || "")
  const password = String(formData.get("password") || "")
  const resume = await prisma.resume.findUnique({ where: { slug } })
  if (!resume?.sharePasswordHash) redirect(`/v/${slug}`)
  const matches = await passwordMatches(password, resume.sharePasswordHash)
  if (!matches) redirect(`/v/${slug}?locked=1`)
  const jar = await cookies()
  jar.set(shareCookieName(resume.id), signValue("share", resume.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  })
  redirect(`/v/${slug}`)
}