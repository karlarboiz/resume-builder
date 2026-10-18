import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { resumeSettingsSchema } from "@/lib/resume"
import { saveResume } from "@/lib/services"

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = resumeSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "The resume could not be saved. Check the fields and try again." }, { status: 400 })
  }

  const id = typeof body?.id === "string" ? body.id : undefined
  const resume = await saveResume(user.id, { ...parsed.data, id })
  if (!resume) return NextResponse.json({ error: "Resume not found." }, { status: 404 })
  return NextResponse.json({
    id: resume.id,
    slug: resume.slug,
    updatedAt: resume.updatedAt.toISOString(),
  })
}
