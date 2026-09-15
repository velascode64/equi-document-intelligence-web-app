PDF fixtures for the Anthropic integration test.

Put files here:

- `*.pdf`: financial docs that should extract at least one performance row.

Run manually:

```bash
bun run test:integration
```

Required env:

```env
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=...
```
