import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/session"
import { improveSection } from "@/lib/ai"
import { sectionSchema } from "@/lib/resume"

const payloadSchema = z.object({
  sectionType: z.string().min(1),
  currentContent: z.unknown(),
  promptText: z.string().trim().min(1).max(2000),
  jobTarget: z.array(z.string()).max(12).default([]),
})

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = payloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Add a prompt before asking for a rewrite." }, { status: 400 })
  }

  const section = sectionSchema.safeParse(parsed.data.currentContent)
  if (!section.success || section.data.type !== parsed.data.sectionType) {
    return NextResponse.json({ error: "That section could not be read." }, { status: 400 })
  }

  try {
    const result = await improveSection({
      section: section.data,
      promptText: parsed.data.promptText,
      jobTarget: parsed.data.jobTarget.length ? parsed.data.jobTarget : user.targetJobs,
    })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "The rewrite failed."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
