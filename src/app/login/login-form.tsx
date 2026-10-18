"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { requestMagicLink, signInWithGitHub, signInWithGoogle, type MagicLinkState } from "@/app/login/actions"

export function LoginForm({
  google,
  github,
  devMailbox,
}: {
  google: boolean
  github: boolean
  devMailbox: string | null
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(requestMagicLink, {} as MagicLinkState)

  useEffect(() => {
    if (state.sent) router.refresh()
  }, [state.sent, router])

  return (
    <div className="space-y-4">
      {google ? (
        <form action={signInWithGoogle}>
          <Button type="submit" variant="secondary" className="w-full">Continue with Google</Button>
        </form>
      ) : null}
      {github ? (
        <form action={signInWithGitHub}>
          <Button type="submit" variant="secondary" className="w-full">Continue with GitHub</Button>
        </form>
      ) : null}
      <form action={action} className="space-y-3">
        <label className="block text-sm" htmlFor="email">Email for a magic link</label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending" : "Email me a link"}
        </Button>
        {state.error ? <p className="text-sm text-clay">{state.error}</p> : null}
        {state.sent ? <p className="text-sm text-pine">Check your inbox for the sign-in link.</p> : null}
      </form>
      {devMailbox ? (
        <div className="rounded-xl border border-dashed border-pine/40 bg-pine/5 p-3 text-sm">
          <p className="font-medium">Local sign-in link</p>
          <p className="mt-1 text-ink/70">No email server is configured, so the latest link opens from here.</p>
          <button
            type="button"
            className="mt-2 text-pine underline"
            onClick={async () => {
              const response = await fetch("/api/dev/mailbox")
              const data = await response.json()
              if (data.url) window.location.assign(data.url)
            }}
          >
            Continue as {devMailbox}
          </button>
        </div>
      ) : (
        <p className="text-xs text-ink/55">
          Google and GitHub appear after their client ids are set. Without an email server, the magic link is printed here in development.
        </p>
      )}
    </div>
  )
}
