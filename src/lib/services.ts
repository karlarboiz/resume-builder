import { Prisma } from "@prisma/client"
import { hash, compare } from "bcryptjs"
import { prisma } from "@/lib/db"
import {
  bucketFor,
  createInitialContent,
  resumeContentSchema,
  resumeSettingsSchema,
  type ResumeContent,
} from "@/lib/resume"
import { slugify } from "@/lib/utils"
import { z } from "zod"

const onboardingSkillSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: z.enum(["Technical", "Soft", "Domain"]),
})

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).default(""),
  location: z.string().trim().max(120).default(""),
  portfolioUrl: z.string().trim().max(300).default(""),
  linkedinUrl: z.string().trim().max(300).default(""),
  industry: z.string().trim().max(80).default(""),
  targetJobs: z.array(z.string().trim().min(1).max(80)).min(1).max(12),
  skills: z.array(onboardingSkillSchema).max(60).default([]),
})

export const profilePatchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  location: z.string().trim().max(120).optional(),
  portfolioUrl: z.string().trim().max(300).optional(),
  linkedinUrl: z.string().trim().max(300).optional(),
  industry: z.string().trim().max(80).optional(),
  targetJobs: z.array(z.string().trim().min(1).max(80)).min(1).max(12).optional(),
  skills: z.array(onboardingSkillSchema).max(60).optional(),
})

async function uniqueSlug(base: string, ignoreId?: string) {
  const root = slugify(base)
  let slug = root
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const existing = await prisma.resume.findUnique({ where: { slug } })
    if (!existing || existing.id === ignoreId) return slug
    slug = `${root}-${crypto.randomUUID().slice(0, 6)}`
  }
  return `${root}-${crypto.randomUUID().slice(0, 8)}`
}

export async function saveProfile(
  userId: string,
  input: z.infer<typeof profileSchema>,
  options?: { complete?: boolean },
) {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        phone: input.phone,
        location: input.location,
        portfolioUrl: input.portfolioUrl,
        linkedinUrl: input.linkedinUrl,
        industry: input.industry,
        targetJobs: input.targetJobs,
        onboardingComplete: options?.complete ? true : undefined,
      },
    })
    await tx.skill.deleteMany({ where: { userId } })
    if (input.skills.length) {
      await tx.skill.createMany({
        data: input.skills.map((skill) => ({
          userId,
          name: skill.name,
          category: skill.category,
        })),
      })
    }
  })
}

export async function patchProfile(userId: string, input: z.infer<typeof profilePatchSchema>) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      phone: input.phone,
      location: input.location,
      portfolioUrl: input.portfolioUrl,
      linkedinUrl: input.linkedinUrl,
      industry: input.industry,
      targetJobs: input.targetJobs,
    },
  })
  if (input.skills) {
    await prisma.skill.deleteMany({ where: { userId } })
    if (input.skills.length) {
      await prisma.skill.createMany({
        data: input.skills.map((skill) => ({
          userId,
          name: skill.name,
          category: skill.category,
        })),
      })
    }
  }
}

export async function createResumeForUser(user: {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  location: string | null
  portfolioUrl: string | null
  linkedinUrl: string | null
  targetJobs: string[]
  skills: { name: string; category: string }[]
}) {
  const fullName = user.name || "Your name"
  const content = createInitialContent({
    fullName,
    email: user.email || "",
    phone: user.phone || "",
    location: user.location || "",
    portfolioUrl: user.portfolioUrl || "",
    linkedinUrl: user.linkedinUrl || "",
    headline: user.targetJobs[0] || "",
    skills: user.skills.map((skill) => ({
      name: skill.name,
      category: bucketFor(
        skill.name,
        skill.category === "Soft" || skill.category === "Domain" ? skill.category : "Technical",
      ),
    })),
  })
  const title = user.targetJobs[0] ? `${fullName} — ${user.targetJobs[0]}` : `${fullName} resume`
  const slug = await uniqueSlug(`${fullName} ${user.targetJobs[0] || "resume"}`)
  return prisma.resume.create({
    data: {
      userId: user.id,
      title,
      slug,
      content: content as Prisma.InputJsonValue,
    },
  })
}

export async function saveResume(
  userId: string,
  input: z.infer<typeof resumeSettingsSchema> & { id?: string },
) {
  const content = resumeContentSchema.parse(input.content)
  const slug = await uniqueSlug(input.slug, input.id)
  const passwordData =
    input.password === undefined
      ? {}
      : input.password === null || input.password.trim() === ""
        ? { sharePasswordHash: null }
        : { sharePasswordHash: await hash(input.password, 10) }

  const data = {
    title: input.title,
    slug,
    templateId: input.templateId,
    accentColor: input.accentColor,
    fontPairing: input.fontPairing,
    lineHeight: input.lineHeight,
    isPublic: input.isPublic,
    content: content as Prisma.InputJsonValue,
    ...passwordData,
  }

  if (!input.id) {
    return prisma.resume.create({ data: { ...data, userId } })
  }

  const existing = await prisma.resume.findFirst({ where: { id: input.id, userId } })
  if (!existing) return null
  return prisma.resume.update({ where: { id: existing.id }, data })
}

export async function passwordMatches(password: string, hashValue: string | null) {
  if (!hashValue) return true
  return compare(password, hashValue)
}

export function parseContent(value: Prisma.JsonValue): ResumeContent {
  return resumeContentSchema.parse(value)
}
