import { NextResponse, type NextRequest } from "next/server"

import { createNotification, listNotifications } from "@/src/features/notifications"
import { requireUser } from "@/src/lib/supabase/server-client"
import { jsonError } from "../_utils"

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser()
    const status = new URL(request.url).searchParams.get("status") as "read" | "unread" | null
    const notifications = await listNotifications(supabase, user.id, status ?? undefined)
    return NextResponse.json({ notifications })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser()
    const body = await request.json()
    const notification = await createNotification(supabase, {
      userId: user.id,
      type: body.type ?? "manual",
      title: body.title,
      message: body.message,
      metadata: body.metadata,
    })

    return NextResponse.json({ notification })
  } catch (error) {
    return jsonError(error)
  }
}
