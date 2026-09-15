"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2Icon, Clock3Icon, FileTextIcon, XCircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

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
    label: "Processing document",
    icon: Clock3Icon,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  document_processing_completed: {
    label: "Document processed",
    icon: CheckCircle2Icon,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  document_processing_failed: {
    label: "Document processing failed",
    icon: XCircleIcon,
    color: "bg-destructive/10 text-destructive",
  },
}

const defaultCopy = { label: "Update", icon: FileTextIcon, color: "bg-muted text-muted-foreground" }

function NotificationDropdown({ icon }: { icon: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<Notification[]>([])

  async function loadNotifications() {
    const response = await fetch("/api/notifications", { cache: "no-store" })
    if (!response.ok) return
    const data = await response.json()
    setNotifications(data.notifications ?? [])
  }

  React.useEffect(() => {
    void loadNotifications()
    const interval = window.setInterval(() => void loadNotifications(), 15000)
    window.addEventListener("notifications:read", loadNotifications)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("notifications:read", loadNotifications)
    }
  }, [])

  const unreadCount = notifications.filter((notification) => notification.status === "unread").length

  return (
    <Popover onOpenChange={(open) => open && void loadNotifications()}>
      <PopoverTrigger render={<SidebarMenuButton size="sm" className="relative" />}>
        {icon}
        <span className="flex-1">Notifications</span>
        {unreadCount > 0 && (
          <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold leading-none text-primary-foreground tabular-nums">
            {unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent side="right" align="end" sideOffset={8} className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <span className="text-[10px] font-medium text-muted-foreground">
            {notifications.length} updates
          </span>
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">No notifications yet.</p>
          ) : (
            notifications.slice(0, 3).map((notification) => {
              const copy = typeCopy[notification.type] ?? defaultCopy
              const Icon = copy.icon
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex gap-3 border-b px-4 py-3 last:border-0",
                    notification.status === "unread" && "bg-primary/[0.03]"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                      copy.color
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{copy.label}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <FileTextIcon className="size-3 shrink-0" />
                      <span className="truncate">{notification.message}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="border-t p-2">
          <Link
            href="/notifications"
            className="flex items-center justify-center rounded-md py-1.5 text-xs font-medium text-primary transition-colors hover:bg-muted"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.title === "Notifications" ? (
                <NotificationDropdown icon={item.icon} />
              ) : (
                <SidebarMenuButton size="sm" render={<Link href={item.url} />}>
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
