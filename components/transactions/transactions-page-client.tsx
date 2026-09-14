"use client"

import { useMemo, useState } from "react"

import { performanceRecords } from "@/data/performance"
import { TransactionSummary } from "@/components/transactions/transaction-summary"
import { TransactionFilters } from "@/components/transactions/transaction-filters"
import { TransactionTable } from "@/components/transactions/transaction-table"

export function TransactionsPageClient() {
  const [search, setSearch] = useState("")
  const [fundFilter, setFundFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [sort, setSort] = useState<"return-desc" | "return-asc">("return-desc")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const funds = useMemo(() => {
    return Array.from(new Set(performanceRecords.map((record) => record.fund))).sort()
  }, [])

  const reportDates = useMemo(() => {
    return Array.from(new Set(performanceRecords.map((record) => record.reportDate))).sort(
      (a, b) => b.localeCompare(a)
    )
  }, [])

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
  }, [dateFilter, fundFilter, search, sort])

  return (
    <div className="flex flex-col gap-4">
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

      <TransactionTable
        records={records}
        expandedId={expandedId}
        setExpandedId={setExpandedId}
      />
    </div>
  )
}
