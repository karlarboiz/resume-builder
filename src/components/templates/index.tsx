import { CompactSinglePage } from "@/components/templates/compact-single-page"
import { CreativeSplit } from "@/components/templates/creative-split"
import { ExecutiveSerif } from "@/components/templates/executive-serif"
import { ModernClean } from "@/components/templates/modern-clean"
import { TechMinimalist } from "@/components/templates/tech-minimalist"
import type { SheetProps } from "@/components/templates/resume-sheet"
import type { TemplateId } from "@/lib/resume"

export function ResumeTemplate({
  templateId,
  ...props
}: Omit<SheetProps, "templateId"> & { templateId: string }) {
  const shared = props
  switch (templateId as TemplateId) {
    case "executive-serif":
      return <ExecutiveSerif {...shared} />
    case "tech-minimalist":
      return <TechMinimalist {...shared} />
    case "creative-split":
      return <CreativeSplit {...shared} />
    case "compact-single-page":
      return <CompactSinglePage {...shared} />
    default:
      return <ModernClean {...shared} />
  }
}
