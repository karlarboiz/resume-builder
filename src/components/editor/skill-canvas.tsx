"use client"

import { Draggable, Droppable, type DropResult } from "@hello-pangea/dnd"
import { GripVertical, Plus, X } from "lucide-react"
import { SKILL_BUCKETS, emptySkill, type SkillBucket, type SkillItem } from "@/lib/resume"

export function applySkillDrag(items: SkillItem[], result: DropResult) {
  const destination = result.destination
  if (!destination || !result.source.droppableId.startsWith("skill::")) return items
  const sourceBucket = result.source.droppableId.split("::")[1] as SkillBucket
  const destBucket = destination.droppableId.split("::")[1] as SkillBucket
  if (!SKILL_BUCKETS.includes(sourceBucket) || !SKILL_BUCKETS.includes(destBucket)) return items

  const grouped = Object.fromEntries(SKILL_BUCKETS.map((bucket) => [bucket, items.filter((item) => item.category === bucket)])) as Record<
    SkillBucket,
    SkillItem[]
  >
  const sourceList = grouped[sourceBucket].slice()
  const [moved] = sourceList.splice(result.source.index, 1)
  if (!moved) return items
  const next = { ...moved, category: destBucket }
  const destList = sourceBucket === destBucket ? sourceList : grouped[destBucket].slice()
  destList.splice(destination.index, 0, next)
  grouped[sourceBucket] = sourceBucket === destBucket ? destList : sourceList
  grouped[destBucket] = destList
  return SKILL_BUCKETS.flatMap((bucket) => grouped[bucket])
}

export function SkillCanvas({
  items,
  suggestions,
  onChange,
}: {
  items: SkillItem[]
  suggestions: { name: string; category: SkillBucket }[]
  onChange: (items: SkillItem[]) => void
}) {
  function update(id: string, patch: Partial<SkillItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  return (
    <div className="space-y-3">
      {SKILL_BUCKETS.map((bucket) => {
        const bucketItems = items.filter((item) => item.category === bucket)
        return (
          <div key={bucket}>
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{bucket}</p>
            <Droppable droppableId={`skill::${bucket}`} type="SKILL" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="mt-1 flex min-h-12 flex-wrap gap-2 rounded-xl border border-dashed border-line bg-paper/60 p-2"
                >
                  {bucketItems.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(drag) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className="flex max-w-full flex-col gap-1 rounded-xl border border-line bg-card px-2 py-1.5"
                        >
                          <div className="flex items-center gap-1">
                            <button type="button" className="cursor-grab text-ink/40" aria-label={`Reorder ${item.name}`} {...drag.dragHandleProps}>
                              <GripVertical className="h-3.5 w-3.5" />
                            </button>
                            <span className="text-sm">{item.name}</span>
                            <button type="button" className="ml-auto text-ink/40" aria-label={`Remove ${item.name}`} onClick={() => onChange(items.filter((skill) => skill.id !== item.id))}>
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            <select
                              className="rounded-md border border-line bg-white px-1 py-0.5 text-xs"
                              aria-label={`${item.name} proficiency`}
                              value={item.showProficiency ? item.indicator : "off"}
                              onChange={(event) => {
                                const value = event.target.value
                                if (value === "off") update(item.id, { showProficiency: false })
                                else update(item.id, { showProficiency: true, indicator: value as SkillItem["indicator"] })
                              }}
                            >
                              <option value="off">No level</option>
                              <option value="bars">Bars</option>
                              <option value="dots">Dots</option>
                              <option value="years">Years</option>
                            </select>
                            {item.showProficiency && item.indicator !== "years" ? (
                              <input
                                className="w-16"
                                type="range"
                                min={1}
                                max={5}
                                value={item.level}
                                aria-label={`${item.name} level`}
                                onChange={(event) => update(item.id, { level: Number(event.target.value) })}
                              />
                            ) : null}
                            {item.showProficiency && item.indicator === "years" ? (
                              <input
                                className="w-14 rounded border border-line px-1 py-0.5 text-xs"
                                type="number"
                                min={0}
                                max={60}
                                value={item.years}
                                aria-label={`${item.name} years`}
                                onChange={(event) => update(item.id, { years: Number(event.target.value) })}
                              />
                            ) : null}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        )
      })}
      {suggestions.length ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-pine">Missing for your target roles</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((skill) => (
              <button
                key={skill.name}
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-pine/30 bg-pine/5 px-2 py-1 text-xs"
                onClick={() => onChange([...items, emptySkill(skill.name, skill.category)])}
              >
                <Plus className="h-3 w-3" />
                {skill.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink/50">Your skills cover the trends for the roles you listed.</p>
      )}
    </div>
  )
}
