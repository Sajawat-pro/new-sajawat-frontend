export async function clientApi(url, options = {}) {
  let response;
  try { response = await fetch(url, { cache: "no-store", ...options, signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(25000)]) : AbortSignal.timeout(25000), headers: { "Content-Type": "application/json", ...options.headers } }); }
  catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(error.name === "TimeoutError" ? "The request took too long. Please try again." : "Check your connection and try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.message || "We couldn’t complete that request. Please try again."); error.status = response.status; throw error; }
  return data;
}
