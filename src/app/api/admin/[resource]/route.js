import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/admin";
import { assertSameOrigin, readJson, apiError, HttpError, json } from "@/lib/http";
import { validateProduct, validateOffer } from "@/lib/adminValidation";
import connectMongoDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Offer from "@/models/Offer";

export async function POST(request, { params }) {
  try {
    assertSameOrigin(request); await requireAdmin(); await connectMongoDB();
    const { resource } = await params;
    const body = await readJson(request);
    if (resource === "products") return json({ item: await Product.create({ ...validateProduct(body), id: randomUUID() }) }, 201);
    if (resource === "offers") return json({ item: await Offer.create(validateOffer(body)) }, 201);
    if (resource === "import") {
      const { products } = await import("@/data/products");
      const result = await Product.bulkWrite(products.map(product => ({ updateOne: { filter: { id: product.id },
        update: { $setOnInsert: { ...product, reviews: [], rating: 0, reviewCount: 0, active: true } }, upsert: true } })));
      return json({ message: `${result.upsertedCount} products imported. Existing products were preserved.` });
    }
    throw new HttpError(404, "Resource not found.");
  } catch (error) {
    if (error.code === 11000) return json({ message: "That product slug or offer code already exists." }, 409);
    return apiError(error, "Unable to save. Please try again.");
  }
}
