import { NextResponse } from "next/server"
import { cookies, headers } from "next/headers"
import { createHash } from "node:crypto"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { parseContent } from "@/lib/services"
import { safeEqual, shareCookieName } from "@/lib/share"

export async function visitorHashFromRequest() {
  const headerStore = await headers()
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  const ua = headerStore.get("user-agent") || "unknown"
  return createHash("sha256")
    .update(`${ip}|${ua}|${process.env.AUTH_SECRET || "dev"}`)
    .digest("hex")
    .slice(0, 32)
}

export async function loadResumeForExport(input: { resumeId?: string; slug?: string }) {
  if (input.resumeId) {
    const user = await getCurrentUser()
    if (!user) {
      return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) }
    }
    const resume = await prisma.resume.findFirst({
      where: { id: input.resumeId, userId: user.id },
    })
    if (!resume) {
      return { error: NextResponse.json({ error: "Resume not found." }, { status: 404 }) }
    }
    return { resume, content: parseContent(resume.content), trackDownload: false }
  }

  if (!input.slug) {
    return { error: NextResponse.json({ error: "Missing resume." }, { status: 400 }) }
  }

  const resume = await prisma.resume.findUnique({
    where: { slug: input.slug },
    include: { user: true },
  })
  if (!resume) {
    return { error: NextResponse.json({ error: "Resume not found." }, { status: 404 }) }
  }

  const user = await getCurrentUser()
  const isOwner = user?.id === resume.userId
  if (!resume.isPublic && !isOwner) {
    return { error: NextResponse.json({ error: "Resume not found." }, { status: 404 }) }
  }
  if (resume.sharePasswordHash && !isOwner) {
    const cookieStore = await cookies()
    const token = cookieStore.get(shareCookieName(resume.id))?.value || ""
    const { signValue } = await import("@/lib/share")
    if (!safeEqual(token, signValue("share", resume.id))) {
      return { error: NextResponse.json({ error: "This link is password protected." }, { status: 401 }) }
    }
  }

  return {
    resume,
    content: parseContent(resume.content),
    trackDownload: !isOwner,
  }
}
