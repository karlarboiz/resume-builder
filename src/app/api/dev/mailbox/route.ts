import { NextResponse } from "next/server"
import { readDevMailbox } from "@/lib/mailbox"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available." }, { status: 404 })
  }
  const mailbox = await readDevMailbox()
  if (!mailbox) return NextResponse.json({ error: "No local sign-in link yet." }, { status: 404 })
  return NextResponse.json(mailbox)
}
