"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import { SectionAgent } from "@/components/editor/section-agent"
import { SkillCanvas, applySkillDrag } from "@/components/editor/skill-canvas"
import { ResumeTemplate } from "@/components/templates"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { missingSkills } from "@/lib/skills"
import { newId } from "@/lib/utils"
import {
  FONT_PAIRINGS,
  TEMPLATES,
  emptySkill,
  sectionTitle,
  type EducationItem,
  type ExperienceItem,
  type ProjectItem,
  type ResumeContent,
  type ResumeSection,
  type SkillBucket,
  type TemplateId,
} from "@/lib/resume"

export type EditorResume = {
  id: string
  title: string
  slug: string
  templateId: TemplateId
  accentColor: string
  fontPairing: (typeof FONT_PAIRINGS)[number]
  lineHeight: number
  isPublic: boolean
  hasPassword: boolean
  content: ResumeContent
  targetJobs: string[]
}

const accents = ["#1f6b4a", "#1c1915", "#b5522a", "#1e3a5f", "#6b3a4a"]

export function ResumeEditor({ initial }: { initial: EditorResume }) {
  const [resume, setResume] = useState(initial)
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved")
  const [error, setError] = useState("")
  const [pane, setPane] = useState<"edit" | "preview">("edit")
  const [password, setPassword] = useState("")
  const [exportError, setExportError] = useState("")
  const [pages, setPages] = useState(1)
  const previewRef = useRef<HTMLDivElement>(null)
  const skipSave = useRef(true)

  const snapshot = useMemo(
    () =>
      JSON.stringify({
        title: resume.title,
        slug: resume.slug,
        templateId: resume.templateId,
        accentColor: resume.accentColor,
        fontPairing: resume.fontPairing,
        lineHeight: resume.lineHeight,
        isPublic: resume.isPublic,
        content: resume.content,
        targetJobs: resume.targetJobs,
      }),
    [resume],
  )

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    const timer = window.setTimeout(() => {
      void persist()
    }, 700)
    return () => window.clearTimeout(timer)
    // persist closes over the latest snapshot via resume state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot])

  useEffect(() => {
    const node = previewRef.current
    if (!node) return
    const measure = () => {
      const width = node.clientWidth || 1
      const pageHeight = width * (297 / 210)
      setPages(Math.max(1, Math.ceil(node.scrollHeight / pageHeight)))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [snapshot, pane])

  async function persist(extra?: { password?: string | null }) {
    setStatus("saving")
    setError("")
    const payload = {
      id: resume.id,
      title: resume.title || "Untitled resume",
      slug: resume.slug,
      templateId: resume.templateId,
      accentColor: resume.accentColor,
      fontPairing: resume.fontPairing,
      lineHeight: resume.lineHeight,
      isPublic: resume.isPublic,
      content: resume.content,
      ...extra,
    }
    const tasks = [
      fetch("/api/resume/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    ]
    if (resume.targetJobs.length) {
      tasks.push(
        fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetJobs: resume.targetJobs }),
        }),
      )
    }
    const [resumeResponse] = await Promise.all(tasks)
    const data = await resumeResponse.json().catch(() => ({}))
    if (!resumeResponse.ok) {
      setStatus("error")
      setError(data.error || "Save failed.")
      return
    }
    setResume((current) => ({ ...current, slug: data.slug || current.slug, hasPassword: extra?.password === null ? false : extra?.password ? true : current.hasPassword }))
    setStatus("saved")
  }

  function patchContent(content: ResumeContent) {
    setResume((current) => ({ ...current, content }))
  }

  function replaceSection(section: ResumeSection) {
    patchContent({
      ...resume.content,
      sections: resume.content.sections.map((item) => (item.id === section.id ? section : item)),
    })
  }

  function onDragEnd(result: DropResult) {
    const destination = result.destination
    if (!destination) return
    if (result.type === "SECTION" && destination.droppableId === "sections") {
      const sections = [...resume.content.sections]
      const [moved] = sections.splice(result.source.index, 1)
      if (!moved) return
      sections.splice(destination.index, 0, moved)
      patchContent({ ...resume.content, sections })
      return
    }
    if (result.type === "SKILL") {
      const skills = resume.content.sections.find((section) => section.type === "skills")
      if (!skills || skills.type !== "skills") return
      replaceSection({ ...skills, items: applySkillDrag(skills.items, result) })
      return
    }
    if (result.type === "ITEM" && result.source.droppableId === destination.droppableId) {
      const sectionId = result.source.droppableId.replace("items::", "")
      const section = resume.content.sections.find((item) => item.id === sectionId)
      if (!section || !("items" in section) || section.type === "skills" || section.type === "custom") return
      const items = [...section.items]
      const [moved] = items.splice(result.source.index, 1)
      if (!moved) return
      items.splice(destination.index, 0, moved)
      replaceSection({ ...section, items } as ResumeSection)
    }
  }

  async function download(format: "pdf" | "docx") {
    setExportError("")
    const response = await fetch(`/api/export/${format}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId: resume.id }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setExportError(data.error || "Export failed.")
      return
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${resume.slug}.${format}`
    link.click()
    URL.revokeObjectURL(url)
  }

  const skillSection = resume.content.sections.find((section) => section.type === "skills")
  const skillNames = skillSection && skillSection.type === "skills" ? skillSection.items.map((item) => item.name) : []
  const suggestions = missingSkills(resume.targetJobs, skillNames)

  return (
    <div>
      <div className="no-print flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <Input
          aria-label="Resume title"
          className="max-w-sm font-medium"
          value={resume.title}
          onChange={(event) => setResume({ ...resume, title: event.target.value })}
        />
        <p className="text-xs text-ink/60" aria-live="polite">
          {status === "saving" ? "Saving" : status === "error" ? "Not saved" : "Saved"}
        </p>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => void download("pdf")}>PDF</Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => void download("docx")}>DOCX</Button>
        </div>
      </div>
      {error || exportError ? <p className="px-4 py-2 text-sm text-clay">{error || exportError}</p> : null}
      <div className="flex gap-2 px-4 py-2 lg:hidden">
        <Button type="button" size="sm" variant={pane === "edit" ? "primary" : "secondary"} onClick={() => setPane("edit")}>Edit</Button>
        <Button type="button" size="sm" variant={pane === "preview" ? "primary" : "secondary"} onClick={() => setPane("preview")}>Preview</Button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid lg:grid-cols-[minmax(320px,460px)_minmax(0,1fr)]">
          <div className={pane === "edit" ? "space-y-6 px-4 py-4" : "hidden space-y-6 px-4 py-4 lg:block"}>
            <BasicsForm resume={resume} setResume={setResume} />
            <ThemeForm resume={resume} setResume={setResume} />
            <Droppable droppableId="sections" type="SECTION">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                  {resume.content.sections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(drag) => (
                        <section ref={drag.innerRef} {...drag.draggableProps} className="rounded-2xl border border-line bg-card p-3">
                          <div className="mb-3 flex items-center gap-2">
                            <button type="button" className="cursor-grab text-ink/40" aria-label={`Reorder ${sectionTitle(section)}`} {...drag.dragHandleProps}>
                              <GripVertical className="h-4 w-4" />
                            </button>
                            <h2 className="font-medium">{sectionTitle(section)}</h2>
                            <div className="ml-auto">
                              <SectionAgent section={section} jobTarget={resume.targetJobs} onAccept={replaceSection} />
                            </div>
                            {section.type === "custom" ? (
                              <button type="button" aria-label="Remove section" onClick={() => patchContent({ ...resume.content, sections: resume.content.sections.filter((item) => item.id !== section.id) })}>
                                <Trash2 className="h-4 w-4 text-clay" />
                              </button>
                            ) : null}
                          </div>
                          <SectionFields
                            section={section}
                            suggestions={suggestions}
                            onChange={replaceSection}
                          />
                        </section>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                patchContent({
                  ...resume.content,
                  sections: [...resume.content.sections, { id: newId(), type: "custom", title: "Certifications", items: [""] }],
                })
              }
            >
              <Plus className="h-4 w-4" />
              Custom section
            </Button>
            <ShareForm
              resume={resume}
              setResume={setResume}
              password={password}
              setPassword={setPassword}
              onPassword={(value) => void persist({ password: value })}
            />
          </div>
          <div className={pane === "preview" ? "bg-[#ebe4d6] px-4 py-6" : "hidden bg-[#ebe4d6] px-4 py-6 lg:block"}>
            <div className="sticky top-4">
              <p className="mb-3 text-center text-xs text-ink/60">
                About {pages} page{pages === 1 ? "" : "s"} when exported. Entries stay intact across page breaks.
              </p>
              <div ref={previewRef}>
                <ResumeTemplate
                  templateId={resume.templateId}
                  content={resume.content}
                  accentColor={resume.accentColor}
                  fontPairing={resume.fontPairing}
                  lineHeight={resume.lineHeight}
                  previewMode
                />
              </div>
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  )
}

