"use client"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-6 py-24">
      <h1 className="font-serif text-4xl">Something went wrong</h1>
      <button className="mt-4 rounded-full bg-ink px-4 py-2 text-sm text-paper" onClick={reset} type="button">
        Try again
      </button>
    </main>
  )
}
