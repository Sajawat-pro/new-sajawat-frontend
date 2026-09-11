import { HttpError, cleanText } from "@/lib/http";
import Product from "@/models/Product";
import Offer from "@/models/Offer";
import { calculateDiscount, paise, rupees } from "@/lib/commerce";
import connectMongoDB from "@/lib/mongodb";
export async function quoteCheckout(body) {
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 50) throw new HttpError(400, "Please select between 1 and 50 items.");
  await connectMongoDB();
  const products = await Product.find({ id: { $in: body.items.map(item => cleanText(item?.productId, 100)) }, active: true }).lean();
  const items = [];
  const quantities = new Map();
  for (const item of body.items) {
    const product = products.find(product => product.id === item?.productId);
    if (!product) throw new HttpError(400, "A product in your bag is no longer available. Please update your bag.");
    if (!product.sizes.includes(item.size)) throw new HttpError(400, "Please select a valid size for " + product.name + ".");
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) throw new HttpError(400, "Select a quantity between 1 and 10.");
    const key = product.id + ":" + item.size;
    const quantity = (quantities.get(key) || 0) + item.quantity;
    if (quantity > 10) throw new HttpError(400, "The maximum quantity per product and size is 10.");
    quantities.set(key, quantity);
    items.push({ productId: product.id, slug: product.slug, name: product.name, image: product.images[0] || "",
      size: item.size, quantity: item.quantity, price: product.price, total: rupees(paise(product.price) * item.quantity) });
  }
  const subtotal = rupees(items.reduce((sum, item) => sum + paise(item.total), 0));
  const offerCode = cleanText(body.offerCode, 30).toUpperCase();
  const offer = offerCode ? await Offer.findOne({ code: offerCode }).lean() : null;
  const discount = calculateDiscount(offer, subtotal);
  if (offerCode && !discount) throw new HttpError(400, "This offer is unavailable, expired, or your bag does not meet its minimum spend.");
  return { items, subtotal, shipping: 0, discount, offerCode, total: rupees(paise(subtotal) - paise(discount)) };
}
export function deliveryDetails(body) {
  const name = cleanText(body.name, 100);
  const phone = cleanText(body.phone, 30);
  const shippingAddress = Object.fromEntries(["addressLine1", "addressLine2", "city", "state", "pincode"].map(key => [key, cleanText(body.shippingAddress?.[key], key === "pincode" ? 20 : 150)]));
  if (name.length < 2) throw new HttpError(400, "Please enter your full name.");
  if (!/^[6-9]\d{9}$/.test(phone)) throw new HttpError(400, "Enter a valid 10-digit Indian mobile number.");
  if (!shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state || !/^[1-9]\d{5}$/.test(shippingAddress.pincode)) throw new HttpError(400, "Complete your delivery address with a valid 6-digit PIN code.");
  return { name, phone, shippingAddress };
}
