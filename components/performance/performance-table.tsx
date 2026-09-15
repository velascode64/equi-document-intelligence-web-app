"use client"

import { FileTextIcon } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { DocumentStatus, PerformanceRecord } from "@/data/performance"
import { cn } from "@/lib/utils"

interface PerformanceTableProps {
  records: PerformanceRecord[]
  expandedId: string | null
  setExpandedId: (id: string | null) => void
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

const percentageFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  style: "percent",
})

const moneyFormatter = (currency: string, value: number) =>
  new Intl.NumberFormat("en-US", {
    currency,
    maximumFractionDigits: value >= 1_000_000 ? 0 : 2,
    minimumFractionDigits: value >= 1_000_000 ? 0 : 2,
    style: "currency",
  }).format(value >= 1_000_000 ? value / 1_000_000 : value) + (value >= 1_000_000 ? "M" : "")

function statusBadge(status: DocumentStatus) {
  switch (status) {
    case "processed":
      return <Badge variant="default">Processed</Badge>
    case "processing":
      return <Badge variant="outline" className="text-amber-600 dark:text-amber-400">Processing</Badge>
    case "failed":
      return <Badge variant="destructive">Failed</Badge>
  }
}

function mockSourceHref(record: PerformanceRecord) {
  const content = [
    record.documentName,
    "",
    `Fund: ${record.fund}`,
    `Manager: ${record.manager}`,
    `Report date: ${record.reportDate}`,
    `YTD return: ${percentageFormatter.format(record.ytdReturn)}`,
  ].join("\n")

  return `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`
}

export function PerformanceTable({
  records,
  expandedId,
  setExpandedId,
}: PerformanceTableProps) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fund</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Report Date</TableHead>
              <TableHead>Strategy</TableHead>
              <TableHead className="text-right">AUM</TableHead>
              <TableHead className="text-right">NAV / Ending Balance</TableHead>
              <TableHead className="text-right">YTD Return</TableHead>
              <TableHead className="text-right">Since Inception</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={11}>
                  <EmptyState
                    title="No performance records found"
                    description="Try changing the current search or filters."
                    variant="filter"
                    className="py-12"
                  />
                </TableCell>
              </TableRow>
            )}

            {records.map((record) => {
              const isExpanded = expandedId === record.id

              return (
                <TableRows
                  key={record.id}
                  record={record}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedId(isExpanded ? null : record.id)}
                />
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function TableRows({
  record,
  isExpanded,
  onToggle,
}: {
  record: PerformanceRecord
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <TableRow
        className={cn("cursor-pointer", isExpanded && "border-b-0 bg-muted/30")}
        onClick={onToggle}
      >
        <TableCell className="font-medium">{record.fund}</TableCell>
        <TableCell>{record.manager}</TableCell>
        <TableCell>{record.documentType}</TableCell>
        <TableCell>{dateFormatter.format(new Date(`${record.reportDate}T00:00:00`))}</TableCell>
        <TableCell>{record.strategy}</TableCell>
        <TableCell className="text-right tabular-nums">{moneyFormatter(record.currency, record.aum)}</TableCell>
        <TableCell className="text-right tabular-nums">{moneyFormatter(record.currency, record.navOrEndingBalance)}</TableCell>
        <TableCell className="text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
          {percentageFormatter.format(record.ytdReturn)}
        </TableCell>
        <TableCell className="text-right tabular-nums">{percentageFormatter.format(record.sinceInception)}</TableCell>
        <TableCell>{statusBadge(record.status)}</TableCell>
        <TableCell>
          <Button
            nativeButton={false}
            render={
              <a
                href={mockSourceHref(record)}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              />
            }
            size="xs"
            variant="ghost"
          >
            <FileTextIcon className="size-3.5" />
            {record.documentName}
          </Button>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={11} className="px-4 py-3">
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Document</dt>
                <dd className="mt-0.5 font-medium">{record.documentName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Benchmark</dt>
                <dd className="mt-0.5 font-medium">{record.benchmark}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Currency</dt>
                <dd className="mt-0.5 font-medium">{record.currency}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Processing status</dt>
                <dd className="mt-0.5">{statusBadge(record.status)}</dd>
              </div>
            </dl>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
