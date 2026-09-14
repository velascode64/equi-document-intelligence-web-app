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
import type { PartialOAuthCredentials } from "@/src/provider/google.provider"

export type ProcessDocumentInput = DocumentContent & {
  userId: string
  driveFileId: string
}

export type SupabaseClientLike = {
  from(table: string): SupabaseQueryLike
}

type SupabaseQueryLike = {
  insert(values: unknown): SupabaseQueryResultLike
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
  const documentId = id()

  const document = await createDocument(supabase, {
    id: documentId,
    user_id: input.userId,
    drive_file_id: input.driveFileId,
    name: input.filename,
    mime_type: input.mimeType,
    status: "processing",
  })

  try {
    const parsed = parseDocumentContent(input)
    const extraction = extractionSchema.parse(
      await (dependencies.extractPerformance ?? extractFinancialPerformance)({
        id: documentId,
        filename: parsed.filename,
        mimeType: parsed.mimeType as SupportedMimeType,
        text: parsed.text,
        base64Data: input.mimeType === "application/pdf" && Buffer.isBuffer(input.content)
          ? input.content.toString("base64")
          : undefined,
      })
    )

    await insertPerformanceRows(supabase, documentId, input, extraction.performance)
    const completed = await updateDocument(supabase, documentId, {
      status: "completed",
      raw_extraction: extraction satisfies LLMDocumentAnalysisResponse,
      processed_at: now(),
    })

    return { document: completed ?? document, performance: extraction.performance }
  } catch (error) {
    await updateDocument(supabase, documentId, {
      status: "failed",
      extraction_error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function syncGoogleDriveFolder(
  input: SyncGoogleDriveFolderInput,
  dependencies: AnalyzerDependencies = {}
): Promise<SyncGoogleDriveFolderResult> {
  const drive = dependencies.drive ?? getGoogleDriveActionClient(input.credentials)
  const processed: ProcessDocumentResult[] = []

  for (const file of await listGoogleDriveFolderDocuments(input, drive)) {
    const content = await downloadGoogleDriveFile(file.id, drive)
    processed.push(
      await processDocument(
        {
          userId: input.userId,
          driveFileId: file.id,
          filename: file.name,
          mimeType: file.mimeType,
          content,
        },
        dependencies
      )
    )
  }

  return { processed }
}

async function createDocument(supabase: SupabaseClientLike, values: unknown) {
  const { data, error } = await supabase.from("documents").insert(values).select("*").single()
  if (error) throw new Error(error.message)
  return data
}

async function updateDocument(supabase: SupabaseClientLike, id: string, values: unknown) {
  const { data, error } = await supabase.from("documents").update(values).eq("id", id).select("*").single()
  if (error) throw new Error(error.message)
  return data
}

async function insertPerformanceRows(
  supabase: SupabaseClientLike,
  documentId: string,
  input: ProcessDocumentInput,
  rows: DocumentPerformanceRow[]
) {
  if (!rows.length) return

  const values = rows.map((row) => ({
    document_id: documentId,
    user_id: input.userId,
    drive_file_id: input.driveFileId,
    fund: row.fund,
    manager: row.manager,
    document_type: row.documentType,
    reporting_date: row.reportingDate,
    strategy: row.strategy,
    aum: row.aum,
    nav: row.nav,
    ending_balance: row.endingBalance,
    ytd_return: row.ytdReturn,
    since_inception: row.sinceInception,
  }))

  const { error } = await supabase.from("financial_performance").insert(values)
  if (error) throw new Error(error.message)
}
