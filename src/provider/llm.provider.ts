import Anthropic from "@anthropic-ai/sdk"

export type LlmInput = { filename: string; prompt?: string; text?: string }

export interface ILLMProvider {
  extractDocument(input: LlmInput): Promise<unknown>
}

export type LlmProvider = ILLMProvider

export class LLMProvider implements ILLMProvider {
  private readonly anthropic: Anthropic
  private readonly model: string
  private readonly maxTokens = 2_000

  constructor(apiKey?: string, model?: string) {
    this.anthropic = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY })
    this.model = model || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6"
  }

  async extractDocument(input: LlmInput): Promise<unknown> {
    const response = await this.anthropic.messages.create({ model: this.model, max_tokens: this.maxTokens, messages: [{ role: "user", content: input.prompt || input.text || "" }] })
    const text = response.content.find((block): block is Anthropic.TextBlock => block.type === "text")?.text
    if (!text) throw new Error("Unexpected response type from LLM")
    return JSON.parse(this.extractJsonObject(text))
  }

  private extractJsonObject(text: string): string {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1]
    if (fenced) return fenced
    const start = text.indexOf("{")
    const end = text.lastIndexOf("}")
    if (start < 0 || end <= start) throw new Error("LLM response did not contain a JSON object")
    return text.slice(start, end + 1)
  }
}

export function createMockLlmProvider(result: unknown): ILLMProvider {
  return { extractDocument: async () => result }
}
