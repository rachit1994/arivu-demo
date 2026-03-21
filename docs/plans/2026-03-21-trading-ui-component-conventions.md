# Trading UI component conventions

## Mini-package layout

Each UI component lives in its own folder:

**Note (case-insensitive filesystems):** `BottomTabs` and `bottomTabs` collide on macOS default volumes. The tab shell and its panel mini-packages live under `src/components/trading/bottomTabs/`; the barrel exports `BottomTabs` from `./bottomTabs`.

- `ComponentName/index.tsx` — public component (default export or named export matching the folder).
- `ComponentName/test/*.test.ts(x)` — Vitest tests only under `test/` (keep `*.test.tsx` suffix for Vitest globs).
- `ComponentName/hooks/use*.ts` — UI-only hooks that compose shared data hooks or local state. No Kalshi HTTP in leaf hooks unless it is the single consumer; prefer `@/lib/trading/hooks`.

## Import boundaries

- **Shared Kalshi / trading data**: import from `@/lib/trading/hooks` (barrel) or `@/lib/trading/hooks/kalshi/<module>` for tests/mocks that need a stable path.
- **`src/lib/trading/hooks` (kalshi subtree)** must not import from `src/components/**` (no UI cycles).
- **Cross-feature UI**: prefer shared primitives under the same feature tree or props; avoid deep imports between sibling feature folders.

## Render strategy

- Keep layout shells mostly presentational; subscribe to atoms and run effects in the **deepest** component that owns the behavior.
- Add `React.memo` only when a child is proven expensive; prefer colocating state and data hooks in leaves.
