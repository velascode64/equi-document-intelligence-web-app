import { describe, expect, it, vi } from "vitest"

import { processDocument } from "@/src/features/smart-findoc-analyzer"
import { MockSupabaseClient } from "@/src/lib/supabase/mock-repository"

const extraction = {
  performance: [{
      fund: "Alpha Fund",
      manager: "Manager A",
      documentType: "fund_factsheet" as const,
      reportingDate: "2026-01-31",
      strategy: "Global Equity",
      aum: 850_000_000,
      nav: 125.4,
      endingBalance: null,
      ytdReturn: 0.042,
      sinceInception: 0.097,
    }],
}

describe("processDocument", () => {
  it("persists a validated extraction result", async () => {
    const supabase = new MockSupabaseClient()
    const result = await processDocument(
      {
        userId: "user-1",
        driveFileId: "drive-1",
        filename: "alpha.html",
        mimeType: "text/html",
        content: "<p>Alpha Fund</p>",
      },
      {
        supabase,
        extractPerformance: vi.fn().mockResolvedValue(extraction),
        id: () => "document-1",
        now: () => "2026-09-13T12:00:00.000Z",
      }
    )

    expect(result.document).toEqual(expect.objectContaining({ status: "completed" }))
    expect(result.performance[0]?.ytdReturn).toBe(0.042)
    expect(supabase.table("documents")).toHaveLength(1)
  })

  it("marks the document as failed when extraction is invalid", async () => {
    const supabase = new MockSupabaseClient()

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
          supabase,
          extractPerformance: vi.fn().mockResolvedValue({ invalid: true }),
          id: () => "document-2",
        }
      )
    ).rejects.toThrow()

    expect(supabase.table("documents")[0]).toEqual(expect.objectContaining({ status: "failed" }))
    expect(supabase.table("documents")[0]).toEqual(expect.objectContaining({ extraction_error: expect.any(String) }))
  })
})
