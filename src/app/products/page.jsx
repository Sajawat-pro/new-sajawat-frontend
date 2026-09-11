import { getProducts } from "@/lib/catalog";
import ProductsCatalog from "@/components/ProductsCatalog";
export const dynamic = "force-dynamic";
export default async function ProductsPage() { return <ProductsCatalog products={await getProducts()} />; }
