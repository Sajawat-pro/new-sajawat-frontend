"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import MediaImage from "@/components/MediaImage";
import { orderTransitions } from "@/lib/commerce";
import Icon from "./Icon";
import Modal from "./Modal";

const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
const date = value => value ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "—";
const label = value => (value || "unknown").replaceAll("_", " ");
const views = ["overview", "orders", "payments", "customers", "products", "offers"];
const descriptions = { overview: "A thoughtful overview of how your store is doing.", orders: "From the first click to a beautifully delivered home.", payments: "Every payment attempt, with the details that matter.", customers: "The people making Sajawat part of their homes.", products: "Curate your collection, down to the last detail.", offers: "Give your customers a little more to love." };
const orderStatuses = Object.keys(orderTransitions);
async function request(url, options = {}) {
  const response = await fetch(url, { ...options, cache: "no-store", signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(25000)]) : AbortSignal.timeout(25000),
    headers: { "Content-Type": "application/json", ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.message || "Something went wrong. Please try again."); error.status = response.status; throw error; }
  return data;
}
function Badge({ value }) { return <span className={`status-badge status-${String(value).toLowerCase()}`}><i />{label(value)}</span>; }
function Empty({ view }) { return <div className="admin-empty"><span><Icon name={view} size={30} /></span><h3>No {view} to show</h3><p>{view === "products" ? "Add your first product or import your existing catalogue." : view === "offers" ? "Create an offer and publish it when you’re ready." : "Your live records will appear here. Try adjusting your filters."}</p></div>; }
function Skeleton() { return <div className="admin-skeleton" role="status" aria-label="Loading dashboard">{[1,2,3,4,5].map(i => <div key={i} className="skeleton-row" />)}</div>; }

