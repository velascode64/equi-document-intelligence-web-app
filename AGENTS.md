# AGENTS.md

This file defines repository-level instructions for coding agents working on this project.

## Source of Truth

Before making changes, read the relevant documentation:

```text
docs/pdoduct-definitions/
├── project-definition.md
├── technical_architecture.md
└── design-system.md
```

Use those documents as the source of truth for:

* product behavior
* architecture
* data model
* processing flows
* project structure
* UI and design decisions

Do not duplicate or redefine those decisions inside the implementation.

If a requested change conflicts with the documentation, update the documentation intentionally instead of inventing a new pattern.

## Package Manager

Use **Bun** only.

```bash
bun install
bun add <package>
bun add -d <package>

bun dev
bun run build
bun run lint
```

Do not use npm, yarn, or pnpm.

Prefer existing `package.json` scripts.

## Development Rules

* Inspect the existing implementation before creating new code.
* Follow existing project conventions.
* Prefer the smallest change that satisfies the requirement.
* Reuse existing components, modules, utilities, and schemas.
* Do not introduce abstractions for hypothetical future requirements.
* Do not add dependencies when the existing stack can solve the problem.
* Keep business logic out of UI components when it belongs in an application module.
* Keep provider-specific implementation inside the appropriate integration.
* Validate external and LLM-generated data before persisting it.
* Keep TypeScript types explicit and avoid `any` unless required at an external boundary.

## Documentation

When a change modifies product behavior, architecture, data relationships, processing flows, or design conventions, update the corresponding document under:

```text
docs/pdoduct-definitions/
```

Do not let implementation and documentation silently diverge.

## Validation

Before considering a change complete, run the relevant project checks.

At minimum, when available:

```bash
bun run lint
bun run build
```

Run affected tests if the project contains them.

Fix errors introduced by the change before finishing.

## Scope

Keep the project intentionally simple.

Do not add infrastructure, frameworks, runtimes, services, or architectural patterns unless they are required by the current product definition or technical architecture.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
