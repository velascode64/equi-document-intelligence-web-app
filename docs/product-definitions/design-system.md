# Design System

## Shared dashboard shell

All authenticated screens use the same responsive shell:

- Sidebar and top navigation
- Page container and breadcrumbs
- User menu and theme switcher
- Desktop and mobile navigation behavior

Use the existing shadcn/ui components and established application patterns. Do
not introduce a new component library or duplicate the application shell.

---

## Performance overview (`/transactions`)

This is the first and highest-priority product screen. It is a normalized
financial-data dashboard, not a transaction ledger.

### Purpose

Compare performance data extracted from fund factsheets, account statements,
and performance reports from different investment managers. The user must be
able to answer questions such as “Which fund had the best return in January
2026?” directly from the screen, without an AI or chat interface.

### Layout

1. Global summary cards calculated from the currently filtered results:
   - **Funds:** number of unique extracted funds.
   - **Source Documents:** number of source documents represented in the results.
   - **Processed:** number of documents successfully processed.
   - **Pending / Failed:** number of documents still processing or requiring attention.
2. Filter controls above the table:
   - Search by fund name or manager.
   - Filter by fund.
   - Filter by reporting period or date.
   - Sort by return, including descending order for best performance first.
3. A normalized performance table. Each row is one extracted fund-performance
   observation for a reporting period.
4. Row detail and source action. Opening a row exposes extraction details and
   provides access to the original source document. Do not use transaction or
   receipt terminology.

### Table fields

| Field | Meaning |
| --- | --- |
| Fund | Normalized fund name |
| Manager | Asset manager or investment manager |
| Document Type | Factsheet, account statement, or performance report |
| Report Date | Date represented by the document or extracted data |
| Strategy | Investment strategy or fund category |
| AUM | Assets under management, normalized to a numeric monetary value |
| NAV / Ending Balance | Net asset value or ending account balance reported in the document |
| YTD Return | Year-to-date performance return, stored as a numeric percentage |
| Since Inception | Performance return since the fund's inception, stored as a numeric percentage |
| Status | `Processing`, `Processed`, or `Failed` |
| Source | Source document name and an action to open it |

Example:

| Fund | Manager | Document Type | Report Date | Strategy | AUM | NAV / Ending Balance | YTD Return | Since Inception | Status | Source |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| Alpha Fund | Manager A | Fund Factsheet | Jan 31, 2026 | Global Equity | $850M | $125.40 | 7.6% | 9.7% | Processed | factsheet.pdf |

Reuse the existing table, filters, cards, responsive shell, empty state, and
row-expansion pattern when they fit. Rename domain-specific labels, types,
sample data, actions, and icons. Do not add an AI or conversational experience.

---

## Authentication

- Sign in and sign up use Google through Supabase Auth.
- Reuse the existing authentication layout, form layout, input styling, and
  loading and error states.

---

## Notifications

Notifications communicate document-processing status only.

Show a notification when processing starts or completes. Each notification
includes the document name, processing status, and timestamp. Notifications are
informational; no user action is required.

Examples:

- `Vanguard_Factsheet_Jan_2026.pdf` is being processed.
- `Vanguard_Factsheet_Jan_2026.pdf` was processed successfully and its extracted data is available.