export default function Dashboard({ view, admin }) {
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [search, setSearch] = useState(""), [query, setQuery] = useState(""), [status, setStatus] = useState("");
  const [from, setFrom] = useState(""), [to, setTo] = useState(""), [page, setPage] = useState(1), [revision, setRevision] = useState(0);
  const [mobileNav, setMobileNav] = useState(false), [selected, setSelected] = useState(null), [busy, setBusy] = useState(false);
  const router = useRouter(), toast = useToast();
  useEffect(() => { if (search === query) return; const timer = setTimeout(() => { setQuery(search); setPage(1); setLoading(true); }, 300); return () => clearTimeout(timer); }, [search, query]);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ view, q: query, status, from, to, page: String(page) });
    request("/api/admin?" + params, { signal: controller.signal }).then(result => { setData(result); setError(""); })
      .catch(error => { if (error.name === "AbortError") return; if (error.status === 401) router.replace("/admin/login"); else setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [view, query, status, from, to, page, revision, router]);
  function refresh() { setLoading(true); setRevision(value => value + 1); }
  function change(setter, value) { setter(value); if (setter !== setPage) setPage(1); setLoading(true); }
  async function mutate(url, body, message, method = "PATCH") {
    setBusy(true);
    try { const result = await request(url, { method, body: JSON.stringify(body) }); toast(result.message || message); setSelected(null); refresh(); return true; }
    catch (error) { toast(error.message, "error"); return false; } finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true);
    try {
      await request("/api/admin/auth", { method: "DELETE" });
      await request("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("userLogin"); router.replace("/admin/login"); router.refresh();
    } catch (error) { toast(error.message, "error"); setBusy(false); }
  }
  function exportCsv() {
    const rows = data?.items || data?.recent || [];
    if (!rows.length) return;
    const columns = view === "payments" ? ["paymentId", "orderNumber", "customerName", "customerEmail", "amount", "currency", "status", "method", "bankReference", "paidAt"] :
      view === "customers" ? ["name", "email", "phone", "orders", "paid", "lastOrder"] :
      ["orderNumber", "customer.name", "customer.email", "customer.phone", "orderStatus", "paymentStatus", "paymentOption", "subtotal", "discount", "shipping", "total", "amountPaid", "balanceDue", "courier", "trackingNumber", "createdAt"];
    const cell = value => { let text = String(value ?? ""); if (/^[=+\-@\t\r]/.test(text)) text = "'" + text; return '"' + text.replaceAll('"', '""') + '"'; };
    const csv = [columns.map(cell).join(","), ...rows.map(row => columns.map(column => cell(column.split(".").reduce((value, key) => value?.[key], row))).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `sajawat-${view}-page-${page}.csv`; anchor.click(); URL.revokeObjectURL(url);
    toast("This page has been exported.");
  }
  const items = data?.items || [];
  return <div className="admin-workspace">
    {mobileNav && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <aside className={`admin-sidebar ${mobileNav ? "is-open" : ""}`}>
      <Link href="/admin" className="admin-wordmark">sajawat<span>STORE ADMIN</span></Link>
      <div className="workspace-pill"><span className="workspace-avatar">S</span><div>Sajawat Store<small>Your workspace</small></div><span className="live-dot" /></div>
      <p className="nav-caption">MANAGE YOUR STORE</p>
      <nav aria-label="Admin navigation">{views.map(item => <Link key={item} href={item === "overview" ? "/admin" : "/admin?view=" + item} className={view === item ? "active" : ""} aria-current={view === item ? "page" : undefined}><Icon name={item} /><span>{item === "overview" ? "Overview" : label(item)}</span>{item === "orders" && data?.totals?.toShip > 0 && <b>{data.totals.toShip}</b>}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="store-note"><span>Made for beautiful homes.</span><p>Let’s make every order a little special.</p><Link href="/" target="_blank">Visit your store <Icon name="arrow" size={15} /></Link></div><button className="sidebar-signout" disabled={busy} onClick={logout}><Icon name="logout" size={18} /> Sign out</button></div>
    </aside>
    <div className="admin-content">
      <header className="admin-topbar"><div><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Icon name="menu" /></button><span className="breadcrumb">Workspace <span>/</span> <strong>{view === "overview" ? "Overview" : label(view)}</strong></span></div><div className="topbar-account"><span className="live-indicator"><i /> Live store data</span><span className="account-avatar">{admin.email.charAt(0).toUpperCase()}</span><span className="account-name">Store administrator<small>{admin.email}</small></span></div></header>
      <main className="dashboard-main">
        <div className="page-heading"><div><span className="eyebrow">YOUR STORE, AT A GLANCE</span><h1>{view === "overview" ? "Welcome to your workspace." : label(view)}</h1><p>{descriptions[view]}</p></div><div className="heading-actions"><button className="admin-button" onClick={refresh} disabled={loading}><Icon name="refresh" size={16} />Refresh</button>{["products", "offers"].includes(view) ? <button className="admin-button primary" onClick={() => setSelected({ kind: view, item: null })}><Icon name="plus" size={17} /> Add {view === "products" ? "product" : "offer"}</button> : <button className="admin-button" disabled={loading || !(data?.items?.length || data?.recent?.length)} onClick={exportCsv}><Icon name="download" size={16} />Export page</button>}</div></div>
        {error && <div className="admin-error" role="alert">{error}<button onClick={refresh}>Try again</button></div>}
        {view === "overview" ? loading ? <Skeleton /> : data && <Overview data={data} onOrder={item => setSelected({ kind: "orders", item })} /> : <>
          <div className="admin-toolbar"><div className="admin-search"><Icon name="search" size={18} /><input aria-label={`Search ${view}`} placeholder={`Search ${view}…`} value={search} onChange={event => setSearch(event.target.value)} /></div>
            {["orders", "payments"].includes(view) && <><select aria-label="Filter by status" value={status} onChange={event => change(setStatus, event.target.value)}><option value="">All statuses</option>{(view === "orders" ? orderStatuses : ["SUCCESS", "PENDING", "FAILED", "USER_DROPPED", "CANCELLED", "NOT_ATTEMPTED", "REFUND_SUCCESS", "REFUND_PENDING", "REFUND_FAILED"]).map(item => <option key={item} value={item}>{label(item)}</option>)}</select><label className="date-filter">From<input type="date" value={from} onChange={event => change(setFrom, event.target.value)} /></label><label className="date-filter">To<input type="date" min={from} value={to} onChange={event => change(setTo, event.target.value)} /></label></>}
            {(search || status || from || to) && <button className="text-button" onClick={() => { setSearch(""); setStatus(""); setFrom(""); setTo(""); setPage(1); setLoading(true); }}>Clear filters</button>}
          </div>
          <section className="admin-panel"><div className="panel-heading"><h2>All {view} <span className="count-pill">{data?.total ?? "—"}</span></h2>{view === "products" && <button className="text-button" disabled={busy} onClick={() => mutate("/api/admin/import", {}, "Catalogue imported.", "POST")}>Import existing catalogue</button>}<span className="muted">Updated from your store</span></div>
            {loading ? <Skeleton /> : !items.length ? <Empty view={view} /> : view === "orders" ? <OrdersTable orders={items} onOrder={item => setSelected({ kind: view, item })} /> :
            view === "payments" ? <div className="table-scroll"><table><thead><tr><th>Transaction</th><th>Customer</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th /></tr></thead><tbody>{items.map(item => <tr key={item._id}><td><strong>{item.paymentId}</strong><small>{item.orderNumber}</small></td><td>{item.customerName}<small>{item.customerEmail}</small></td><td className="money">{money(item.amount)}</td><td className="capitalize">{item.method}</td><td><Badge value={item.status} /></td><td>{date(item.paidAt || item.createdAt)}</td><td><button className="table-open" onClick={() => setSelected({ kind: view, item })}>Details</button></td></tr>)}</tbody></table></div> :
            view === "customers" ? <div className="table-scroll"><table><thead><tr><th>Customer</th><th>Phone</th><th>Orders</th><th>Collected</th><th>Last order</th></tr></thead><tbody>{items.map(item => <tr key={item._id}><td><strong>{item.name}</strong><small>{item.email}</small></td><td>{item.phone}</td><td>{item.orders}</td><td className="money">{money(item.paid)}</td><td>{date(item.lastOrder)}</td></tr>)}</tbody></table></div> :
            view === "products" ? <div className="table-scroll"><table><thead><tr><th>Product</th><th>Collection</th><th>Price</th><th>Sizes</th><th>Visibility</th><th /></tr></thead><tbody>{items.map(item => <tr key={item._id}><td><div className="product-cell"><div className="product-thumb"><MediaImage src={item.images?.[0]} alt={item.name} fill sizes="44px" className="object-cover" /></div><div><strong>{item.name}</strong><small>{item.sku || item.slug}</small></div></div></td><td>{item.collection || "—"}</td><td className="money">{money(item.price)}</td><td>{item.sizes.join(", ")}</td><td><Badge value={item.active ? "active" : "draft"} /></td><td><button className="table-open" onClick={() => setSelected({ kind: view, item })}>Edit product</button></td></tr>)}</tbody></table></div> :
            <div className="offer-grid">{items.map(item => <article className="offer-card" key={item._id}><div><span className="offer-icon"><Icon name="offers" /></span><Badge value={!item.active ? "draft" : item.endsAt && new Date(item.endsAt) < new Date() ? "expired" : item.startsAt && new Date(item.startsAt) > new Date() ? "scheduled" : "active"} /></div><p className="offer-value">{item.type === "percentage" ? item.value + "%" : money(item.value)} <span>off</span></p><h3>{item.title}</h3><p>{item.description || "Apply this code at checkout."}</p><code>{item.code}</code><small>Minimum spend {money(item.minOrder)}{item.maxDiscount > 0 ? " · Up to " + money(item.maxDiscount) : ""}</small><footer><span>{item.endsAt ? "Ends " + date(item.endsAt) : "No end date"}</span><button className="text-button" onClick={() => setSelected({ kind: view, item })}>Edit offer →</button></footer></article>)}</div>}
            {data?.total > 0 && <div className="pagination"><span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}</span><div><button className="admin-button" disabled={page === 1 || loading} onClick={() => change(setPage, page - 1)}>Previous</button><span>Page {page}</span><button className="admin-button" disabled={page * 20 >= data.total || loading} onClick={() => change(setPage, page + 1)}>Next</button></div></div>}
          </section>
          {view === "payments" && <p className="admin-footnote">Transactions are saved when Cashfree confirms or reconciles an order. Use “Refresh payment” in an order to retrieve earlier attempts. Delivery balances remain outstanding until collection is recorded.</p>}
        </>}
        <footer className="dashboard-footer"><span>SAJAWAT STORE</span><span>A little order. A lot of possibility.</span></footer>
      </main>
    </div>
    {selected?.kind === "orders" && <OrderDetail order={selected.item} onClose={() => !busy && setSelected(null)} busy={busy} onSave={body => mutate("/api/admin/orders/" + selected.item._id, body, "Order saved.")} />}
    {selected?.kind === "payments" && <Modal title="Transaction details" onClose={() => setSelected(null)}><dl className="detail-grid payment-detail">{Object.entries({ "Payment ID": selected.item.paymentId, "Order": selected.item.orderNumber, "Customer": selected.item.customerName, "Email": selected.item.customerEmail, "Amount": money(selected.item.amount), "Status": label(selected.item.status), "Method": selected.item.method, "Bank reference": selected.item.bankReference, "Gateway message": selected.item.message, "Payment time": date(selected.item.paidAt), "Recorded": date(selected.item.createdAt) }).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value || "—"}</dd></div>)}</dl></Modal>}
    {["products", "offers"].includes(selected?.kind) && <Editor kind={selected.kind} item={selected.item} busy={busy} onClose={() => !busy && setSelected(null)} onSave={body => mutate("/api/admin/" + selected.kind + (selected.item ? "/" + selected.item._id : ""), body, "Saved successfully.", selected.item ? "PATCH" : "POST")} />}
  </div>;
}

function OrdersTable({ orders, onOrder }) {
  return <div className="table-scroll"><table><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Fulfilment</th><th /></tr></thead><tbody>{orders.map(order => <tr key={order._id}><td><strong>{order.orderNumber}</strong><small>{date(order.createdAt)}</small></td><td><strong>{order.customer.name}</strong><small>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items · {order.shippingAddress.city}</small></td><td className="money">{money(order.total)}<small>{money(order.amountPaid)} received</small></td><td><Badge value={order.paymentStatus} /></td><td><Badge value={order.orderStatus} /></td><td><button className="table-open" aria-label={"View order " + order.orderNumber} onClick={() => onOrder(order)}>View order <span>↗</span></button></td></tr>)}</tbody></table></div>;
}
function Overview({ data, onOrder }) {
  const totals = data.totals;
  const metrics = [{ name: "Total collected", value: money(totals.collected), note: "Received, less verified refunds", icon: "payments", tone: "sage" }, { name: "Total orders", value: totals.orders, note: "All orders, including pending", icon: "orders", tone: "lavender" }, { name: "Ready to fulfil", value: totals.toShip, note: "Placed, confirmed & packed", icon: "products", tone: "peach" }, { name: "Outstanding balance", value: money(totals.outstanding), note: "To collect on accepted orders", icon: "clock", tone: "sand" }];
  const series = Array.from({ length: 30 }, (_, i) => { const day = new Date(new Date(data.updatedAt).getTime() - (29 - i) * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); return { day, amount: data.trend.find(item => item._id === day)?.amount || 0 }; });
  const max = Math.max(1, ...series.map(item => item.amount)), total = series.reduce((sum, item) => sum + item.amount, 0);
  return <>
    <div className="metric-grid">{metrics.map(metric => <article key={metric.name} className={"metric-card " + metric.tone}><div><span>{metric.name}</span><span className="metric-icon"><Icon name={metric.icon} /></span></div><h2>{metric.value}</h2><p>{metric.note}</p></article>)}</div>
    <div className="overview-middle"><section className="admin-panel revenue-panel"><div className="panel-heading"><div><h2>Payments received</h2><p>Actual collections over the last 30 days</p></div><span className="chart-period"><Icon name="clock" size={14} />Last 30 days</span></div><div className="chart-total">{money(total)} <span>collected</span></div><div className="chart-wrap"><div className="chart-y"><span>{money(max)}</span><span>{money(max / 2)}</span><span>₹0</span></div><div className="bar-chart" role="img" aria-label={`Payments collected over 30 days: ${money(total)}. ${series.filter(item => item.amount > 0).map(item => item.day + ": " + money(item.amount)).join("; ") || "No payments yet."}`}>{series.map(item => <div key={item.day} className="chart-bar-slot"><div className="chart-bar" style={{ height: item.amount ? Math.max(2, item.amount / max * 100) + "%" : "2px", opacity: item.amount ? 1 : 0.15 }} title={item.day + ": " + money(item.amount)} /></div>)}</div></div><div className="chart-x"><span>{series[0].day}</span><span>{series[14].day}</span><span>Today</span></div></section>
    <section className="admin-panel attention-panel"><div className="panel-heading"><h2>A little attention</h2><span className="attention-dot" /></div><p className="attention-intro">Keep things moving, one order at a time.</p><Link href="/admin?view=orders"><span className="attention-icon peach"><Icon name="orders" /></span><div><strong>Orders to prepare</strong><small>Ready for their next chapter</small></div><b>{totals.toShip}</b><span>→</span></Link><Link href="/admin?view=orders"><span className="attention-icon lavender"><Icon name="payments" /></span><div><strong>Awaiting payment</strong><small>Check before fulfilment</small></div><b>{totals.pendingPayments}</b><span>→</span></Link><Link href="/admin?view=products"><span className="attention-icon sage"><Icon name="products" /></span><div><strong>Published products</strong><small>Available in your store</small></div><b>{data.products}</b><span>→</span></Link><div className="attention-note"><Icon name="check" size={16} /><span>Your dashboard uses real store records.</span></div></section></div>
    <section className="admin-panel"><div className="panel-heading"><div><h2>Recent orders</h2><p>The latest from your store</p></div><Link className="text-button" href="/admin?view=orders">View all orders →</Link></div>{data.recent.length ? <OrdersTable orders={data.recent} onOrder={onOrder} /> : <Empty view="orders" />}</section>
  </>;
}

function OrderDetail({ order, onClose, busy, onSave }) {
  const [status, setStatus] = useState(order.orderStatus);
  const outstanding = Math.max(0, order.total - (order.amountPaid || 0));
  function submit(event) { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); onSave({ ...body, updatedAt: order.updatedAt }); }
  return <Modal title={order.orderNumber} onClose={onClose} wide><div className="order-detail"><div className="order-detail-top"><Badge value={order.orderStatus} /><Badge value={order.paymentStatus} /><span>Placed {date(order.createdAt)}</span></div><div className="order-detail-columns"><section><h3>Customer & delivery</h3><p><strong>{order.customer.name}</strong><br /><a href={"mailto:" + order.customer.email}>{order.customer.email}</a><br /><a href={"tel:" + order.customer.phone}>{order.customer.phone}</a></p><p>{order.shippingAddress.addressLine1}<br />{order.shippingAddress.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}{order.shippingAddress.city}, {order.shippingAddress.state}<br />India · {order.shippingAddress.pincode}</p><small>Customer ID: {order.userId}</small></section><section><h3>Payment summary</h3><dl className="summary-lines">{[["Subtotal", money(order.subtotal)], ["Discount" + (order.offerCode ? " · " + order.offerCode : ""), "−" + money(order.discount)], ["Shipping", money(order.shipping)], ["Order total", money(order.total)], ["Received", money(order.amountPaid)], ["Refunded", money(order.amountRefunded)], ["Outstanding", money(outstanding)]].map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><p className="muted">{label(order.paymentOption || order.paymentMethod)} · Due online {money(order.amountDueNow)}</p>{order.cashfreeOrderId && <><small className="break-all">Cashfree: {order.cashfreeOrderId}<br />Gateway status: {order.cashfreeOrderStatus}</small><button type="button" className="admin-button" disabled={busy} onClick={() => onSave({ action: "reconcile" })}><Icon name="refresh" size={15} />{busy ? "Refreshing…" : "Refresh payment"}</button></>}</section></div>
    <h3>Ordered items</h3><div className="order-items">{order.items.map((item, index) => <div key={index}><div className="product-thumb"><MediaImage src={item.image} alt={item.name} fill sizes="44px" className="object-cover" /></div><div><strong>{item.name}</strong><small>{item.size} · Qty {item.quantity} · {money(item.price)} each</small><small>Product ID: {item.productId}</small></div><b>{money(item.total)}</b></div>)}</div>
    <form onSubmit={submit}><h3>Fulfilment details</h3><div className="editor-grid"><label>Order status<select name="orderStatus" value={status} onChange={event => setStatus(event.target.value)}>{[order.orderStatus, ...(orderTransitions[order.orderStatus] || [])].map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label><label>Courier<input name="courier" defaultValue={order.courier} maxLength={100} required={status === "shipped"} placeholder="Courier name" /></label><label>Tracking number<input name="trackingNumber" defaultValue={order.trackingNumber} maxLength={100} required={status === "shipped"} placeholder="Shipment tracking number" /></label><label className="full-width">Internal notes<textarea name="adminNotes" defaultValue={order.adminNotes} maxLength={3000} rows={3} placeholder="Packing instructions, follow-ups, or delivery notes…" /></label></div>{status === "cancelled" && order.amountPaid > 0 && <p className="admin-error">Cancelling changes fulfilment only. Arrange any refund in Cashfree, then reconcile the payment record.</p>}<div className="editor-actions"><button type="button" className="admin-button" onClick={onClose} disabled={busy}>Close</button><button className="admin-button primary" disabled={busy}>{busy ? "Saving…" : "Save order"}</button></div></form>
    {outstanding > 0 && ["shipped", "delivered"].includes(order.orderStatus) && !order.amountRefunded && <form onSubmit={event => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); onSave({ action: "collect_delivery", amount: Number(values.amount), reference: values.reference, updatedAt: order.updatedAt }); }}><h3>Record delivery payment</h3><p>Record money already received from the customer or courier.</p><div className="editor-grid"><label>Amount collected (₹)<input type="number" name="amount" min="0.01" step="0.01" required defaultValue={outstanding} /></label><label>Receipt or courier reference<input name="reference" required maxLength={150} /></label></div><button disabled={busy} className="admin-button primary">Record collection</button></form>}
    {order.deliveryPayment?.collectedAt && <p>Delivery collection: {money(order.deliveryPayment.amount)} · {order.deliveryPayment.reference} · {date(order.deliveryPayment.collectedAt)}</p>}
    <h3>Order timeline</h3><ol className="order-timeline">{(order.statusHistory?.length ? order.statusHistory : [{ status: order.orderStatus, note: "Existing order", at: order.createdAt }]).map((entry, index) => <li key={index}><span /><div><strong>{label(entry.status)}</strong><p>{entry.note}</p><small>{date(entry.at)} · {entry.actor || "Store"}</small></div></li>)}</ol><dl className="detail-grid">{[["Paid at", order.paidAt], ["Delivered at", order.deliveredAt], ["Cancelled at", order.cancelledAt], ["Last updated", order.updatedAt]].map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{date(value)}</dd></div>)}</dl>
  </div></Modal>;
}

