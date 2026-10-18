import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { profilePatchSchema, profileSchema, patchProfile, saveProfile, createResumeForUser } from "@/lib/services"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the profile fields and try again." }, { status: 400 })
  }

  await saveProfile(user.id, parsed.data, { complete: true })
  const fresh = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: { skills: true, resumes: { take: 1, orderBy: { createdAt: "desc" } } },
  })
  const resume = fresh.resumes[0] ?? (await createResumeForUser(fresh))
  return NextResponse.json({ ok: true, resumeId: resume.id })
}

export async function PUT(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 })
  const body = await request.json().catch(() => null)
  const parsed = profilePatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the profile fields and try again." }, { status: 400 })
  }
  if (parsed.data.targetJobs && parsed.data.targetJobs.length === 0) {
    return NextResponse.json({ error: "Keep at least one target role." }, { status: 400 })
  }
  await patchProfile(user.id, parsed.data)
  return NextResponse.json({ ok: true })
}
