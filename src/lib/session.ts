import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function getCurrentUser() {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return null
  return prisma.user.findUnique({
    where: { email },
    include: { skills: { orderBy: { name: "asc" } } },
  })
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}
