import { describe, expect, it } from "vitest"

import { processDocument } from "@/src/features/documents/documents.service"
import { createMockExtractor } from "@/src/integrations/openai/openai.extractor"
import { InMemorySupabaseRepository } from "@/src/lib/supabase/mock-repository"

describe("document extraction flow", () => {
  it("runs document → parser → LLM mock → validation → normalization → repository", async () => {
    const repository = new InMemorySupabaseRepository()
    const result = await processDocument(
      {
        userId: "user-1",
        driveFileId: "drive-file-1",
        filename: "Vanguard_Factsheet_Jan_2026.pdf",
        mimeType: "application/pdf",
        content: Buffer.from("Fund: Vanguard Global Equity\nYTD Return: 0.076"),
      },
      {
        documents: repository,
        funds: repository,
        performance: repository,
        extractor: createMockExtractor({
          documentType: "fund_factsheet",
          fund: { name: "Vanguard Global Equity", manager: "Vanguard", currency: "USD" },
          performance: [{ reportingDate: "2026-01-31", ytdReturn: 0.076, nav: 125.4 }],
        }),
        id: () => "document-1",
        now: () => "2026-09-13T12:00:00.000Z",
      }
    )

    expect(result.document.status).toBe("completed")
    expect(repository.documents).toHaveLength(1)
    expect(repository.funds).toEqual([
      { id: "fund-1", name: "Vanguard Global Equity", manager: "Vanguard", currency: "USD" },
    ])
    expect(repository.performance).toEqual([
      expect.objectContaining({ documentId: "document-1", ytdReturn: 0.076 }),
    ])
  })
})
