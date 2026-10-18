"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { INDUSTRIES, SKILL_SUGGESTIONS, roleSuggestions, type OnboardingCategory } from "@/lib/skills"

type SkillDraft = { name: string; category: OnboardingCategory }

export function OnboardingWizard({
  email,
  hasResume,
  initial,
}: {
  email: string
  hasResume: boolean
  initial: {
    name: string
    phone: string
    location: string
    portfolioUrl: string
    linkedinUrl: string
    industry: string
    targetJobs: string[]
    skills: SkillDraft[]
  }
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [name, setName] = useState(initial.name)
  const [phone, setPhone] = useState(initial.phone)
  const [location, setLocation] = useState(initial.location)
  const [portfolioUrl, setPortfolioUrl] = useState(initial.portfolioUrl)
  const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedinUrl)
  const [industry, setIndustry] = useState(initial.industry || "Software")
  const [targetJobs, setTargetJobs] = useState<string[]>(initial.targetJobs)
  const [customRole, setCustomRole] = useState("")
  const [skills, setSkills] = useState<SkillDraft[]>(initial.skills)
  const [customSkill, setCustomSkill] = useState("")
  const [skillCategory, setSkillCategory] = useState<OnboardingCategory>("Technical")

  const suggestions = SKILL_SUGGESTIONS[industry] ?? SKILL_SUGGESTIONS.Software
  const roles = roleSuggestions(industry)

  function toggleSkill(skill: SkillDraft) {
    setSkills((current) =>
      current.some((item) => item.name.toLowerCase() === skill.name.toLowerCase())
        ? current.filter((item) => item.name.toLowerCase() !== skill.name.toLowerCase())
        : [...current, skill],
    )
  }

  async function finish() {
    setError("")
    if (!name.trim() || targetJobs.length === 0) {
      setError("Add your name and at least one target role.")
      return
    }
    setPending(true)
    const response = await fetch("/api/user/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        location,
        portfolioUrl,
        linkedinUrl,
        industry,
        targetJobs,
        skills,
      }),
    })
    const data = await response.json().catch(() => ({}))
    setPending(false)
    if (!response.ok) {
      setError(data.error || "Could not save your profile.")
      return
    }
    router.push(`/editor/${data.resumeId}`)
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-xs uppercase tracking-[0.16em] text-pine">Step {step + 1} of 3</p>
      <h1 className="mt-2 font-serif text-4xl">{["About you", "Skills", "Target roles"][step]}</h1>
      {step === 0 ? (
        <div className="mt-6 grid gap-3">
          <label className="text-sm" htmlFor="full-name">Full name
            <Input id="full-name" className="mt-1" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <p className="text-sm text-ink/60">Account email: {email}</p>
          <label className="text-sm">Phone
            <Input className="mt-1" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label className="text-sm">Location
            <Input className="mt-1" value={location} onChange={(event) => setLocation(event.target.value)} />
          </label>
          <label className="text-sm">Portfolio
            <Input className="mt-1" value={portfolioUrl} onChange={(event) => setPortfolioUrl(event.target.value)} />
          </label>
          <label className="text-sm">LinkedIn
            <Input className="mt-1" value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} />
          </label>
          <label className="text-sm">Industry
            <select className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-2" value={industry} onChange={(event) => setIndustry(event.target.value)}>
              {INDUSTRIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      {step === 1 ? (
        <div className="mt-6 space-y-5">
          {(["Technical", "Soft", "Domain"] as const).map((category) => (
            <div key={category}>
              <p className="text-sm font-medium">{category}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions[category].map((skill) => {
                  const selected = skills.some((item) => item.name.toLowerCase() === skill.toLowerCase())
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill({ name: skill, category })}
                      className={`rounded-full border px-3 py-1 text-sm ${selected ? "border-pine bg-pine text-white" : "border-line bg-card"}`}
                    >
                      {skill}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              if (!customSkill.trim()) return
              toggleSkill({ name: customSkill.trim(), category: skillCategory })
              setCustomSkill("")
            }}
          >
            <Input value={customSkill} placeholder="Add your own" onChange={(event) => setCustomSkill(event.target.value)} />
            <select className="rounded-lg border border-line bg-card px-2" value={skillCategory} onChange={(event) => setSkillCategory(event.target.value as OnboardingCategory)}>
              <option>Technical</option>
              <option>Soft</option>
              <option>Domain</option>
            </select>
            <Button type="submit" variant="secondary">Add</Button>
          </form>
        </div>
      ) : null}
      {step === 2 ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => {
              const selected = targetJobs.some((item) => item.toLowerCase() === role.toLowerCase())
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() =>
                    setTargetJobs((current) =>
                      selected ? current.filter((item) => item.toLowerCase() !== role.toLowerCase()) : [...current, role],
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-sm ${selected ? "border-ink bg-ink text-paper" : "border-line bg-card"}`}
                >
                  {role}
                </button>
              )
            })}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              if (!customRole.trim()) return
              setTargetJobs((current) => [...current, customRole.trim()])
              setCustomRole("")
            }}
          >
            <Input value={customRole} placeholder="Custom role" onChange={(event) => setCustomRole(event.target.value)} />
            <Button type="submit" variant="secondary">Add</Button>
          </form>
          {targetJobs.length ? <p className="text-sm text-ink/70">Selected: {targetJobs.join(", ")}</p> : null}
        </div>
      ) : null}
      {error ? <p className="mt-4 text-sm text-clay">{error}</p> : null}
      <div className="mt-8 flex gap-2">
        {step > 0 ? (
          <Button type="button" variant="secondary" onClick={() => setStep((value) => value - 1)}>Back</Button>
        ) : null}
        {step < 2 ? (
          <Button type="button" onClick={() => setStep((value) => value + 1)}>Continue</Button>
        ) : (
          <Button type="button" disabled={pending} onClick={() => void finish()}>
            {pending ? "Saving" : hasResume ? "Save and open resume" : "Create resume"}
          </Button>
        )}
      </div>
    </div>
  )
}
