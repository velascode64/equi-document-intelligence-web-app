## UI Component Strategy

The application uses **shadcn/ui** as the base component system and selectively reuses/adapts UI patterns from:

`abderrahimghazali/shadcn-fintech`

Repository:
`https://github.com/abderrahimghazali/shadcn-fintech`

The goal is **not to migrate the application into the shadcn-fintech repository** and not to copy the entire template.

Instead, selected components and patterns should be copied into this codebase and adapted to the product requirements, data model, Supabase integration, and design system.

### Source structure

Reusable components adapted from `shadcn-fintech` should live under:

```text
src/
├── components/
│   ├── ui/                  # Base shadcn/ui primitives
│   ├── fintech/             # Components adapted from shadcn-fintech
│   └── shared/              # Product-specific reusable components
```

Do not import components directly from the cloned `shadcn-fintech` repository.

The cloned repository is only a **reference implementation and component source**.

---

## Components to Reuse

### 1. Application Shell

Reuse/adapt the general dashboard shell:

* Sidebar
* Top navigation/header
* Page container
* Breadcrumbs
* Responsive navigation behavior
* User/account menu
* Theme switcher
* Desktop/mobile layout behavior

Target location:

```text
src/components/shared/layout/
```

The application shell should be shared by all authenticated pages.

---

### 2. Authentication UI

Reuse the visual structure of:

* Sign in page
* Sign up page
* Authentication layout
* Social login buttons where applicable
* Form layout
* Input styling
* Password field styling
* Loading/error states

Do **not** reuse Clerk authentication logic.

Authentication must use **Supabase Auth**.

Expected implementation:

```text
src/modules/auth/
src/components/shared/auth/
```

The UI may be adapted from `shadcn-fintech`, but authentication calls must use the project's Supabase client.

---

### 3. Dashboard Summary Cards

Reuse/adapt financial dashboard cards for high-level metrics.

Use these patterns for:

* Total documents
* Documents processed
* Documents pending
* Processing failures
* Total extracted records
* Recently processed documents
* Any product-specific KPI

Component examples:

```text
MetricCard
SummaryCard
StatCard
TrendCard
```

Target location:

```text
src/components/fintech/cards/
```

Do not keep fake financial terminology from the original template.

Cards must represent the actual domain model.

---

### 4. Data Tables

Reuse the transactions table pattern as the base for application data tables.

Required behaviors:

* Search
* Filtering
* Sorting
* Pagination
* Row actions
* Expandable rows where useful
* Loading states
* Empty states
* Error states

Primary use cases:

```text
Documents table
Extracted records table
Processing history table
Connected sources table
```

Target location:

```text
src/components/fintech/data-table/
```

The component should remain generic enough to accept typed column definitions and data.

---

### 5. Filters and Search

Reuse/adapt filtering patterns from transaction and analytics pages.

Required controls:

* Search input
* Date range filter
* Status filter
* Document type filter
* Source filter
* Sort control
* Reset filters action

Target location:

```text
src/components/shared/filters/
```

Filters should modify application state or query parameters, not contain database logic directly.

---

### 6. Detail / Expanded Views

Reuse the expandable transaction-row/card patterns for inspecting a document or extracted record.

A detail view may display:

* Document metadata
* Source
* Processing status
* Extracted structured data
* Processing timestamp
* Original file information
* Parsing/extraction errors
* Raw/normalized values where useful

Use either:

```text
Sheet
Dialog
ExpandableRow
DetailPanel
```

depending on the interaction.

---

### 7. Charts and Analytics

Reuse/adapt chart patterns from the dashboard and analytics pages.

The source project uses **Recharts**.

Potential application charts:

* Documents processed over time
* Documents by type
* Processing success/error ratio
* Extracted records over time
* Source distribution
* Processing latency

Target location:

```text
src/components/fintech/charts/
```

Charts should only be added when they communicate useful product information.

Do not reproduce financial charts that have no equivalent product metric.

