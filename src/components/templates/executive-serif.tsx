import { ResumeSheet, type SheetProps } from "@/components/templates/resume-sheet"

type TemplateProps = Omit<SheetProps, "templateId">

export function ExecutiveSerif(props: TemplateProps) {
  return <ResumeSheet {...props} templateId="executive-serif" />
}
