import { ResumeSheet, type SheetProps } from "@/components/templates/resume-sheet"

type TemplateProps = Omit<SheetProps, "templateId">

export function CreativeSplit(props: TemplateProps) {
  return <ResumeSheet {...props} templateId="creative-split" />
}
