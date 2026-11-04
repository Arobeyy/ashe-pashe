import { NextResponse } from "next/server"
import { clearAuthCookie } from "@/lib/auth"
import type { ApiResponse } from "@/types"

export async function POST(): Promise<NextResponse<ApiResponse<{ loggedOut: boolean }>>> {
  await clearAuthCookie()
  return NextResponse.json({ success: true, data: { loggedOut: true } })
}