function Editor({ kind, item, busy, onClose, onSave }) {
  const product = kind === "products";
  const initial = item || (product ? { active: false, price: "", oldPrice: 0, sizes: ["Small", "Medium", "Large"] } : { type: "percentage", value: "", minOrder: 0, maxDiscount: 0, active: false });
  const [type, setType] = useState(initial.type || "percentage");
  async function submit(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const body = Object.fromEntries(form); body.active = form.has("active");
    if (!product) { body.startsAt = body.startsAt ? new Date(body.startsAt).toISOString() : null; body.endsAt = body.endsAt ? new Date(body.endsAt).toISOString() : null; }
    await onSave(body);
  }
  const field = (name, title, options = {}) => <label key={name} className={options.full ? "full-width" : ""}>{title}<input name={name} defaultValue={initial[name] ?? ""} type={options.type || "text"} required={options.required} min={options.min} max={options.max} step={options.type === "number" ? "0.01" : undefined} maxLength={options.maxLength || 180} placeholder={options.placeholder} /></label>;
  const area = (name, title, placeholder) => <label key={name} className="full-width">{title}<textarea name={name} rows={3} defaultValue={Array.isArray(initial[name]) ? initial[name].join("\n") : initial[name] || ""} placeholder={placeholder} maxLength={5000} /></label>;
  const localDate = value => { if (!value) return ""; const d = new Date(value); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
  return <Modal title={(item ? "Edit " : "New ") + (product ? "product" : "offer")} onClose={onClose} wide><form className="editor-form" onSubmit={submit}><p className="muted">{product ? "Product details appear in your store as soon as you publish." : "Discounts are validated on the server at checkout. Dates use your local time."}</p><div className="editor-grid">{product ? <>
    {field("name", "Product name", { required: true, full: true })}{field("slug", "URL slug", { required: true, placeholder: "monstera-frame-black" })}{field("sku", "SKU")}{field("collection", "Collection")}{field("color", "Colour")}{field("plantType", "Plant type")}{field("price", "Selling price (₹)", { type: "number", required: true, min: 1 })}{field("oldPrice", "Original price (₹)", { type: "number", min: 0 })}
    {area("description", "Description")}{area("sizes", "Sizes · one per line", "Small\nMedium\nLarge")}{area("images", "Image paths · one per line", "/images/products/your-product.jpg")}{area("features", "Features · one per line")}{area("materials", "Materials · one per line")}{area("care", "Care instructions · one per line")}<label className="full-width">Dimensions by size (JSON)<textarea name="dimensions" rows={3} defaultValue={JSON.stringify(initial.dimensions || {}, null, 2)} placeholder={'{"Small": "30 × 30 cm"}'} /></label>{item && <p className="muted full-width">Reviews: {item.reviewCount || 0} · Rating: {item.rating || "Unrated"}. Existing review fields are preserved.</p>}
    </> : <>{field("title", "Offer title", { required: true })}{field("code", "Checkout code", { required: true, maxLength: 30, placeholder: "WELCOME10" })}{area("description", "Description")}<label>Discount type<select name="type" value={type} onChange={event => setType(event.target.value)}><option value="percentage">Percentage off</option><option value="fixed">Fixed amount off</option></select></label>{field("value", type === "percentage" ? "Discount (%)" : "Discount (₹)", { type: "number", required: true, min: 0.01, max: type === "percentage" ? 100 : 100000 })}{field("minOrder", "Minimum order (₹)", { type: "number", min: 0 })}{field("maxDiscount", "Discount cap (₹) · 0 = no cap", { type: "number", min: 0 })}<label>Starts at<input type="datetime-local" name="startsAt" defaultValue={localDate(initial.startsAt)} /></label><label>Ends at<input type="datetime-local" name="endsAt" defaultValue={localDate(initial.endsAt)} /></label></>}
    <label className="checkbox-label full-width"><input name="active" type="checkbox" defaultChecked={initial.active} />{product ? "Publish this product in the store" : "Enable this offer"}</label></div><div className="editor-actions"><button type="button" className="admin-button" onClick={onClose} disabled={busy}>Cancel</button><button className="admin-button primary" disabled={busy}>{busy ? <><span className="spinner" /> Saving…</> : "Save " + (product ? "product" : "offer")}</button></div></form></Modal>;
}
