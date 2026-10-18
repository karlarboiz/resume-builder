import { ResumeSheet, type SheetProps } from "@/components/templates/resume-sheet"

type TemplateProps = Omit<SheetProps, "templateId">

export function ModernClean(props: TemplateProps) {
  return <ResumeSheet {...props} templateId="modern-clean" />
}
