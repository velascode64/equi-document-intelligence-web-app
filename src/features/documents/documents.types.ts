export type DocumentStatus = "pending" | "processing" | "completed" | "failed"

export type SupportedMimeType = "application/pdf" | "text/html" | "text/csv"

export type DocumentContent = {
  filename: string
  mimeType: SupportedMimeType
  content: string | Buffer
}

export type ParsedDocument = {
  filename: string
  mimeType: SupportedMimeType
  text: string
}

export type Document = {
  id: string
  userId: string
  driveFileId: string
  name: string
  mimeType: SupportedMimeType
  status: DocumentStatus
  rawExtraction?: unknown
  extractionError?: string
  processedAt?: string
}
