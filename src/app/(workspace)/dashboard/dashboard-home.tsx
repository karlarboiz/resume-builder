"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createResumeAction, deleteResumeAction } from "@/app/(workspace)/actions"
import { Button } from "@/components/ui/button"
import { TEMPLATES } from "@/lib/resume"

export type DashboardResume = {
  id: string
  title: string
  slug: string
  templateId: string
  isPublic: boolean
  updatedAt: string
  viewCount: number
  views: {
    visitorHash: string
    referrer: string | null
    durationSec: number
    downloadedPdf: boolean
  }[]
  inquiries: {
    id: string
    name: string
    email: string
    message: string
    createdAt: string
  }[]
}

function summarize(resume: DashboardResume) {
  const unique = new Set(resume.views.map((view) => view.visitorHash)).size
  const downloads = resume.views.filter((view) => view.downloadedPdf).length
  const durations = resume.views.map((view) => view.durationSec).filter((value) => value > 0)
  const average = durations.length
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
    : 0
  const referrers = new Map<string, number>()
  for (const view of resume.views) {
    const key = view.referrer || "Direct"
    referrers.set(key, (referrers.get(key) || 0) + 1)
  }
  return {
    unique,
    downloads,
    average,
    referrers: [...referrers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4),
  }
}

export function DashboardHome({ initial }: { initial: DashboardResume[] }) {
  const [resumes, setResumes] = useState(initial)

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const response = await fetch("/api/analytics/summary")
      if (!response.ok) return
      const data = await response.json()
      setResumes((current) =>
        current.map((resume) => {
          const next = data.resumes?.find((item: { id: string }) => item.id === resume.id)
          return next ? { ...resume, viewCount: next.viewCount, views: next.views, inquiries: next.inquiries } : resume
        }),
      )
    }, 10000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Your resumes</h1>
          <p className="mt-2 text-sm text-ink/70">Views, reading time, and messages refresh every few seconds.</p>
        </div>
        <form action={createResumeAction}>
          <Button type="submit">New resume</Button>
        </form>
      </div>
      {resumes.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-line bg-card p-6 text-sm">
          No resumes yet. Create one from your saved profile.
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {resumes.map((resume) => {
            const stats = summarize(resume)
            const template = TEMPLATES.find((item) => item.id === resume.templateId)?.name || resume.templateId
            return (
              <article key={resume.id} className="rounded-2xl border border-line bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl">{resume.title}</h2>
                    <p className="text-sm text-ink/60">
                      {template} · {resume.isPublic ? "Public" : "Private"} · Updated {new Date(resume.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/editor/${resume.id}`} className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm text-paper">Edit</Link>
                    <form action={deleteResumeAction} onSubmit={(event) => { if (!confirm("Delete this resume?")) event.preventDefault() }}>
                      <input type="hidden" name="id" value={resume.id} />
                      <Button type="submit" variant="danger" size="sm">Delete</Button>
                    </form>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div><dt className="text-ink/50">Views</dt><dd className="text-lg">{resume.viewCount}</dd></div>
                  <div><dt className="text-ink/50">Unique readers</dt><dd className="text-lg">{stats.unique}</dd></div>
                  <div><dt className="text-ink/50">Avg. read</dt><dd className="text-lg">{stats.average}s</dd></div>
                  <div><dt className="text-ink/50">PDF downloads</dt><dd className="text-lg">{stats.downloads}</dd></div>
                </dl>
                {stats.referrers.length ? (
                  <p className="mt-3 text-xs text-ink/60">
                    Sources: {stats.referrers.map(([name, count]) => `${name} (${count})`).join(", ")}
                  </p>
                ) : null}
                {resume.isPublic ? (
                  <p className="mt-2 text-sm">
                    <a className="text-pine underline" href={`/v/${resume.slug}`}>/v/{resume.slug}</a>
                  </p>
                ) : null}
                {resume.inquiries.length ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Messages</p>
                    {resume.inquiries.map((inquiry) => (
                      <div key={inquiry.id} className="rounded-xl bg-paper px-3 py-2 text-sm">
                        <p className="font-medium">{inquiry.name} · {inquiry.email}</p>
                        <p className="mt-1 text-ink/80">{inquiry.message}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
