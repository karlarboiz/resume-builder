import { ResumeSheet, type SheetProps } from "@/components/templates/resume-sheet"

type TemplateProps = Omit<SheetProps, "templateId">

export function TechMinimalist(props: TemplateProps) {
  return <ResumeSheet {...props} templateId="tech-minimalist" />
}
