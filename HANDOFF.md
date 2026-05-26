# HANDOFF — Beat The Clock Agent Hack, Wayfair HQ, 2026-05-26

> **You are picking up mid-sprint.** Read this doc in full, then `AGENTS.md`, then `lib/schemas.ts`. Time-critical — submission is 7:45pm. Hack started 5:45pm.

## What we are building

A two-pronged demonstration of the agentic-commerce thesis built in 75 minutes for Track 1 (Consumer Shopping Experience).

**Thesis:** Agentic commerce works when both sides have rich context — the BRAND side (product catalog with enriched, conversational attributes) AND the USER side (style preferences, budget, lived context). Most teams will build only the consumer side. We're building both.

**Prong A — Catalog enrichment (this repo).** A webapp where brands paste product URLs or upload a catalog (CSV/JSON). The system scrapes / parses raw product data, then sends each product through an LLM enrichment pipeline that generates rich conversational summaries, style tags, use cases, Q&A, substitutes, complementary items, and target segments. Enriched catalog is exposed via `/api/search`.

**Prong B — Consumer extension (Cooper's separate repo).** Browser extension that overlays on wayfair.com, takes user context three ways (memory paste, interview, optional room image), POSTs to our `/api/search` endpoint, displays ranked recommendations with reasoning.

**The merge happens at the contract layer.** Cooper builds against `SearchQuery` (POST input) → `SearchResult` (response) in `lib/schemas.ts`. He never needs to know how enrichment works.

## Why this wins

- Differentiated from every other team (they will build only the consumer side)
- Personal credibility: Cameron has previously built a similar enrichment pattern at Remark (codename Prism / trawl). This is that pattern, ported to a new context in 90 minutes.
- The two-pronged demo IS the creativity + showmanship score; Tier 1 covers completeness + usefulness

## Submission requirements (HARD)

- **60-second Loom video** is the ONLY thing judged for non-top-15 teams
- Submission form: https://hack.subconscious.dev (use the link they provide)
- Top 10-15 teams give a live 90-second demo after submission
- Grand prize: $3,000 in credits ($1k Subconscious + $2k Baseten)
- Judged on: Completeness, Usefulness, Creativity, Showmanship

## Demo storyboard (60s Loom)

| Time | Beat |
|---|---|
| 0:00-0:10 | Hook: "Every other team here built the consumer side. We built both because agentic commerce only works when the brand AND the user have rich context." |
| 0:10-0:25 | Prong A: split screen, raw Wayfair product fields vs enriched fields. "30 seconds per product, fully automated." |
| 0:25-0:50 | Prong B: live consumer flow in Cooper's extension on wayfair.com. Memory paste OR interview → 3 ranked recommendations with "why this matches" reasoning. |
| 0:50-1:00 | Thesis close: "This enrichment runs on raw catalog plus LLM general knowledge. With real shopper-conversation data underneath, the enrichment gets dramatically richer. That's agentic commerce." |

Cameron is the talking head. Cooper operates the demo.

## Architecture

```
[Brand] ──┬─ paste URLs ──┐
         └─ upload CSV/JSON ┴─→ [Admin UI in this repo]
                                  │
                                  ▼
                            [scrape (browser-use / Cloudflare MCP) → enrichment (Subconscious)]
                                  │
                                  ▼
                            [data/enriched.json  (in-memory + disk cache)]
                                  │
                                  ▼
                            [POST /api/search] ◄────── [Cooper's extension on wayfair.com]
                                  │                          │
                                  └─→ SearchResult ──────────┘
```

Single Next.js process. No DB. JSON file cache. We are 75 minutes deep.

## Schema (already committed at `lib/schemas.ts`)

Zod schemas, types exported. Read `lib/schemas.ts` before writing any handler code. Key types:

- `RawProductSchema` — what brands upload or scraping extracts
- `EnrichmentSchema` — what the LLM produces (summary, styleTags, useCases, qa, substitutes, complementary, targetSegments)
- `EnrichedProductSchema` — RawProduct + Enrichment + metadata
- `SearchQuerySchema` / `SearchResultSchema` — the contract Coop's extension calls

This schema is LOCKED. Coop is building his extension against it. Do not change shape without confirming with Cameron.

## Tech rules (HARD, from Coop)

- **pnpm** as drop-in replacement for npm
- **TypeScript exclusively.** Absolutely no `any`. If data is unknown, use zod to assert the shape.
- **ky** instead of fetch/axios. Use ky's schema validation hooks where applicable.
- **Prefer npm packages native to the problem** (Subconscious's own SDK over rolling fetch calls, etc.). The Vercel AI SDK + the existing `lib/subconscious.ts` provider is the right layer for LLM calls; don't bypass it.
- **oxlint / oxfmt** with recommended configs. All code must pass lint before commit.
- **Next.js 16 has breaking changes from training data.** Read `node_modules/next/dist/docs/` for the canonical APIs. Heed deprecation notices. The existing starter uses Next 16 + AI SDK 6 + React 19 + Zod 4. Bleeding edge.

## Subconscious gotchas

- Chat completions only (`/v1/chat/completions`). **Does NOT support `/v1/responses`** (per comment in `lib/subconscious.ts`).
- No server-side `tools` field. Function-calling is wired client-side via the AI SDK's `ToolLoopAgent`.
- For structured output (what we need for enrichment): first try `generateObject({ model: subconsciousModel, schema: EnrichmentSchema, prompt })`. If that fails because `generateObject` requires `/v1/responses`, fall back to `generateText` + JSON-mode prompt + `EnrichmentSchema.parse(JSON.parse(text))`.
- Thinking is OFF by default in `lib/subconscious.ts` (faster, no reasoning preamble). Leave it off for enrichment.
- Model: `subconscious/tim-qwen3.6-27b`.

## Voice rules (HARD)

- No em dashes. Use commas, colons, parens, sentence breaks.
- No LLM constructions ("This isn't X, it's Y," "I'd be happy to," "Great question").
- Direct, concrete, specific. Names, numbers, real examples.
- Applies to commits, comments, UI copy, demo narration.

## Current state (at handoff)

**Done:**
- Repo forked: `cameronburnss/hack-webapp-starter`
- `lib/schemas.ts` committed (this is the locked contract with Coop)
- HANDOFF.md (this doc)

**In progress (parallel):**
- Cameron: collecting Wayfair product URLs for the demo (scenario: Cooper furnishing his college house / apartment, ~15 URLs across sofas, dining chairs, lamps, beds, accent tables)
- Cameron: investigating Cloudflare MCP for URL → scrape → PDP data path (sponsor tool, cleanest scrape solution if it works)
- Other Claude instance: testing Subconscious structured output (does `generateObject` with `EnrichmentSchema` work, or do we fall back to JSON-mode + manual parse?)
- Cooper: building consumer-facing extension in his own repo, against the `SearchQuery` / `SearchResult` schemas

**Not yet built (in priority order for THIS repo):**
1. **Enrichment pipeline** (`lib/enrichment.ts`): `enrichProduct(raw: RawProduct): Promise<EnrichedProduct>`. Calls Subconscious with the structured-output prompt, validates with `EnrichmentSchema`, returns the merged object. Port the prompt structure from Cameron's trawl repo (`generate_fields.py` — Cameron confirmed it's not Remark IP except the KH data layer). Adapt for furniture.
2. **Scraping integration**: depends on what Cameron lands on for Cloudflare MCP. Fallbacks in order: (a) Cloudflare MCP if it works in <10 min, (b) browser-use CLI driven from a Node script, (c) manual paste of product data into a JSON file. The contract: produce `RawProduct[]` from URLs.
3. **Admin upload UI** (`app/page.tsx` — replace the starter's landing): two input modes — paste URLs (textarea, one per line) OR upload CSV/JSON. Trigger enrichment loop with progress animation: per-product card transitions from "Enriching: Stanton Mid-Century Sofa..." (spinner) → "✓ Enriched" (green check + style tags revealed). Aggregate counter. Done state with "view catalog" link.
4. **`/api/search` endpoint** (`app/api/search/route.ts`): POST, accepts `SearchQuery`, returns `SearchResult`. Internally: combines user context into a search query, ranks against enriched catalog. Simplest implementation: pass user context + all enriched products to LLM, ask for top N with `whyThisMatches` reasoning. CORS headers so Coop's extension can hit it.
5. **Catalog storage** (`lib/catalog-store.ts`): in-memory `Map<string, EnrichedProduct>` with filesystem persistence at `data/enriched.json`. No DB.

## Open decisions (deferred until needed)

- **Subconscious `generateObject` vs JSON-mode fallback** — being tested in parallel; default to whichever works first
- **Scrape integration** — Cloudflare MCP if available, browser-use CLI otherwise, manual paste as last resort
- **Whether to pre-warm the enrichment cache before recording the Loom** — almost certainly yes (faster demo, no API jitter during recording)

## Build sequence remaining

| Time | Action |
|---|---|
| 6:25-6:30 | Confirm Subconscious structured-output path (other instance) |
| 6:30-6:45 | Land scrape integration (Cloudflare MCP if available, browser-use otherwise) + collect 15 URLs |
| 6:45-7:10 | Enrichment pipeline + admin UI + animation |
| 7:10-7:20 | `/api/search` endpoint + catalog store |
| 7:20-7:30 | Pre-warm enrichment cache; end-to-end test with Cooper's extension |
| 7:30-7:45 | Loom record + submit |

## Out of scope (DO NOT BUILD)

- User accounts / auth
- Database (use JSON file)
- Cart / checkout
- Tests (this is a hack)
- Refactors
- New deps beyond what Coop's tech rules allow
- Anything that doesn't appear in the 60-second Loom

## Anything else

- Subconscious skill is pre-installed at `.agents/skills/subconscious-dev/` — auto-loaded when this repo opens in Claude Code
- `.env.local` needs `SUBCONSCIOUS_API_KEY` (Cameron has the key, will set when he opens his workspace)
- The existing chat UI (`components/chat-app.tsx`) and `/api/chat` route can be left in place as a fallback / second surface, but the admin upload UI at `app/page.tsx` is the primary entry point for Prong A

Salud. Build fast. Ship the demo.
