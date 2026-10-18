import {
  preserveSectionIds,
  sectionSchema,
  type ResumeSection,
} from "@/lib/resume"

function tidy(text: string) {
  const compact = text.replace(/\s+/g, " ").trim()
  if (!compact) return ""
  const capitalized = compact.charAt(0).toUpperCase() + compact.slice(1)
  return /[.!?]$/.test(capitalized) ? capitalized : capitalized
}

function polishLocally(section: ResumeSection, jobTarget: string[]): ResumeSection {
  const role = jobTarget[0]
  if (section.type === "summary") {
    const text = tidy(section.text)
    if (!text) {
      return {
        ...section,
        text: role
          ? `${role} with a record of specific, measurable work. Replace this sentence with your own scope, tools, and outcomes.`
          : "Specialist with a record of specific, measurable work. Replace this sentence with your own scope, tools, and outcomes.",
      }
    }
    return { ...section, text }
  }
  if (section.type === "experience") {
    return {
      ...section,
      items: section.items.map((item) => ({
        ...item,
        bullets: item.bullets.map((bullet) => tidy(bullet)).filter(Boolean),
      })),
    }
  }
  if (section.type === "projects") {
    return {
      ...section,
      items: section.items.map((item) => ({
        ...item,
        bullets: item.bullets.map((bullet) => tidy(bullet)).filter(Boolean),
      })),
    }
  }
  if (section.type === "custom") {
    return { ...section, items: section.items.map((item) => tidy(item)).filter(Boolean) }
  }
  if (section.type === "skills") {
    return {
      ...section,
      items: section.items.map((item) => ({ ...item, name: item.name.trim() })),
    }
  }
  return section
}

export async function improveSection(input: {
  section: ResumeSection
  promptText: string
  jobTarget: string[]
}) {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return {
      section: polishLocally(input.section, input.jobTarget),
      mode: "local" as const,
    }
  }

  const { default: OpenAI } = await import("openai")
  const client = new OpenAI({ apiKey: key })
  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: [
          "You edit a single resume section.",
          "Return JSON only: {\"section\": <same shape as the input section>}.",
          "Preserve every id.",
          "Do not invent employers, schools, dates, credentials, or metrics.",
          "If the user asks for numbers that are not in the source, use a bracket placeholder such as [metric] instead of fabricating a figure.",
          "Keep the section truthful, specific, and easy to scan.",
          input.jobTarget.length
            ? `Target roles: ${input.jobTarget.join(", ")}.`
            : "No target role was provided.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          instruction: input.promptText,
          section: input.section,
        }),
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error("The model returned an empty response.")
  const parsed = JSON.parse(raw) as { section?: unknown }
  const candidate = parsed.section ?? parsed
  const validated = sectionSchema.safeParse(candidate)
  if (!validated.success) {
    throw new Error("The model returned a section this editor could not apply.")
  }
  return {
    section: preserveSectionIds(input.section, validated.data),
    mode: "openai" as const,
  }
}

export async function transcribeAudio(file: File) {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error("Add OPENAI_API_KEY to transcribe audio with Whisper.")
  }
  const { default: OpenAI } = await import("openai")
  const client = new OpenAI({ apiKey: key })
  const result = await client.audio.transcriptions.create({
    file,
    model: "whisper-1",
  })
  return result.text
}
