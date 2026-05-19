# AGENTS.md — `@huiol/stream-ui`

## Quick start

```bash
pnpm install
pnpm dev          # dev server, serves from play/
pnpm test         # vitest (happy-dom), watch mode by default
pnpm build        # vite build + vue-tsc --emitDeclarationOnly (no separate typecheck script)
pnpm docs:dev     # vitepress dev in docs/
```

## Structure

| Path | Purpose |
|---|---|
| `src/core/stream-contains-core.ts` | All parsing + rendering logic |
| `src/StreamContains.ts` | Vue `defineComponent` wrapper around core |
| `src/core/default-tag.ts` | Fallback tag renderer for unregistered tags |
| `src/component/` | Built-in components (`Think`, `Text`) |
| `src/types/` | TypeScript type definitions |
| `cli/index.js` | CLI entry (init/add/create/list), plain JS |
| `play/` | Dev playground (vite root) |
| `tests/` | Vitest test files |

## Key quirks

- **TypeScript 6** — `tsconfig.json` uses `ignoreDeprecations: "6.0"` for moduleResolution "Bundler".
- **No lint/formatter** — no eslint, prettier, or biome config. Skip any lint step.
- **Test environment** — `happy-dom`, not jsdom.
- **`vite.config.ts` root** is `play/`; the lib build entry is `src/index.ts`. This means `vite` (dev server) serves the playground, not the lib itself.
- **`pnpm test`** runs in watch mode by default. Use `pnpm test run` for CI/one-shot.
- **CLI** (`bin/stream-ui.js`) is plain ESM JavaScript (not TypeScript), in `cli/`.
- **The package ships `src/core`** in `"files"` in package.json so CLI-generated source can import it.

## Testing

```bash
pnpm test                  # watch mode
pnpm test run              # single run
pnpm test run --coverage   # single run with coverage (100% branch threshold)
pnpm test -- tests/some.test.ts  # single file
```

Test files live in `tests/` matching `*.{test,spec}.ts`.

## Coverage

- **100% branch threshold** configured in `vitest.config.ts`.
- `pnpm test run --coverage` to verify (coverage disabled by default).
- CLI tests create temp dirs with `mkdtemp` + cleanup in `afterEach`.
- Core tests use happy-dom environment.
- Tests for `areAttrsEqual` are exercised through `areBlocksEqual` via `emitBlocks` comparison logic, using `props.modelValue` mutation between render calls.

| Step | Branch % |
|---|---|
| Initial | 67.24% |
| CLI + core expansion | 93.05% |
| `areAttrsEqual` edge cases + dead code removal | 100% |

## Build pipeline

```bash
pnpm build   # 1) vite build → dist/ 2) vue-tsc --emitDeclarationOnly → dist/types
```

No separate typecheck script exists — `vue-tsc` runs during build only.
