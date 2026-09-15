import { NextResponse, type NextRequest } from "next/server"

import { getProfile, upsertProfile } from "@/src/features/profiles"
import { requireUser } from "@/src/lib/supabase/server-client"
import { jsonError } from "../_utils"

export async function GET() {
  try {
    const { supabase, user } = await requireUser()
    const profile = await getProfile(supabase, user.id)
    return NextResponse.json({ profile, user })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser()
    const body = await request.json()
    const current = await getProfile(supabase, user.id)
    const profile = await upsertProfile(supabase, {
      id: user.id,
      email: body.email ?? user.email ?? null,
      fullName: body.fullName ?? null,
      avatarUrl: body.avatarUrl ?? current?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
    })

    return NextResponse.json({ profile })
  } catch (error) {
    return jsonError(error)
  }
}
