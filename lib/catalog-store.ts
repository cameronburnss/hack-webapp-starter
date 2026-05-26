import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { EnrichedProductSchema, type EnrichedProduct } from "@/lib/schemas";

const CATALOG_PATH = path.join(process.cwd(), "data", "enriched.json");
const CATALOG_FILE_SCHEMA = z.array(EnrichedProductSchema);

class CatalogStore {
  private products: Map<string, EnrichedProduct> = new Map();
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await fs.readFile(CATALOG_PATH, "utf-8");
      const parsed = CATALOG_FILE_SCHEMA.parse(JSON.parse(raw));
      this.products = new Map(parsed.map((p) => [p.id, p]));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
    this.loaded = true;
  }

  async save(): Promise<void> {
    await fs.mkdir(path.dirname(CATALOG_PATH), { recursive: true });
    await fs.writeFile(
      CATALOG_PATH,
      JSON.stringify(Array.from(this.products.values()), null, 2),
    );
  }

  has(id: string): boolean {
    return this.products.has(id);
  }

  get(id: string): EnrichedProduct | undefined {
    return this.products.get(id);
  }

  all(): EnrichedProduct[] {
    return Array.from(this.products.values());
  }

  upsert(product: EnrichedProduct): void {
    this.products.set(product.id, product);
  }

  async upsertMany(products: EnrichedProduct[]): Promise<void> {
    for (const p of products) this.products.set(p.id, p);
    await this.save();
  }

  clear(): void {
    this.products.clear();
  }
}

// Survive Next.js HMR module reloads in dev so state doesn't reset on edits.
declare global {
  var __catalogStore: CatalogStore | undefined;
}

export const catalog: CatalogStore =
  globalThis.__catalogStore ?? (globalThis.__catalogStore = new CatalogStore());
