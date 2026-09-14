import type {
  DocumentRepository,
  FundRepository,
  PerformanceRepository,
} from "@/src/features/documents/documents.service"
import type { Document } from "@/src/features/documents/documents.types"
import type { Fund } from "@/src/features/funds/funds.types"
import type { PerformanceRecord } from "@/src/features/performance/performance.types"

export class InMemorySupabaseRepository
  implements DocumentRepository, FundRepository, PerformanceRepository
{
  readonly documents: Document[] = []
  readonly funds: Fund[] = []
  readonly performance: PerformanceRecord[] = []

  async create(document: Document) {
    this.documents.push({ ...document })
    return { ...document }
  }

  async markCompleted(id: string, rawExtraction: unknown, processedAt: string) {
    const document = this.getDocument(id)
    Object.assign(document, { status: "completed" as const, rawExtraction, processedAt })
    return { ...document }
  }

  async markFailed(id: string, extractionError: string) {
    const document = this.getDocument(id)
    Object.assign(document, { status: "failed" as const, extractionError })
    return { ...document }
  }

  async findOrCreate(input: Omit<Fund, "id">) {
    const existing = this.funds.find(
      (fund) =>
        fund.name === input.name &&
        fund.manager === input.manager &&
        fund.currency === input.currency
    )
    if (existing) return { ...existing }

    const fund = { id: `fund-${this.funds.length + 1}`, ...input }
    this.funds.push(fund)
    return { ...fund }
  }

  async createMany(records: PerformanceRecord[]) {
    this.performance.push(...records.map((record) => ({ ...record })))
    return records.map((record) => ({ ...record }))
  }

  private getDocument(id: string) {
    const document = this.documents.find((item) => item.id === id)
    if (!document) throw new Error(`Document not found: ${id}`)
    return document
  }
}
