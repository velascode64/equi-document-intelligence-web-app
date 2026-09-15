import { NextResponse } from "next/server"

import { markNotificationRead } from "@/src/features/notifications"
import { requireUser } from "@/src/lib/supabase/server-client"
import { jsonError } from "../../../_utils"

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, user } = await requireUser()
    const { id } = await context.params
    const notification = await markNotificationRead(supabase, id, user.id)
    return NextResponse.json({ notification })
  } catch (error) {
    return jsonError(error)
  }
}
