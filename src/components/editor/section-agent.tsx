"use client"

import { useState } from "react"
import { Mic, Sparkles, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/input"
import { sectionToPlain, type ResumeSection } from "@/lib/resume"

type SpeechResult = {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>
}

type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechResult) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
}

export function SectionAgent({
  section,
  jobTarget,
  onAccept,
}: {
  section: ResumeSection
  jobTarget: string[]
  onAccept: (section: ResumeSection) => void
}) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [listening, setListening] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [revised, setRevised] = useState<ResumeSection | null>(null)
  const [mode, setMode] = useState<"openai" | "local" | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  async function improve(nextPrompt = prompt) {
    setError("")
    if (!nextPrompt.trim()) {
      setError("Type a direction, or dictate one.")
      return
    }
    setPending(true)
    try {
      const response = await fetch("/api/ai/improve-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType: section.type,
          currentContent: section,
          promptText: nextPrompt,
          jobTarget,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "The rewrite failed.")
        return
      }
      setRevised(data.section)
      setMode(data.mode)
      setOpen(false)
      setReviewOpen(true)
    } catch {
      setError("The rewrite failed.")
    } finally {
      setPending(false)
    }
  }

  function startVoice() {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) {
      setError("This browser has no speech recognition. Upload a short recording instead.")
      return
    }
    const recognition = new Ctor()
    recognition.lang = "en-US"
    recognition.interimResults = true
    recognition.continuous = false
    recognition.onresult = (event) => {
      let text = ""
      for (let index = 0; index < event.results.length; index += 1) {
        text += event.results[index][0].transcript
      }
      setPrompt(text)
    }
    recognition.onerror = () => setError("The microphone did not produce a transcript.")
    recognition.onend = () => setListening(false)
    setListening(true)
    recognition.start()
  }

  async function uploadAudio(file: File) {
    setError("")
    setPending(true)
    try {
      const body = new FormData()
      body.set("audio", file)
      const response = await fetch("/api/ai/transcribe", { method: "POST", body })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Transcription failed.")
        return
      }
      setPrompt((current) => `${current} ${data.text || ""}`.trim())
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon" aria-label="Improve this section">
            <Sparkles className="h-4 w-4 text-pine" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <p className="font-medium">Rewrite this section</p>
          <p className="mt-1 text-xs text-ink/60">
            Ask for a tighter summary, STAR bullets, or a tone aimed at your target role.
          </p>
          <Textarea
            className="mt-3 min-h-24"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Make the bullets more quantitative, without inventing numbers."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={startVoice}>
              <Mic className="h-3.5 w-3.5" />
              {listening ? "Listening" : "Microphone"}
            </Button>
            <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border border-line px-3 text-xs">
              <Upload className="h-3.5 w-3.5" />
              Audio
              <input
                className="sr-only"
                type="file"
                accept="audio/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void uploadAudio(file)
                }}
              />
            </label>
            <Button type="button" size="sm" disabled={pending} onClick={() => void improve()}>
              {pending ? "Working" : "Review changes"}
            </Button>
          </div>
          {error ? <p className="mt-2 text-xs text-clay">{error}</p> : null}
        </PopoverContent>
      </Popover>
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogTitle>Review the rewrite</DialogTitle>
          <p className="mt-1 text-sm text-ink/70">
            {mode === "local"
              ? "Local polish only. Add OPENAI_API_KEY for a GPT-4o rewrite. Nothing here invents employers or metrics."
              : "GPT-4o kept the original facts. Placeholders like [metric] mean a number was not in your source."}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Original</p>
              <pre className="mt-2 min-h-40 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm">{sectionToPlain(section)}</pre>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-pine">Suggested</p>
              <pre className="mt-2 min-h-40 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm">
                {revised ? sectionToPlain(revised) : ""}
              </pre>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                if (revised) onAccept(revised)
                setReviewOpen(false)
              }}
            >
              Accept changes
            </Button>
            <Button type="button" variant="secondary" disabled={pending} onClick={() => void improve()}>
              Try again
            </Button>
            <Button type="button" variant="ghost" onClick={() => setReviewOpen(false)}>
              Discard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
