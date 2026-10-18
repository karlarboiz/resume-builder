import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx"
import {
  SKILL_BUCKETS,
  sectionTitle,
  type ResumeContent,
} from "@/lib/resume"
import { displayHost, externalHref } from "@/lib/utils"

function text(value: string, options?: { bold?: boolean; size?: number; color?: string; italics?: boolean }) {
  return new TextRun({
    text: value,
    bold: options?.bold,
    italics: options?.italics,
    size: options?.size ?? 21,
    font: "Calibri",
    color: options?.color,
  })
}

export async function resumeToDocx(input: {
  title: string
  content: ResumeContent
  accentColor: string
}) {
  const { basics, sections } = input.content
  const accent = input.accentColor.replace("#", "")
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [text(basics.fullName || input.title, { bold: true, size: 36, color: accent })],
    }),
  ]

  if (basics.headline) {
    children.push(new Paragraph({ children: [text(basics.headline, { size: 22, italics: true })] }))
  }

  const contact = [
    basics.showContact ? basics.email : "",
    basics.showContact ? basics.phone : "",
    basics.location,
    basics.portfolioUrl ? displayHost(basics.portfolioUrl) : "",
    basics.linkedinUrl ? displayHost(basics.linkedinUrl) : "",
  ].filter(Boolean)
  if (contact.length) {
    children.push(new Paragraph({ children: [text(contact.join("  ·  "), { size: 18, color: "444444" })] }))
  }

  for (const section of sections) {
    if (section.type === "summary" && !section.text.trim()) continue
    if (section.type !== "summary" && section.type !== "custom" && section.items.length === 0) continue
    if (section.type === "custom" && section.items.every((item) => !item.trim())) continue

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 280, after: 80 },
        children: [text(sectionTitle(section).toUpperCase(), { bold: true, size: 22, color: accent })],
      }),
    )

    if (section.type === "summary") {
      children.push(new Paragraph({ children: [text(section.text)] }))
    }

    if (section.type === "experience") {
      for (const item of section.items) {
        children.push(
          new Paragraph({
            spacing: { before: 140 },
            children: [text(`${item.role}${item.company ? ` — ${item.company}` : ""}`, { bold: true })],
          }),
        )
        const meta = [item.location, item.start, item.current ? "Present" : item.end].filter(Boolean).join(" · ")
        if (meta) children.push(new Paragraph({ children: [text(meta, { size: 18, color: "555555", italics: true })] }))
        for (const bullet of item.bullets.filter(Boolean)) {
          children.push(new Paragraph({ text: bullet, bullet: { level: 0 } }))
        }
      }
    }

    if (section.type === "education") {
      for (const item of section.items) {
        children.push(
          new Paragraph({
            spacing: { before: 120 },
            children: [text(`${item.degree || "Study"}${item.school ? `, ${item.school}` : ""}`, { bold: true })],
          }),
        )
        const meta = [item.location, item.start, item.end].filter(Boolean).join(" · ")
        if (meta) children.push(new Paragraph({ children: [text(meta, { size: 18, color: "555555" })] }))
        if (item.details) children.push(new Paragraph({ children: [text(item.details)] }))
      }
    }

    if (section.type === "projects") {
      for (const item of section.items) {
        const href = item.url ? externalHref(item.url) : ""
        children.push(
          new Paragraph({
            spacing: { before: 120 },
            children: [text(href ? `${item.name} (${href})` : item.name, { bold: true })],
          }),
        )
        for (const bullet of item.bullets.filter(Boolean)) {
          children.push(new Paragraph({ text: bullet, bullet: { level: 0 } }))
        }
      }
    }

    if (section.type === "skills") {
      for (const bucket of SKILL_BUCKETS) {
        const names = section.items.filter((item) => item.category === bucket)
        if (!names.length) continue
        const label = names
          .map((item) => {
            if (!item.showProficiency) return item.name
            if (item.indicator === "years") return `${item.name} (${item.years} yrs)`
            return `${item.name} (${item.level}/5)`
          })
          .join(", ")
        children.push(new Paragraph({ children: [text(`${bucket}: ${label}`)] }))
      }
    }

    if (section.type === "custom") {
      for (const item of section.items.filter(Boolean)) {
        children.push(new Paragraph({ text: item, bullet: { level: 0 } }))
      }
    }
  }

  const document = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
        },
        children,
      },
    ],
  })

  return Packer.toBuffer(document)
}
