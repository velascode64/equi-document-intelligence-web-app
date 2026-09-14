type SupabaseQueryClient = {
  from(table: string): any
}

export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type UpsertProfileInput = {
  id: string
  email?: string | null
  fullName?: string | null
  avatarUrl?: string | null
}

export async function getProfile(supabase: SupabaseQueryClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function upsertProfile(
  supabase: SupabaseQueryClient,
  input: UpsertProfileInput
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: input.id,
      email: input.email ?? null,
      full_name: input.fullName ?? null,
      avatar_url: input.avatarUrl ?? null,
    })
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data
}
