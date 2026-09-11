import "./admin.css";
export const metadata = { title: "Sajawat · Store Admin", robots: { index: false, follow: false } };
export default function AdminLayout({ children }) { return <div className="admin-root">{children}</div>; }
