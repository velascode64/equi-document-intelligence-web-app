import { describe, expect, it } from "vitest"

import { parseDocument } from "@/src/features/documents/documents.parser"

describe("parseDocument", () => {
  it("converts HTML into clean text", () => {
    const parsed = parseDocument({
      filename: "report.html",
      mimeType: "text/html",
      content: "<h1>Alpha Fund</h1><script>ignored()</script><p>Return: 4.2%</p>",
    })

    expect(parsed.text).toBe("Alpha Fund Return: 4.2%")
  })

  it("accepts CSV buffers", () => {
    const parsed = parseDocument({
      filename: "report.csv",
      mimeType: "text/csv",
      content: Buffer.from("fund,return\nAlpha Fund,0.042"),
    })

    expect(parsed.text).toContain("Alpha Fund,0.042")
  })

  it("rejects unsupported or empty documents", () => {
    expect(() => parseDocument({ filename: "note.txt", mimeType: "text/plain" as never, content: "text" })).toThrow("Unsupported document type")
    expect(() => parseDocument({ filename: "empty.csv", mimeType: "text/csv", content: " " })).toThrow("Document is empty")
  })
})
