# Technical Architecture — Equi Document Intelligence



`smart-findoc-analyzer` owns the initial Google Drive sync flow, document parsing, LLM extraction, validation, and persistence orchestration. Provider implementations live under `src/provider/` and are mocked in tests. File cleaning utilities are reusable and are not tied to a feature.

## 1. Goal

Build a simple, modular document intelligence application that:

* Connects to Google Drive through OAuth.
* Monitors one selected folder.
* Ingests PDF, HTML, and CSV files.
* Uses an LLM to understand document structure and extract normalized financial data.
* Stores document metadata and extracted records in Supabase/PostgreSQL.
* Exposes the data through a Next.js dashboard with search, filters, and sorting.

The system should remain focused on the assessment requirements and avoid unnecessary infrastructure.

The application is API-first: browser components call Next.js route handlers;
route handlers authenticate and validate HTTP input; feature services own use
cases; repository wrappers own Supabase queries. Database clients never cross
the browser boundary.

---

## 2. Architecture

### 2.1 System Architecture

```mermaid
flowchart TD
    A[User] --> B[Next.js Application]

    B --> C[Application Modules]

    C --> D[Supabase / PostgreSQL]
    C --> E[Google Drive Integration]
    C --> F[Anthropic / LLM Integration]

    E --> G[Google Drive API]
    F --> H[LLM]
```

### 2.2 Components

#### Next.js

Main application layer.

Responsible for:

* UI
* Routes
* Authentication flow
* Server actions / API routes
* Calling application modules

Pages and components should not contain business logic that belongs inside modules.

---

#### Supabase

Used for:

* PostgreSQL database
* Authentication if needed
* Server-side database access

Route handlers must not contain table queries. They authenticate the request
and invoke feature services. Repository wrappers create a server-only client
and encapsulate `.from(...)` calls. The service-role key is server-only and is
read from `SUPABASE_SERVICE_ROLE_KEY`; it must never use a `NEXT_PUBLIC_` name.
Use the authenticated session client and RLS for user-owned operations where
possible; reserve the service-role client for justified internal operations.

Google Drive remains the source of truth for original documents.

---

#### Google Drive

External document source.

Responsible for:

* OAuth authorization
* Folder selection
* Listing files
* Reading file metadata
* Downloading file content
* Detecting new or updated files

Google-specific implementation is injected through provider adapters when this integration is implemented.

---

#### Anthropic / LLM

Responsible for document understanding.

The LLM receives document content and must:

* Identify the document structure
* Understand terminology
* Understand tables and labels
* Identify financial entities and values
* Return structured output matching the extraction schema

The current extraction path uses Anthropic's document/tool flow in `financial-performance.parser.ts`. `src/provider/llm.provider.ts` remains available for simpler JSON extraction and tests.

---
### 2.3 Project Structure

This repository is a monorepo. The existing `src/` tree is the source of truth; no separate backend application is introduced.

```text
src/
├── app/                         # Next.js routes and pages
├── components/                  # Shared UI components
├── features/
│   └── smart-findoc-analyzer/   # Document extraction feature
│       ├── index.ts             # Public API
│       ├── schemas/             # Zod schemas and domain types
│       │   ├── document.schema.ts
│       │   └── performance.schema.ts
│       ├── services/            # Flow orchestration
│       │   └── analyzer.service.ts
│       ├── actions/             # Google Drive and LLM extraction actions
│       │   ├── google-drive.action.ts
│       │   └── financial-performance.parser.ts
│       └── __tests__/           # Feature-level flow tests
├── provider/                    # Provider-agnostic external adapters
│   ├── google.provider.ts        # Google OAuth and Drive client
│   └── llm.provider.ts           # LLM provider helpers and mocks
├── utils/                       # Reusable file/content utilities
│   └── document-text.ts
└── lib/
    └── supabase/                # Database clients and test doubles
```
## 3. Authentication & Google OAuth

Authentication is handled with **Supabase Auth**.

Google is used as the authentication provider and as the authorization mechanism for accessing the user's Google Drive.

### Authentication Flow

```mermaid
flowchart TD
    A[User] --> B[Sign in with Google]
    B --> C[Supabase Auth]
    C --> D[Google OAuth]
    D --> E[User grants permissions]
    E --> F[Supabase Session]
    F --> G[Application]
```

### Supabase

Use the Supabase CLI for local development and database/auth configuration.

Typical workflow:

```bash
supabase start
supabase status
supabase db reset
```

Supabase is responsible for:

* User authentication
* Session management
* User identity
* PostgreSQL persistence

Authentication-specific application code should use the existing Supabase clients under:

```text
src/lib/supabase/
├── backend-client.ts
└── mock-repository.ts
```

### Google OAuth

Google OAuth must be configured in Google Cloud Console.

Required setup:

* Enable Google Drive API
* Configure OAuth consent screen
* Create OAuth Web Client
* Configure local and production redirect URLs
* Add the application as a test user while the OAuth app is in testing mode

