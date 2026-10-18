import { connection } from "next/server"
import Link from "next/link"
import { Suspense } from "react"
import { ResumeTemplate } from "@/components/templates"
import { auth } from "@/auth"
import { sampleContent } from "@/lib/resume"

export default function HomePage() {
  return (
    <div>
      <Suspense fallback={<div className="h-16" />}>
        <HomeHeader />
      </Suspense>
      <main className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-pine">For the person reading it</p>
          <h1 className="mt-3 max-w-xl font-serif text-5xl leading-tight">
            A resume you can reorder, rewrite, export, and hand to a hiring manager.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink/75">
            Build an ATS-friendly document, drag sections and skills into the order you want, ask for a section rewrite in text or by voice, then export PDF and Word or share a public link with view analytics.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-full bg-pine px-5 py-3 text-sm text-white">
              Start a resume
            </Link>
            <a href="#how" className="rounded-full border border-line bg-card px-5 py-3 text-sm">
              See what it includes
            </a>
          </div>
        </div>
        <div className="rounded-3xl bg-[#ebe4d6] p-4">
          <ResumeTemplate
            templateId="modern-clean"
            content={sampleContent}
            accentColor="#1f6b4a"
            fontPairing="modern"
            lineHeight={1.4}
          />
        </div>
      </main>
      <section id="how" className="mx-auto grid max-w-6xl gap-4 px-6 py-16 md:grid-cols-3">
        {[
          ["Five templates", "Modern Clean, Executive Serif, Tech Minimalist, Creative Split, and Compact Single-Page. Accent, type, and line height stay live."],
          ["Section agent", "Each section has a rewrite control for typed or spoken direction, then a side-by-side review before you accept it."],
          ["A link, not an attachment", "Public pages can hide your email, take a password, track views and PDF downloads, and accept a message."],
        ].map(([title, copy]) => (
          <article key={title} className="rounded-2xl border border-line bg-card p-5">
            <h2 className="font-serif text-2xl">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/75">{copy}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

async function HomeHeader() {
  await connection()
  const session = await auth()
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <p className="font-serif text-xl">Resume Builder</p>
      {session?.user ? (
        <Link href="/dashboard" className="rounded-full bg-ink px-4 py-2 text-sm text-paper">
          Dashboard
        </Link>
      ) : (
        <Link href="/login" className="rounded-full bg-ink px-4 py-2 text-sm text-paper">
          Sign in
        </Link>
      )}
    </header>
  )
}
