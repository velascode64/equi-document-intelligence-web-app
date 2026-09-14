import { describe, expect, it } from "vitest"

import { parseDocumentContent } from "@/src/features/smart-findoc-analyzer/actions/financial-performance.parser"

describe("parseDocumentContent", () => {
  it("converts HTML into clean text", () => {
    const parsed = parseDocumentContent({
      filename: "report.html",
      mimeType: "text/html",
      content: "<h1>Alpha Fund</h1><script>ignored()</script><p>Return: 4.2%</p>",
    })

    expect(parsed.text).toBe("Alpha Fund Return: 4.2%")
  })

  it("accepts CSV buffers", () => {
    const parsed = parseDocumentContent({
      filename: "report.csv",
      mimeType: "text/csv",
      content: Buffer.from("fund,return\nAlpha Fund,0.042"),
    })

    expect(parsed.text).toContain("Alpha Fund,0.042")
  })

  it("rejects unsupported or empty documents", () => {
    expect(() => parseDocumentContent({ filename: "note.txt", mimeType: "text/plain" as never, content: "text" })).toThrow("Unsupported document type")
    expect(() => parseDocumentContent({ filename: "empty.csv", mimeType: "text/csv", content: " " })).toThrow("Document is empty")
  })
})
