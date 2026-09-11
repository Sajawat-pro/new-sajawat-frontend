import { HttpError, cleanText } from "@/lib/http";

function number(value, label, min = 0, max = 10000000) {
  if (value === "" || value == null || !Number.isFinite(Number(value)) || Number(value) < min || Number(value) > max) throw new HttpError(400, `${label} must be between ${min} and ${max}.`);
  return Math.round(Number(value) * 100) / 100;
}
function lines(value, max = 30) {
  const entries = Array.isArray(value) ? value : typeof value === "string" ? value.split("\n") : [];
  if (entries.length > max) throw new HttpError(400, `Please use no more than ${max} entries.`);
  return entries.map(item => cleanText(item, 500)).filter(Boolean);
}
export function validateProduct(body) {
  const name = cleanText(body.name, 180);
  const slug = cleanText(body.slug, 160);
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new HttpError(400, "Enter a product name and a slug using lowercase letters, numbers and hyphens.");
  const images = lines(body.images, 12);
  if (images.some(path => !/^\/images\/[a-zA-Z0-9_./-]+$/.test(path) || path.includes(".."))) throw new HttpError(400, "Images must use a local /images/ path without spaces or traversal segments.");
  const sizes = lines(body.sizes, 20);
  if (!sizes.length) throw new HttpError(400, "Add at least one size.");
  let dimensions = body.dimensions || {};
  if (typeof dimensions === "string") {
    try { dimensions = JSON.parse(dimensions || "{}"); } catch { throw new HttpError(400, "Dimensions must be valid JSON, for example {\"Small\": \"30 × 30 cm\"}."); }
  }
  if (!dimensions || Array.isArray(dimensions) || typeof dimensions !== "object" || Object.entries(dimensions).some(([key, value]) => !sizes.includes(key) || typeof value !== "string" || value.length > 150)) throw new HttpError(400, "Dimensions must map your size names to measurements.");
  const price = number(body.price, "Price", 1);
  const oldPrice = number(body.oldPrice || 0, "Original price");
  if (oldPrice && oldPrice < price) throw new HttpError(400, "Original price must be at least the selling price.");
  return { name, slug, price, oldPrice, sizes: [...new Set(sizes)], images, dimensions,
    collection: cleanText(body.collection, 100), color: cleanText(body.color, 80), plantType: cleanText(body.plantType, 80),
    sku: cleanText(body.sku, 100), description: cleanText(body.description, 5000),
    features: lines(body.features), materials: lines(body.materials), care: lines(body.care), active: body.active === true };
}
export function validateOffer(body) {
  const code = cleanText(body.code, 30).toUpperCase();
  const title = cleanText(body.title, 100);
  if (!/^[A-Z0-9_-]{3,30}$/.test(code) || !title) throw new HttpError(400, "Enter a title and an offer code with 3–30 letters or numbers.");
  if (!["percentage", "fixed"].includes(body.type)) throw new HttpError(400, "Select a valid discount type.");
  const date = value => {
    if (!value) return null;
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) throw new HttpError(400, "Enter a valid offer date.");
    return parsed;
  };
  const startsAt = date(body.startsAt), endsAt = date(body.endsAt);
  if (startsAt && endsAt && startsAt >= endsAt) throw new HttpError(400, "The offer must end after it starts.");
  return { code, title, type: body.type, value: number(body.value, "Discount", 0.01, body.type === "percentage" ? 100 : 100000),
    description: cleanText(body.description, 300), minOrder: number(body.minOrder || 0, "Minimum spend"),
    maxDiscount: number(body.maxDiscount || 0, "Maximum discount"), startsAt, endsAt, active: body.active === true };
}
