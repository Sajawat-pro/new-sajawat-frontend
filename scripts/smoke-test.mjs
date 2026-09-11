import nextEnv from "@next/env";
import mongoose from "mongoose";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import Product from "../src/models/Product.js";
import Order from "../src/models/Order.js";
import Payment from "../src/models/Payment.js";
nextEnv.loadEnvConfig(process.cwd());
const database = "sajawat_verify_" + Date.now();
mkdirSync(".tmp", { recursive: true });
writeFileSync(".tmp/verification-db.txt", database);
const uri = new URL(process.env.MONGODB_URI); uri.pathname = "/" + database;
const base = "http://localhost:3005";
let server, browser, cdp, serverLog = "";
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function report(message) { console.log("PASS " + message); }
try {
  await mongoose.connect(uri.toString(), { serverSelectionTimeoutMS: 10000 });
  await Product.create({ id: "verification-frame", slug: "verification-frame", name: "Verification Frame", collection: "Botanical", price: 499, oldPrice: 699, sizes: ["Small", "Large"], images: ["/images/founders-favorites.png"], active: true });
  const order = await Order.create({ orderNumber: "SJ-VERIFICATION-001", userId: new mongoose.Types.ObjectId(), firebaseUid: "verification-user", customer: { name: "Test Customer", email: "customer@example.com", phone: "9999999999" }, shippingAddress: { addressLine1: "Test address", city: "Jaipur", state: "Rajasthan", pincode: "302001" }, items: [{ productId: "verification-frame", slug: "verification-frame", name: "Verification Frame", image: "/images/founders-favorites.png", size: "Small", quantity: 1, price: 499, total: 499 }], subtotal: 499, total: 499, amountDueNow: 99, amountPaid: 99, balanceDue: 400, paymentMethod: "cashfree", paymentOption: "advance_99", paymentStatus: "partially_paid", orderStatus: "confirmed", paidAt: new Date(), statusHistory: [{ status: "confirmed", actor: "Verification", note: "Temporary test record" }] });
  await Payment.create({ paymentId: "verification_payment", orderId: order._id, orderNumber: order.orderNumber, customerName: "Test Customer", customerEmail: "customer@example.com", amount: 99, status: "SUCCESS", method: "upi", paidAt: new Date() });
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", "3005"], { env: { ...process.env, SITE_URL: base, MONGODB_URI: uri.toString() }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", chunk => { serverLog = (serverLog + chunk).slice(-6000); }); server.stderr.on("data", chunk => { serverLog = (serverLog + chunk).slice(-6000); });
  for (let i = 0; i < 90; i++) { try { if ((await fetch(base + "/admin/login")).ok) break; } catch {} await sleep(500); if (i === 89) throw new Error("Test server did not start"); }
  assert.equal((await fetch(base + "/api/admin")).status, 401); report("admin API rejects unauthenticated requests");
  assert.equal((await fetch(base + "/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://attacker.invalid" }, body: "{}" })).status, 403); report("cross-origin admin login is rejected");
  const login = await fetch(base + "/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json", Origin: base }, body: JSON.stringify({ id: process.env.ADMIN_LOGIN_ID, password: process.env.ADMIN_PASSWORD }) });
  assert.equal(login.status, 200); const cookie = login.headers.get("set-cookie").split(";")[0]; report("admin credentials create a secure server session");
  async function api(path, body, method = "GET") {
    const response = await fetch(base + path, { method, headers: { Origin: base, Cookie: cookie, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, data: await response.json() };
  }
  let result = await api("/api/admin"); assert.equal(result.status, 200); assert.equal(result.data.totals.collected, 99); assert.equal(result.data.totals.outstanding, 400); report("overview totals reflect database payments and delivery balances");
  for (const view of ["orders", "payments", "customers", "products", "offers"]) assert.equal((await api("/api/admin?view=" + view)).status, 200); report("all dashboard data views load");
  assert.equal((await api("/api/admin?view=orders&q=%5B")).status, 200); report("search safely escapes regular expressions");
  assert.equal((await api("/api/admin/offers", { code: "TEST10", title: "Test offer", type: "percentage", value: 101, active: true }, "POST")).status, 400);
  result = await api("/api/admin/offers", { code: "TEST10", title: "Test offer", type: "percentage", value: 10, minOrder: 100, maxDiscount: 30, active: true }, "POST"); assert.equal(result.status, 201); const offerId = result.data.item._id;
  const cart = { items: [{ productId: "verification-frame", size: "Small", quantity: 1, price: 1 }], offerCode: "TEST10" };
  result = await api("/api/checkout/quote", cart, "POST"); assert.equal(result.status, 200); assert.equal(result.data.subtotal, 499); assert.equal(result.data.discount, 30); assert.equal(result.data.total, 469); report("checkout ignores client prices and applies the validated discount cap");
  assert.equal((await api("/api/checkout/quote", { items: [{ productId: "verification-frame", size: "Small", quantity: 1.5 }] }, "POST")).status, 400);
  assert.equal((await api("/api/checkout/quote", { items: [{ productId: "verification-frame", size: "Invalid", quantity: 1 }] }, "POST")).status, 400); report("invalid quantities and sizes are rejected");
  await api("/api/admin/offers/" + offerId, { active: false }, "PATCH");
  assert.equal((await api("/api/checkout/quote", cart, "POST")).status, 400); report("disabled offers cannot be redeemed");
  let current = (await api("/api/admin?view=orders")).data.items[0];
  const orderPath = "/api/admin/orders/" + current._id;
  assert.equal((await api(orderPath, { updatedAt: current.updatedAt, orderStatus: "delivered" }, "PATCH")).status, 400); report("fulfilment cannot skip required stages");
  for (const orderStatus of ["packed", "shipped", "delivered"]) {
    result = await api(orderPath, { updatedAt: current.updatedAt, orderStatus, courier: "Test courier", trackingNumber: "VERIFY-001", adminNotes: "Temporary smoke test" }, "PATCH"); assert.equal(result.status, 200);
    current = (await api("/api/admin?view=orders")).data.items[0];
  }
  assert.equal((await api(orderPath, { updatedAt: "2000-01-01", orderStatus: "delivered" }, "PATCH")).status, 409); report("concurrent updates are rejected instead of overwriting orders");
  result = await api(orderPath, { action: "collect_delivery", amount: 400, reference: "VERIFY-RECEIPT", updatedAt: current.updatedAt }, "PATCH"); assert.equal(result.status, 200);
  result = await api(orderPath, { action: "collect_delivery", amount: 400, reference: "VERIFY-RECEIPT", updatedAt: current.updatedAt }, "PATCH"); assert.equal(result.status, 200);
  assert.equal(await Payment.countDocuments({ method: "cash_on_delivery" }), 1); assert.equal((await Order.findById(order._id)).amountPaid, 499); report("delivery collection retries record payment exactly once");
  assert.equal((await api("/api/payments/create", {}, "POST")).status, 401); report("admin sessions cannot impersonate customers at checkout");
  assert.equal((await api("/api/payments/webhook", {}, "POST")).status, 401); report("unsigned payment webhooks are rejected");

  // Real browser rendering against this isolated database; no fixtures are added to the store database.
  mkdirSync("artifacts", { recursive: true }); mkdirSync(".tmp/browser-profile", { recursive: true });
  browser = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=9333", "--user-data-dir=" + process.cwd() + "/.tmp/browser-profile", "about:blank"], { windowsHide: true, stdio: "ignore" });
  let target;
  for (let i = 0; i < 40; i++) { try { target = (await (await fetch("http://localhost:9333/json", { signal: AbortSignal.timeout(1000) })).json()).find(item => item.type === "page"); if (target) break; } catch {} await sleep(250); }
  if (!target) throw new Error("Chrome debugging connection unavailable");
  const socket = new WebSocket(target.webSocketDebuggerUrl); let sequence = 0; const pending = new Map();
  await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error("Chrome socket timed out")), 5000); socket.onopen = () => { clearTimeout(timer); resolve(); }; socket.onerror = error => { clearTimeout(timer); reject(error); }; });
  socket.onmessage = event => { const data = JSON.parse(event.data); if (pending.has(data.id)) { const { resolve, reject } = pending.get(data.id); pending.delete(data.id); if (data.error) reject(new Error(data.error.message)); else resolve(data.result); } };
  cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; const timer = setTimeout(() => { pending.delete(id); reject(new Error("Chrome command timed out: " + method)); }, 15000); pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => { const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; };
  const waitFor = async selector => { for (let i = 0; i < 100; i++) { if (await evaluate("!!document.querySelector(" + JSON.stringify(selector) + ")")) return; await sleep(200); } throw new Error("Browser timeout: " + selector); };
  const screenshot = async file => { await sleep(600); await evaluate("document.fonts.ready.then(() => true)"); const shot = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); writeFileSync(file, Buffer.from(shot.data, "base64")); };
  await cdp("Page.enable"); await cdp("Network.enable");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: base + "/admin/login" }); await waitFor(".admin-login-form");
  await screenshot("artifacts/admin-login-desktop.png");
  await cdp("Network.setCookie", { name: "sajawat_admin", value: cookie.slice(cookie.indexOf("=") + 1), url: base, httpOnly: true, sameSite: "Strict" });
  await cdp("Page.navigate", { url: base + "/admin" }); await waitFor(".metric-grid");
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true);
  await screenshot("artifacts/admin-overview-desktop.png"); report("desktop dashboard renders without page overflow");
  await evaluate("document.querySelector('.table-open').click()"); await waitFor("dialog[open]"); await screenshot("artifacts/admin-order-detail.png");
  assert.equal(await evaluate("document.querySelector('dialog').contains(document.activeElement)"), true); report("order dialog opens and contains keyboard focus");
  await cdp("Page.navigate", { url: base + "/admin?view=offers" }); await waitFor(".offer-card"); await screenshot("artifacts/admin-offers.png");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cdp("Page.navigate", { url: base + "/admin" }); await waitFor(".metric-grid");
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true); await screenshot("artifacts/admin-overview-mobile.png"); report("mobile dashboard renders without page overflow");
  await evaluate("document.querySelector('.mobile-menu').click()"); assert.equal(await evaluate("!!document.querySelector('.admin-sidebar.is-open')"), true); report("mobile navigation opens");
  await cdp("Page.navigate", { url: base + "/products" }); await waitFor("a[href='/products/verification-frame']");
  assert.equal(await evaluate("document.body.innerText.includes('Verification Frame')"), true); report("storefront displays products from MongoDB");
  await evaluate("localStorage.setItem('sajawat-bag', JSON.stringify([{id:'verification-frame-Small',productId:'verification-frame',size:'Small',quantity:1,price:1}]))");
  await cdp("Page.navigate", { url: base + "/checkout" }); await waitFor(".checkout-section");
  assert.equal(await evaluate("document.body.innerText.includes('499.00')"), true); report("checkout displays the authoritative server price in the browser");
  await screenshot("artifacts/checkout-mobile.png");
  await cdp("Browser.close").catch(() => {}); socket.close();
  console.log("Smoke tests completed. Screenshots saved under artifacts/.");
} catch (error) { console.error("FAIL", error.message); console.error(serverLog.replace(/mongodb[^\s]+/g, "[database]")); process.exitCode = 1; }
finally {
  if (browser) browser.kill();
  if (server) server.kill();
  if (mongoose.connection.name === database && /^sajawat_verify_\d+$/.test(database)) await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
}
