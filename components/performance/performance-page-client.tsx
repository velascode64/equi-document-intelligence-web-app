"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckIcon, Loader2Icon } from "lucide-react"

import type { PerformanceRecord } from "@/data/performance"
import { TransactionSummary } from "@/components/performance/transaction-summary"
import { TransactionFilters } from "@/components/performance/transaction-filters"
import { PerformanceTable } from "@/components/performance/performance-table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type DriveFolder = {
  id: string
  name: string
}

export function PerformancePageClient() {
  const [performanceRecords, setPerformanceRecords] = useState<PerformanceRecord[]>([])
  const [folderId, setFolderId] = useState("")
  const [folderName, setFolderName] = useState("")
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [foldersLoaded, setFoldersLoaded] = useState(false)
  const [foldersError, setFoldersError] = useState<string | null>(null)
  const [folderSearch, setFolderSearch] = useState("")
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [connectionLoaded, setConnectionLoaded] = useState(false)
  const [hasFolderConfigured, setHasFolderConfigured] = useState(false)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [isSavingFolder, setIsSavingFolder] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStep, setSyncStep] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [fundFilter, setFundFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [sort, setSort] = useState<"return-desc" | "return-asc">("return-desc")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function loadPerformance() {
    const response = await fetch("/api/smart-findoc-analyzer/financial-performance")
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setToast({ type: "error", message: data.error ?? "Could not load performance records." })
      return
    }
    const data = await response.json()
    setPerformanceRecords(data.performance ?? [])
  }

  async function loadConnection() {
    const response = await fetch("/api/smart-findoc-analyzer/google-drive/connection")
    setConnectionLoaded(true)
    if (!response.ok) return
    const data = await response.json()
    const savedFolderId = data.connection?.google_drive_folder_id ?? ""
    const savedFolderName = data.connection?.google_drive_folder_name ?? ""
    setFolderId(savedFolderId)
    setFolderName(savedFolderName)
    setHasFolderConfigured(Boolean(savedFolderId))
    setIsFolderModalOpen(!savedFolderId)
  }

  async function loadFolders(query = folderSearch) {
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())

    const response = await fetch(`/api/smart-findoc-analyzer/google-drive/folders?${params}`)
    setFoldersLoaded(true)
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setFoldersError(data.error ?? "Could not load Google Drive folders.")
      return
    }
    const data = await response.json()
    setFoldersError(null)
    setFolders(data.folders ?? [])
  }

  async function createFolder() {
    const name = folderSearch.trim()
    if (!name) {
      setFoldersError("Type a folder name to create it in the Drive root directory.")
      return
    }

    setIsCreatingFolder(true)
    setFoldersError(null)
    const response = await fetch("/api/smart-findoc-analyzer/google-drive/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    const data = await response.json().catch(() => ({}))
    setIsCreatingFolder(false)

    if (!response.ok) {
      setFoldersError(data.error ?? "Could not create Google Drive folder.")
      return
    }

    setFolderId(data.folder.id)
    setFolderName(data.folder.name)
    setFolders((current) => [data.folder, ...current])
  }

  async function saveFolder() {
    setMessage(null)
    setIsSavingFolder(true)
    const response = await fetch("/api/smart-findoc-analyzer/google-drive/connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId, folderName }),
    })

    setIsSavingFolder(false)
    setHasFolderConfigured(response.ok && Boolean(folderId))
    if (response.ok && folderId) setIsFolderModalOpen(false)
    setMessage(response.ok ? "Google Drive folder saved." : "Could not save folder.")
  }

  async function syncFolder() {
    setIsSyncing(true)
    setSyncStep("Reading folder")
    setMessage(null)
    setToast(null)
    window.setTimeout(() => setSyncStep("Finding files"), 400)
    window.setTimeout(() => setSyncStep("Processing files"), 1200)
    const response = await fetch("/api/smart-findoc-analyzer/sync", { method: "POST" })
    const data = await response.json().catch(() => ({}))
    setSyncStep("Refreshing dashboard")
    await loadPerformance()
    setIsSyncing(false)
    setSyncStep(null)
    const syncMessage = response.ok ? `Synced ${data.processed ?? 0} document(s).` : data.error ?? "Sync failed."
    setMessage(syncMessage)
    setToast({ type: response.ok ? "success" : "error", message: syncMessage })
  }

  useEffect(() => {
    void loadConnection()
    void loadPerformance()
    void loadFolders()
  }, [])

  const funds = useMemo(() => {
    return Array.from(new Set(performanceRecords.map((record) => record.fund))).sort()
  }, [performanceRecords])

  const reportDates = useMemo(() => {
    return Array.from(new Set(performanceRecords.map((record) => record.reportDate))).sort(
      (a, b) => b.localeCompare(a)
    )
  }, [performanceRecords])

  const records = useMemo(() => {
    let data = performanceRecords

    if (search) {
      const q = search.toLowerCase()
      data = data.filter(
        (record) =>
          record.fund.toLowerCase().includes(q) ||
          record.manager.toLowerCase().includes(q)
      )
    }

    if (fundFilter !== "all") {
      data = data.filter((record) => record.fund === fundFilter)
    }

    if (dateFilter !== "all") {
      data = data.filter((record) => record.reportDate === dateFilter)
    }

    return [...data].sort((a, b) =>
      sort === "return-desc"
        ? b.ytdReturn - a.ytdReturn
        : a.ytdReturn - b.ytdReturn
    )
  }, [dateFilter, fundFilter, performanceRecords, search, sort])

  return (
    <div className="flex flex-col gap-4">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-lg px-4 py-3 text-sm shadow-lg ${
            toast.type === "error"
              ? "bg-destructive text-destructive-foreground"
              : "bg-foreground text-background"
          }`}
        >
          {toast.message}
        </div>
      )}

      <Dialog open={connectionLoaded && isFolderModalOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Configure Google Drive folder</DialogTitle>
            <DialogDescription>
              Choose the Drive folder where your financial documents will be synced from.
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            MVP limitation: search and folder creation only work in the root directory of your Google Drive.
          </p>
          {foldersError && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {foldersError}
            </p>
          )}
          <div className="flex gap-2">
            <Input
              value={folderSearch}
              onChange={(event) => setFolderSearch(event.target.value)}
              placeholder="Search root folders"
            />
            <Button type="button" variant="outline" onClick={() => void loadFolders()}>
              Search
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={createFolder}
            disabled={isCreatingFolder}
          >
            {isCreatingFolder ? "Creating..." : "Create folder in root"}
          </Button>
          <div className="max-h-72 overflow-y-auto rounded-lg border">
            {!foldersLoaded && (
              <p className="p-3 text-sm text-muted-foreground">Loading folders...</p>
            )}
            {foldersLoaded && !foldersError && folders.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">No Drive folders found.</p>
            )}
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                className="flex w-full items-center justify-between gap-3 border-b p-3 text-left text-sm last:border-b-0 hover:bg-muted"
                onClick={() => {
                  setFolderId(folder.id)
                  setFolderName(folder.name)
                }}
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-medium">{folder.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{folder.id}</span>
                </span>
                {folder.id === folderId && <CheckIcon className="size-4 shrink-0" />}
              </button>
            ))}
          </div>
          {folderId && (
            <p className="text-sm text-muted-foreground">
              Selected: {folderName || folderId}
            </p>
          )}
          <DialogFooter>
            <Button onClick={saveFolder} disabled={isSavingFolder || !folderId}>
              {isSavingFolder ? "Saving..." : "Save folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-2 rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Google Drive folder</p>
          <p className="truncate text-sm font-medium">
            {folderName || folderId || "No folder configured"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsFolderModalOpen(true)} variant="outline">Edit</Button>
          <Button onClick={syncFolder} disabled={isSyncing || !folderId}>
            {isSyncing ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Syncing...
              </>
            ) : (
              "Sync folder"
            )}
          </Button>
        </div>
      </div>
      {isSyncing && (
        <div className="flex items-center gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          <span>{syncStep ?? "Syncing folder"}</span>
        </div>
      )}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <TransactionSummary records={records} />

      <TransactionFilters
        search={search}
        setSearch={setSearch}
        fundFilter={fundFilter}
        setFundFilter={setFundFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        sort={sort}
        setSort={setSort}
        funds={funds}
        reportDates={reportDates}
      />

      <PerformanceTable
        records={records}
        expandedId={expandedId}
        setExpandedId={setExpandedId}
      />
    </div>
  )
}
