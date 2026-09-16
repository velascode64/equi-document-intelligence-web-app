import { describe, expect, it, vi } from "vitest"

import { getProfile, upsertProfile } from "../services/profiles.service"

type QueryResult = { data: unknown; error: { message: string } | null }

function createQueryStub(result: QueryResult) {
  const stub = {
    select: vi.fn(() => stub),
    eq: vi.fn(() => stub),
    upsert: vi.fn(() => stub),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
  }
  return stub
}

describe("getProfile", () => {
  it("selects the profile by id and returns it", async () => {
    const profile = {
      id: "user-1",
      email: "user@example.com",
      full_name: "User One",
      avatar_url: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    }
    const stub = createQueryStub({ data: profile, error: null })
    const supabase = { from: vi.fn(() => stub) }

    const result = await getProfile(supabase, "user-1")

    expect(supabase.from).toHaveBeenCalledWith("profiles")
    expect(stub.eq).toHaveBeenCalledWith("id", "user-1")
    expect(result).toEqual(profile)
  })

  it("returns null when no profile exists", async () => {
    const stub = createQueryStub({ data: null, error: null })
    const supabase = { from: vi.fn(() => stub) }

    const result = await getProfile(supabase, "user-missing")

    expect(result).toBeNull()
  })

  it("throws when Supabase returns an error", async () => {
    const stub = createQueryStub({ data: null, error: { message: "connection failed" } })
    const supabase = { from: vi.fn(() => stub) }

    await expect(getProfile(supabase, "user-1")).rejects.toThrow("connection failed")
  })
})

describe("upsertProfile", () => {
  it("upserts the profile with null defaults for omitted fields", async () => {
    const profile = {
      id: "user-1",
      email: null,
      full_name: null,
      avatar_url: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    }
    const stub = createQueryStub({ data: profile, error: null })
    const supabase = { from: vi.fn(() => stub) }

    const result = await upsertProfile(supabase, { id: "user-1" })

    expect(stub.upsert).toHaveBeenCalledWith({
      id: "user-1",
      email: null,
      full_name: null,
      avatar_url: null,
    })
    expect(result).toEqual(profile)
  })

  it("throws when the upsert fails", async () => {
    const stub = createQueryStub({ data: null, error: { message: "constraint violation" } })
    const supabase = { from: vi.fn(() => stub) }

    await expect(upsertProfile(supabase, { id: "user-1" })).rejects.toThrow("constraint violation")
  })
})
