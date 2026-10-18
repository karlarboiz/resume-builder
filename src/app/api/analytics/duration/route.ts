import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"

const payloadSchema = z.object({
  viewId: z.string().min(1),
  durationSec: z.number().int().min(0).max(1800),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = payloadSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  const view = await prisma.resumeView.findUnique({ where: { id: parsed.data.viewId } })
  if (!view) return NextResponse.json({ ok: false }, { status: 404 })
  if (parsed.data.durationSec > view.durationSec) {
    await prisma.resumeView.update({
      where: { id: view.id },
      data: { durationSec: parsed.data.durationSec },
    })
  }
  return NextResponse.json({ ok: true })
}
