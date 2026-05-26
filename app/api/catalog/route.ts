import { NextResponse } from "next/server";
import { catalog } from "@/lib/catalog-store";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(): Promise<NextResponse> {
  await catalog.load();
  return NextResponse.json(
    { products: catalog.all() },
    { headers: CORS_HEADERS },
  );
}
