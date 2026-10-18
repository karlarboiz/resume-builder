import { Suspense } from "react"
import { OnboardingWizard } from "@/app/(workspace)/onboarding/wizard"
import { requireUser } from "@/lib/session"
import { prisma } from "@/lib/db"

export const instant = false

export default function OnboardingPage() {
  return (
    <Suspense fallback={<p className="px-6 py-10">Loading profile…</p>}>
      <OnboardingContent />
    </Suspense>
  )
}

async function OnboardingContent() {
  const user = await requireUser()
  const resumeCount = await prisma.resume.count({ where: { userId: user.id } })
  return (
    <OnboardingWizard
      email={user.email || ""}
      hasResume={resumeCount > 0}
      initial={{
        name: user.name || "",
        phone: user.phone || "",
        location: user.location || "",
        portfolioUrl: user.portfolioUrl || "",
        linkedinUrl: user.linkedinUrl || "",
        industry: user.industry || "Software",
        targetJobs: user.targetJobs,
        skills: user.skills.map((skill) => ({
          name: skill.name,
          category: skill.category === "Soft" || skill.category === "Domain" ? skill.category : "Technical",
        })),
      }}
    />
  )
}
