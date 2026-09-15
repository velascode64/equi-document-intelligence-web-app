import { NextResponse, type NextRequest } from "next/server"

import {
  createGoogleDriveRootFolder,
  getGoogleDriveConnection,
  listGoogleDriveFolders,
} from "@/src/features/smart-findoc-analyzer"
import { requireUser } from "@/src/lib/supabase/server-client"
import { jsonError } from "../../../_utils"

type OAuthTokens = { accessToken?: string; refreshToken?: string; expiresAt?: number }

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser()
    const connection = await getGoogleDriveConnection(supabase, user.id)
    const oauthTokens = connection?.oauth_tokens as OAuthTokens | null

    if (!oauthTokens?.accessToken && !oauthTokens?.refreshToken) {
      return NextResponse.json({ error: "Google Drive is not connected" }, { status: 400 })
    }

    const query = request.nextUrl.searchParams.get("q")?.trim()
    const folders = await listGoogleDriveFolders(oauthTokens, query)
    return NextResponse.json({ folders })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser()
    const connection = await getGoogleDriveConnection(supabase, user.id)
    const oauthTokens = connection?.oauth_tokens as OAuthTokens | null
    const body = await request.json()
    const name = String(body.name ?? "").trim()

    if (!oauthTokens?.accessToken && !oauthTokens?.refreshToken) {
      return NextResponse.json({ error: "Google Drive is not connected" }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    const folder = await createGoogleDriveRootFolder(oauthTokens, name)
    return NextResponse.json({ folder })
  } catch (error) {
    return jsonError(error)
  }
}
