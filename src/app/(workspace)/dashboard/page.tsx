import { Suspense } from "react"
import { redirect } from "next/navigation"
import { DashboardHome, type DashboardResume } from "@/app/(workspace)/dashboard/dashboard-home"
import { prisma } from "@/lib/db"
import { requireUser } from "@/lib/session"

export const instant = false

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="px-6 py-10">Loading resumes…</p>}>
      <DashboardContent />
    </Suspense>
  )
}

async function DashboardContent() {
  const user = await requireUser()
  if (!user.onboardingComplete) redirect("/onboarding")

  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    include: {
      views: true,
      inquiries: { orderBy: { createdAt: "desc" }, take: 20 },
    },
    orderBy: { updatedAt: "desc" },
  })

  const initial: DashboardResume[] = resumes.map((resume) => ({
    id: resume.id,
    title: resume.title,
    slug: resume.slug,
    templateId: resume.templateId,
    isPublic: resume.isPublic,
    updatedAt: resume.updatedAt.toISOString(),
    viewCount: resume.viewCount,
    views: resume.views.map((view) => ({
      visitorHash: view.visitorHash,
      referrer: view.referrer,
      durationSec: view.durationSec,
      downloadedPdf: view.downloadedPdf,
    })),
    inquiries: resume.inquiries.map((inquiry) => ({
      id: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      message: inquiry.message,
      createdAt: inquiry.createdAt.toISOString(),
    })),
  }))

  return <DashboardHome initial={initial} />
}