---

### 8. Status Indicators

Create reusable status components based on the existing badge/card visual language.

Required states:

```text
pending
processing
completed
failed
```

Components:

```text
StatusBadge
ProcessingIndicator
ConnectionStatus
```

Target location:

```text
src/components/shared/status/
```

Status colors and semantics must remain consistent throughout the application.

---

### 9. Activity / Recent Items

Reuse dashboard activity patterns for:

* Recently uploaded documents
* Recently processed documents
* Latest extraction jobs
* Recent failures
* Recent source synchronizations

Suggested component:

```text
RecentActivity
ActivityItem
```

This should be a compact dashboard component, not a replacement for the full documents table.

---

### 10. Empty States

Reuse/adapt the repository's empty-state patterns.

Required cases include:

* No documents yet
* No search results
* No connected Google Drive folder
* No extracted records
* No recent activity

Every empty state should provide a useful next action where possible.

Examples:

```text
Upload a document
Connect Google Drive
Clear filters
Return to documents
```

---

### 11. Loading States

Provide consistent loading states for:

* Initial page loading
* Tables
* Document processing
* Detail views
* Dashboard metrics
* Google Drive synchronization

Prefer:

```text
Skeleton
Spinner
Progress
```

Do not show blank areas while asynchronous data is loading.

---

### 12. Error States

Create reusable error UI for:

* Supabase query failures
* Google Drive connection failures
* File processing failures
* LLM extraction failures
* Unsupported document types

Suggested components:

```text
ErrorState
InlineError
RetryAction
```

Technical errors should not be exposed directly to end users unless useful for debugging.

---

### 13. Notifications / Feedback

Reuse/adapt notification patterns for application feedback.

Use for:

* Upload successful
* Document processing started
* Processing completed
* Processing failed
* Drive connection successful
* Drive synchronization failed

Use toast notifications for transient feedback.

Use persistent alerts when user action is required.

---

### 14. Settings Patterns

Reuse the settings-page structure where useful for:

* Account settings
* Google Drive connection
* Connected sources
* Appearance/theme
* Processing preferences

Do not reproduce unrelated banking, billing, card, or security settings from the original template.

---

## Base shadcn/ui Components

Prefer existing shadcn/ui primitives before creating custom components.

Expected primitives include:

```text
Button
Card
Input
Label
Textarea
Select
DropdownMenu
Dialog
Sheet
Tabs
Table
Badge
Tooltip
Popover
Command
Skeleton
Separator
Alert
Avatar
Checkbox
Switch
Progress
ScrollArea
Breadcrumb
Sidebar
```

If a required primitive does not yet exist in the project, install it through the standard shadcn CLI rather than manually recreating it.

---

## Components We Should Not Copy

The following `shadcn-fintech` components are outside the scope of this product unless a future requirement explicitly needs them:

```text
Crypto trading components
Candlestick charts
Portfolio components
Investment ticker
Credit/debit cards
Money transfer UI
Bank-account UI
Budget tracking
Spending heatmap
Savings goals
Trading forms
Market overview
```

Do not copy these simply because they exist in the source repository.

---

## Implementation Rule for the LLM

When implementing a UI feature:

1. Check whether an equivalent pattern already exists in `shadcn-fintech`.
2. Reuse/adapt that component when it meaningfully matches the requirement.
3. Copy the relevant code into this repository.
4. Remove demo/mock financial logic.
5. Replace mock data with typed props.
6. Integrate the component with the appropriate application module.
7. Keep database and business logic outside UI components.
8. Use existing shadcn/ui primitives where possible.
9. Preserve the application's established visual language.
10. Do not introduce a second design system or UI library without a clear requirement.

The priority is:

```text
Existing project component
        ↓
Adapted shadcn-fintech component
        ↓
Standard shadcn/ui primitive
        ↓
New custom component
```

Avoid creating new components when an existing reusable pattern already satisfies the requirement.
