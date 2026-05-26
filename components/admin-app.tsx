"use client";

import { useMemo, useState } from "react";
import type { EnrichedProduct } from "@/lib/schemas";

type Tab = "enriched" | "raw" | "split";

const DEFAULT_URLS = [
  "https://www.wayfair.com/furniture/pdp/george-oliver-brekyn-97-wide-upholstered-sectional-with-tufted-seatbacks-and-wooden-legs-w111568830.html",
  "https://www.wayfair.com/furniture/pdp/latitude-run-88-velvet-square-arm-sofa-with-storage-deep-seat-sofa-with-usb-charging-ports-cup-holders-w113639102.html",
].join("\n");

function formatPrice(n?: number): string {
  if (n === undefined) return "—";
  return `$${n.toFixed(2)}`;
}

function RawAttributes({ attrs }: { attrs: Record<string, string | number | boolean> | undefined }) {
  const entries = useMemo(() => {
    if (!attrs) return [];
    return Object.entries(attrs).filter(([, v]) => v !== "Does Not Apply" && v !== "");
  }, [attrs]);
  if (entries.length === 0) {
    return (
      <p className="text-xs text-zinc-500">No raw attributes captured.</p>
    );
  }
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-1 font-mono text-[11px] sm:grid-cols-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex gap-2 border-b border-zinc-900 py-1">
          <dt className="shrink-0 text-zinc-500">{k}:</dt>
          <dd className="text-zinc-300">{String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Enriched({ p }: { p: EnrichedProduct }) {
  const e = p.enrichment;
  return (
    <div className="space-y-4 text-sm">
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-[#FF5C28]">
          Summary
        </div>
        <p className="mt-1 leading-relaxed text-zinc-200">{e.summary}</p>
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-[#FF5C28]">
          Style Tags
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {e.styleTags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-[#FF5C28]/30 bg-[rgb(255_92_40/0.08)] px-2.5 py-0.5 text-xs text-zinc-200"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-[#FF5C28]">
          Materials
        </div>
        <p className="mt-1 leading-relaxed text-zinc-300">{e.materials}</p>
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-[#FF5C28]">
          Use Cases ({e.useCases.length})
        </div>
        <ul className="mt-2 space-y-2">
          {e.useCases.map((u) => (
            <li key={u.scenario}>
              <div className="font-medium text-zinc-200">{u.scenario}</div>
              <div className="text-zinc-400">{u.description}</div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-[#FF5C28]">
          Q&amp;A ({e.qa.length})
        </div>
        <ul className="mt-2 space-y-2">
          {e.qa.map((qa) => (
            <li key={qa.question}>
              <div className="font-medium text-zinc-200">Q: {qa.question}</div>
              <div className="text-zinc-400">A: {qa.answer}</div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-[#FF5C28]">
          Target Segments
        </div>
        <ul className="mt-2 space-y-1.5">
          {e.targetSegments.map((s) => (
            <li key={s.segment}>
              <span className="font-medium text-zinc-200">{s.segment}</span>
              <span className="text-zinc-400"> — {s.description}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-[#FF5C28]">
            Substitutes
          </div>
          <ul className="mt-2 space-y-1 text-zinc-300">
            {e.substitutes.map((s) => (
              <li key={s.productName}>· {s.productName}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-[#FF5C28]">
            Complementary
          </div>
          <ul className="mt-2 space-y-1 text-zinc-300">
            {e.complementary.map((c) => (
              <li key={c.productName}>· {c.productName}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ProductRow({ p, tab }: { p: EnrichedProduct; tab: Tab }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="flex flex-col gap-4 border-b border-zinc-800 p-4 sm:flex-row sm:items-center">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
            alt={p.name}
            className="h-20 w-20 shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 object-cover"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="truncate text-base font-semibold tracking-tight text-white">
              {p.name}
            </h3>
            <span className="text-sm font-medium text-[#FF5C28]">
              {formatPrice(p.price)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">{p.category}</p>
          <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
            id: {p.id}
          </p>
        </div>
      </div>

      <div
        className={
          tab === "split"
            ? "grid divide-zinc-800 sm:grid-cols-2 sm:divide-x"
            : ""
        }
      >
        {(tab === "raw" || tab === "split") && (
          <div className="p-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Raw catalog data
            </div>
            {p.description ? (
              <p className="mb-3 text-sm text-zinc-400">{p.description}</p>
            ) : null}
            <RawAttributes attrs={p.rawAttributes} />
          </div>
        )}
        {(tab === "enriched" || tab === "split") && (
          <div className="p-4">
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Enriched output
            </div>
            <Enriched p={p} />
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminApp({
  initialProducts,
}: {
  initialProducts: EnrichedProduct[];
}) {
  const [products, setProducts] = useState<EnrichedProduct[]>(initialProducts);
  const [urls, setUrls] = useState<string>(DEFAULT_URLS);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("split");
  const [showInput, setShowInput] = useState(false);

  async function refreshCatalog(): Promise<void> {
    const res = await fetch("/api/catalog");
    if (!res.ok) return;
    const data = (await res.json()) as { products: EnrichedProduct[] };
    setProducts(data.products);
  }

  async function runEnrich(force: boolean): Promise<void> {
    setBusy(true);
    setError(null);
    setStatus("Enriching catalog. ~9s per new product at concurrency 5.");
    try {
      const urlList = urls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);
      if (urlList.length === 0) {
        setError("Paste at least one Wayfair PDP URL.");
        setStatus(null);
        return;
      }
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlList, force }),
      });
      const data = (await res.json()) as
        | {
            enrichedCount: number;
            skippedCount: number;
            totalInCatalog: number;
          }
        | { error: string; details?: string };
      if (!res.ok || "error" in data) {
        const msg = "error" in data ? data.error : "Enrich failed";
        const details = "details" in data && data.details ? `: ${data.details}` : "";
        setError(`${msg}${details}`);
        setStatus(null);
        return;
      }
      setStatus(
        `Enriched ${data.enrichedCount}, skipped ${data.skippedCount}. Total in catalog: ${data.totalInCatalog}.`,
      );
      await refreshCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  const totalCatalogValue = products.reduce((sum, p) => sum + (p.price ?? 0), 0);

  return (
    <div className="flex min-h-full flex-col bg-black">
      <header className="border-b border-zinc-800 bg-black">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#FF5C28]">
              Brand · Catalog Enrichment
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">
              Wayfair Catalog → Agentic Commerce
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-400">
              Paste Wayfair PDP URLs. We extract raw catalog data and enrich it with conversational LLM context so agentic shopping experiences have something rich to query.
            </p>
          </div>
          <div className="flex rounded-full border border-zinc-800 bg-zinc-950 p-1">
            {(["split", "enriched", "raw"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition ${
                  tab === t
                    ? "bg-[#FF5C28] text-black"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t === "split" ? "Raw → Enriched" : t}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
              <div>
                <span className="text-zinc-500">Products in catalog: </span>
                <span className="font-medium text-white">{products.length}</span>
              </div>
              <div>
                <span className="text-zinc-500">Catalog value: </span>
                <span className="font-medium text-white">
                  ${totalCatalogValue.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Endpoint: </span>
                <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-300">
                  POST /api/search
                </code>
              </div>
            </div>
            <button
              onClick={() => setShowInput((v) => !v)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-[#FF5C28] hover:text-[#FF5C28]"
            >
              {showInput ? "Hide enrich panel" : "Enrich more URLs"}
            </button>
          </div>

          {showInput ? (
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Wayfair PDP URLs (one per line)
                </span>
                <textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  rows={4}
                  placeholder="https://www.wayfair.com/furniture/pdp/..."
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-white outline-none placeholder:text-zinc-600 focus:border-[#FF5C28] focus:ring-2 focus:ring-[#FF5C28]/30"
                />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={busy}
                  onClick={() => runEnrich(false)}
                  className="rounded-xl bg-[#FF5C28] px-4 py-2 text-sm font-medium text-black hover:bg-[#ff7347] disabled:opacity-40"
                >
                  {busy ? "Enriching…" : "Enrich catalog"}
                </button>
                <button
                  disabled={busy}
                  onClick={() => runEnrich(true)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-[#FF5C28] hover:text-[#FF5C28] disabled:opacity-40"
                >
                  Force re-enrich
                </button>
                {busy ? (
                  <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#FF5C28]" />
                    Working…
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {status ? (
            <p className="mt-3 rounded-lg border border-[#FF5C28]/30 bg-[rgb(255_92_40/0.08)] px-3 py-2 text-sm text-zinc-200">
              {status}
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          ) : null}
        </section>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
            <p className="text-lg font-medium text-zinc-300">
              No enriched products yet.
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Open the enrich panel above and paste URLs to populate the catalog.
            </p>
          </div>
        ) : (
          <section className="space-y-4">
            {products.map((p) => (
              <ProductRow key={p.id} p={p} tab={tab} />
            ))}
          </section>
        )}
      </main>

      <footer className="border-t border-zinc-800 bg-black">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-zinc-500">
          <span>
            Brand-side catalog enrichment · Powered by Subconscious
          </span>
          <a
            href="/chat"
            className="rounded px-2 py-1 hover:text-[#FF5C28]"
          >
            chat fallback →
          </a>
        </div>
      </footer>
    </div>
  );
}
