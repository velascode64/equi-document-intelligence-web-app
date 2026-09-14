import Anthropic from "@anthropic-ai/sdk"
import type { DocumentContent, ParsedDocument, SupportedMimeType } from "../schemas/document.schema"
import { cleanDocumentText } from "@/src/utils/document-text"

const supportedTypes = new Set<SupportedMimeType>(["application/pdf", "text/html", "text/csv"])
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
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
  const text = input.mimeType === "text/html" ? cleanDocumentText(raw) : raw.trim()
  if (!text) throw new Error(`Document is empty: ${input.filename}`)
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

Normalization rules: fund is the normalized fund name; manager is the asset/investment manager; documentType is fund_factsheet, account_statement, or performance_report; reportingDate is ISO YYYY-MM-DD; aum, nav, and endingBalance are numeric monetary values without symbols or magnitude suffixes ("$850M" is 850000000); and ytdReturn and sinceInception are decimal percentages ("7.6%" is 0.076). Use endingBalance for account statements and nav for fund reports when applicable. Use null when a field is absent or not reliably extractable. Never guess.

DOCUMENT CONTENT:\n${text}`
}

export async function extractFinancialPerformance(document: DocumentForLLM): Promise<LLMDocumentAnalysisResponse> {
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
