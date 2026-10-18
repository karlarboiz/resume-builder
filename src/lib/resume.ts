import { z } from "zod"
import { newId } from "@/lib/utils"

export const SKILL_BUCKETS = ["Languages", "Frameworks", "Tools", "Domain", "Soft"] as const
export const TEMPLATE_IDS = [
  "modern-clean",
  "executive-serif",
  "tech-minimalist",
  "creative-split",
  "compact-single-page",
] as const
export const FONT_PAIRINGS = ["modern", "editorial", "technical"] as const

export const skillItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  category: z.enum(SKILL_BUCKETS),
  showProficiency: z.boolean(),
  indicator: z.enum(["bars", "dots", "years"]),
  level: z.number().int().min(1).max(5),
  years: z.number().int().min(0).max(60),
})

export const experienceItemSchema = z.object({
  id: z.string().min(1),
  role: z.string().trim().max(120),
  company: z.string().trim().max(120),
  location: z.string().trim().max(120),
  start: z.string().trim().max(40),
  end: z.string().trim().max(40),
  current: z.boolean(),
  bullets: z.array(z.string().trim().max(400)).max(12),
})

export const educationItemSchema = z.object({
  id: z.string().min(1),
  school: z.string().trim().max(160),
  degree: z.string().trim().max(160),
  location: z.string().trim().max(120),
  start: z.string().trim().max(40),
  end: z.string().trim().max(40),
  details: z.string().trim().max(400),
})

export const projectItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().max(120),
  url: z.string().trim().max(300),
  bullets: z.array(z.string().trim().max(400)).max(8),
})

export const sectionSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.literal("summary"),
    text: z.string().trim().max(4000),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("experience"),
    items: z.array(experienceItemSchema).max(20),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("education"),
    items: z.array(educationItemSchema).max(12),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("projects"),
    items: z.array(projectItemSchema).max(16),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("skills"),
    items: z.array(skillItemSchema).max(80),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("custom"),
    title: z.string().trim().min(1).max(80),
    items: z.array(z.string().trim().max(400)).max(16),
  }),
])

export const basicsSchema = z.object({
  fullName: z.string().trim().max(120),
  headline: z.string().trim().max(160),
  email: z.string().trim().max(160),
  phone: z.string().trim().max(40),
  location: z.string().trim().max(120),
  portfolioUrl: z.string().trim().max(300),
  linkedinUrl: z.string().trim().max(300),
  showContact: z.boolean(),
})

export const resumeContentSchema = z.object({
  basics: basicsSchema,
  sections: z.array(sectionSchema).min(1).max(12),
})

export const resumeSettingsSchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(60),
  templateId: z.enum(TEMPLATE_IDS),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  fontPairing: z.enum(FONT_PAIRINGS),
  lineHeight: z.number().min(1.1).max(1.8),
  isPublic: z.boolean(),
  content: resumeContentSchema,
  password: z.string().max(80).nullable().optional(),
})

export type SkillItem = z.infer<typeof skillItemSchema>
export type ExperienceItem = z.infer<typeof experienceItemSchema>
export type EducationItem = z.infer<typeof educationItemSchema>
export type ProjectItem = z.infer<typeof projectItemSchema>
export type ResumeSection = z.infer<typeof sectionSchema>
export type ResumeContent = z.infer<typeof resumeContentSchema>
export type SkillBucket = (typeof SKILL_BUCKETS)[number]
export type TemplateId = (typeof TEMPLATE_IDS)[number]

export const TEMPLATES: { id: TemplateId; name: string; description: string }[] = [
  {
    id: "modern-clean",
    name: "Modern Clean",
    description: "Single column, accent rules, ATS-friendly.",
  },
  {
    id: "executive-serif",
    name: "Executive Serif",
    description: "Centered name, serif headings, quiet rules.",
  },
  {
    id: "tech-minimalist",
    name: "Tech Minimalist",
    description: "Compact labels and hairline dividers.",
  },
  {
    id: "creative-split",
    name: "Creative Split",
    description: "Sidebar for skills with a linear text order.",
  },
  {
    id: "compact-single-page",
    name: "Compact Single-Page",
    description: "Tighter type for a one-page read.",
  },
]

const LANGUAGES = new Set([
  "typescript",
  "javascript",
  "python",
  "sql",
  "go",
  "java",
  "html",
  "css",
  "ruby",
  "rust",
  "kotlin",
  "c#",
  "c++",
])

const FRAMEWORKS = new Set([
  "react",
  "next.js",
  "node.js",
  "django",
  "spring",
  "vue",
  "angular",
  "express",
  "tailwind",
  "graphql",
  "figma",
])

export function bucketFor(
  name: string,
  onboardingCategory: "Technical" | "Soft" | "Domain",
): SkillBucket {
  if (onboardingCategory === "Soft") return "Soft"
  if (onboardingCategory === "Domain") return "Domain"
  const key = name.trim().toLowerCase()
  if (LANGUAGES.has(key)) return "Languages"
  if (FRAMEWORKS.has(key)) return "Frameworks"
  return "Tools"
}

export function emptySkill(name: string, category: SkillBucket): SkillItem {
  return {
    id: newId(),
    name,
    category,
    showProficiency: false,
    indicator: "bars",
    level: 3,
    years: 1,
  }
}

