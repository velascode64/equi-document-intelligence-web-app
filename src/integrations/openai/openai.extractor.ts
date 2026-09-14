import type { FinancialExtractor } from "@/src/features/documents/documents.service"

export type LlmClient = {
  extractFinancialData(input: { filename: string; text: string }): Promise<unknown>
}

export function createOpenAIExtractor(client: LlmClient): FinancialExtractor {
  return {
    extract: (input) => client.extractFinancialData(input),
  }
}

export function createMockExtractor(result: unknown): FinancialExtractor {
  return {
    extract: async () => result,
  }
}
