import { describe, expect, it, vi } from "vitest"

import { createNotification, listNotifications, markNotificationRead } from "../services/notifications.service"

type QueryResult = { data: unknown; error: { message: string } | null }

function createQueryStub(result: QueryResult) {
  const stub: any = {
    select: vi.fn(() => stub),
    eq: vi.fn(() => stub),
    order: vi.fn(() => stub),
    insert: vi.fn(() => stub),
    update: vi.fn(() => stub),
    single: vi.fn(async () => result),
    then: (resolve: (value: QueryResult) => unknown) => resolve(result),
  }
  return stub
}

describe("listNotifications", () => {
  it("lists notifications for a user ordered by newest first", async () => {
    const notifications = [
      { id: "n1", user_id: "user-1", type: "document_processing_started", title: "Processing document", message: "file.pdf is being processed.", status: "unread", metadata: {}, read_at: null, created_at: "2026-01-02T00:00:00.000Z" },
    ]
    const stub = createQueryStub({ data: notifications, error: null })
    const supabase = { from: vi.fn(() => stub) }

    const result = await listNotifications(supabase, "user-1")

    expect(supabase.from).toHaveBeenCalledWith("notifications")
    expect(stub.eq).toHaveBeenCalledWith("user_id", "user-1")
    expect(stub.order).toHaveBeenCalledWith("created_at", { ascending: false })
    expect(result).toEqual(notifications)
  })

  it("filters by status when provided", async () => {
    const stub = createQueryStub({ data: [], error: null })
    const supabase = { from: vi.fn(() => stub) }

    await listNotifications(supabase, "user-1", "unread")

    expect(stub.eq).toHaveBeenCalledWith("status", "unread")
  })

  it("returns an empty array when Supabase returns no data", async () => {
    const stub = createQueryStub({ data: null, error: null })
    const supabase = { from: vi.fn(() => stub) }

    const result = await listNotifications(supabase, "user-1")

    expect(result).toEqual([])
  })

  it("throws when Supabase returns an error", async () => {
    const stub = createQueryStub({ data: null, error: { message: "query failed" } })
    const supabase = { from: vi.fn(() => stub) }

    await expect(listNotifications(supabase, "user-1")).rejects.toThrow("query failed")
  })
})

describe("createNotification", () => {
  it("inserts a single notification with default metadata", async () => {
    const created = {
      id: "n1",
      user_id: "user-1",
      type: "document_processing_started",
      title: "Processing document",
      message: "file.pdf is being processed.",
      status: "unread",
      metadata: {},
      read_at: null,
      created_at: "2026-01-02T00:00:00.000Z",
    }
    const stub = createQueryStub({ data: created, error: null })
    const supabase = { from: vi.fn(() => stub) }

    const result = await createNotification(supabase, {
      userId: "user-1",
      type: "document_processing_started",
      title: "Processing document",
      message: "file.pdf is being processed.",
    })

    expect(stub.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      type: "document_processing_started",
      title: "Processing document",
      message: "file.pdf is being processed.",
      metadata: {},
    })
    expect(result).toEqual(created)
  })

  it("throws when the insert fails", async () => {
    const stub = createQueryStub({ data: null, error: { message: "insert failed" } })
    const supabase = { from: vi.fn(() => stub) }

    await expect(
      createNotification(supabase, {
        userId: "user-1",
        type: "document_processing_started",
        title: "Processing document",
        message: "file.pdf is being processed.",
      })
    ).rejects.toThrow("insert failed")
  })
})

describe("markNotificationRead", () => {
  it("marks a notification as read scoped to its owner", async () => {
    const updated = {
      id: "n1",
      user_id: "user-1",
      type: "document_processing_started",
      title: "Processing document",
      message: "file.pdf is being processed.",
      status: "read",
      metadata: {},
      read_at: "2026-01-02T00:00:00.000Z",
      created_at: "2026-01-02T00:00:00.000Z",
    }
    const stub = createQueryStub({ data: updated, error: null })
    const supabase = { from: vi.fn(() => stub) }

    const result = await markNotificationRead(supabase, "n1", "user-1")

    expect(stub.update).toHaveBeenCalledWith(expect.objectContaining({ status: "read" }))
    expect(stub.eq).toHaveBeenCalledWith("id", "n1")
    expect(stub.eq).toHaveBeenCalledWith("user_id", "user-1")
    expect(result).toEqual(updated)
  })

  it("throws when the update fails", async () => {
    const stub = createQueryStub({ data: null, error: { message: "not found" } })
    const supabase = { from: vi.fn(() => stub) }

    await expect(markNotificationRead(supabase, "n1", "user-1")).rejects.toThrow("not found")
  })
})