Initial Google scopes:

```text
openid
email
profile
https://www.googleapis.com/auth/drive.readonly
```

`drive.readonly` is required so the application can read existing files from the folder selected by the user.

### Google Credentials

Required environment variables:

```text
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

Supabase Google provider configuration must use the same Google OAuth credentials.

### Drive Authorization

After authentication, the application must have enough Google authorization to access Drive.

The application should be able to:

```text
authenticate user
      ↓
obtain Google OAuth authorization
      ↓
access Google Drive API
      ↓
select folder
      ↓
read folder contents
```

Google Drive access remains isolated behind `src/provider/google.provider.ts` and `actions/google-drive.action.ts`; the analyzer service consumes those actions and does not call the Google SDK directly.

Do not place Google OAuth or Drive-specific logic directly inside UI components.


## 4. Data Model

### 4.1 Entity Relationships

```mermaid
erDiagram
    USER ||--o| DRIVE_CONNECTION : connects
    USER ||--o{ DOCUMENT : owns
    FUND ||--o{ FINANCIAL_PERFORMANCE : classifies
    DOCUMENT_TYPE ||--o{ DOCUMENT : classifies

    DRIVE_CONNECTION ||--o{ DOCUMENT : syncs

    DOCUMENT ||--o{ FINANCIAL_PERFORMANCE : produces
```

### 4.2 Entities

### User

Represents the application user.

Key data:

* `id`
* `email`
* profile information
* `created_at`
* `updated_at`

Relationships:

* Has one active Drive connection in the initial version
* Owns documents

---

### DriveConnection

Represents the user's Google Drive integration.

Key data:

* `id`
* `user_id`
* Google account identifier
* selected `folder_id`
* selected `folder_name`
* OAuth token information
* `created_at`
* `updated_at`

Relationships:

* Belongs to a user
* Provides documents from the selected folder

---

### Document

Represents one file discovered in the selected Google Drive folder.

Key data:

* `id`
* `user_id`
* `drive_connection_id`
* `drive_file_id`
* `name`
* `mime_type`
* `modified_time`
* `status`
* `raw_extraction`
* `extraction_error`
* `processed_at`
* `created_at`
* `updated_at`

Processing status:

```text
pending
processing
completed
failed
```

Relationships:

* Belongs to a user
* Comes from a Drive connection
* Produces performance records

`drive_file_id` uniquely identifies the source file from Google Drive.

`content_sha256` is calculated from the downloaded bytes and is used with the
owner ID to identify equivalent files uploaded with different names or Drive
IDs. It must have a unique index on `(user_id, content_sha256)`.

---

### Fund

Canonical representation of an investment fund or account.

Key data:

* `id`
* `canonical_name`
* `manager`
* `created_at`
* `updated_at`

`canonical_name` is unique per manager when a manager is available. Raw LLM
names remain in the extraction for traceability; matching and normalization are
performed by a dedicated classification service.

---

### DocumentType

Lookup catalogue for document classifications, initially `fund_factsheet`,
`account_statement`, and `performance_report`. Documents and extracted rows
reference this catalogue instead of relying on repeated free-text labels.

---

### FinancialPerformance

Represents normalized financial information extracted from a document.

Key data:

* `id`
* `document_id`
* `fund_id`
* `user_id`
* `drive_file_id`
* `fund`
* `manager`
* `document_type`
* `reporting_date`
* `strategy`
* `aum`
* `nav`
* `ending_balance`
* `ytd_return`
* `since_inception`
* `created_at`

Relationships:

* Belongs to a document

Every normalized record must keep a reference to its source document.

---

## 5. Document Processing

### 5.1 Processing Flow

```mermaid
flowchart TD
    A[Drive change] --> B[List changed Drive files]
    B --> C{New Drive ID?}
    C -->|No| K[Skip]
    C -->|Yes| D[Download supported file]
    D --> E{Content fingerprint exists?}
    E -->|Yes| K
    E -->|No| F[Create Document Row and notification]
    F --> G[Anthropic Tool Extraction]
    G --> H[Zod Validation]
    H --> I[Classify fund and document type]
    I --> J[Persist performance rows]
    J --> L[Update Document Status]
```

---

### 5.2 Drive Sync

The current implementation lists supported files in the selected folder through
`syncGoogleDriveFolder`. It skips a file whose `(user_id, drive_file_id)` is
already present in `documents`, before downloading the file or invoking the
LLM. It creates one notification only for the newly-created document.

```mermaid
flowchart TD
    A[Selected Drive Folder] --> B[listGoogleDriveFolderDocuments]
    B --> C[downloadGoogleDriveFile]
    C --> D[processDocument]
```

Implemented rules:

* PDF, HTML, and CSV files are accepted.
* Unsupported mime types are ignored.
* An existing Drive file is skipped: no download, LLM call, or notification.
* A new document creates one `document_processing_started` notification.
* Completing or failing only updates the document status.

Planned production synchronization:

* Subscribe to Google Drive Changes API push notifications at a server-side
    webhook endpoint.
* Persist the Drive page token/cursor per connection and request only changes
    since the stored cursor.
* Verify and renew watch channels before their expiration.
* Calculate and persist `content_sha256` before extraction to deduplicate files
    with different names and IDs but identical content.

---

### 5.3 Document Parser

`smart-findoc-analyzer/actions/financial-performance.parser.ts` prepares the source document for the LLM.

It does not interpret financial meaning.

```mermaid
flowchart TD
    A[PDF / HTML / CSV] --> B[financial-performance.parser.ts]
    B --> C[DocumentContent]
```

Common internal representation:

```ts
type DocumentContent = {
  filename: string
  mimeType: string
  content: string | Buffer
}
```

The parser handles file preparation only.

Do not create manager-specific or document-specific parsers such as:

```text
BlackRockParser
VanguardParser
FundFactsheetParser
AccountStatementParser
```

The LLM is responsible for understanding those differences.

---

### 5.4 LLM Extraction

The document content is sent to Anthropic together with a tool schema that returns normalized performance rows.

```mermaid
flowchart TD
    A[DocumentContent] --> B[Anthropic Document Tool]
    B --> C[LLM]
    C --> D[Structured Extraction]
```

The LLM may identify:

* Document type
* Fund name
* Fund manager
* Report date
* Strategy
* AUM
* YTD return
* NAV
* Ending balance
* Since inception return

Example:

```ts
{
  performance: [
    {
      fund: "Alpha Growth Fund",
      manager: "Alpha Capital",
      documentType: "fund_factsheet",
      reportingDate: "2026-01-31",
      strategy: "Global Equity",
      aum: 850000000,
      nav: 125.30,
      endingBalance: null,
      ytdReturn: 0.076,
      sinceInception: 0.097
    }
  ]
}
```

The LLM handles differences in:

* Layout
* Terminology
* Tables
* Document structure
* Source format

---

### 5.5 Persistence

After validation, the extraction is normalized and persisted.

```mermaid
flowchart TD
    A[Validated Extraction] --> B[Save raw_extraction]
    B --> C[Create Financial Performance Rows]
    C --> D[Mark Document Completed]
```

If processing fails:

```mermaid
flowchart TD
    A[Processing Error] --> B[Mark Document Failed]
    B --> C[Save extraction_error]
```

All Supabase operations are isolated in server-side repository wrappers. The
feature service coordinates repositories and provider actions but does not
receive a client from a browser component.

---

## 6. Validation

All LLM output must be validated before being written into normalized database tables.

Use Zod.

```mermaid
flowchart TD
    A[LLM Response] --> B[Zod Schema]
    B --> C{Valid?}

    C -->|Yes| D[Normalize]
    D --> E[Persist]

    C -->|No| F[Mark Document Failed]
```

Validation should cover:

* Required fields
* Dates
* Numeric values
* Percentages
* Currency
* Optional fields
* Extraction structure

Schemas live inside the related module.

Current schema files:

```text
documents.schema.ts
performance.schema.ts
```

---

## 8. Testing

Use **Vitest** for unit testing.

The initial testing scope focuses on the main Drive-to-analysis flow inside:

```text
src/features/smart-findoc-analyzer/
```

### What to Test

Automated tests must cover:

* `syncGoogleDriveFolder`
* Google Drive listing/download mocks
* LLM extraction mock
* Supabase persistence mock
* Error handling
* A repeated Drive sync skips existing files and makes no LLM call
* Content-fingerprint deduplication for files with different names
* PDF, CSV, and HTML parsing and extraction contracts
* API route authentication, validation, success, and error responses
* At least one integration test against the configured Supabase schema

### Mocking

External dependencies must be mocked.

Examples:

* Google Drive API
* Anthropic / LLM calls
* Supabase client calls
* Network requests

Unit tests should not call real external services.

Example:

```text
syncGoogleDriveFolder
        │
        ├── Google Drive API          → mock
        ├── LLM extraction            → mock
        └── Supabase client           → mock
```

Tests should validate module behavior independently from infrastructure.

### Test Location

Keep tests close to the code they cover.

```text
src/features/smart-findoc-analyzer/__tests__/
└── sync-google-drive-folder.test.ts
```

### Test Runner

Use:

```bash
bun run test
```

Vitest is the default test runner for module-level unit tests.

Run the real-LLM integration suite explicitly only when its credentials are
available:

```bash
bun run test:integration
```


## 9. Non-Goals

The initial version does not include:

* AI agents
* Chat interface
* RAG
* Vector database
* Manager-specific parsers
* Microservices
* Complex queue infrastructure
* Multiple storage providers
* Advanced portfolio analytics
* Enterprise permissions
