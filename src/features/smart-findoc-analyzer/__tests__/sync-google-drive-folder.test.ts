import { describe, expect, it, vi } from "vitest"

import { syncGoogleDriveFolder } from "@/src/features/smart-findoc-analyzer"
import { MockSupabaseClient } from "@/src/lib/supabase/mock-repository"

describe("syncGoogleDriveFolder", () => {
  it("lists one Drive document, downloads it, extracts performance, and persists the results", async () => {
    const drive = {
      files: {
        list: vi.fn().mockResolvedValue({
          data: {
            files: [
              { id: "drive-file-1", name: "Alpha Fund January.pdf", mimeType: "application/pdf" },
              { id: "ignored-file", name: "notes.txt", mimeType: "text/plain" },
            ],
          },
        }),
        get: vi.fn().mockResolvedValue({
          data: Buffer.from("Fund: Alpha Fund\nManager: Manager A\nYTD Return: 7.6%"),
        }),
      },
    }
    const supabase = new MockSupabaseClient()
    const extractPerformance = vi.fn().mockResolvedValue({
      performance: [{
        fund: "Alpha Fund",
        manager: "Manager A",
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

    const result = await syncGoogleDriveFolder(
      {
        userId: "user-1",
        folderId: "folder-1",
        credentials: { accessToken: "mock-access-token" },
      },
      {
        drive,
        supabase,
        extractPerformance,
        id: () => "document-1",
        now: () => "2026-09-13T12:00:00.000Z",
      }
    )

    expect(drive.files.list).toHaveBeenCalledWith(expect.objectContaining({
      q: expect.stringContaining("'folder-1' in parents"),
      pageSize: 100,
    }))
    expect(drive.files.get).toHaveBeenCalledWith(
      { fileId: "drive-file-1", alt: "media" },
      { responseType: "arraybuffer" }
    )
    expect(extractPerformance).toHaveBeenCalledWith(expect.objectContaining({
      id: "document-1",
      filename: "Alpha Fund January.pdf",
      mimeType: "application/pdf",
      base64Data: Buffer.from("Fund: Alpha Fund\nManager: Manager A\nYTD Return: 7.6%").toString("base64"),
    }))
    expect(result.processed).toHaveLength(1)
    expect(supabase.table("documents")).toEqual([
      expect.objectContaining({
        id: "document-1",
        drive_file_id: "drive-file-1",
        name: "Alpha Fund January.pdf",
        status: "completed",
        processed_at: "2026-09-13T12:00:00.000Z",
      }),
    ])
    expect(supabase.table("financial_performance")).toEqual([
      expect.objectContaining({
        document_id: "document-1",
        user_id: "user-1",
        drive_file_id: "drive-file-1",
        fund: "Alpha Fund",
        manager: "Manager A",
        document_type: "fund_factsheet",
        reporting_date: "2026-01-31",
        ytd_return: 0.076,
        since_inception: 0.097,
      }),
    ])
  })
})
