import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { RawProductSchema, type RawProduct } from "./schemas";

const RawProductsFileSchema = z.array(RawProductSchema);

const CACHE_PATH = join(process.cwd(), "data", "raw-products.json");

let cache: Map<string, RawProduct> | null = null;

async function loadCache(): Promise<Map<string, RawProduct>> {
  if (cache) return cache;
  const text = await readFile(CACHE_PATH, "utf8");
  const products = RawProductsFileSchema.parse(JSON.parse(text));
  cache = new Map(products.map((p) => [p.id, p]));
  return cache;
}

// Wayfair PDP slugs end with the SKU before .html, e.g. `...-w113639102.html`
// or `...-caom1589.html`. The SKU is the stable join key.
function extractSku(url: string): string | null {
  const m = url.match(/-(w\d+|[a-z]{4}\d{4})\.html/i);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Resolve a list of Wayfair PDP URLs to RawProduct entries from the local cache.
 *
 * Live scraping at request time is blocked by Wayfair's bot challenge, so this
 * function reads pre-scraped data committed in `data/raw-products.json`.
 * The cache is populated offline via the Chrome DevTools MCP path documented in
 * `.context/scrape-tab-prompt.md`. To add URLs, scrape them and append.
 */
export async function scrapeWayfairUrls(urls: string[]): Promise<RawProduct[]> {
  const products = await loadCache();
  const found: RawProduct[] = [];
  const missing: string[] = [];
  for (const url of urls) {
    const sku = extractSku(url);
    const match = sku ? products.get(sku) : null;
    if (match) found.push(match);
    else missing.push(url);
  }
  if (missing.length > 0) {
    throw new Error(
      `scrapeWayfairUrls: ${missing.length} URL(s) not in cache. Pre-scrape these URLs before /api/enrich can run on them:\n${missing.join("\n")}`,
    );
  }
  return found;
}

/** All RawProducts in the cache. Useful for demo seeding. */
export async function allRawProducts(): Promise<RawProduct[]> {
  const products = await loadCache();
  return Array.from(products.values());
}
