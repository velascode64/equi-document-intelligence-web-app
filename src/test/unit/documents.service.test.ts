import { describe, expect, it, vi } from "vitest"

import { processDocument } from "@/src/features/documents/documents.service"
import { createMockExtractor } from "@/src/integrations/openai/openai.extractor"
import { InMemorySupabaseRepository } from "@/src/lib/supabase/mock-repository"

const extraction = {
  documentType: "fund_factsheet" as const,
  fund: { name: "Alpha Fund", manager: "Manager A", currency: "USD" },
  strategy: "Global Equity",
  aum: 850_000_000,
  performance: [
    {
      reportingDate: "2026-01-31",
      monthlyReturn: 0.042,
      ytdReturn: 0.042,
      sinceInception: 0.097,
      nav: 125.4,
      benchmark: "MSCI ACWI",
    },
  ],
}

describe("processDocument", () => {
  it("persists a validated extraction result", async () => {
    const repository = new InMemorySupabaseRepository()
    const result = await processDocument(
      {
        userId: "user-1",
        driveFileId: "drive-1",
        filename: "alpha.html",
        mimeType: "text/html",
        content: "<p>Alpha Fund</p>",
      },
      {
        documents: repository,
        funds: repository,
        performance: repository,
        extractor: createMockExtractor(extraction),
        id: () => "document-1",
        now: () => "2026-09-13T12:00:00.000Z",
      }
    )

    expect(result.document.status).toBe("completed")
    expect(result.fund.name).toBe("Alpha Fund")
    expect(result.performance[0]?.ytdReturn).toBe(0.042)
    expect(repository.documents).toHaveLength(1)
  })

  it("marks the document as failed when extraction is invalid", async () => {
    const repository = new InMemorySupabaseRepository()
    const extractor = { extract: vi.fn().mockResolvedValue({ invalid: true }) }

    await expect(
      processDocument(
        {
          userId: "user-1",
          driveFileId: "drive-2",
          filename: "invalid.csv",
          mimeType: "text/csv",
          content: "not valid extraction",
        },
        {
          documents: repository,
          funds: repository,
          performance: repository,
          extractor,
          id: () => "document-2",
        }
      )
    ).rejects.toThrow()

    expect(repository.documents[0]?.status).toBe("failed")
    expect(repository.documents[0]?.extractionError).toBeTruthy()
  })
})
