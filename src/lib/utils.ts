import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(input: string) {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
  return base || "resume"
}

export function newId() {
  return crypto.randomUUID()
}

export function externalHref(url: string) {
  const trimmed = url.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function displayHost(url: string) {
  try {
    return new URL(externalHref(url)).host.replace(/^www\./, "")
  } catch {
    return url.replace(/^https?:\/\//, "")
  }
}
