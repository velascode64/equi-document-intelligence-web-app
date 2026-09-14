export type PerformanceRecord = {
  id: string
  documentId: string
  fundId: string
  reportingDate: string
  monthlyReturn?: number
  ytdReturn?: number
  sinceInception?: number
  nav?: number
  benchmark?: string
  currency: string
}

export type ExtractedFinancialData = {
  documentType: "fund_factsheet" | "account_statement" | "performance_report"
  fund: {
    name: string
    manager: string
    currency: string
  }
  strategy?: string
  aum?: number
  performance: Array<{
    reportingDate: string
    monthlyReturn?: number
    ytdReturn?: number
    sinceInception?: number
    nav?: number
    benchmark?: string
  }>
}
