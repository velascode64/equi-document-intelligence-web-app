import type { SupabaseClientLike } from "@/src/features/smart-findoc-analyzer/services/analyzer.service"

type SupabaseResponse = { data: unknown; error: { message: string } | null }

export class MockSupabaseClient implements SupabaseClientLike {
  readonly tables = new Map<string, unknown[]>()

  from(table: string) {
    if (!this.tables.has(table)) this.tables.set(table, [])
    const rows = this.tables.get(table)!

    return {
      insert: (values: unknown) => new MockResult(rows, Array.isArray(values) ? values : [values]),
      delete: () => ({
        eq: (column: string, value: unknown) => {
          const deleted = rows.filter((row) => isRecord(row) && row[column] === value)
          for (const row of deleted) rows.splice(rows.indexOf(row), 1)
          return new MockResult(rows, [])
        },
      }),
      update: (values: unknown) => ({
        eq: (column: string, value: unknown) => {
          const updated = rows
            .filter((row) => isRecord(row) && row[column] === value)
            .map((row) => Object.assign(row as object, values))
          return new MockResult(rows, updated)
        },
      }),
    }
  }

  table<T = unknown>(name: string): T[] {
    return (this.tables.get(name) ?? []) as T[]
  }
}

class MockResult {
  constructor(private readonly table: unknown[], private readonly data: unknown[]) {}

  then<TResult1 = SupabaseResponse, TResult2 = never>(
    onfulfilled?: ((value: SupabaseResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.run().then(onfulfilled, onrejected)
  }

  select() {
    return this
  }

  async single(): Promise<SupabaseResponse> {
    await this.run()
    return { data: this.data[0] ?? null, error: null }
  }

  private async run(): Promise<SupabaseResponse> {
    for (const row of this.data) {
      if (!this.table.includes(row)) this.table.push(row)
    }
    return { data: this.data, error: null }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
