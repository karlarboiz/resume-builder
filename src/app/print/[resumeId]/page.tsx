import { notFound } from "next/navigation"
import { Suspense } from "react"
import { ResumeTemplate } from "@/components/templates"
import { prisma } from "@/lib/db"
import { parseContent } from "@/lib/services"
import { printToken, safeEqual } from "@/lib/share"

export const instant = false

export default function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ resumeId: string }>
  searchParams: Promise<{ token?: string }>
}) {
  return (
    <Suspense>
      <PrintSheet params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function PrintSheet({
  params,
  searchParams,
}: {
  params: Promise<{ resumeId: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { resumeId } = await params
  const { token } = await searchParams
  if (!token || !safeEqual(token, printToken(resumeId))) notFound()
  const resume = await prisma.resume.findUnique({ where: { id: resumeId } })
  if (!resume) notFound()
  const content = parseContent(resume.content)
  return (
    <main className="bg-white">
      <ResumeTemplate
        templateId={resume.templateId}
        content={content}
        accentColor={resume.accentColor}
        fontPairing={resume.fontPairing}
        lineHeight={resume.lineHeight}
      />
    </main>
  )
}
