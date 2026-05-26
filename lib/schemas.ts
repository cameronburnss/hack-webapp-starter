import { z } from "zod";

// Raw product input (what brands upload, or what scrape extracts from a PDP).
// Lenient — partial is fine. Only id + name strictly required.
export const RawProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().optional(),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
  productUrl: z.string().url().optional(),
  rawAttributes: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});
export type RawProduct = z.infer<typeof RawProductSchema>;

// What the LLM enrichment generates. This IS the contract Coop's extension
// queries via /api/search. Coop's frontend renders against these fields.
export const EnrichmentSchema = z.object({
  // Conversational, salesperson-not-spec-sheet. Reads aloud well.
  summary: z.string(),

  // ["mid-century", "organic-modern", "scandinavian", "industrial"]
  styleTags: z.array(z.string()),

  // Materials + construction in conversational language, not bullet specs.
  materials: z.string(),

  // Concrete scenarios the product fits.
  useCases: z
    .array(
      z.object({
        scenario: z.string(),
        description: z.string(),
      }),
    )
    .min(2)
    .max(5),

  // Common buyer questions + grounded answers.
  qa: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    )
    .min(3)
    .max(6),

  // Alternatives within the same need.
  substitutes: z.array(
    z.object({
      productName: z.string(),
      productId: z.string().optional(),
      reason: z.string(),
    }),
  ),

  // Items that pair well.
  complementary: z.array(
    z.object({
      productName: z.string(),
      productId: z.string().optional(),
      reason: z.string(),
    }),
  ),

  // Who this is for, in plain language.
  targetSegments: z.array(
    z.object({
      segment: z.string(),
      description: z.string(),
    }),
  ),
});
export type Enrichment = z.infer<typeof EnrichmentSchema>;

// Full enriched product. What Cameron's /api/search returns to Coop's extension.
export const EnrichedProductSchema = RawProductSchema.extend({
  enrichment: EnrichmentSchema,
  enrichedAt: z.string().datetime(),
  enrichmentVersion: z.literal("v1"),
});
export type EnrichedProduct = z.infer<typeof EnrichedProductSchema>;

// What Coop's extension POSTs to /api/search.
export const SearchQuerySchema = z.object({
  userContext: z.object({
    memoryPaste: z.string().optional(),
    interviewAnswers: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        }),
      )
      .optional(),
    roomImageBase64: z.string().optional(),
  }),
  filters: z
    .object({
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      category: z.string().optional(),
    })
    .optional(),
  limit: z.number().int().positive().default(5),
});
export type SearchQuery = z.infer<typeof SearchQuerySchema>;

// One recommendation in the result set.
export const RecommendationSchema = z.object({
  product: EnrichedProductSchema,
  matchScore: z.number().min(0).max(1),
  whyThisMatches: z.string(),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

// What /api/search returns.
export const SearchResultSchema = z.object({
  query: SearchQuerySchema,
  results: z.array(RecommendationSchema),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;
