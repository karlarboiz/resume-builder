import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 })

  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    include: {
      views: true,
      inquiries: { orderBy: { createdAt: "desc" }, take: 20 },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({
    resumes: resumes.map((resume) => ({
      id: resume.id,
      viewCount: resume.viewCount,
      views: resume.views.map((view) => ({
        visitorHash: view.visitorHash,
        referrer: view.referrer,
        durationSec: view.durationSec,
        downloadedPdf: view.downloadedPdf,
        createdAt: view.createdAt.toISOString(),
      })),
      inquiries: resume.inquiries.map((inquiry) => ({
        id: inquiry.id,
        name: inquiry.name,
        email: inquiry.email,
        message: inquiry.message,
        createdAt: inquiry.createdAt.toISOString(),
      })),
    })),
  })
}
