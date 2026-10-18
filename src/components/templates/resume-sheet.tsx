import { displayHost, externalHref } from "@/lib/utils"
import {
  SKILL_BUCKETS,
  sectionIsEmpty,
  sectionTitle,
  type ResumeContent,
  type SkillItem,
  type TemplateId,
} from "@/lib/resume"

export type SheetProps = {
  templateId: TemplateId
  content: ResumeContent
  accentColor: string
  fontPairing: string
  lineHeight: number
  previewMode?: boolean
}

function Proficiency({ skill }: { skill: SkillItem }) {
  if (!skill.showProficiency) return null
  if (skill.indicator === "years") {
    return (
      <span className="proficiency">
        {skill.years} yr{skill.years === 1 ? "" : "s"}
      </span>
    )
  }
  return (
    <span className={`proficiency ${skill.indicator}`} aria-label={`${skill.level} of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <i key={index} data-on={index < skill.level ? "true" : "false"} />
      ))}
    </span>
  )
}

export function ResumeSheet({
  templateId,
  content,
  accentColor,
  fontPairing,
  lineHeight,
  previewMode = false,
}: SheetProps) {
  const { basics } = content
  const showContact = basics.showContact || previewMode
  const contact = [
    showContact ? basics.email : "",
    showContact ? basics.phone : "",
    basics.location,
    basics.portfolioUrl ? displayHost(basics.portfolioUrl) : "",
    basics.linkedinUrl ? displayHost(basics.linkedinUrl) : "",
  ].filter(Boolean)

  return (
    <article
      className="sheet"
      data-template={templateId}
      data-pairing={fontPairing}
      style={{
        ["--resume-accent" as string]: accentColor,
        ["--resume-leading" as string]: String(lineHeight),
      }}
    >
      <header>
        <h1>{basics.fullName || "Your name"}</h1>
        {basics.headline ? <p className="headline">{basics.headline}</p> : null}
        {contact.length ? (
          <p className="contact">
            {showContact && basics.email ? <span>{basics.email}</span> : null}
            {showContact && basics.phone ? <span>{basics.phone}</span> : null}
            {basics.location ? <span>{basics.location}</span> : null}
            {basics.portfolioUrl ? (
              <a href={externalHref(basics.portfolioUrl)}>{displayHost(basics.portfolioUrl)}</a>
            ) : null}
            {basics.linkedinUrl ? (
              <a href={externalHref(basics.linkedinUrl)}>{displayHost(basics.linkedinUrl)}</a>
            ) : null}
          </p>
        ) : null}
        {previewMode && !basics.showContact ? (
          <p className="hidden-note">Email and phone are hidden on the public link.</p>
        ) : null}
      </header>
      {content.sections.map((section) => {
        if (!previewMode && sectionIsEmpty(section)) return null
        if (previewMode && sectionIsEmpty(section)) return null
        return (
          <section key={section.id} data-type={section.type}>
            <h2>{sectionTitle(section)}</h2>
            {section.type === "summary" ? <p>{section.text}</p> : null}
            {section.type === "experience"
              ? section.items.map((item) => (
                  <div className="entry" key={item.id}>
                    <div className="entry-head">
                      <strong>{item.role || "Role"}</strong>
                      <span>{item.company}</span>
                    </div>
                    <p className="meta">
                      {[item.location, item.start, item.current ? "Present" : item.end]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <ul>
                      {item.bullets.filter(Boolean).map((bullet, index) => (
                        <li key={`${item.id}-${index}`}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ))
              : null}
            {section.type === "education"
              ? section.items.map((item) => (
                  <div className="entry" key={item.id}>
                    <div className="entry-head">
                      <strong>{item.degree || "Study"}</strong>
                      <span>{item.school}</span>
                    </div>
                    <p className="meta">
                      {[item.location, item.start, item.end].filter(Boolean).join(" · ")}
                    </p>
                    {item.details ? <p>{item.details}</p> : null}
                  </div>
                ))
              : null}
            {section.type === "projects"
              ? section.items.map((item) => (
                  <div className="entry" key={item.id}>
                    <div className="entry-head">
                      <strong>{item.name || "Project"}</strong>
                      {item.url ? <a href={externalHref(item.url)}>{displayHost(item.url)}</a> : null}
                    </div>
                    <ul>
                      {item.bullets.filter(Boolean).map((bullet, index) => (
                        <li key={`${item.id}-${index}`}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ))
              : null}
            {section.type === "skills" ? (
              <div className="skill-groups">
                {SKILL_BUCKETS.map((bucket) => {
                  const items = section.items.filter((item) => item.category === bucket)
                  if (!items.length) return null
                  return (
                    <div key={bucket}>
                      <h3>{bucket}</h3>
                      <ul>
                        {items.map((item) => (
                          <li key={item.id}>
                            {item.name}
                            <Proficiency skill={item} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            ) : null}
            {section.type === "custom" ? (
              <ul>
                {section.items.filter(Boolean).map((item, index) => (
                  <li key={`${section.id}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        )
      })}
    </article>
  )
}
