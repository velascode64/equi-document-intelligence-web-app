import { z } from "zod"

import {
  extractFinancialPerformance,
  parseDocumentContent,
  type DocumentPerformanceRow,
  type LLMDocumentAnalysisResponse,
} from "../actions/financial-performance.parser"
import type { DocumentContent, SupportedMimeType } from "../schemas/document.schema"
import { createBackendSupabaseClient } from "@/src/lib/supabase/backend-client"
import {
  downloadGoogleDriveFile,
  getGoogleDriveActionClient,
  listGoogleDriveFolderDocuments,
  type DriveClientLike,
} from "../actions/google-drive.action"
import {
  replaceFinancialPerformanceForDocument,
  toFinancialPerformanceRows,
} from "./financial-performance.service"
import { findDocumentByDriveFileId } from "./persistence.service"
import type { PartialOAuthCredentials } from "@/src/provider/google.provider"
import { createNotification } from "@/src/features/notifications"

export type ProcessDocumentInput = DocumentContent & {
  userId: string
  driveFileId: string
  driveModifiedTime?: string | null
  driveMd5Checksum?: string | null
  existingDocumentId?: string
}

export type SupabaseClientLike = {
  from(table: string): SupabaseQueryLike
}

type SupabaseQueryLike = {
  insert(values: unknown): SupabaseQueryResultLike
  upsert(values: unknown, options?: unknown): SupabaseQueryResultLike
  update(values: unknown): SupabaseQueryFilterLike
}

type SupabaseQueryFilterLike = {
  eq(column: string, value: unknown): SupabaseQueryResultLike
}

type SupabaseQueryResultLike = {
  then<TResult1 = { data: unknown; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2>
  select(columns?: string): SupabaseQueryResultLike
  single(): PromiseLike<{ data: unknown; error: { message: string } | null }>
}

export type AnalyzerDependencies = {
  supabase?: SupabaseClientLike
  drive?: DriveClientLike
  extractPerformance?: typeof extractFinancialPerformance
  id?: () => string
  now?: () => string
}

export type ProcessDocumentResult = {
  document: unknown
  performance: DocumentPerformanceRow[]
}

export type SyncGoogleDriveFolderInput = {
  userId: string
  folderId: string
  credentials: PartialOAuthCredentials
}

export type SyncGoogleDriveFolderResult = {
  processed: ProcessDocumentResult[]
}

const performanceRowSchema = z.object({
  fund: z.string().trim().min(1).nullable(),
  manager: z.string().trim().min(1).nullable(),
  documentType: z.enum(["fund_factsheet", "account_statement", "performance_report"]).nullable(),
  reportingDate: z.string().date().nullable(),
  strategy: z.string().trim().min(1).nullable(),
  aum: z.number().finite().nonnegative().nullable(),
  nav: z.number().finite().nonnegative().nullable(),
  endingBalance: z.number().finite().nonnegative().nullable(),
  ytdReturn: z.number().finite().min(-1).max(10).nullable(),
  sinceInception: z.number().finite().min(-1).max(10).nullable(),
})

const extractionSchema = z.object({
  performance: z.array(performanceRowSchema),
})

export async function processDocument(
  input: ProcessDocumentInput,
  dependencies: AnalyzerDependencies = {}
): Promise<ProcessDocumentResult> {
  const supabase = dependencies.supabase ?? (createBackendSupabaseClient() as unknown as SupabaseClientLike)
  const id = dependencies.id ?? crypto.randomUUID
  const now = dependencies.now ?? (() => new Date().toISOString())
  // reuse the existing row's id on re-sync so it doesn't move the primary key referenced by financial_performance
  const documentId = input.existingDocumentId ?? id()

  const document = await createDocument(supabase, {
    id: documentId,
    user_id: input.userId,
    drive_file_id: input.driveFileId,
    name: input.filename,
    mime_type: input.mimeType,
    drive_modified_time: input.driveModifiedTime ?? null,
    drive_md5_checksum: input.driveMd5Checksum ?? null,
    status: "processing",
  })
  const persistedDocumentId = (document as { id: string }).id

  await notifyDocumentEvent(supabase, {
    userId: input.userId,
    type: "document_processing_started",
    title: "Processing document",
    message: `${input.filename} is being processed.`,
    documentId: persistedDocumentId,
  })

  try {
    const parsed = parseDocumentContent(input)
    const extraction = extractionSchema.parse(
      await (dependencies.extractPerformance ?? extractFinancialPerformance)({
        id: persistedDocumentId,
        filename: parsed.filename,
        mimeType: parsed.mimeType as SupportedMimeType,
        text: parsed.text,
        base64Data: input.mimeType === "application/pdf" && Buffer.isBuffer(input.content)
          ? input.content.toString("base64")
          : undefined,
      })
    )

    await replaceFinancialPerformanceForDocument(
      supabase,
      persistedDocumentId,
      toFinancialPerformanceRows(persistedDocumentId, extraction.performance)
    )
    const completed = await updateDocument(supabase, persistedDocumentId, {
      status: "completed",
      raw_extraction: extraction satisfies LLMDocumentAnalysisResponse,
      processed_at: now(),
    })

    return { document: completed ?? document, performance: extraction.performance }
  } catch (error) {
    await updateDocument(supabase, persistedDocumentId, {
      status: "failed",
      extraction_error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

async function notifyDocumentEvent(
  supabase: SupabaseClientLike,
  input: { userId: string; type: string; title: string; message: string; documentId: string }
) {
  try {
    await createNotification(supabase as unknown as Parameters<typeof createNotification>[0], {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: { documentId: input.documentId },
    })
  } catch (error) {
    console.error("[analyzer.service] Failed to create notification:", error)
  }
}

export async function syncGoogleDriveFolder(
  input: SyncGoogleDriveFolderInput,
  dependencies: AnalyzerDependencies = {}
): Promise<SyncGoogleDriveFolderResult> {
  const supabase = dependencies.supabase ?? (createBackendSupabaseClient() as unknown as SupabaseClientLike)
  const drive = dependencies.drive ?? getGoogleDriveActionClient(input.credentials)
  const processed: ProcessDocumentResult[] = []

  for (const file of await listGoogleDriveFolderDocuments(input, drive)) {
    const existing = await findDocumentByDriveFileId(
      supabase as unknown as Parameters<typeof findDocumentByDriveFileId>[0],
      input.userId,
      file.id
    )

    if (existing) continue

    const content = await downloadGoogleDriveFile(file.id, drive)
    processed.push(
      await processDocument(
        {
          userId: input.userId,
          driveFileId: file.id,
          filename: file.name,
          mimeType: file.mimeType,
          content,
          driveModifiedTime: file.modifiedTime,
          driveMd5Checksum: file.md5Checksum,
        },
        { ...dependencies, supabase }
      )
    )
  }

  return { processed }
}

async function createDocument(supabase: SupabaseClientLike, values: unknown) {
  const { data, error } = await supabase
    .from("documents")
    .upsert(values, { onConflict: "user_id,drive_file_id" })
    .select("*")
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function updateDocument(supabase: SupabaseClientLike, id: string, values: unknown) {
  const { data, error } = await supabase.from("documents").update(values).eq("id", id).select("*").single()
  if (error) throw new Error(error.message)
  return data
}
