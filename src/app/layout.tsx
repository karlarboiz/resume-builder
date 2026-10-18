import type { Metadata } from "next"
import { Fraunces, IBM_Plex_Sans, Libre_Baskerville, Source_Sans_3 } from "next/font/google"
import "./globals.css"

const source = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
})

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
})

const libre = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre",
})

export const metadata: Metadata = {
  title: "Resume Builder",
  description: "Create, rewrite, export, and share a resume with a public hiring link.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${source.variable} ${fraunces.variable} ${plex.variable} ${libre.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  )
}
