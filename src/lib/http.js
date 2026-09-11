import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function assertSameOrigin(request) {
  const origin = request.headers.get("origin");
  const expected = process.env.SITE_URL || new URL(request.url).origin;
  const localDevelopment = process.env.NODE_ENV !== "production" && origin === new URL(request.url).origin;
  if (!origin || (origin !== new URL(expected).origin && !localDevelopment)) {
    throw new HttpError(403, "This request could not be verified. Refresh the page and try again.");
  }
}

export async function readJson(request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new HttpError(415, "Please send JSON data.");
  const text = await readLimitedText(request);
  try { const body = JSON.parse(text); if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error(); return body; }
  catch { throw new HttpError(400, "The request contains invalid data."); }
}

export async function readLimitedText(request, limit = 64000) {
  if (Number(request.headers.get("content-length")) > limit) throw new HttpError(413, "The request is too large.");
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks = []; let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new HttpError(413, "The request is too large."); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { throw new HttpError(400, "The request contains invalid text."); }
}

export function apiError(error, fallback = "Something went wrong. Please try again.") {
  if (!(error instanceof HttpError)) console.error(fallback, { name: error.name, code: error.code });
  return NextResponse.json({ message: error instanceof HttpError ? error.message : fallback }, {
    status: error instanceof HttpError ? error.status : 500,
    headers: { "Cache-Control": "no-store" },
  });
}

export function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function cleanText(value, max = 150) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