function BasicsForm({
  resume,
  setResume,
}: {
  resume: EditorResume
  setResume: React.Dispatch<React.SetStateAction<EditorResume>>
}) {
  const basics = resume.content.basics
  function setBasics(patch: Partial<typeof basics>) {
    setResume({ ...resume, content: { ...resume.content, basics: { ...basics, ...patch } } })
  }
  return (
    <div className="grid gap-3">
      <label className="text-sm">Full name
        <Input className="mt-1" value={basics.fullName} onChange={(event) => setBasics({ fullName: event.target.value })} />
      </label>
      <label className="text-sm">Headline
        <Input className="mt-1" value={basics.headline} onChange={(event) => setBasics({ headline: event.target.value })} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Email
          <Input className="mt-1" value={basics.email} onChange={(event) => setBasics({ email: event.target.value })} />
        </label>
        <label className="text-sm">Phone
          <Input className="mt-1" value={basics.phone} onChange={(event) => setBasics({ phone: event.target.value })} />
        </label>
      </div>
      <label className="text-sm">Location
        <Input className="mt-1" value={basics.location} onChange={(event) => setBasics({ location: event.target.value })} />
      </label>
      <label className="text-sm">Portfolio
        <Input className="mt-1" value={basics.portfolioUrl} onChange={(event) => setBasics({ portfolioUrl: event.target.value })} />
      </label>
      <label className="text-sm">LinkedIn
        <Input className="mt-1" value={basics.linkedinUrl} onChange={(event) => setBasics({ linkedinUrl: event.target.value })} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={basics.showContact} onChange={(event) => setBasics({ showContact: event.target.checked })} />
        Show email and phone on the public link
      </label>
    </div>
  )
}

