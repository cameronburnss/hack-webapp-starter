import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { catalog } from "@/lib/catalog-store";
import {
  SearchQuerySchema,
  type EnrichedProduct,
  type SearchQuery,
  type SearchResult,
} from "@/lib/schemas";
import { subconsciousModel } from "@/lib/subconscious";

export const maxDuration = 60;

const RankOutputSchema = z.object({
  recommendations: z
    .array(
      z.object({
        productId: z.string(),
        matchScore: z.number().min(0).max(1),
        whyThisMatches: z.string(),
      }),
    )
    .min(1),
});

const SYSTEM_PROMPT = `You are an expert furniture shopping assistant. Given a shopper's context and an enriched product catalog, rank the products that best match the shopper's needs.

Each recommendation must include:
- A matchScore from 0 to 1 reflecting fit
- A whyThisMatches explanation that references BOTH specific shopper context AND specific product enrichment details (materials, style, use cases, target segments)
- No generic marketing language. Be concrete.`;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function buildShopperContext(userContext: SearchQuery["userContext"]): string {
  const parts: string[] = [];
  if (userContext.memoryPaste) {
    parts.push(`Shopper memory paste:\n${userContext.memoryPaste}`);
  }
  if (userContext.interviewAnswers?.length) {
    const answers = userContext.interviewAnswers
      .map((qa) => `- Q: ${qa.question}\n  A: ${qa.answer}`)
      .join("\n");
    parts.push(`Shopper interview answers:\n${answers}`);
  }
  if (userContext.roomImageBase64) {
    parts.push(
      "(Shopper provided a room image. Not consumed in v1 ranking, but signals they care about how this fits a specific space.)",
    );
  }
  if (parts.length === 0) {
    parts.push("(Shopper provided no explicit context. Recommend based on broad appeal.)");
  }
  return parts.join("\n\n");
}

function applyFilters(
  products: EnrichedProduct[],
  filters: SearchQuery["filters"],
): EnrichedProduct[] {
  if (!filters) return products;
  return products.filter((p) => {
    if (filters.minPrice !== undefined && (p.price ?? 0) < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && (p.price ?? Number.POSITIVE_INFINITY) > filters.maxPrice) return false;
    if (filters.category && p.category !== filters.category) return false;
    return true;
  });
}

export function OPTIONS(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request): Promise<NextResponse> {
  await catalog.load();

  let query: SearchQuery;
  try {
    const json = (await request.json()) as unknown;
    query = SearchQuerySchema.parse(json);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Invalid SearchQuery body",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const candidates = applyFilters(catalog.all(), query.filters);
  if (candidates.length === 0) {
    const empty: SearchResult = { query, results: [] };
    return NextResponse.json(empty, { headers: CORS_HEADERS });
  }

  const catalogForLLM = candidates.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    enrichment: p.enrichment,
  }));

  const shopperContext = buildShopperContext(query.userContext);

  const { object } = await generateObject({
    model: subconsciousModel,
    schema: RankOutputSchema,
    system: SYSTEM_PROMPT,
    prompt: `Shopper context:\n${shopperContext}\n\nProduct catalog (${candidates.length} products):\n${JSON.stringify(catalogForLLM, null, 2)}\n\nReturn up to the top ${query.limit} products ranked by fit. Each whyThisMatches must reference specific details from BOTH the shopper context AND the product enrichment.`,
  });

  const byId = new Map(candidates.map((p) => [p.id, p]));
  const results = object.recommendations
    .map((r) => {
      const product = byId.get(r.productId);
      if (!product) return null;
      return {
        product,
        matchScore: r.matchScore,
        whyThisMatches: r.whyThisMatches,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .slice(0, query.limit);

  const result: SearchResult = { query, results };
  return NextResponse.json(result, { headers: CORS_HEADERS });
}
