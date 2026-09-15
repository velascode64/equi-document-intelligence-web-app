import type { SupabaseClientLike } from "@/src/features/smart-findoc-analyzer/services/analyzer.service"

type SupabaseResponse = { data: unknown; error: { message: string } | null }

export class MockSupabaseClient implements SupabaseClientLike {
  readonly tables = new Map<string, unknown[]>()

  from(table: string) {
    if (!this.tables.has(table)) this.tables.set(table, [])
    const rows = this.tables.get(table)!

    return {
      insert: (values: unknown) => new MockResult(rows, Array.isArray(values) ? values : [values]),
      upsert: (values: unknown) => new MockResult(rows, Array.isArray(values) ? values : [values], true),
      select: () => new MockSelectQuery(rows),
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
  constructor(private readonly table: unknown[], private readonly data: unknown[], private readonly replace = false) {}

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
      if (this.replace && isRecord(row)) {
        const index = this.table.findIndex((item) => isSameRecord(item, row))
        if (index >= 0) this.table.splice(index, 1)
      }
      if (!this.table.includes(row)) this.table.push(row)
    }
    return { data: this.data, error: null }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

class MockSelectQuery {
  constructor(private readonly rows: unknown[]) {}

  eq(column: string, value: unknown): MockSelectQuery {
    return new MockSelectQuery(this.rows.filter((row) => isRecord(row) && row[column] === value))
  }

  async maybeSingle(): Promise<SupabaseResponse> {
    return { data: this.rows[0] ?? null, error: null }
  }

  then<TResult1 = SupabaseResponse, TResult2 = never>(
    onfulfilled?: ((value: SupabaseResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve<SupabaseResponse>({ data: this.rows, error: null }).then(onfulfilled, onrejected)
  }
}

function isSameRecord(left: unknown, right: Record<string, unknown>) {
  if (!isRecord(left)) return false
  if (left.id && right.id) return left.id === right.id
  if (left.user_id && left.drive_file_id && right.user_id && right.drive_file_id) {
    return left.user_id === right.user_id && left.drive_file_id === right.drive_file_id
  }
  return false
}
