import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import Dashboard from "@/components/admin/Dashboard";
export const dynamic = "force-dynamic";
export default async function AdminPage({ searchParams }) {
  let admin;
  try { admin = await requireAdmin(); } catch (error) { if ([401, 403].includes(error.status)) redirect("/admin/login"); throw error; }
  const params = await searchParams;
  const view = ["overview", "orders", "payments", "customers", "products", "offers"].includes(params.view) ? params.view : "overview";
  return <Dashboard key={view} view={view} admin={{ name: admin.name, email: admin.email }} />;
}
