# engineering-insights — examples

Format demonstrations for [`SKILL.md`](SKILL.md). **These are illustrative, not
recorded findings** — they show the shape an entry takes, using made-up
situations from a typical web service. Do not copy them into a real
`INSIGHTS.md`.

## The bar: more noise vs insight

Beyond the pair in [`SKILL.md`](SKILL.md):

| ✗ Noise | ✓ Insight |
| --- | --- |
| "Promises can be tricky" | "`Promise.all()` over the ingest pipeline times out past ~30 items — use `Promise.allSettled()` in batches of 10" |
| "be careful with async" | "checkout state always goes through `cartStore.ts` — three components share the cart, and a local `useState` copy desyncs the header badge" |
| "e2e tests can be flaky" | "the browser flows assume an empty database — the second flow opens the *first* row of the orders list, so a dev DB with leftover rows fails it. Run them against the throwaway DB the e2e script starts" |
| "watch out for the ORM" | "Prisma Accelerate caps responses at 5MB — use `select`, not `include`, on the orders export query" |

Every ✓ entry names the thing, states what happens, and ends with what to do
instead. Every ✗ entry would be equally true in any repo — which is what makes
it worthless here.

## One worked entry per section

### Decisions

```markdown
### 2026-09-15 — Payment retries are keyed in the database, not the cache

**What:** every payment attempt stores its idempotency key on the order row,
and a retry checks the row before calling the provider.
**Why:** the cache evicts under memory pressure, and a retry that lands after
an eviction looks like a first attempt.
**Rejected:** a cache key with a 24h TTL — in the load test 3 of 1,000
retried payments were charged twice after the keys were evicted.
```

### What Works

```markdown
- **2026-09-15** — Declaring the classification fields **last** in a structured
  output schema is what makes them informative: with `category` before the
  evidence fields the model labelled all 12 candidates identically, and moving
  them after the evidence produced 5 distinct categories on the same input.
  Generation order is schema order. `src/llm/classify.ts`
```

### What Doesn't Work

```markdown
- **2026-09-15** — A green `npm test` does not mean the integration tests ran:
  files under `test/integration/` self-skip when no Docker daemon is
  reachable, so a machine without Docker reports success having exercised
  none of the DB paths. Check the skip count, not the exit code.
  `test/helpers/db.ts`
```

### Codebase Patterns

```markdown
- **2026-09-15** — `lib/format.ts` and `lib/formats.ts` differ by one
  character and do unrelated jobs — the first formats money and dates for
  display, the second lists the file formats the export endpoint accepts.
  Editing the wrong one silently changes nothing. `src/lib/formats.ts`
```

### Tool & Library Notes

```markdown
- **2026-09-15** — Drizzle's `text('col', { enum: [...] })` narrows the
  TypeScript type only and emits no DB constraint, so a status column is
  unconstrained free text in Postgres — a boot-time reaper matching
  `status='running'` is protected by convention alone. Use `check()` for a real
  constraint. `src/db/schema/jobs.ts`
```

### Recurring Errors & Fixes

```markdown
- **2026-09-15** — `EADDRINUSE :::5432` from the test setup means a local
  Postgres already holds the port: the test database container maps a fixed
  host port. Stop the local service, or set `TEST_DB_PORT` to a free one.
  `test/setup.ts`
```

### Open Questions

```markdown
- **2026-09-15** — Unclear whether the search index is rebuilt on an
  incremental import or only on a full one; a product added by an incremental
  import appeared to rank with stale scores, but this was seen once and not
  reproduced. `src/import/incremental.ts`
```

## Refining instead of duplicating

When a near-duplicate already exists, sharpen it in place rather than appending
a second version:

```markdown
- **2026-08-05** — `modules/billing/` is the only module that never grew past
  routes-only …
  - **2026-09-15** — Sharpening: it is the largest case but not the only one —
    four of eight modules query the DB straight from the transport layer.
    `grep -rln "db/schema" src/modules/*/routes.ts`
```

And when a warning later stops being true, mark it — never delete it:

```markdown
- **2026-08-05** — … original claim …
  **Fixed 2026-09-15 in `src/modules/billing/repository.ts`.**
```

## A new file

When the target `INSIGHTS.md` does not exist, create it with this skeleton
before writing the first entry. The seven headings are fixed and in this
order.

```markdown
# <package or repo name> — insights

Durable findings recorded by the `engineering-insights` skill: things that are
true about this code but not visible in it.

**Append-only** — correct a stale entry with a dated note beneath it rather
than editing it away, and mark a warning as fixed rather than deleting it.

Sections are fixed. Add to the one that fits; never invent a new heading.
Newest first within each section.

## Decisions

## What Works

## What Doesn't Work

## Codebase Patterns

## Tool & Library Notes

## Recurring Errors & Fixes

## Open Questions
```
