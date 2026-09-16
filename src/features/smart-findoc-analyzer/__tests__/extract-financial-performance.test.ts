import { describe, expect, it, vi } from "vitest"

const createMock = vi.fn()

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { create: createMock }
  },
}))

import { extractFinancialPerformance } from "../actions/financial-performance.parser"

describe("extractFinancialPerformance", () => {
  it("sends the document tool schema and returns the parsed performance rows", async () => {
    createMock.mockResolvedValueOnce({
      stop_reason: "tool_use",
      usage: { input_tokens: 10, output_tokens: 5 },
      content: [
        {
          type: "tool_use",
          name: "extract_document_analysis",
          input: {
            performance: [
              {
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
              },
            ],
          },
        },
      ],
    })

    const result = await extractFinancialPerformance({
      id: "document-1",
      filename: "alpha-fund.csv",
      mimeType: "text/csv",
      text: "fund,manager,ytd_return\nAlpha Fund,Manager A,0.076",
    })

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tool_choice: { type: "tool", name: "extract_document_analysis" },
      })
    )
    expect(result.performance).toHaveLength(1)
    expect(result.performance[0]).toMatchObject({ fund: "Alpha Fund", ytdReturn: 0.076 })
  })

  it("throws when Claude does not return the expected tool_use block", async () => {
    createMock.mockResolvedValueOnce({
      stop_reason: "end_turn",
      usage: { input_tokens: 10, output_tokens: 5 },
      content: [{ type: "text", text: "I could not extract structured data." }],
    })

    await expect(
      extractFinancialPerformance({
        id: "document-2",
        filename: "broken.csv",
        mimeType: "text/csv",
        text: "unreadable content",
      })
    ).rejects.toThrow("Unexpected response type from Claude")
  })
})
