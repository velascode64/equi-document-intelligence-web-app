type SupabaseQueryClient = {
  from(table: string): any
}

export type NotificationStatus = "unread" | "read"

export type Notification = {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  status: NotificationStatus
  metadata: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export type CreateNotificationInput = {
  userId: string
  type: string
  title: string
  message: string
  metadata?: Record<string, unknown>
}

export async function listNotifications(
  supabase: SupabaseQueryClient,
  userId: string,
  status?: NotificationStatus
): Promise<Notification[]> {
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (status) query = query.eq("status", status)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createNotification(
  supabase: SupabaseQueryClient,
  input: CreateNotificationInput
): Promise<Notification> {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function markNotificationRead(
  supabase: SupabaseQueryClient,
  notificationId: string,
  userId: string
): Promise<Notification> {
  const { data, error } = await supabase
    .from("notifications")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data
}
