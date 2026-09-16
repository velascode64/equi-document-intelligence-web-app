# Product Definition — Equi Document Intelligence

## Project Statement

###  Document Intelligence Web App
Integration: Google Drive (OAuth)
Build a web application that connects to a user's Google Drive via OAuth, monitors a designated folder for financial documents (PDFs, HTML emails, CSVs — think fund factsheets, account statements, performance reports from different managers), and uses LLMs to extract structured data. The system stores the results in a database and provides a UI to browse, search, and query across everything that's been ingested.
 
The app should handle the reality that every document looks different — different layouts, different terminology, different formats. The user shouldn't need to configure a parser for each one. The Google Drive connection should sync so new files dropped into the folder are picked up without manual re-upload.
 
Think: "I connect my Google Drive, point it at a folder with 20 messy PDFs from different fund managers, and I can immediately see a table of all extracted performance data, filter by fund or date, and ask 'Which fund had the best January return?' — and when a new factsheet lands in the folder, it's processed automatically."

---

## Product Goal

Build a simple web application that connects to a user's Google Drive, watches a selected folder for financial documents, extracts structured financial data from those files, and makes the results easy to browse, search, and filter.

The main user experience should feel like:

> Connect Drive → choose a folder → documents are processed automatically → extracted financial data appears in a clean dashboard.

The user should not need to configure custom parsers for each document format.

---

## Core User Flow

1. User signs in.
2. User connects Google Drive through OAuth.
3. User selects one Drive folder to monitor.
4. The app discovers supported files inside the folder.
5. Each document is processed automatically.
6. The system extracts normalized financial information using an LLM.
7. Extracted data is stored in PostgreSQL.
8. The dashboard shows the processed documents and extracted financial records.
9. The user can search and filter the extracted information.
10. New files added to the Drive folder are detected and processed automatically.

The system must not reprocess an existing document or call the LLM during a
sync unless it is a genuinely new source document. A notification is created
only when a new `documents` record is created; completing or failing the
extraction only changes that document's status.

---

## Supported Documents

Initial scope:

* PDF
* CSV
* HTML

Typical examples:

* Fund factsheets
* Performance reports
* Account statements
* Manager reports
* Financial emails exported as HTML

The system should assume documents may use different terminology, layouts, and structures.

---

## Core Product Areas

### Drive

Responsible for:

* Google OAuth connection
* Folder selection
* Discovering files
* Detecting new files without manual upload
* Triggering document processing

The target production integration uses Google Drive's Changes API and push
notifications. Client-side polling is a temporary demo mechanism, not the
production source of truth for detecting changes.

### Documents

Each ingested document should expose:

* File name
* File type
* Source
* Processing status
* Processing date
* Extraction result

Basic statuses:

`pending → processing → completed → failed`

### Extraction

The extraction pipeline transforms an unstructured document into normalized financial data.

Initial target information may include:

* Fund name
* Fund manager
* Reporting period
* Monthly return
* YTD return
* NAV
* Currency
* Benchmark

The extraction schema can evolve once we have representative sample documents.

The raw extraction result can also be retained to avoid losing information that is not yet represented in the normalized schema.

### Classification and Deduplication

The application maintains a canonical fund catalogue and a document-type
catalogue. Extracted performance rows link to a canonical fund where a match
is known; unmatched names are held for review rather than silently creating
near-duplicate funds.

Documents are deduplicated at two levels:

* Google Drive file identity prevents processing the same Drive file twice.
* A SHA-256 content fingerprint prevents processing equivalent content that
	arrives under a different Drive file ID or filename.

### Dashboard

The dashboard uses the shared application design system as its UI foundation.

Initial views:

* Overview
* Documents
* Performance

The primary experience is a normalized financial data table where information extracted from different documents can be compared.

Example:

| Fund        | Manager   | Period   | Return | Source        |
| ----------- | --------- | -------- | -----: | ------------- |
| Alpha Fund  | Manager A | Jan 2026 |   4.2% | factsheet.pdf |
| Growth Fund | Manager B | Jan 2026 |   3.7% | report.pdf    |

Users should be able to:

* Search by fund or manager
* Filter by fund
* Filter by reporting period/date
* Sort by performance
* Open the source document / extraction details

This should be enough to answer questions such as:

> Which fund had the best January return?

without requiring an AI agent or conversational interface.

---

## Non-Goals

For the initial version we are **not** building:

* AI agent
* Chat interface
* Complex RAG infrastructure
* Vector search
* Custom parser configuration per fund manager
* Advanced portfolio analytics
* Multiple Drive providers
* Workflow builders
* Complex permissions or enterprise roles
* A generalized document-processing platform

---

## Delivery Requirements

The repository must include:

* Working source code and database migrations.
* A README with setup, configuration, validation, and deployment guidance.
* A five-minute walkthrough video at `equi-findoc-ai.mp4`.
* Automated coverage for PDF, CSV, and HTML ingestion; Drive sync and
	deduplication; persistence; and the API-level happy and failure paths.
