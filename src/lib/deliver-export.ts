import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { loadResumeForExport, visitorHashFromRequest } from "@/lib/export-access"
import { resumeToDocx } from "@/lib/docx"
import { renderPdf } from "@/lib/pdf"
import { printToken } from "@/lib/share"
import { storeExport } from "@/lib/storage"
import { slugify } from "@/lib/utils"

async function readTarget(request: Request) {
  const url = new URL(request.url)
  if (request.method === "GET") {
    return { slug: url.searchParams.get("slug") || undefined, resumeId: undefined }
  }
  const body = await request.json().catch(() => null)
  return {
    resumeId: typeof body?.resumeId === "string" ? body.resumeId : undefined,
    slug: typeof body?.slug === "string" ? body.slug : undefined,
  }
}

export async function deliverExport(request: Request, format: "pdf" | "docx") {
  const target = await readTarget(request)
  const loaded = await loadResumeForExport(target)
  if ("error" in loaded && loaded.error) return loaded.error
  if (!("resume" in loaded)) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 })
  }

  const { resume, content, trackDownload } = loaded
  const filename = `${slugify(resume.slug)}.${format}`

  try {
    let body: Buffer
    let contentType: string
    if (format === "docx") {
      body = Buffer.from(
        await resumeToDocx({ title: resume.title, content, accentColor: resume.accentColor }),
      )
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    } else {
      const origin = process.env.APP_URL || process.env.AUTH_URL || "http://127.0.0.1:3000"
      const url = `${origin}/print/${resume.id}?token=${printToken(resume.id)}`
      body = await renderPdf(url)
      contentType = "application/pdf"
    }

    const stored = await storeExport(
      `${resume.userId}/${resume.id}/${Date.now()}.${format}`,
      body,
      contentType,
    )
    await prisma.exportArtifact.create({
      data: { resumeId: resume.id, format, location: stored.location },
    })

    if (trackDownload && format === "pdf") {
      const visitorHash = await visitorHashFromRequest()
      const recent = await prisma.resumeView.findFirst({
        where: {
          resumeId: resume.id,
          visitorHash,
          createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
        },
        orderBy: { createdAt: "desc" },
      })
      if (recent) {
        await prisma.resumeView.update({
          where: { id: recent.id },
          data: { downloadedPdf: true },
        })
      } else {
        await prisma.resumeView.create({
          data: {
            resumeId: resume.id,
            visitorHash,
            referrer: "download",
            downloadedPdf: true,
          },
        })
      }
    }

    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
