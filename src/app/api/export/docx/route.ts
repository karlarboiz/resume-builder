import { deliverExport } from "@/lib/deliver-export"

export async function GET(request: Request) {
  return deliverExport(request, "docx")
}

export async function POST(request: Request) {
  return deliverExport(request, "docx")
}
