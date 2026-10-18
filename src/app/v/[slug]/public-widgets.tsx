"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"

export function ViewTracker({ viewId }: { viewId: string }) {
  useEffect(() => {
    const started = Date.now()
    const send = () => {
      const durationSec = Math.min(1800, Math.round((Date.now() - started) / 1000))
      const body = JSON.stringify({ viewId, durationSec })
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/duration", new Blob([body], { type: "application/json" }))
      } else {
        void fetch("/api/analytics/duration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        })
      }
    }
    window.addEventListener("pagehide", send)
    return () => window.removeEventListener("pagehide", send)
  }, [viewId])
  return null
}

export function ContactCandidate({ slug }: { slug: string }) {
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")

  async function onSubmit(formData: FormData) {
    setError("")
    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        name: formData.get("name"),
        email: formData.get("email"),
        message: formData.get("message"),
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(data.error || "Message was not sent.")
      return
    }
    setStatus(data.message || "Message sent.")
  }

  if (status) return <p className="text-sm text-pine">{status}</p>

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit(new FormData(event.currentTarget))
      }}
    >      <Input name="name" required placeholder="Your name" aria-label="Your name" />
      <Input name="email" type="email" required placeholder="Your email" aria-label="Your email" />
      <Textarea name="message" required placeholder="Message for the candidate" aria-label="Message" />
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <Button type="submit">Contact candidate</Button>
    </form>
  )
}
