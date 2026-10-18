import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

export type DevMailbox = {
  identifier: string
  url: string
  createdAt: string
}

const mailboxPath = path.join(process.cwd(), "data", "mailbox.json")

export async function writeDevMailbox(identifier: string, url: string) {
  const payload: DevMailbox = {
    identifier,
    url,
    createdAt: new Date().toISOString(),
  }
  await mkdir(path.dirname(mailboxPath), { recursive: true })
  await writeFile(mailboxPath, JSON.stringify(payload, null, 2))
  console.log(`\nMagic link for ${identifier}:\n${url}\n`)
}

export async function readDevMailbox(): Promise<DevMailbox | null> {
  if (process.env.NODE_ENV === "production") return null
  try {
    const { readFile } = await import("node:fs/promises")
    const raw = await readFile(mailboxPath, "utf8")
    return JSON.parse(raw) as DevMailbox
  } catch {
    return null
  }
}
