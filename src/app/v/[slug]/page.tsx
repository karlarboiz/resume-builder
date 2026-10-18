import { cookies, headers } from "next/headers"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { createHash } from "node:crypto"
import { unlockResume } from "@/app/v/[slug]/actions"
import { ContactCandidate, ViewTracker } from "@/app/v/[slug]/public-widgets"
import { ResumeTemplate } from "@/components/templates"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { parseContent } from "@/lib/services"
import { safeEqual, shareCookieName, signValue } from "@/lib/share"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const instant = false

export default function PublicResumePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ locked?: string }>
}) {
  return (
    <Suspense fallback={<main className="px-6 py-16">Loading resume…</main>}>
      <PublicResume params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function PublicResume({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ locked?: string }>
}) {
  const { slug } = await params
  const query = await searchParams
  const resume = await prisma.resume.findUnique({ where: { slug }, include: { user: true } })
  if (!resume) notFound()

  const session = await auth()
  const isOwner = session?.user?.email != null && session.user.email === resume.user.email
  if (!resume.isPublic && !isOwner) notFound()

  const jar = await cookies()
  const unlocked =
    !resume.sharePasswordHash ||
    isOwner ||
    safeEqual(jar.get(shareCookieName(resume.id))?.value || "", signValue("share", resume.id))

  if (!unlocked) {
    return (
      <main className="mx-auto max-w-md px-6 py-20">
        <h1 className="font-serif text-4xl">This resume is locked</h1>
        <p className="mt-2 text-sm text-ink/70">Enter the password the candidate shared with you.</p>
        {query.locked ? <p className="mt-3 text-sm text-clay">That password did not match.</p> : null}
        <form action={unlockResume} className="mt-6 space-y-3">
          <input type="hidden" name="slug" value={slug} />
          <Input name="password" type="password" required aria-label="Password" />
          <Button type="submit">Continue</Button>
        </form>
      </main>
    )
  }

  const content = parseContent(resume.content)
  let viewId: string | null = null
  if (!isOwner) {
    const headerStore = await headers()
    const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
    const ua = headerStore.get("user-agent") || "unknown"
    const visitorHash = createHash("sha256")
      .update(`${ip}|${ua}|${process.env.AUTH_SECRET || "dev"}`)
      .digest("hex")
      .slice(0, 32)
    const view = await prisma.resumeView.create({
      data: {
        resumeId: resume.id,
        visitorHash,
        referrer: headerStore.get("referer"),
      },
    })
    await prisma.resume.update({
      where: { id: resume.id },
      data: { viewCount: { increment: 1 } },
    })
    viewId = view.id
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      {viewId ? <ViewTracker viewId={viewId} /> : null}
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink/70">{content.basics.fullName}</p>
        <div className="flex gap-2">
          <a className="rounded-full bg-ink px-4 py-2 text-sm text-paper" href={`/api/export/pdf?slug=${resume.slug}`}>
            Download PDF
          </a>
          <a className="rounded-full border border-line bg-card px-4 py-2 text-sm" href={`/api/export/docx?slug=${resume.slug}`}>
            Download DOCX
          </a>
        </div>
      </div>
      <ResumeTemplate
        templateId={resume.templateId}
        content={content}
        accentColor={resume.accentColor}
        fontPairing={resume.fontPairing}
        lineHeight={resume.lineHeight}
      />
      <section className="no-print mx-auto mt-8 max-w-xl rounded-2xl border border-line bg-card p-5">
        <h2 className="font-serif text-2xl">Contact candidate</h2>
        <p className="mt-1 text-sm text-ink/70">
          Your note goes to their dashboard. Their personal email stays off this form.
        </p>
        <div className="mt-4">
          <ContactCandidate slug={resume.slug} />
        </div>
      </section>
    </main>
  )
}