function ThemeForm({
  resume,
  setResume,
}: {
  resume: EditorResume
  setResume: React.Dispatch<React.SetStateAction<EditorResume>>
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-card p-3">
      <p className="text-sm font-medium">Template</p>
      <div className="grid gap-2">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setResume({ ...resume, templateId: template.id })}
            className={`rounded-xl border px-3 py-2 text-left text-sm ${resume.templateId === template.id ? "border-pine bg-pine/5" : "border-line"}`}
          >
            <span className="font-medium">{template.name}</span>
            <span className="mt-0.5 block text-xs text-ink/60">{template.description}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Accent color">
        {accents.map((color) => (
          <button key={color} type="button" aria-label={color} className="h-7 w-7 rounded-full border border-black/10" style={{ background: color }} onClick={() => setResume({ ...resume, accentColor: color })} />
        ))}
        <input aria-label="Custom accent" type="color" value={resume.accentColor} onChange={(event) => setResume({ ...resume, accentColor: event.target.value })} />
      </div>
      <label className="block text-sm">Font pairing
        <select className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2" value={resume.fontPairing} onChange={(event) => setResume({ ...resume, fontPairing: event.target.value as EditorResume["fontPairing"] })}>
          {FONT_PAIRINGS.map((pairing) => (
            <option key={pairing} value={pairing}>{pairing}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">Line height {resume.lineHeight.toFixed(2)}
        <input className="mt-1 w-full" type="range" min={1.15} max={1.7} step={0.05} value={resume.lineHeight} onChange={(event) => setResume({ ...resume, lineHeight: Number(event.target.value) })} />
      </label>
      <label className="block text-sm">Target roles
        <Input
          key={resume.targetJobs.join("|")}
          className="mt-1"
          defaultValue={resume.targetJobs.join(", ")}
          placeholder="Separate roles with commas"
          onBlur={(event) =>
            setResume({
              ...resume,
              targetJobs: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
            })
          }
        />
      </label>
    </div>
  )
}

function SectionFields({
  section,
  suggestions,
  onChange,
}: {
  section: ResumeSection
  suggestions: { name: string; category: SkillBucket }[]
  onChange: (section: ResumeSection) => void
}) {
  if (section.type === "summary") {
    return <Textarea value={section.text} onChange={(event) => onChange({ ...section, text: event.target.value })} placeholder="A short summary of the work you want to be hired for." />
  }
  if (section.type === "skills") {
    return (
      <div className="space-y-3">
        <SkillCanvas items={section.items} suggestions={suggestions} onChange={(items) => onChange({ ...section, items })} />
        <SkillAdder onAdd={(name, category) => onChange({ ...section, items: [...section.items, emptySkill(name, category)] })} />
      </div>
    )
  }
  if (section.type === "experience") {
    return (
      <ItemList
        droppableId={`items::${section.id}`}
        addLabel="Add role"
        onAdd={() =>
          onChange({
            ...section,
            items: [...section.items, { id: newId(), role: "", company: "", location: "", start: "", end: "", current: false, bullets: [""] }],
          })
        }
      >
        {section.items.map((item, index) => (
          <Draggable key={item.id} draggableId={item.id} index={index}>
            {(drag) => (
              <div ref={drag.innerRef} {...drag.draggableProps} className="space-y-2 rounded-xl border border-line p-2">
                <div className="flex gap-2">
                  <button type="button" aria-label="Reorder role" {...drag.dragHandleProps}><GripVertical className="h-4 w-4" /></button>
                  <Input aria-label="Role" placeholder="Role" value={item.role} onChange={(event) => updateExperience(section, item.id, { role: event.target.value }, onChange)} />
                  <button type="button" aria-label="Remove role" onClick={() => onChange({ ...section, items: section.items.filter((entry) => entry.id !== item.id) })}><Trash2 className="h-4 w-4" /></button>
                </div>
                <Input aria-label="Company" placeholder="Company" value={item.company} onChange={(event) => updateExperience(section, item.id, { company: event.target.value }, onChange)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input aria-label="Start" placeholder="Start" value={item.start} onChange={(event) => updateExperience(section, item.id, { start: event.target.value }, onChange)} />
                  <Input aria-label="End" placeholder="End" value={item.end} disabled={item.current} onChange={(event) => updateExperience(section, item.id, { end: event.target.value }, onChange)} />
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={item.current} onChange={(event) => updateExperience(section, item.id, { current: event.target.checked }, onChange)} />
                  Current role
                </label>
                <BulletEditor bullets={item.bullets} onChange={(bullets) => updateExperience(section, item.id, { bullets }, onChange)} />
              </div>
            )}
          </Draggable>
        ))}
      </ItemList>
    )
  }
  if (section.type === "education") {
    return (
      <ItemList droppableId={`items::${section.id}`} addLabel="Add education" onAdd={() => onChange({ ...section, items: [...section.items, { id: newId(), school: "", degree: "", location: "", start: "", end: "", details: "" }] })}>
        {section.items.map((item, index) => (
          <Draggable key={item.id} draggableId={item.id} index={index}>
            {(drag) => (
              <div ref={drag.innerRef} {...drag.draggableProps} className="space-y-2 rounded-xl border border-line p-2">
                <div className="flex gap-2">
                  <button type="button" aria-label="Reorder education" {...drag.dragHandleProps}><GripVertical className="h-4 w-4" /></button>
                  <Input aria-label="Degree" placeholder="Degree" value={item.degree} onChange={(event) => updateEducation(section, item.id, { degree: event.target.value }, onChange)} />
                </div>
                <Input aria-label="School" placeholder="School" value={item.school} onChange={(event) => updateEducation(section, item.id, { school: event.target.value }, onChange)} />
                <Input aria-label="Details" placeholder="Details" value={item.details} onChange={(event) => updateEducation(section, item.id, { details: event.target.value }, onChange)} />
              </div>
            )}
          </Draggable>
        ))}
      </ItemList>
    )
  }
  if (section.type === "projects") {
    return (
      <ItemList droppableId={`items::${section.id}`} addLabel="Add project" onAdd={() => onChange({ ...section, items: [...section.items, { id: newId(), name: "", url: "", bullets: [""] }] })}>
        {section.items.map((item, index) => (
          <Draggable key={item.id} draggableId={item.id} index={index}>
            {(drag) => (
              <div ref={drag.innerRef} {...drag.draggableProps} className="space-y-2 rounded-xl border border-line p-2">
                <div className="flex gap-2">
                  <button type="button" aria-label="Reorder project" {...drag.dragHandleProps}><GripVertical className="h-4 w-4" /></button>
                  <Input aria-label="Project name" placeholder="Name" value={item.name} onChange={(event) => updateProject(section, item.id, { name: event.target.value }, onChange)} />
                </div>
                <Input aria-label="Project URL" placeholder="URL" value={item.url} onChange={(event) => updateProject(section, item.id, { url: event.target.value }, onChange)} />
                <BulletEditor bullets={item.bullets} onChange={(bullets) => updateProject(section, item.id, { bullets }, onChange)} />
              </div>
            )}
          </Draggable>
        ))}
      </ItemList>
    )
  }
  return (
    <div className="space-y-2">
      <Input aria-label="Section title" value={section.title} onChange={(event) => onChange({ ...section, title: event.target.value || "Section" })} />
      <BulletEditor bullets={section.items} onChange={(items) => onChange({ ...section, items })} />
    </div>
  )
}

function ItemList({
  droppableId,
  addLabel,
  onAdd,
  children,
}: {
  droppableId: string
  addLabel: string
  onAdd: () => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Droppable droppableId={droppableId} type="ITEM">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </Button>
    </div>
  )
}

function BulletEditor({ bullets, onChange }: { bullets: string[]; onChange: (bullets: string[]) => void }) {
  return (
    <div className="space-y-2">
      {bullets.map((bullet, index) => (
        <Input
          key={index}
          aria-label={`Bullet ${index + 1}`}
          value={bullet}
          placeholder="Bullet"
          onChange={(event) => onChange(bullets.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
        />
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...bullets, ""])}>Add bullet</Button>
    </div>
  )
}

function SkillAdder({ onAdd }: { onAdd: (name: string, category: SkillBucket) => void }) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState<SkillBucket>("Tools")
  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (!name.trim()) return
        onAdd(name.trim(), category)
        setName("")
      }}
    >
      <Input aria-label="New skill" value={name} placeholder="Add a skill" onChange={(event) => setName(event.target.value)} />
      <select aria-label="Skill category" className="rounded-lg border border-line bg-white px-2 text-sm" value={category} onChange={(event) => setCategory(event.target.value as SkillBucket)}>
        {["Languages", "Frameworks", "Tools", "Domain", "Soft"].map((bucket) => (
          <option key={bucket}>{bucket}</option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="secondary">Add</Button>
    </form>
  )
}

function ShareForm({
  resume,
  setResume,
  password,
  setPassword,
  onPassword,
}: {
  resume: EditorResume
  setResume: React.Dispatch<React.SetStateAction<EditorResume>>
  password: string
  setPassword: (value: string) => void
  onPassword: (value: string | null) => void
}) {
  const [copied, setCopied] = useState(false)
  const link = typeof window === "undefined" ? `/v/${resume.slug}` : `${window.location.origin}/v/${resume.slug}`
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-card p-3">
      <p className="text-sm font-medium">Public link</p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={resume.isPublic} onChange={(event) => setResume({ ...resume, isPublic: event.target.checked })} />
        Anyone with the link can view this resume
      </label>
      <label className="block text-sm">Slug
        <Input className="mt-1" value={resume.slug} onChange={(event) => setResume({ ...resume, slug: event.target.value })} />
      </label>
      <p className="truncate text-xs text-ink/60">{link}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(link)
            setCopied(true)
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </Button>
        <a className="inline-flex h-8 items-center rounded-full border border-line px-3 text-xs" href={`/v/${resume.slug}`}>Open</a>
      </div>
      <label className="block text-sm">Password
        <Input className="mt-1" type="password" value={password} placeholder={resume.hasPassword ? "Password is set" : "Optional"} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => onPassword(password)}>Save password</Button>
        {resume.hasPassword ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => onPassword(null)}>Remove password</Button>
        ) : null}
      </div>
    </div>
  )
}

function updateExperience(
  section: Extract<ResumeSection, { type: "experience" }>,
  id: string,
  patch: Partial<ExperienceItem>,
  onChange: (section: ResumeSection) => void,
) {
  onChange({
    ...section,
    items: section.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  })
}

function updateEducation(
  section: Extract<ResumeSection, { type: "education" }>,
  id: string,
  patch: Partial<EducationItem>,
  onChange: (section: ResumeSection) => void,
) {
  onChange({
    ...section,
    items: section.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  })
}

function updateProject(
  section: Extract<ResumeSection, { type: "projects" }>,
  id: string,
  patch: Partial<ProjectItem>,
  onChange: (section: ResumeSection) => void,
) {
  onChange({
    ...section,
    items: section.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  })
}
