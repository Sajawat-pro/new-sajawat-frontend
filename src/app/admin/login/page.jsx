"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import Icon from "@/components/admin/Icon";
export default function AdminLogin() {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const router = useRouter(), toast = useToast();
  async function submit(event) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: form.get("id"), password: form.get("password") }), signal: AbortSignal.timeout(20000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to sign in.");
      toast("Welcome back to Sajawat."); router.replace("/admin"); router.refresh();
    } catch (error) { setError(error.name === "TimeoutError" ? "The connection timed out. Please try again." : error.message); setBusy(false); }
  }
  return <div className="admin-login"><div className="login-story"><Link href="/" className="admin-wordmark">sajawat<span>STORE</span></Link><div><span className="eyebrow">A LITTLE CARE. A BEAUTIFUL HOME.</span><h1>Good things,<br />beautifully<br /><em>managed.</em></h1><p>Your orders, your customers, your growing store.<br />Everything in one thoughtful space.</p></div><span className="login-story-footer">THE SAJAWAT WORKSPACE</span></div><div className="login-panel"><form onSubmit={submit} className="admin-login-form"><div className="login-lock"><Icon name="lock" size={25} /></div><span className="eyebrow">STORE ADMINISTRATION</span><h2>Welcome back.</h2><p>Sign in to take care of your store.</p><label>Admin ID<input name="id" type="email" autoComplete="username" placeholder="Your admin email" required maxLength={254} autoFocus /></label><label>Password<input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required maxLength={256} /></label>{error && <div className="admin-error" role="alert">{error}</div>}<button className="admin-button primary" disabled={busy}>{busy ? <><span className="spinner" /> Signing in…</> : <>Sign in to dashboard <Icon name="arrow" size={18} /></>}</button><Link className="login-back" href="/">← Back to the store</Link></form></div></div>;
}
