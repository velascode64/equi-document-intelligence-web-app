"use client"

import { useEffect, useState } from "react"
import { CheckCircle2Icon, Clock3Icon, FileTextIcon, XCircleIcon } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Notification = {
  id: string
  type: string
  title: string
  message: string
  status: "unread" | "read"
  created_at: string
}

const typeCopy: Record<string, { label: string; icon: typeof Clock3Icon; color: string }> = {
  document_processing_started: {
    label: "Processing",
    icon: Clock3Icon,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  document_processing_completed: {
    label: "Processed",
    icon: CheckCircle2Icon,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  document_processing_failed: {
    label: "Failed",
    icon: XCircleIcon,
    color: "bg-destructive/10 text-destructive",
  },
}

const defaultCopy = { label: "Update", icon: FileTextIcon, color: "bg-muted text-muted-foreground" }

export function NotificationsPageClient() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  async function loadNotifications() {
    const response = await fetch("/api/notifications", { cache: "no-store" })
    if (!response.ok) return
    const data = await response.json()
    const loaded: Notification[] = data.notifications ?? []
    setNotifications(loaded)
    return loaded
  }

  useEffect(() => {
    void loadNotifications().then((loaded) => {
      const unread = loaded?.filter((notification) => notification.status === "unread") ?? []
      if (unread.length) void markAllAsRead(unread)
    })
  }, [])

  async function markAllAsRead(unread: Notification[]) {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, status: "read" }))
    )
    const results = await Promise.all(
      unread.map((notification) =>
        fetch(`/api/notifications/${notification.id}/read`, { method: "POST" })
      )
    )
    if (results.some((result) => !result.ok)) console.error("Failed to mark some notifications as read")
    window.dispatchEvent(new Event("notifications:read"))
  }

  async function markAsRead(id: string) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, status: "read" } : notification
      )
    )
    const response = await fetch(`/api/notifications/${id}/read`, { method: "POST" })
    if (!response.ok) console.error("Failed to mark notification as read")
    window.dispatchEvent(new Event("notifications:read"))
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Document processing status and extraction availability.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <EmptyState
              variant="notifications"
              title="No document notifications"
              description="Processing updates will appear here."
              className="py-12"
            />
          ) : (
            notifications.map((notification) => {
              const copy = typeCopy[notification.type] ?? defaultCopy
              const Icon = copy.icon

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void markAsRead(notification.id)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b px-4 py-4 text-left last:border-b-0 hover:bg-muted/50",
                    notification.status === "unread" && "bg-primary/[0.03]"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                      copy.color
                    )}
                  >
                    <Icon className="size-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{notification.title}</p>
                      <Badge variant="outline">{copy.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                  </div>

                  <time className="shrink-0 text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </time>
                </button>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
