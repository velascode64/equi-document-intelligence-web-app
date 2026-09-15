import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })
}

export async function requireUser() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  return { supabase, user: data.user }
}
