import Link from "next/link"
import { Suspense } from "react"
import { LoginForm } from "@/app/login/login-form"
import { readDevMailbox } from "@/lib/mailbox"

export const instant = false

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <Suspense fallback={<main className="px-6 py-16">Loading sign in…</main>}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  )
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const query = await searchParams
  const mailbox = await readDevMailbox()
  const google = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
  const github = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET)

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="font-serif text-2xl">
        Resume Builder
      </Link>
      <h1 className="mt-6 font-serif text-4xl">Sign in</h1>
      <p className="mt-2 text-sm text-ink/70">
        Use Google, GitHub, or a one-time email link. New accounts continue into profile setup.
      </p>
      {query.error ? (
        <p className="mt-4 rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">
          Sign-in did not complete. Try the link again.
        </p>
      ) : null}
      <div className="mt-6">
        <LoginForm google={google} github={github} devMailbox={mailbox?.identifier ?? null} />
      </div>
    </main>
  )
}
