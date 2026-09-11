import nextEnv from "@next/env";
import { readFileSync, writeFileSync } from "node:fs";
nextEnv.loadEnvConfig(process.cwd());
// Read-only credential check against a deliberately nonexistent order. Never creates a payment.
const outcomes = [];
for (const mode of ["production", "sandbox"]) {
  try {
    const response = await fetch((mode === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg") + "/orders/sajawat_configuration_probe_nonexistent", {
      headers: { "x-api-version": "2025-01-01", "x-client-id": process.env.CASHFREE_APP_ID, "x-client-secret": process.env.CASHFREE_SECRET_KEY }, signal: AbortSignal.timeout(15000),
    });
    const data = await response.json().catch(() => ({}));
    outcomes.push({ mode, status: response.status, code: data.code });
  } catch (error) { outcomes.push({ mode, error: error.name }); }
}
console.log(JSON.stringify(outcomes));
const verified = outcomes.filter(item => item.status === 404 && /order.*not.*found|order_not_found/i.test(item.code || ""));
if (verified.length === 1) {
  const path = new URL("../.env", import.meta.url);
  writeFileSync(path, readFileSync(path, "utf8").replace(/^CASHFREE_ENV=.*$/m, "CASHFREE_ENV=" + verified[0].mode));
  console.log("CASHFREE_ENV set to verified credential environment: " + verified[0].mode);
} else console.log("Cashfree mode could not be verified automatically; existing configuration preserved.");
