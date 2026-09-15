"use client"

import { SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TransactionFiltersProps {
  search: string
  setSearch: (v: string) => void
  fundFilter: string
  setFundFilter: (v: string) => void
  dateFilter: string
  setDateFilter: (v: string) => void
  sort: "return-desc" | "return-asc"
  setSort: (v: "return-desc" | "return-asc") => void
  funds: string[]
  reportDates: string[]
}

export function TransactionFilters({
  search,
  setSearch,
  fundFilter,
  setFundFilter,
  dateFilter,
  setDateFilter,
  sort,
  setSort,
  funds,
  reportDates,
}: TransactionFiltersProps) {
  const dateLabel = (date: string) =>
    new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(
      new Date(`${date}T00:00:00`)
    )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:min-w-[200px] sm:flex-1">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search funds or managers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <Select
        value={fundFilter}
        onValueChange={(v) => v && setFundFilter(v)}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Fund" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All funds</SelectItem>
          {funds.map((fund) => (
            <SelectItem key={fund} value={fund}>
              {fund}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={dateFilter}
        onValueChange={(v) => v && setDateFilter(v)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Report date" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All dates</SelectItem>
          {reportDates.map((date) => (
            <SelectItem key={date} value={date}>
              {dateLabel(date)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Sort by return" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="return-desc">Return: high to low</SelectItem>
          <SelectItem value="return-asc">Return: low to high</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
