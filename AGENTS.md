# Agent memory

Project-root **AGENTS.md**: Cursor reads this file as project rules and applies it to the Agent. Plain markdown only (no YAML frontmatter). Keep focused and under ~500 lines; reference external docs (e.g. `docs/`) instead of inlining long content.

---

## Using installed plugins and skills

Use Cursor’s installed plugins and skills so the agent behaves consistently and uses the right tools at the right time.

### When to request project rules

- **TypeScript / unions and enums**: Before implementing or refactoring code that uses unions or enums, request the **TypeScript exhaustive-switch** rule and follow it (exhaustive switch handling, no fall-through).
- **Imports**: When adding or moving imports, request the **no-inline-imports** rule; keep imports at the top of the file, avoid inline imports.
- **Citing external sources**: When presenting web search or research results, request the **citation-standards** rule and format citations accordingly.

Request a rule by reading it (e.g. from the rule’s path or via the Rules panel) when the task matches the rule’s scope; then follow it.

### When to invoke skills

Invoke the **Skill** tool (do not only mention skills). Use the skill that matches the context:

| Context | Skill to use |
|--------|----------------|
| Before any creative work (features, components, behavior changes) | **brainstorming** – explore intent, requirements, and design first. |
| Before implementing a feature or bugfix | **test-driven-development** – write failing tests first, then minimal code to pass. |
| Bug, test failure, or unexpected behavior | **systematic-debugging** – reproduce, isolate, then fix. |
| Spec or requirements for a multi-step task | **writing-plans** – create a detailed implementation plan before coding. |
| Executing a written implementation plan | **executing-plans** or **subagent-driven-development** – run in batches with checkpoints. |
| Before claiming work complete or passing | **verification-before-completion** – run verification commands and show evidence. |
| Completing a task or major feature | **requesting-code-review** – verify work meets requirements before merge. |
| After receiving code review feedback | **receiving-code-review** – understand and validate feedback before implementing. |
| Implementation complete, tests pass | **finishing-a-development-branch** – decide merge, PR, or cleanup. |
| 2+ independent tasks | **dispatching-parallel-agents** – if no shared state or ordering dependency. |
| Feature work needing isolation | **using-git-worktrees** – create an isolated worktree. |

If there is any chance a skill applies (e.g. “this might be creative work”), invoke it; do not skip.

### When to use MCP

- **Shadcn/UI**: If the project has the **shadcn** MCP server enabled (e.g. in `.cursor/mcp.json`), use it to add or update components from the shadcn/ui design system instead of hand-writing from scratch when the task is to add or change UI components.
- **Other MCP servers**: Use any other configured MCP tools when the task clearly fits their purpose (e.g. database, APIs, design tools). Prefer MCP over ad-hoc scripts when the tool is available and maintained.

---

## Production-grade bar (non-negotiable)

Code must be **production-grade**: safe, fast, and correct under real-world conditions. **“No errors possible”** means: no uncaught exceptions or internal details exposed to clients; no untested success or failure paths; no missing validation, timeouts, or bounds that could cause bad state, leakage, or outages in production. The agent MUST treat the following as mandatory; skipping any item is a blocker.

### Security (every change)

- **Input validation**: Validate and sanitize all external input (body, query, headers, path params) before use. Reject invalid shape/size/type with 400; never trust client data.
- **Secrets**: No secrets in code, logs, or errors. Use env/secrets only; never log or expose `DATABASE_URL`, `IP_HASH_SALT`, API keys, or tokens.
- **Injection**: Use parameterized queries for DB; no string concatenation for SQL or shell. Escape/sanitize before rendering or storing user content.
- **Auth and boundaries**: Enforce auth where required; assume least privilege; do not expose internal errors or stack traces to clients (return generic 500 message, log details server-side).
- **Rate limits and quotas**: Respect rate limits (e.g. contact submissions); return 429 with `Retry-After` when exceeded; bound request size and compute to prevent DoS.

### Performance (every change)

