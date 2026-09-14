import { describe, expect, it, vi } from "vitest"

import { processDocument } from "@/src/features/smart-findoc-analyzer"
import { MockSupabaseClient } from "@/src/lib/supabase/mock-repository"

describe("document extraction flow", () => {
  it("runs Google mock -> parser -> LLM mock -> Supabase mock", async () => {
    const googleDrive = {
      getDocument: vi.fn().mockResolvedValue({
        userId: "user-1",
        driveFileId: "drive-file-1",
        filename: "Vanguard_Factsheet_Jan_2026.pdf",
        mimeType: "application/pdf",
        content: Buffer.from("Fund: Vanguard Global Equity\nYTD Return: 0.076"),
      }),
    }
    const supabase = new MockSupabaseClient()
    const extractPerformance = vi.fn().mockResolvedValue({
      performance: [{
        fund: "Vanguard Global Equity",
        manager: "Vanguard",
        documentType: "fund_factsheet",
        reportingDate: "2026-01-31",
        strategy: "Global Equity",
        aum: 850_000_000,
        nav: 125.4,
        endingBalance: null,
        ytdReturn: 0.076,
        sinceInception: 0.097,
      }],
    })

    const result = await processDocument(await googleDrive.getDocument("drive-file-1"), {
        supabase,
        extractPerformance,
        id: () => "document-1",
        now: () => "2026-09-13T12:00:00.000Z",
      })

    expect(googleDrive.getDocument).toHaveBeenCalledWith("drive-file-1")
    expect(extractPerformance).toHaveBeenCalledWith(expect.objectContaining({ id: "document-1" }))
    expect(result.performance).toHaveLength(1)
    expect(supabase.table("documents")).toEqual([
      expect.objectContaining({ id: "document-1", status: "completed" }),
    ])
    expect(supabase.table("financial_performance")).toEqual([
      expect.objectContaining({
        document_id: "document-1",
        fund: "Vanguard Global Equity",
        ytd_return: 0.076,
      }),
    ])
  })
})
