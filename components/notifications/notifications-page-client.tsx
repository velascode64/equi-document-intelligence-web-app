"use client"

import { CheckCircle2Icon, Clock3Icon, FileTextIcon } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  documentNotifications,
  type DocumentNotificationStatus,
} from "@/data/document-notifications"
import { cn } from "@/lib/utils"

const statusCopy: Record<
  DocumentNotificationStatus,
  { label: string; title: string; icon: typeof Clock3Icon; color: string }
> = {
  processing: {
    label: "Processing",
    title: "Processing document",
    icon: Clock3Icon,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  processed: {
    label: "Processed",
    title: "Document processed",
    icon: CheckCircle2Icon,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
}

export function NotificationsPageClient() {
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
          {documentNotifications.length === 0 ? (
            <EmptyState
              variant="notifications"
              title="No document notifications"
              description="Processing updates will appear here."
              className="py-12"
            />
          ) : (
            documentNotifications.map((notification) => {
              const copy = statusCopy[notification.status]
              const Icon = copy.icon

              return (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 border-b px-4 py-4 last:border-b-0"
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
                      <p className="text-sm font-semibold">{copy.title}</p>
                      <Badge variant="outline">{copy.label}</Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <FileTextIcon className="size-3.5 shrink-0" />
                      <span className="truncate">{notification.documentName}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.status === "processing"
                        ? `${notification.documentName} is being processed.`
                        : `${notification.documentName} was processed successfully and its extracted data is now available.`}
                    </p>
                  </div>

                  <time className="shrink-0 text-xs text-muted-foreground">
                    {notification.timestamp}
                  </time>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