- **Bounded work**: No unbounded loops or recursion; cap list sizes and pagination; avoid N+1 queries (batch or single query where possible).
- **I/O and timeouts**: Set timeouts on all outbound calls (DB, HTTP, KV); fail fast and return 503 or 504 rather than hanging.
- **Resource use**: Avoid loading large payloads into memory whole when streaming is possible; do not hold references that prevent GC.

### Edge cases (every change)

- **Null/undefined/empty**: Explicitly handle null, undefined, empty string, empty array; do not assume presence. Use optional chaining and nullish coalescing deliberately; document invariants.
- **Boundaries**: Check numeric/string length limits (max length, max value, min value); reject out-of-range inputs with 400.
- **Malformed input**: Handle invalid JSON, wrong content-type, and truncated bodies; return 400 with a clear message; never throw uncaught to the client.
- **Failure modes**: On DB/KV/network failure, log, return 503 or 504, and do not leave partial state inconsistent (prefer all-or-nothing or explicit compensation).

### Testing (every change)

- **Paths**: Every new branch (success, validation failure, auth failure, 429, 5xx) must have an automated test. No untested error paths.
- **Coverage**: Maintain 100% coverage on new/changed code; mutation score ≥85% on critical paths (no critical mutants surviving).
- **Hermetic**: Tests must not depend on order, shared mutable state, or real external services; use fakes/mocks and deterministic time/ids.
- **Regression**: Before claiming “fixed”, add or run a test that would have caught the bug; then fix. No “fix then hope”.

### Verification before “done”

- Run typecheck, lint, and full test suite; all must pass with no skipped tests.
- Run any project-specific gates (e.g. `npm run check:lines`, root pre-commit); fix any failure.
- Confirm no `any`, no dead code, no commented-out blocks left behind; security-sensitive paths reviewed.

---

## Learned User Preferences

- Read docs, ADRs, RFCs; define acceptance criteria, NFRs, SLOs; plan flags and rollback before changes.
- always build and fix any errors after any change
- Design data/API contracts, threat model, privacy; plan unit/integration/E2E/property/mutation tests; hermetic seeds/time.
- Files ≤ 80 lines; strict TypeScript; maps over enums; arrow functions only; interfaces for props/APIs.
- Avoid spread/ternary/if-else; prefer switch; absolute imports `@/`; Yarn; no monorepo.
- Share code via `file:../../shared`; pin versions; lockfiles committed; reproducible builds.
- UI: Tailwind + Shadcn + Radix; responsive; testIDs on interactives; follow Next.js/Expo docs.
- State/URL: Recoil (nexus) for state; `nuqs` for URL search params.
- Third-party calls only from backend; no direct UI calls.
- TDD: Red (failing test) → Green (minimal pass) → Refactor; hermetic tests; property/fuzz/mutation ≥85%.
- Functional/declarative; logic outside components/hooks where possible.
- React: prefer RSC; minimize `use client`/`useEffect`/state; wrap clients in Suspense.
- Optimize LCP/CLS/FID; lazy-load; WebP with sizes; avoid layout shift.
- APIs: versioned contracts; 6-month back-compat; explicit input/output types.
- Validate/sanitize inputs; least privilege; secrets isolated; threat model updated.
- Small/medium/large test strategy; 100% coverage; mutation ≥85%; no flakes.
- Type/lint/security pass; no `any`; dead code removed; a11y checks; structured logs/metrics/traces.
- Never default to web when testing; fix issues instead.
- Block on failed quality gates; approve only when all gates pass; regression test first, then fix.
- Folder structure: single source of truth (e.g. llm-prompts/folder.md); tsconfig and Jest follow it; clear dependency paths; verify before coding.
- Before any change: read docs/ADRs/RFCs → define acceptance criteria and NFRs/SLOs → design contracts and threat model → plan tests (hermetic) → verify folder structure and tsconfig/jest → create ticket checklist and branch; agree observability and dashboards.
- Scrum flow: Backlog → DOR → Planning → Daily → Build (TDD) → Review → Retro.
- Per PR: code + tests + fixtures; deterministic seed/time helpers; README/runbook/ADR updated; migration + rollback verified; presubmit (small+medium) blocks on failure.
- folder structure should be highly resuable; to be shared with multiple projects with least amount of inter dependencies possible
- in each folder there should be a index file exporting all functions whether working in python or js
- **Production-grade first**: Before writing any code, apply the Production-grade bar above: security (validation, secrets, injection, auth, rate limits), performance (bounded work, timeouts, no N+1), edge cases (null/empty/boundaries/malformed/failure modes), and tests (every path, hermetic, regression). No code is “done” until the bar is met and verification commands pass.
- Code should always be highly commented (explain why, not what); written as a senior engineer would: clear contracts, single responsibility, testable steps.
- Functions: arrow functions only; descriptive names (verb-based, whatNeedsToBeDone pattern); break logic into sequential steps (step1, step2, etc.); use try-catch for error boundaries; never empty catch blocks—always log/handle/throw; explicit return types; **validate inputs at the start**; **handle edge cases explicitly** (null, undefined, empty, bounds).
- Error handling: wrap operations in try-catch; log errors with structured context (no secrets); re-throw or handle appropriately; never swallow errors silently; use typed error classes/interfaces; do not expose internal errors or stack traces to clients.
- Step-by-step execution: decompose complex operations into named step functions; execute sequentially; each step testable in isolation; single responsibility.
- Code structure: functions ≤ 80 lines; extract steps to separate functions; interfaces for function signatures; strict TypeScript with no `any`; no dead code or commented-out blocks.
- Security/performance/edge cases (mandatory): validate and sanitize all inputs before use; check null/undefined/empty and boundaries; use parameterized queries and timeouts; consider rate limits and resource bounds; document invariants where non-obvious.

