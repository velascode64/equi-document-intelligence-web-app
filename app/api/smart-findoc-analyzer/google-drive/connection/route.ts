import { NextResponse, type NextRequest } from "next/server"

import {
  getGoogleDriveConnection,
  upsertGoogleDriveConnection,
} from "@/src/features/smart-findoc-analyzer"
import { requireUser } from "@/src/lib/supabase/server-client"
import { jsonError } from "../../../_utils"

export async function GET() {
  try {
    const { supabase, user } = await requireUser()
    const connection = await getGoogleDriveConnection(supabase, user.id)
    return NextResponse.json({ connection })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser()
    const body = await request.json()
    const current = await getGoogleDriveConnection(supabase, user.id)

    const connection = await upsertGoogleDriveConnection(supabase, {
      userId: user.id,
      googleAccountEmail: current?.google_account_email ?? user.email ?? null,
      googleDriveFolderId: body.folderId,
      googleDriveFolderName: body.folderName ?? null,
      oauthTokens: current?.oauth_tokens ?? {},
      syncStatus: current?.sync_status ?? "idle",
    })

    return NextResponse.json({ connection })
  } catch (error) {
    return jsonError(error)
  }
}
