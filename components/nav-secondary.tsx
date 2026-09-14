"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2Icon, Clock3Icon, FileTextIcon } from "lucide-react"

import { documentNotifications } from "@/data/document-notifications"
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

function NotificationDropdown({ icon }: { icon: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger render={<SidebarMenuButton size="sm" className="relative" />}>
        {icon}
        <span className="flex-1">Notifications</span>
        <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold leading-none text-primary-foreground tabular-nums">
          {documentNotifications.length}
        </span>
      </PopoverTrigger>
      <PopoverContent side="right" align="end" sideOffset={8} className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <span className="text-[10px] font-medium text-muted-foreground">
            {documentNotifications.length} updates
          </span>
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {documentNotifications.slice(0, 3).map((notification) => {
            const isProcessing = notification.status === "processing"
            return (
              <div key={notification.id} className="flex gap-3 border-b px-4 py-3 last:border-0">
                <div
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                    isProcessing
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {isProcessing ? <Clock3Icon className="size-3.5" /> : <CheckCircle2Icon className="size-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">
                    {isProcessing ? "Processing document" : "Document processed"}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <FileTextIcon className="size-3 shrink-0" />
                    <span className="truncate">{notification.documentName}</span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                    {notification.timestamp}
                  </p>
                </div>
              </div>
            )
          })}
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
