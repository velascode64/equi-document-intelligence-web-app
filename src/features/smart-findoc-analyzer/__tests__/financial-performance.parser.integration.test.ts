import { readdir, readFile } from "node:fs/promises"
import { basename, extname, join } from "node:path"
import { describe, expect, it } from "vitest"

import {
  type DocumentPerformanceRow,
  extractFinancialPerformance,
  parseDocumentContent,
} from "../actions/financial-performance.parser"

const shouldRun = process.env.RUN_LLM_INTEGRATION_TESTS === "true"
const describeIfEnabled = shouldRun ? describe : describe.skip
const testFilesDir = join(import.meta.dirname, "test-files")

export const expectedExtractions: Record<string, DocumentPerformanceRow[]> = {
  "ReportP0.pdf": [],

  "vanguardTotalStockMarketReport.pdf": [{
    fund: "Vanguard Total Stock Market ETF",
    manager: "Vanguard Capital Management",
    documentType: "fund_factsheet",
    reportingDate: "2026-06-30",
    strategy:
      "Passively managed, index-sampling strategy tracking the CRSP US Total Market Index",
    aum: 663488000000,
    nav: null,
    endingBalance: null,
    ytdReturn: 0.1107,
    sinceInception: 0.0948,
  }],

  "sp500fund.pdf": [{
    fund: "iShares Core S&P 500 ETF",
    manager: null,
    documentType: "fund_factsheet",
    reportingDate: "2026-06-30",
    strategy:
      "Seeks to track the S&P 500 Index, providing exposure to large-cap U.S. companies",
    aum: 888128940000,
    nav: null,
    endingBalance: null,
    ytdReturn: null,
    sinceInception: 0.0841,
  }],
}

describeIfEnabled("extractFinancialPerformance Anthropic integration", () => {
  it("extracts performance rows from financial PDFs", async () => {
    const files = await pdfFiles()

    expect(files.length, "Add at least one PDF to __tests__/test-files").toBeGreaterThan(0)

    for (const file of files) {
      const expected = expectedExtractions[basename(file)]
      expect(expected, `Missing expected extraction for ${basename(file)}`).toBeDefined()

      const result = await extractPdf(file)

      expect(result.performance, basename(file)).toHaveLength(expected.length)
      for (const row of result.performance) {
        expect(Object.keys(row).sort()).toEqual([
          "aum",
          "documentType",
          "endingBalance",
          "fund",
          "manager",
          "nav",
          "reportingDate",
          "sinceInception",
          "strategy",
          "ytdReturn",
        ])
        expectNullableString(row.fund)
        expectNullableString(row.manager)
        expect(row.documentType === null || ["fund_factsheet", "account_statement", "performance_report"].includes(row.documentType)).toBe(true)
        expect(row.reportingDate === null || /^\d{4}-\d{2}-\d{2}$/.test(row.reportingDate)).toBe(true)
        expectNullableString(row.strategy)
        expectNullableNumber(row.aum)
        expectNullableNumber(row.nav)
        expectNullableNumber(row.endingBalance)
        expectNullableNumber(row.ytdReturn)
        expectNullableNumber(row.sinceInception)
      }
      result.performance.forEach((row, index) => {
        expectExtraction(row, expected[index], basename(file))
      })
    }
  })
})

async function pdfFiles() {
  const files = await readdir(testFilesDir)
  return files
    .filter((file) => extname(file).toLowerCase() === ".pdf")
    .map((file) => join(testFilesDir, file))
}

function expectNullableString(value: unknown) {
  expect(value === null || typeof value === "string").toBe(true)
}

function expectNullableNumber(value: unknown) {
  expect(value === null || typeof value === "number").toBe(true)
}

function expectExtraction(
  actual: DocumentPerformanceRow,
  expected: DocumentPerformanceRow,
  filename: string
) {
  expect(normalizeFund(actual.fund), `${filename} fund`).toBe(expected.fund)
  // manager is hard to validate reliably (LLM sometimes returns individual portfolio managers instead of the firm name) - improve later
  expect(actual.documentType, `${filename} documentType`).toBe(expected.documentType)
  expect(actual.reportingDate, `${filename} reportingDate`).toBe(expected.reportingDate)
  expect(actual.aum, `${filename} aum`).toBe(expected.aum)
  expect(actual.nav, `${filename} nav`).toBe(expected.nav)
  expect(actual.endingBalance, `${filename} endingBalance`).toBe(expected.endingBalance)
  expect(actual.ytdReturn, `${filename} ytdReturn`).toBe(expected.ytdReturn)
  expect(actual.sinceInception, `${filename} sinceInception`).toBe(expected.sinceInception)

  if (expected.strategy) {
    expect(actual.strategy, `${filename} strategy`).toEqual(expect.any(String))
    expect(actual.strategy?.length, `${filename} strategy`).toBeGreaterThan(10)
  } else {
    expect(actual.strategy, `${filename} strategy`).toBeNull()
  }
}

function normalizeFund(value: string | null) {
  return value?.replace(/\s*\([A-Z.]+\)\s*$/, "") ?? null
}

async function extractPdf(file: string) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY")

  const content = await readFile(file)
  console.log(`\n[llm] Calling Anthropic for ${basename(file)} (${content.length} bytes)`)
  const parsed = parseDocumentContent({
    filename: basename(file),
    mimeType: "application/pdf",
    content,
  })

  const result = await extractFinancialPerformance({
    filename: parsed.filename,
    mimeType: parsed.mimeType,
    text: parsed.text,
    base64Data: content.toString("base64"),
  })
  console.log(`[llm] ${basename(file)} extracted ${result.performance.length} row(s)`)
  console.table(result.performance)
  return result
}
