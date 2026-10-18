"use server"

import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { requireUser } from "@/lib/session"
import { createResumeForUser } from "@/lib/services"

export async function createResumeAction() {
  const user = await requireUser()
  const resume = await createResumeForUser(user)
  redirect(`/editor/${resume.id}`)
}

export async function deleteResumeAction(formData: FormData) {
  const user = await requireUser()
  const id = String(formData.get("id") || "")
  await prisma.resume.deleteMany({ where: { id, userId: user.id } })
  redirect("/dashboard")
}
