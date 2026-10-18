import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const token =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value
  if (!token) {
    const login = new URL("/login", request.url)
    login.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(login)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/editor/:path*", "/onboarding/:path*"],
}
