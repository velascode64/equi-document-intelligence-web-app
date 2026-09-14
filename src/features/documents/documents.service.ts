import { extractedFinancialDataSchema } from "./documents.schema"
import { parseDocument } from "./documents.parser"
import type { Document, DocumentContent } from "./documents.types"
import type { Fund } from "../funds/funds.types"
import type { ExtractedFinancialData, PerformanceRecord } from "../performance/performance.types"

export type DocumentRepository = {
  create(document: Document): Promise<Document>
  markCompleted(id: string, rawExtraction: unknown, processedAt: string): Promise<Document>
  markFailed(id: string, extractionError: string): Promise<Document>
}

export type FundRepository = {
  findOrCreate(fund: Omit<Fund, "id">): Promise<Fund>
}

export type PerformanceRepository = {
  createMany(records: PerformanceRecord[]): Promise<PerformanceRecord[]>
}

export type FinancialExtractor = {
  extract(input: { filename: string; text: string }): Promise<unknown>
}

export type ProcessDocumentResult = {
  document: Document
  fund: Fund
  performance: PerformanceRecord[]
}

export async function processDocument(
  input: DocumentContent & { userId: string; driveFileId: string },
  dependencies: {
    documents: DocumentRepository
    funds: FundRepository
    performance: PerformanceRepository
    extractor: FinancialExtractor
    now?: () => string
    id?: () => string
  }
): Promise<ProcessDocumentResult> {
  const document: Document = {
    id: dependencies.id?.() ?? crypto.randomUUID(),
    userId: input.userId,
    driveFileId: input.driveFileId,
    name: input.filename,
    mimeType: input.mimeType,
    status: "processing",
  }

  await dependencies.documents.create(document)

  try {
    const parsed = parseDocument(input)
    const rawExtraction = await dependencies.extractor.extract({
      filename: parsed.filename,
      text: parsed.text,
    })
    const extraction = extractedFinancialDataSchema.parse(rawExtraction) as ExtractedFinancialData
    const fund = await dependencies.funds.findOrCreate(extraction.fund)
    const performance = await dependencies.performance.createMany(
      extraction.performance.map((item, index) => ({
        id: `${document.id}-performance-${index + 1}`,
        documentId: document.id,
        fundId: fund.id,
        reportingDate: item.reportingDate,
        monthlyReturn: item.monthlyReturn,
        ytdReturn: item.ytdReturn,
        sinceInception: item.sinceInception,
        nav: item.nav,
        benchmark: item.benchmark,
        currency: extraction.fund.currency,
      }))
    )
    const completed = await dependencies.documents.markCompleted(
      document.id,
      extraction,
      dependencies.now?.() ?? new Date().toISOString()
    )

    return { document: completed, fund, performance }
  } catch (error) {
    await dependencies.documents.markFailed(
      document.id,
      error instanceof Error ? error.message : "Document processing failed"
    )
    throw error
  }
}
