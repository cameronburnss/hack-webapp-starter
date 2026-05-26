import { AdminApp } from "@/components/admin-app";
import { catalog } from "@/lib/catalog-store";

export default async function Home() {
  await catalog.load();
  const products = catalog.all();
  return <AdminApp initialProducts={products} />;
}
