import type { DocumentContent, ParsedDocument, SupportedMimeType } from "./documents.types"

const supportedTypes = new Set<SupportedMimeType>([
  "application/pdf",
  "text/html",
  "text/csv",
])

export function parseDocument(input: DocumentContent): ParsedDocument {
  if (!supportedTypes.has(input.mimeType)) {
    throw new Error(`Unsupported document type: ${input.mimeType}`)
  }

  const text = Buffer.isBuffer(input.content) ? input.content.toString("utf8") : input.content
  if (!text.trim()) throw new Error(`Document is empty: ${input.filename}`)

  return {
    filename: input.filename,
    mimeType: input.mimeType,
    text: input.mimeType === "text/html" ? stripHtml(text) : text.trim(),
  }
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
}
