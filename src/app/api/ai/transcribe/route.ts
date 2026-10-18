import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { transcribeAudio } from "@/lib/ai"

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 })

  const form = await request.formData()
  const audio = form.get("audio")
  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "Attach an audio file." }, { status: 400 })
  }
  if (audio.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Keep the recording under 10 MB." }, { status: 400 })
  }

  try {
    const text = await transcribeAudio(audio)
    return NextResponse.json({ text })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcription failed."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
