"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BellIcon, LogInIcon, MonitorIcon, MoonIcon, SettingsIcon, SunIcon, TrendingUpIcon } from "lucide-react"
import { useTheme } from "next-themes"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

const pages = [
  { label: "Performance", icon: TrendingUpIcon, href: "/transactions" },
  { label: "Notifications", icon: BellIcon, href: "/notifications" },
  { label: "Settings", icon: SettingsIcon, href: "/settings" },
  { label: "Sign In", icon: LogInIcon, href: "/sign-in" },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { setTheme } = useTheme()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const run = useCallback((action: () => void) => {
    setOpen(false)
    action()
  }, [])

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Search Equi pages and actions"
    >
      <Command>
        <CommandInput placeholder="Search pages and actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Pages">
            {pages.map((page) => (
              <CommandItem key={page.href} onSelect={() => run(() => router.push(page.href))}>
                <page.icon className="mr-2 size-4" />
                {page.label}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => run(() => setTheme("light"))}>
              <SunIcon className="mr-2 size-4" />
              Light mode
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme("dark"))}>
              <MoonIcon className="mr-2 size-4" />
              Dark mode
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme("system"))}>
              <MonitorIcon className="mr-2 size-4" />
              System theme
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
