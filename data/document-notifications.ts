export type DocumentNotificationStatus = "processing" | "processed"

export type DocumentNotification = {
  id: string
  documentName: string
  status: DocumentNotificationStatus
  timestamp: string
}

export const documentNotifications: DocumentNotification[] = [
  {
    id: "dn1",
    documentName: "Vanguard_Factsheet_Jan_2026.pdf",
    status: "processing",
    timestamp: "Sep 13, 2026 · 10:42 AM",
  },
  {
    id: "dn2",
    documentName: "Vanguard_Factsheet_Dec_2025.pdf",
    status: "processed",
    timestamp: "Sep 13, 2026 · 10:18 AM",
  },
  {
    id: "dn3",
    documentName: "Global_Equity_Report_Jan_2026.pdf",
    status: "processed",
    timestamp: "Sep 12, 2026 · 4:35 PM",
  },
]
