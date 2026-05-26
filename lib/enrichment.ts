import { generateObject } from "ai";
import { subconsciousModel } from "@/lib/subconscious";
import {
  EnrichmentSchema,
  type EnrichedProduct,
  type RawProduct,
} from "@/lib/schemas";

const SYSTEM_PROMPT = `You are enriching e-commerce furniture product data to power LLM discovery and agentic recommendations.

Given raw product data, generate structured enrichment that reads like a knowledgeable salesperson with taste, not a spec sheet. Be specific about materials, use cases, and target buyers. Use concrete scenarios. No marketing fluff.`;

export async function enrichProduct(raw: RawProduct): Promise<EnrichedProduct> {
  const { object: enrichment } = await generateObject({
    model: subconsciousModel,
    schema: EnrichmentSchema,
    system: SYSTEM_PROMPT,
    prompt: `Product:\n${JSON.stringify(raw, null, 2)}\n\nGenerate the enrichment.`,
  });

  return {
    ...raw,
    enrichment,
    enrichedAt: new Date().toISOString(),
    enrichmentVersion: "v1",
  };
}

// Hand-rolled semaphore for concurrency. Avoids the p-limit dep and the
// pnpm minimum-release-age block. 5 concurrent at ~9s each puts 15 products
// at ~30s wall time, with Subconscious comfortably handling the load.
async function withConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

export type EnrichProgress = (
  done: number,
  total: number,
  product: EnrichedProduct,
) => void;

export async function enrichProducts(
  raws: RawProduct[],
  options?: { concurrency?: number; onProgress?: EnrichProgress },
): Promise<EnrichedProduct[]> {
  const concurrency = options?.concurrency ?? 5;
  let done = 0;
  return withConcurrency(raws, concurrency, async (raw) => {
    const enriched = await enrichProduct(raw);
    done++;
    options?.onProgress?.(done, raws.length, enriched);
    return enriched;
  });
}
