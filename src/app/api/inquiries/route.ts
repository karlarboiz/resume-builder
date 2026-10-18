import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"

const payloadSchema = z.object({
  slug: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  message: z.string().trim().min(1).max(4000),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = payloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Add your name, a valid email, and a message." }, { status: 400 })
  }

  const resume = await prisma.resume.findUnique({ where: { slug: parsed.data.slug } })
  if (!resume || !resume.isPublic) {
    return NextResponse.json({ error: "This resume is not accepting messages." }, { status: 404 })
  }

  await prisma.inquiry.create({
    data: {
      resumeId: resume.id,
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    },
  })

  return NextResponse.json({
    ok: true,
    message: "Message sent. The candidate sees it in their dashboard — their email stays hidden.",
  })
}
