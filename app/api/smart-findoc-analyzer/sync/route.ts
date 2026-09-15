import { NextResponse } from "next/server"

import {
  getGoogleDriveConnection,
  syncGoogleDriveFolder,
  updateGoogleDriveSyncStatus,
} from "@/src/features/smart-findoc-analyzer"
import { requireUser } from "@/src/lib/supabase/server-client"
import { jsonError } from "../../_utils"

export async function POST() {
  try {
    const { supabase, user } = await requireUser()
    const connection = await getGoogleDriveConnection(supabase, user.id)

    if (!connection?.google_drive_folder_id) {
      return NextResponse.json({ error: "Google Drive folder is not configured" }, { status: 400 })
    }

    await updateGoogleDriveSyncStatus(supabase, user.id, "syncing")

    try {
      const result = await syncGoogleDriveFolder(
        {
          userId: user.id,
          folderId: connection.google_drive_folder_id,
          credentials: {
            accessToken: connection.oauth_tokens.accessToken as string | undefined,
            refreshToken: connection.oauth_tokens.refreshToken as string | undefined,
            expiresAt: connection.oauth_tokens.expiresAt as number | undefined,
          },
        },
        {
          supabase,
          extractPerformance: process.env.SMART_FINDOC_USE_MOCK_LLM !== "false"
            ? async () => ({ performance: mockPerformanceRows() })
            : undefined,
        }
      )

      await updateGoogleDriveSyncStatus(supabase, user.id, "completed")
      return NextResponse.json({ processed: result.processed.length })
    } catch (error) {
      await updateGoogleDriveSyncStatus(
        supabase,
        user.id,
        "failed",
        error instanceof Error ? error.message : String(error)
      )
      throw error
    }
  } catch (error) {
    return jsonError(error)
  }
}

function mockPerformanceRows() {
  return [
    ["Alpha Fund", "Manager A", "Global Equity", 850_000_000, 125.4, 0.076, 0.097],
    ["Growth Fund", "Manager B", "Growth Equity", 620_000_000, 98.62, 0.061, 0.084],
    ["Income Opportunities Fund", "Manager C", "Fixed Income", 410_000_000, 104.18, 0.028, 0.051],
    ["Global Real Assets Fund", "Manager D", "Real Assets", 295_000_000, 87.95, 0.043, 0.068],
    ["Emerging Markets Fund", "Manager E", "Emerging Markets Equity", 185_000_000, 72.31, 0.019, 0.046],
  ].map(([fund, manager, strategy, aum, nav, ytdReturn, sinceInception]) => ({
    fund: fund as string,
    manager: manager as string,
    documentType: "fund_factsheet" as const,
    reportingDate: "2026-01-31",
    strategy: strategy as string,
    aum: aum as number,
    nav: nav as number,
    endingBalance: null,
    ytdReturn: ytdReturn as number,
    sinceInception: sinceInception as number,
  }))
}
