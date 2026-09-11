import { quoteCheckout } from "@/lib/checkout";
import { assertSameOrigin, readJson, apiError, json } from "@/lib/http";
export async function POST(request) {
  try { assertSameOrigin(request); return json(await quoteCheckout(await readJson(request))); }
  catch (error) { return apiError(error, "Unable to calculate your total. Please try again."); }
}
