import { generateObject, generateText } from "ai";
import { NextResponse } from "next/server";

import { subconsciousModel } from "@/lib/subconscious";
import { EnrichmentSchema, type RawProduct } from "@/lib/schemas";

// One sample product so this route is self-contained.
const SAMPLE: RawProduct = {
  id: "test-001",
  name: "Stanton Mid-Century Velvet Sofa",
  description:
    "84-inch tufted velvet sofa in emerald green with solid walnut legs. Sloped arms, kiln-dried hardwood frame, foam-down cushions. Handcrafted in North Carolina.",
  price: 1299,
  category: "Sofas & Sectionals",
  imageUrl: "https://example.com/sample-sofa.jpg",
  productUrl: "https://wayfair.com/sample",
};

const SYSTEM_PROMPT = `You are enriching e-commerce furniture product data to power LLM discovery and agentic recommendations.

Given raw product data, generate structured enrichment that reads like a knowledgeable salesperson with taste, not a spec sheet. Be specific about materials, use cases, and target buyers. Use concrete scenarios. No marketing fluff.`;

const SCHEMA_DESC = `{
  summary: string,                                             // 2-4 sentences, conversational
  styleTags: string[],                                          // 3-6 specific style descriptors like "mid-century", "organic-modern"
  materials: string,                                            // Materials + construction in plain language
  useCases: Array<{ scenario: string; description: string }>,  // 2-5 items, concrete scenarios
  qa: Array<{ question: string; answer: string }>,             // 3-6 buyer questions + grounded answers
  substitutes: Array<{ productName: string; reason: string }>, // 2-4 alternatives
  complementary: Array<{ productName: string; reason: string }>, // 2-4 items that pair well
  targetSegments: Array<{ segment: string; description: string }> // 2-3 buyer personas
}`;

export async function GET() {
  const start = Date.now();
  const log: string[] = [];

  // Path 1: AI SDK structured output (cleanest if Subconscious supports it)
  try {
    log.push("attempting generateObject with EnrichmentSchema...");
    const result = await generateObject({
      model: subconsciousModel,
      schema: EnrichmentSchema,
      system: SYSTEM_PROMPT,
      prompt: `Product:\n${JSON.stringify(SAMPLE, null, 2)}\n\nGenerate the enrichment.`,
    });
    return NextResponse.json({
      verdict: "generateObject WORKS",
      path: "generateObject",
      elapsedMs: Date.now() - start,
      log,
      enrichment: result.object,
    });
  } catch (err) {
    log.push(
      `generateObject failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Path 2: generateText + JSON-mode prompt + manual zod parse
  try {
    log.push("attempting generateText + JSON mode + zod parse fallback...");
    const { text } = await generateText({
      model: subconsciousModel,
      system: `${SYSTEM_PROMPT}\n\nReturn ONLY valid JSON matching this exact shape:\n${SCHEMA_DESC}\n\nNo prose, no markdown fences, just the JSON object.`,
      prompt: `Product:\n${JSON.stringify(SAMPLE, null, 2)}\n\nGenerate the enrichment JSON.`,
    });
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    const parsed = EnrichmentSchema.parse(JSON.parse(cleaned));
    return NextResponse.json({
      verdict: "generateObject FAILED, fallback path WORKS",
      path: "generateText + manual parse",
      elapsedMs: Date.now() - start,
      log,
      enrichment: parsed,
      rawTextLength: text.length,
    });
  } catch (err) {
    log.push(
      `generateText fallback failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return NextResponse.json(
    {
      verdict: "BOTH PATHS FAILED — investigate before proceeding",
      elapsedMs: Date.now() - start,
      log,
    },
    { status: 500 },
  );
}
