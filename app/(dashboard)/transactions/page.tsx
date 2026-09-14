import { TransactionsPageClient } from "@/components/transactions/transactions-page-client"

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Performance</h1>
        <p className="text-sm text-muted-foreground">
          Compare normalized data extracted from your financial documents.
        </p>
      </div>
      <TransactionsPageClient />
    </div>
  )
}
