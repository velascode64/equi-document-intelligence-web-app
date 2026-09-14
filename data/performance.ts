export type DocumentStatus = "processing" | "processed" | "failed"

export type PerformanceRecord = {
  id: string
  documentId: string
  documentName: string
  documentType: "Fund Factsheet" | "Account Statement" | "Performance Report"
  status: DocumentStatus
  fund: string
  manager: string
  reportDate: string
  strategy: string
  aum: number
  navOrEndingBalance: number
  ytdReturn: number
  sinceInception: number
  currency: string
  benchmark: string
}

export const performanceRecords: PerformanceRecord[] = [
  { id: "p1", documentId: "d1", documentName: "Alpha_Fund_Factsheet_Jan_2026.pdf", documentType: "Fund Factsheet", status: "processed", fund: "Alpha Fund", manager: "Manager A", reportDate: "2026-01-31", strategy: "Global Equity", aum: 850_000_000, navOrEndingBalance: 125.4, ytdReturn: 0.076, sinceInception: 0.097, currency: "USD", benchmark: "MSCI ACWI" },
  { id: "p2", documentId: "d2", documentName: "Growth_Fund_Report_Jan_2026.pdf", documentType: "Performance Report", status: "processed", fund: "Growth Fund", manager: "Manager B", reportDate: "2026-01-31", strategy: "Growth Equity", aum: 620_000_000, navOrEndingBalance: 98.62, ytdReturn: 0.061, sinceInception: 0.084, currency: "USD", benchmark: "Russell 1000 Growth" },
  { id: "p3", documentId: "d3", documentName: "Income_Opportunities_Statement_Jan_2026.pdf", documentType: "Account Statement", status: "processed", fund: "Income Opportunities Fund", manager: "Manager C", reportDate: "2026-01-31", strategy: "Fixed Income", aum: 410_000_000, navOrEndingBalance: 104.18, ytdReturn: 0.028, sinceInception: 0.051, currency: "USD", benchmark: "Bloomberg US Aggregate" },
  { id: "p4", documentId: "d4", documentName: "Global_Real_Assets_Jan_2026.pdf", documentType: "Fund Factsheet", status: "processed", fund: "Global Real Assets Fund", manager: "Manager D", reportDate: "2026-01-31", strategy: "Real Assets", aum: 295_000_000, navOrEndingBalance: 87.95, ytdReturn: 0.043, sinceInception: 0.068, currency: "USD", benchmark: "S&P Global Infrastructure" },
  { id: "p5", documentId: "d5", documentName: "Alpha_Fund_Factsheet_Dec_2025.pdf", documentType: "Fund Factsheet", status: "processed", fund: "Alpha Fund", manager: "Manager A", reportDate: "2025-12-31", strategy: "Global Equity", aum: 832_000_000, navOrEndingBalance: 116.53, ytdReturn: 0.142, sinceInception: 0.089, currency: "USD", benchmark: "MSCI ACWI" },
  { id: "p6", documentId: "d6", documentName: "Emerging_Markets_Feb_2026.pdf", documentType: "Performance Report", status: "processing", fund: "Emerging Markets Fund", manager: "Manager E", reportDate: "2026-02-28", strategy: "Emerging Markets Equity", aum: 185_000_000, navOrEndingBalance: 72.31, ytdReturn: 0.019, sinceInception: 0.046, currency: "USD", benchmark: "MSCI Emerging Markets" },
  { id: "p7", documentId: "d7", documentName: "Balanced_Portfolio_Feb_2026.pdf", documentType: "Account Statement", status: "failed", fund: "Balanced Portfolio", manager: "Manager F", reportDate: "2026-02-28", strategy: "Multi-Asset", aum: 340_000_000, navOrEndingBalance: 110.07, ytdReturn: 0.032, sinceInception: 0.073, currency: "USD", benchmark: "60/40 Global Blend" },
]
