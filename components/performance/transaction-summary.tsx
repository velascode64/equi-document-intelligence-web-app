import { CheckCircle2Icon, Clock3Icon, FileTextIcon, LandmarkIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { PerformanceRecord } from "@/data/performance"

interface TransactionSummaryProps {
  records: PerformanceRecord[]
}

export function TransactionSummary({ records }: TransactionSummaryProps) {
  const funds = new Set(records.map((record) => record.fund)).size
  const documents = new Map(records.map((record) => [record.documentId, record]))
  const processed = [...documents.values()].filter(
    (record) => record.status === "processed"
  ).length
  const requiresAttention = [...documents.values()].filter(
    (record) => record.status !== "processed"
  ).length

  const cards = [
    {
      label: "Funds",
      value: funds.toString(),
      icon: LandmarkIcon,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Source Documents",
      value: documents.size.toString(),
      icon: FileTextIcon,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-500/10",
    },
    {
      label: "Processed",
      value: processed.toString(),
      icon: CheckCircle2Icon,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Pending / Failed",
      value: requiresAttention.toString(),
      icon: Clock3Icon,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10"
        >
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              card.bg
            )}
          >
            <card.icon className={cn("size-4", card.color)} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="tabular-nums text-base font-semibold tracking-tight">
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
