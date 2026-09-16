import { describe, expect, it } from "vitest"

import { parseDocumentContent } from "../actions/financial-performance.parser"

describe("parseDocumentContent", () => {
  it("parses a CSV document as plain text", () => {
    const csv = "fund,manager,ytd_return\nAlpha Fund,Manager A,0.076\n"

    const result = parseDocumentContent({
      filename: "alpha-fund.csv",
      mimeType: "text/csv",
      content: csv,
    })

    expect(result.mimeType).toBe("text/csv")
    expect(result.text).toBe(csv.trim())
  })

  it("strips markup and normalizes whitespace for an HTML document", () => {
    const html = `
      <html>
        <body>
          <script>console.log("ignored")</script>
          <p>Fund:&nbsp;Alpha&nbsp;Fund</p>
          <p>YTD&nbsp;Return: 7.6%</p>
        </body>
      </html>
    `

    const result = parseDocumentContent({
      filename: "alpha-fund-email.html",
      mimeType: "text/html",
      content: html,
    })

    expect(result.mimeType).toBe("text/html")
    expect(result.text).toBe("Fund: Alpha Fund YTD Return: 7.6%")
    expect(result.text).not.toContain("console.log")
  })

  it("accepts a PDF document without extracting text upfront", () => {
    const result = parseDocumentContent({
      filename: "alpha-fund.pdf",
      mimeType: "application/pdf",
      content: Buffer.from("%PDF-1.4 mock binary content"),
    })

    expect(result.mimeType).toBe("application/pdf")
    expect(result.text).toBe("")
  })

  it("rejects unsupported mime types", () => {
    expect(() =>
      parseDocumentContent({
        filename: "notes.txt",
        // @ts-expect-error intentionally invalid mime type for the test
        mimeType: "text/plain",
        content: "not supported",
      })
    ).toThrow("Unsupported document type")
  })

  it("rejects an empty non-PDF document", () => {
    expect(() =>
      parseDocumentContent({
        filename: "empty.csv",
        mimeType: "text/csv",
        content: "   ",
      })
    ).toThrow("Document is empty")
  })
})
