import { NextResponse } from "next/server"
import { clearAuthCookie } from "@/lib/auth"
import type { ApiResponse } from "@/types"

export async function POST(): Promise<NextResponse<ApiResponse<{ loggedOut: boolean }>>> {
  const response = NextResponse.json({ success: true, data: { loggedOut: true } })
  await clearAuthCookie(response)
  return response
}