export function createInitialContent(input: {
  fullName: string
  email: string
  phone: string
  location: string
  portfolioUrl: string
  linkedinUrl: string
  headline: string
  skills: { name: string; category: SkillBucket }[]
}): ResumeContent {
  return {
    basics: {
      fullName: input.fullName,
      headline: input.headline,
      email: input.email,
      phone: input.phone,
      location: input.location,
      portfolioUrl: input.portfolioUrl,
      linkedinUrl: input.linkedinUrl,
      showContact: true,
    },
    sections: [
      { id: newId(), type: "summary", text: "" },
      {
        id: newId(),
        type: "skills",
        items: input.skills.map((skill) => emptySkill(skill.name, skill.category)),
      },
      { id: newId(), type: "experience", items: [] },
      { id: newId(), type: "projects", items: [] },
      { id: newId(), type: "education", items: [] },
    ],
  }
}

export const sampleContent: ResumeContent = {
  basics: {
    fullName: "Sample Candidate",
    headline: "Senior Frontend Engineer",
    email: "sample@example.com",
    phone: "(555) 010-0142",
    location: "Remote",
    portfolioUrl: "https://example.com",
    linkedinUrl: "https://www.linkedin.com/in/example",
    showContact: true,
  },
  sections: [
    {
      id: "summary",
      type: "summary",
      text: "Frontend engineer who ships accessible product UI, tightens design systems, and writes resumes the way hiring teams actually read them: specific, scannable, and honest.",
    },
    {
      id: "skills",
      type: "skills",
      items: [
        { id: "skill-1", name: "TypeScript", category: "Languages", showProficiency: false, indicator: "bars", level: 3, years: 1 },
        { id: "skill-2", name: "React", category: "Frameworks", showProficiency: false, indicator: "bars", level: 3, years: 1 },
        { id: "skill-3", name: "Next.js", category: "Frameworks", showProficiency: false, indicator: "bars", level: 3, years: 1 },
        { id: "skill-4", name: "Testing", category: "Tools", showProficiency: false, indicator: "bars", level: 3, years: 1 },
        { id: "skill-5", name: "Accessibility", category: "Domain", showProficiency: false, indicator: "bars", level: 3, years: 1 },
      ],
    },
    {
      id: "experience",
      type: "experience",
      items: [
        {
          id: "job-1",
          role: "Senior Frontend Engineer",
          company: "Northwind Studio",
          location: "Remote",
          start: "2022",
          end: "",
          current: true,
          bullets: [
            "Led the design-system migration used by 14 product squads.",
            "Cut dashboard interaction latency by rebuilding the heaviest views.",
          ],
        },
      ],
    },
    {
      id: "projects",
      type: "projects",
      items: [
        {
          id: "project-1",
          name: "Public portfolio",
          url: "https://example.com",
          bullets: ["Published case studies with measurable product outcomes."],
        },
      ],
    },
    {
      id: "education",
      type: "education",
      items: [
        {
          id: "edu-1",
          school: "State University",
          degree: "B.S. Computer Science",
          location: "Austin, TX",
          start: "2014",
          end: "2018",
          details: "",
        },
      ],
    },
  ],
}

export function sectionTitle(section: ResumeSection) {
  switch (section.type) {
    case "summary":
      return "Summary"
    case "experience":
      return "Experience"
    case "education":
      return "Education"
    case "projects":
      return "Projects"
    case "skills":
      return "Skills"
    case "custom":
      return section.title
  }
}

export function sectionIsEmpty(section: ResumeSection) {
  switch (section.type) {
    case "summary":
      return section.text.trim().length === 0
    case "custom":
      return section.items.every((item) => item.trim().length === 0)
    case "skills":
      return section.items.length === 0
    default:
      return section.items.length === 0
  }
}

export function sectionToPlain(section: ResumeSection) {
  switch (section.type) {
    case "summary":
      return section.text || "(empty summary)"
    case "experience":
      return (
        section.items
          .map((item) =>
            [
              `${item.role || "Role"} — ${item.company || "Company"}`,
              [item.start, item.current ? "Present" : item.end].filter(Boolean).join(" – "),
              ...item.bullets.filter(Boolean).map((bullet) => `• ${bullet}`),
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n\n") || "(no experience yet)"
      )
    case "education":
      return (
        section.items
          .map((item) =>
            [item.degree, item.school, item.details].filter(Boolean).join("\n"),
          )
          .join("\n\n") || "(no education yet)"
      )
    case "projects":
      return (
        section.items
          .map((item) =>
            [`${item.name}${item.url ? ` (${item.url})` : ""}`, ...item.bullets.map((b) => `• ${b}`)]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n\n") || "(no projects yet)"
      )
    case "skills":
      return (
        SKILL_BUCKETS.map((bucket) => {
          const names = section.items.filter((item) => item.category === bucket).map((item) => item.name)
          return names.length ? `${bucket}: ${names.join(", ")}` : ""
        })
          .filter(Boolean)
          .join("\n") || "(no skills yet)"
      )
    case "custom":
      return section.items.filter(Boolean).map((item) => `• ${item}`).join("\n") || "(empty section)"
  }
}

export function preserveSectionIds(original: ResumeSection, revised: ResumeSection): ResumeSection {
  if (original.type !== revised.type) return original
  if (original.type === "summary" && revised.type === "summary") {
    return { ...revised, id: original.id }
  }
  if (original.type === "custom" && revised.type === "custom") {
    return { ...revised, id: original.id }
  }
  if (!("items" in original) || !("items" in revised)) return { ...revised, id: original.id }
  const items = revised.items.map((item, index) => {
    const previous = original.items[index] as { id?: string } | undefined
    if (item && typeof item === "object" && "id" in item) {
      return { ...item, id: previous?.id || item.id || newId() }
    }
    return item
  })
  return { ...revised, id: original.id, items } as ResumeSection
}
