import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/catalog";
export const dynamic = "force-dynamic";
import ProductDetails from "@/components/ProductDetails";

export default async function ProductDetailsPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return <ProductDetails product={product} relatedProducts={(await getProducts()).filter(item => item.id !== product.id).slice(0, 3)} />;
}