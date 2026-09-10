import { notFound } from "next/navigation";
import { getProductBySlug } from "@/data/products";
import ProductDetails from "@/components/ProductDetails";

export default async function ProductDetailsPage({ params }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  return <ProductDetails product={product} />;
}