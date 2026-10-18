import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Nodemailer from "next-auth/providers/nodemailer"
import type { Provider } from "next-auth/providers"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import { writeDevMailbox } from "@/lib/mailbox"

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }
    return map[char] ?? char
  })
}

const providers: Provider[] = []

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google)
}
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(GitHub)
}

providers.push(
  Nodemailer({
    server: process.env.EMAIL_SERVER || "smtp://127.0.0.1:1025",
    from: process.env.EMAIL_FROM || "Resume Builder <login@localhost>",
    async sendVerificationRequest({ identifier, url }) {
      const from = process.env.EMAIL_FROM || "Resume Builder <login@localhost>"
      if (process.env.EMAIL_SERVER) {
        const nodemailer = await import("nodemailer")
        const transport = nodemailer.createTransport(process.env.EMAIL_SERVER)
        await transport.sendMail({
          to: identifier,
          from,
          subject: "Your Resume Builder sign-in link",
          text: `Sign in:\n${url}\n`,
          html: `<p><a href="${escapeHtml(url)}">Sign in to Resume Builder</a></p>`,
        })
        return
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("Set EMAIL_SERVER before sending magic links in production.")
      }
      await writeDevMailbox(identifier, url)
    },
  }),
)

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    redirect({ url, baseUrl }) {
      const base = new URL(baseUrl)
      const target = new URL(url, baseUrl)
      const local = new Set(["localhost", "127.0.0.1"])
      const sameHost =
        target.hostname === base.hostname ||
        (local.has(target.hostname) && local.has(base.hostname) && target.port === base.port)
      if (!sameHost) return baseUrl
      return target.toString()
    },
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
