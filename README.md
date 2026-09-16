# Equi Document Intelligence

Equi connects a user's Google Drive folder, discovers financial PDFs, HTML
documents, and CSVs, extracts normalized performance data with Anthropic, and
shows it in a searchable dashboard. The goal is to compare heterogeneous fund
factsheets, account statements, and performance reports without creating a
custom parser for each manager.

## Project Documents

- Product scope: [docs/product-definitions/project-definition.md](docs/product-definitions/project-definition.md)
- Technical architecture: [docs/product-definitions/technical_architecture.md](docs/product-definitions/technical_architecture.md)
- Dashboard and interaction design: [docs/product-definitions/design-system.md](docs/product-definitions/design-system.md)
- Demo video:

  [![Equi Document Intelligence demo](https://img.youtube.com/vi/rHy39tqk-n4/maxresdefault.jpg)](https://www.youtube.com/watch?v=rHy39tqk-n4)

## Prerequisites

- Bun 1.3 or newer
- Node.js 22 or newer
- A Supabase project
- A Google Cloud OAuth client with Google Drive API enabled
- An Anthropic API key for real extraction; set `SMART_FINDOC_USE_MOCK_LLM=true`
	to run the UI flow without LLM calls

## Configuration

Create `.env` with env.example variables. 
Never commit values for secrets.

## Run Locally

```bash
bun install
bun dev
```

Open `http://localhost:3000`, sign in, connect Google Drive, choose a folder,
and start a sync.

## Database

Apply the migrations in `supabase/migrations/` to the target Supabase project.
The migration set creates profiles, Drive connections, documents,
notifications, and normalized financial-performance records with RLS policies.

## Validation

```bash
bun run lint
bun run test
bun run test:integration
bun run build
```

The integration suite requires `ANTHROPIC_API_KEY` and may incur model usage.

## Deployment

Deploy as a Next.js application with Node.js 22 or newer. Install dependencies
with Bun and run the production build:

```text
Install Command: bun install --frozen-lockfile
Build Command: bun run build
```

Set every variable listed in Configuration in the deployment environment. Add
the deployed `/auth/callback` URL to the Google OAuth client's allowed redirect
URIs.

## Roadmap / Pending Work

The core assessment flow is complete. The following improvements are pending:

* CSV and HTML support — Complete and validate ingestion and LLM extraction for CSV and HTML documents.
* Google Drive push notifications — Replace demo polling with the Drive Changes API and webhooks.
* Content-based deduplication — Add SHA-256 fingerprints to detect duplicated documents with different filenames or Drive IDs.
* Fund and document-type catalogues — Normalize extracted fund names and document types using canonical records.
* Expand automated tests — Add coverage for CSV/HTML ingestion, API routes, notifications, and edge cases.
* Supabase repository layer — Move database queries into dedicated repositories and keep route handlers thin.
* ESLint cleanup — Resolve remaining lint and type-safety issues.