## Mandatory Superpowers Workflows (Automatic Execution)

These workflows MUST be executed automatically without manual invocation. They exist to enforce the Production-grade bar (security, performance, edge cases, testing) and to avoid shipping code that could fail in production. **Use the Skill tool** for the contexts listed in “Using installed plugins and skills” above; **request project/plugin rules** (e.g. TypeScript exhaustive-switch, no-inline-imports) when they apply. The agent must invoke the appropriate skill tool when these contexts arise:

- **Before ANY creative work** (features, components, new functionality, behavior changes): ALWAYS invoke `brainstorming` skill first to explore user intent, requirements, and design before implementation.

- **Before implementing ANY feature or bugfix**: ALWAYS invoke `test-driven-development` skill to write failing tests first, then implement minimal code to pass.

- **When encountering ANY bug, test failure, or unexpected behavior**: ALWAYS invoke `systematic-debugging` skill before proposing fixes.

- **When you have a spec or requirements for multi-step tasks**: ALWAYS invoke `writing-plans` skill to create a detailed implementation plan before touching code.

- **When executing a written implementation plan**: ALWAYS invoke `executing-plans` skill to run in batches with review checkpoints, or `subagent-driven-development` if tasks are independent.

- **Before claiming work is complete, fixed, or passing**: ALWAYS invoke `verification-before-completion` skill to run verification commands and confirm output with evidence.

- **When completing tasks or major features**: ALWAYS invoke `requesting-code-review` skill before merging to verify work meets requirements.

- **When receiving code review feedback**: ALWAYS invoke `receiving-code-review` skill before implementing suggestions, especially if feedback seems unclear or technically questionable.

- **When implementation is complete and tests pass**: ALWAYS invoke `finishing-a-development-branch` skill to decide how to integrate the work (merge, PR, or cleanup).

- **When facing 2+ independent tasks**: ALWAYS invoke `dispatching-parallel-agents` skill if tasks can be worked on without shared state or sequential dependencies.

- **When starting feature work needing isolation**: ALWAYS invoke `using-git-worktrees` skill to create isolated git worktrees.

- **After major project steps are completed**: ALWAYS use `code-reviewer` subagent to review implementation against the original plan and coding standards.

These workflows are NON-NEGOTIABLE and must be followed automatically. Do not wait for user to invoke `/brainstorm` or other commands—execute the appropriate skill tool immediately when the context matches.

## Learned Workspace Facts
