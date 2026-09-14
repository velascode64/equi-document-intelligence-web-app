type SupabaseQueryClient = {
  from(table: string): any
}

export type SyncStatus = "idle" | "syncing" | "completed" | "failed"
export type DocumentStatus = "pending" | "processing" | "completed" | "failed"

export type GoogleDriveConnection = {
  id: string
  user_id: string
  google_account_email: string | null
  google_drive_folder_id: string | null
  google_drive_folder_name: string | null
  oauth_tokens: Record<string, unknown>
  sync_status: SyncStatus
  last_sync_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export type UpsertGoogleDriveConnectionInput = {
  userId: string
  googleAccountEmail?: string | null
  googleDriveFolderId?: string | null
  googleDriveFolderName?: string | null
  oauthTokens: Record<string, unknown>
  syncStatus?: SyncStatus
}

export type DriveDocument = {
  id: string
  user_id: string
  google_drive_connection_id: string | null
  drive_file_id: string
  name: string
  mime_type: string
  drive_modified_time: string | null
  drive_md5_checksum: string | null
  status: DocumentStatus
  raw_extraction: unknown
  extraction_error: string | null
  processed_at: string | null
  created_at: string
  updated_at: string
}

export type UpsertDriveDocumentInput = {
  userId: string
  googleDriveConnectionId?: string | null
  driveFileId: string
  name: string
  mimeType: string
  driveModifiedTime?: string | null
  driveMd5Checksum?: string | null
  status?: DocumentStatus
}

export async function getGoogleDriveConnection(
  supabase: SupabaseQueryClient,
  userId: string
): Promise<GoogleDriveConnection | null> {
  const { data, error } = await supabase
    .from("google_drive_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function upsertGoogleDriveConnection(
  supabase: SupabaseQueryClient,
  input: UpsertGoogleDriveConnectionInput
): Promise<GoogleDriveConnection> {
  const { data, error } = await supabase
    .from("google_drive_connections")
    .upsert({
      user_id: input.userId,
      google_account_email: input.googleAccountEmail ?? null,
      google_drive_folder_id: input.googleDriveFolderId ?? null,
      google_drive_folder_name: input.googleDriveFolderName ?? null,
      oauth_tokens: input.oauthTokens,
      sync_status: input.syncStatus ?? "idle",
    }, { onConflict: "user_id" })
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateGoogleDriveSyncStatus(
  supabase: SupabaseQueryClient,
  userId: string,
  syncStatus: SyncStatus,
  lastError?: string | null
): Promise<GoogleDriveConnection> {
  const { data, error } = await supabase
    .from("google_drive_connections")
    .update({
      sync_status: syncStatus,
      last_sync_at: syncStatus === "completed" ? new Date().toISOString() : undefined,
      last_error: lastError ?? null,
    })
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function findDocumentByDriveFileId(
  supabase: SupabaseQueryClient,
  userId: string,
  driveFileId: string
): Promise<DriveDocument | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .eq("drive_file_id", driveFileId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function upsertDriveDocument(
  supabase: SupabaseQueryClient,
  input: UpsertDriveDocumentInput
): Promise<DriveDocument> {
  const { data, error } = await supabase
    .from("documents")
    .upsert({
      user_id: input.userId,
      google_drive_connection_id: input.googleDriveConnectionId ?? null,
      drive_file_id: input.driveFileId,
      name: input.name,
      mime_type: input.mimeType,
      drive_modified_time: input.driveModifiedTime ?? null,
      drive_md5_checksum: input.driveMd5Checksum ?? null,
      status: input.status ?? "pending",
    }, { onConflict: "user_id,drive_file_id" })
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data
}

export function shouldProcessDriveDocument(
  existing: Pick<DriveDocument, "drive_modified_time" | "drive_md5_checksum"> | null,
  incoming: Pick<UpsertDriveDocumentInput, "driveModifiedTime" | "driveMd5Checksum">
): boolean {
  if (!existing) return true
  if (incoming.driveMd5Checksum && existing.drive_md5_checksum !== incoming.driveMd5Checksum) return true
  if (incoming.driveModifiedTime && existing.drive_modified_time !== incoming.driveModifiedTime) return true
  return !incoming.driveMd5Checksum && !incoming.driveModifiedTime
}
