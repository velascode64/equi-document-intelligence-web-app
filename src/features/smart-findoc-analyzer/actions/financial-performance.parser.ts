import Anthropic from "@anthropic-ai/sdk"
import type { DocumentContent, ParsedDocument, SupportedMimeType } from "../schemas/document.schema"
import { cleanDocumentText } from "@/src/utils/document-text"

const supportedTypes = new Set<SupportedMimeType>(["application/pdf", "text/html", "text/csv"])
const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6"
const nullableString = { type: ["string", "null"] as const }
const nullableNumber = { type: ["number", "null"] as const }

export type DocumentForLLM = {
  id?: string
  filename: string
  mimeType: SupportedMimeType
  text: string
  base64Data?: string
}

export type DocumentPerformanceRow = {
  fund: string | null
  manager: string | null
  documentType: "fund_factsheet" | "account_statement" | "performance_report" | null
  reportingDate: string | null
  strategy: string | null
  aum: number | null
  nav: number | null
  endingBalance: number | null
  ytdReturn: number | null
  sinceInception: number | null
}

export type LLMDocumentAnalysisResponse = {
  performance: DocumentPerformanceRow[]
}

export function parseDocumentContent(input: DocumentContent): ParsedDocument {
  if (!supportedTypes.has(input.mimeType)) throw new Error(`Unsupported document type: ${input.mimeType}`)
  const raw = Buffer.isBuffer(input.content) ? input.content.toString("utf8") : input.content
  const text = input.mimeType === "application/pdf"
    ? ""
    : input.mimeType === "text/html"
      ? cleanDocumentText(raw)
      : raw.trim()
  if (!text && input.mimeType !== "application/pdf") throw new Error(`Document is empty: ${input.filename}`)
  return { filename: input.filename, mimeType: input.mimeType, text }
}

export function getDocumentAnalysisTool(): Anthropic.Tool {
  return {
    name: "extract_document_analysis",
    description:
      "Extract normalized fund performance rows from a financial document. Return one performance item for each fund/report-date pair found; never invent values.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        performance: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              fund: nullableString,
              manager: nullableString,
              documentType: {
                anyOf: [
                  { type: "string", enum: ["fund_factsheet", "account_statement", "performance_report"] },
                  { type: "null" },
                ],
              },
              reportingDate: nullableString,
              strategy: nullableString,
              aum: nullableNumber,
              nav: nullableNumber,
              endingBalance: nullableNumber,
              ytdReturn: nullableNumber,
              sinceInception: nullableNumber,
            },
            required: [
              "fund",
              "manager",
              "documentType",
              "reportingDate",
              "strategy",
              "aum",
              "nav",
              "endingBalance",
              "ytdReturn",
              "sinceInception",
            ],
          },
        },
      },
      required: ["performance"],
    },
  }
}

export function createFinancialDocumentPrompt(filename: string, text: string): string {
  return `Extract normalized fund performance data from ${filename}.

Use the extract_document_analysis tool. The document may be a fund factsheet, account statement, or performance report. Return one item in performance for every fund/report-date pair present in the document.

Each performance item is one table row with fund, manager, documentType, reportingDate, strategy, aum, nav, endingBalance, ytdReturn, and sinceInception.

If the document does not contain fund/account performance data, return performance: [].

Field rules:
- fund: normalized fund/account name.
- manager: explicitly identified investment, fund, asset, or portfolio manager. Do not use distributor, sponsor, issuer, brand, or product family unless the document explicitly identifies it as manager.
- documentType: fund_factsheet, account_statement, or performance_report.
- reportingDate: date represented by the document/data in ISO YYYY-MM-DD.
- strategy: investment strategy or fund category stated or clearly described by the document.
- aum: total assets under management / net assets of the specific fund, ETF, share class, or account represented by the document. Do not use parent-company, issuer-wide, or broader fund-family assets.
- nav: current monetary Net Asset Value per share/unit only. Do not interpret "NAV return", "NAV performance", or any percentage as nav.
- endingBalance: ending account balance for account statements only; otherwise null unless a balance is explicitly reported.
- ytdReturn: year-to-date fund return for the reporting year. Prefer NAV return when both NAV and market-price returns are presented. Do not substitute calendar-year, trailing 1-year, benchmark, index, or market-price return when YTD fund/NAV return is absent.
- sinceInception: fund/account since-inception return. Prefer NAV return when multiple return types are presented. Do not use benchmark/index since-inception return.

Normalization rules: monetary values are numeric values without symbols or magnitude suffixes ("$850M" is 850000000); returns are decimal percentages ("7.6%" is 0.076); use null when a field is absent or not reliably extractable. Never guess or infer from unrelated numbers.${
    text ? `\n\nDOCUMENT CONTENT:\n${text}` : ""
  }`
}

export async function extractFinancialPerformance(document: DocumentForLLM): Promise<LLMDocumentAnalysisResponse> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const prompt = createFinancialDocumentPrompt(document.filename, document.text)

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4096,
    tool_choice: { type: "tool", name: "extract_document_analysis" },
    tools: [getDocumentAnalysisTool()],
    messages: [
      {
        role: "user",
        content: document.base64Data && document.mimeType === "application/pdf"
          ? [
              {
                type: "document",
                title: document.filename,
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: document.base64Data,
                },
              },
              { type: "text", text: prompt },
            ]
          : prompt,
      },
    ],
  })

  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === "extract_document_analysis"
  )

  if (!toolBlock) {
    throw new Error("Unexpected response type from Claude")
  }

  return toDocumentAnalysis(toolBlock.input)
}

function toDocumentAnalysis(input: unknown): LLMDocumentAnalysisResponse {
  const parsed = input as Partial<LLMDocumentAnalysisResponse>
  return { performance: Array.isArray(parsed.performance) ? parsed.performance : [] }
}
