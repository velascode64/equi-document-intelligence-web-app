"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { CheckIcon, LoaderIcon, LogOutIcon, MoonIcon, MonitorIcon, PaletteIcon, SunIcon, UserIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { createBrowserSupabaseClient } from "@/src/lib/supabase/browser-client"

type TabId = "profile" | "appearance"

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <UserIcon className="size-4" /> },
  { id: "appearance", label: "Appearance", icon: <PaletteIcon className="size-4" /> },
]

const subscribeToNothing = () => () => {}

function ProfileTab() {
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)
  const [loggingOut, setLoggingOut] = React.useState(false)
  const [name, setName] = React.useState("Equi User")
  const [email, setEmail] = React.useState("user@example.com")
  const [avatarUrl, setAvatarUrl] = React.useState("")

  React.useEffect(() => {
    void fetch("/api/profiles")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data) return
        setName(data.profile?.full_name ?? data.user?.user_metadata?.full_name ?? "Equi User")
        setEmail(data.profile?.email ?? data.user?.email ?? "user@example.com")
        setAvatarUrl(data.profile?.avatar_url ?? data.user?.user_metadata?.avatar_url ?? "")
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: name, email }),
    })
    setSaving(false)
  }

  async function handleLogout() {
    setLoggingOut(true)
    await createBrowserSupabaseClient().auth.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your account profile details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="text-lg">{getInitials(name || email)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="name">Full Name</label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">Email Address</label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? <LoaderIcon className="size-4 animate-spin" /> : <LogOutIcon className="size-4" />}
            {loggingOut ? "Logging out..." : "Log out"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <LoaderIcon className="size-4 animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function getInitials(value: string) {
  const parts = value
    .replace(/@.*/, "")
    .split(/\s+/)
    .filter(Boolean)

  return (parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "")
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(subscribeToNothing, () => true, () => false)

  const themes: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: "light", label: "Light", icon: <SunIcon className="size-5" /> },
    { id: "dark", label: "Dark", icon: <MoonIcon className="size-5" /> },
    { id: "system", label: "System", icon: <MonitorIcon className="size-5" /> },
  ]

  if (!mounted) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize how Equi looks on your device</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {themes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border-2 p-6 transition-all hover:bg-muted/50",
                theme === item.id ? "border-primary ring-2 ring-primary/20" : "border-border"
              )}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
              {theme === item.id && <CheckIcon className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function SettingsPageClient() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = React.useState<TabId>(
    tabs.some((tab) => tab.id === tabParam) ? (tabParam as TabId) : "profile"
  )

  const tabContent: Record<TabId, React.ReactNode> = {
    profile: <ProfileTab />,
    appearance: <AppearanceTab />,
  }

  return (
    <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
      <nav className="hidden w-52 shrink-0 flex-col gap-1 lg:flex">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "ghost"}
            size="sm"
            className={cn("justify-start gap-2", activeTab === tab.id && "font-semibold")}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </nav>

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2 lg:hidden">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "ghost"}
            size="sm"
            className="shrink-0 gap-1.5 text-xs"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="min-w-0 flex-1">{tabContent[activeTab]}</div>
    </div>
  )
}
