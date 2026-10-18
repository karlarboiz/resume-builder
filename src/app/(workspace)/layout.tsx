import Link from "next/link"
import { Suspense } from "react"
import { signOut } from "@/auth"
import { requireUser } from "@/lib/session"

export const instant = false

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="h-14 border-b border-line" />}>
        <WorkspaceHeader />
      </Suspense>
      {children}
    </div>
  )
}

async function WorkspaceHeader() {
  const user = await requireUser()
  return (
    <header className="flex items-center justify-between border-b border-line px-4 py-3">
      <Link href="/dashboard" className="font-serif text-xl">Resume Builder</Link>
      <div className="flex items-center gap-4 text-sm">
        <span className="hidden text-ink/70 sm:inline">{user.email}</span>
        <Link href="/onboarding">Profile</Link>
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/" })
          }}
        >
          <button type="submit" className="text-ink/70">Sign out</button>
        </form>
      </div>
    </header>
  )
}
