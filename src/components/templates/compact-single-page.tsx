import { ResumeSheet, type SheetProps } from "@/components/templates/resume-sheet"

type TemplateProps = Omit<SheetProps, "templateId">

export function CompactSinglePage(props: TemplateProps) {
  return <ResumeSheet {...props} templateId="compact-single-page" />
}
