import { NextResponse } from "next/server";
import { z } from "zod";

import { catalog } from "@/lib/catalog-store";
import { enrichProducts } from "@/lib/enrichment";
import { RawProductSchema, type EnrichedProduct, type RawProduct } from "@/lib/schemas";

export const maxDuration = 300;

const EnrichRequestSchema = z.object({
  urls: z.array(z.string().url()).optional(),
  rawProducts: z.array(RawProductSchema).optional(),
  force: z.boolean().optional().default(false),
  concurrency: z.number().int().positive().max(10).optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  await catalog.load();

  let body: z.infer<typeof EnrichRequestSchema>;
  try {
    const json = (await request.json()) as unknown;
    body = EnrichRequestSchema.parse(json);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 400 },
    );
  }

  const raws: RawProduct[] = body.rawProducts ?? [];

  if (body.urls?.length) {
    // STUB: the scrape tab will commit lib/scrape.ts with scrapeWayfairUrls.
    // Once that lands, import it and call here:
    //   const scraped = await scrapeWayfairUrls(body.urls);
    //   raws = [...raws, ...scraped];
    return NextResponse.json(
      {
        error:
          "URL → enrichment not yet wired. lib/scrape.ts pending from scrape tab. For now, pass rawProducts directly.",
      },
      { status: 501 },
    );
  }

  if (raws.length === 0) {
    return NextResponse.json(
      { error: "Provide either rawProducts or urls" },
      { status: 400 },
    );
  }

  const toEnrich = body.force ? raws : raws.filter((r) => !catalog.has(r.id));
  const skipped = raws.length - toEnrich.length;

  const enriched: EnrichedProduct[] = await enrichProducts(toEnrich, {
    concurrency: body.concurrency ?? 5,
  });

  await catalog.upsertMany(enriched);

  return NextResponse.json({
    enrichedCount: enriched.length,
    skippedCount: skipped,
    totalInCatalog: catalog.all().length,
    enrichedIds: enriched.map((p) => p.id),
  });
}

export async function GET(): Promise<NextResponse> {
  await catalog.load();
  return NextResponse.json({
    totalInCatalog: catalog.all().length,
    productIds: catalog.all().map((p) => p.id),
  });
}
