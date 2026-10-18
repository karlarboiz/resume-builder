import { notFound } from "next/navigation"
import { Suspense } from "react"
import { ResumeEditor, type EditorResume } from "@/components/editor/resume-editor"
import { prisma } from "@/lib/db"
import { FONT_PAIRINGS, TEMPLATE_IDS, resumeContentSchema, type TemplateId } from "@/lib/resume"
import { requireUser } from "@/lib/session"

export const instant = false

export default function EditorPage({
  params,
}: {
  params: Promise<{ resumeId: string }>
}) {
  return (
    <Suspense fallback={<p className="px-6 py-10">Loading editor…</p>}>
      <EditorContent params={params} />
    </Suspense>
  )
}

async function EditorContent({ params }: { params: Promise<{ resumeId: string }> }) {
  const user = await requireUser()
  const { resumeId } = await params
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId: user.id } })
  if (!resume) notFound()
  const content = resumeContentSchema.safeParse(resume.content)
  if (!content.success) {
    return <p className="px-6 py-10">This resume’s saved content could not be read.</p>
  }

  const templateId = TEMPLATE_IDS.includes(resume.templateId as TemplateId)
    ? (resume.templateId as TemplateId)
    : "modern-clean"
  const fontPairing = FONT_PAIRINGS.includes(resume.fontPairing as EditorResume["fontPairing"])
    ? (resume.fontPairing as EditorResume["fontPairing"])
    : "modern"

  const initial: EditorResume = {
    id: resume.id,
    title: resume.title,
    slug: resume.slug,
    templateId,
    accentColor: resume.accentColor,
    fontPairing,
    lineHeight: resume.lineHeight,
    isPublic: resume.isPublic,
    hasPassword: Boolean(resume.sharePasswordHash),
    content: content.data,
    targetJobs: user.targetJobs,
  }

  return <ResumeEditor initial={initial} />
}
