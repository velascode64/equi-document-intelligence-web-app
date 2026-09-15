import { NextResponse, type NextRequest } from "next/server"

import { upsertProfile } from "@/src/features/profiles"
import { upsertGoogleDriveConnection } from "@/src/features/smart-findoc-analyzer"
import { createServerSupabaseClient } from "@/src/lib/supabase/server-client"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/"

  if (!code) return NextResponse.redirect(new URL("/sign-in", request.url))

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) return NextResponse.redirect(new URL("/sign-in", request.url))

  await upsertProfile(supabase, {
    id: data.user.id,
    email: data.user.email ?? null,
    fullName: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
    avatarUrl: data.user.user_metadata?.avatar_url ?? null,
  })

  await upsertGoogleDriveConnection(supabase, {
    userId: data.user.id,
    googleAccountEmail: data.user.email ?? null,
    oauthTokens: {
      accessToken: data.session?.provider_token,
      refreshToken: data.session?.provider_refresh_token,
      expiresAt: data.session?.expires_at ? data.session.expires_at * 1000 : undefined,
    },
  })

  return NextResponse.redirect(new URL(next, request.url))
}
