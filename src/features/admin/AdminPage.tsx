import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService, type AdminProduct, type AdminUser, type AdminOrder, type AdminSummary } from '../../shared/api/services/adminService';

type Tab = 'inventory' | 'users' | 'orders';
const money = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(value);
const date = (value: string) => new Date(value).toLocaleString('es-MX');
const inputStyle = 'w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-accent';
const buttonStyle = 'rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-ink transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50';
const labels: Record<string, string> = {
  pending: 'Pendiente', processing: 'En preparación', shipped: 'Enviado', delivered: 'Entregado',
  cancelled: 'Cancelado', paid: 'Pagado', unpaid: 'Sin pagar', refunded: 'Reembolsado',
  customer: 'Cliente', admin: 'Administrador', inventory_manager: 'Inventario',
};

function StockForm({ product, onUpdated }: { product: AdminProduct; onUpdated: () => void }) {
  const [quantity, setQuantity] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    const amount = Number(quantity);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000) {
      setError('Indica una cantidad entera de 1 a 1,000,000.'); return;
    }
    setBusy(true); setError(''); setSuccess('');
    try {
      await adminService.addStock(product.product_id, amount);
      setSuccess(`Se añadieron ${amount} unidades.`); setQuantity(''); onUpdated();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo añadir stock.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="min-w-52 space-y-2">
    <div className="flex gap-2">
      <input aria-label={`Unidades para ${product.name}`} type="number" min="1" max="1000000" step="1" required
        className={`${inputStyle} max-w-28`} value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Unidades" disabled={busy} />
      <button className={buttonStyle} disabled={busy}>{busy ? 'Guardando…' : 'Añadir'}</button>
    </div>
    {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
    {success && <p role="status" className="text-xs text-ok">{success}</p>}
  </form>;
}

export function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('inventory');
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [summaryError, setSummaryError] = useState('');
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [dates, setDates] = useState({ from: '', to: '' });
  const [draftDates, setDraftDates] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const isAdmin = !authLoading && user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    setSummaryLoading(true); setSummaryError('');
    adminService.summary(dates).then(data => { if (active) setSummary(data); })
      .catch(err => { if (active) { setSummary(null); setSummaryError(err.message || 'No se pudo cargar el resumen.'); } })
      .finally(() => { if (active) setSummaryLoading(false); });
    return () => { active = false; };
  }, [isAdmin, dates, reload]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    setLoading(true); setError('');
    const filters = { page, search, ...(tab === 'orders' ? dates : {}) };
    const request = tab === 'inventory' ? adminService.products(filters) : tab === 'users' ? adminService.users(filters) : adminService.orders(filters);
    request.then(data => {
      if (!active) return;
      setTotal(data.total);
      if (tab === 'inventory') setProducts(data.items as AdminProduct[]);
      if (tab === 'users') setUsers(data.items as AdminUser[]);
      if (tab === 'orders') setOrders(data.items as AdminOrder[]);
    }).catch(err => { if (active) setError(err.message || 'No se pudieron cargar los datos.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAdmin, tab, page, search, dates, reload]);

  if (authLoading) return <p role="status">Verificando acceso…</p>;
  if (!user) return <Navigate to="/iniciar-sesion" replace />;
  if (user.role !== 'admin') return <section className="rounded-3xl border border-line bg-card p-8">
    <h1 className="font-display text-2xl">Acceso restringido</h1>
    <p className="mt-3 text-muted">Esta sección requiere una cuenta administradora.</p>
    <Link to="/perfil" className="mt-5 inline-block text-accent">Volver a mi perfil</Link>
  </section>;

  const maxPages = Math.max(1, Math.ceil(total / 20));
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-widest text-accent">Administración</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">Hola, {user.name}</h1>
        <p className="mt-2 text-muted">Consulta ventas y clientes, y mantén el inventario al día.</p></div>
      <button onClick={() => setReload(n => n + 1)} className="rounded-xl border border-line px-4 py-2 text-sm hover:border-accent">Actualizar datos</button>
    </header>

    <section aria-label="Resumen de ventas" className="space-y-4 rounded-3xl border border-line bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="font-display text-xl">Resumen de ventas</h2>
          <p className="mt-1 text-xs text-muted">Importes en USD. Solo pedidos pagados y no cancelados. Fechas en UTC.</p></div>
        <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); setDates({ ...draftDates }); setPage(1); }}>
          <label className="text-xs text-muted">Desde<input type="date" className={`${inputStyle} mt-1`} value={draftDates.from}
            max={draftDates.to || undefined} onChange={e => setDraftDates(d => ({ ...d, from: e.target.value }))} /></label>
          <label className="text-xs text-muted">Hasta<input type="date" className={`${inputStyle} mt-1`} value={draftDates.to}
            min={draftDates.from || undefined} onChange={e => setDraftDates(d => ({ ...d, to: e.target.value }))} /></label>
          <button className={buttonStyle}>Aplicar</button>
          <button type="button" className="px-2 py-2 text-sm text-muted hover:text-cream" onClick={() => {
            setDraftDates({ from: '', to: '' }); setDates({ from: '', to: '' }); setPage(1);
          }}>Todo el historial</button>
        </form>
      </div>
      {summaryError && <p role="alert" className="text-red-300">{summaryError}</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy={summaryLoading}>
        {[
          ['Ventas pagadas', summary ? money(summary.revenue) : '—'],
          ['Pedidos pagados', summary?.paid_orders ?? '—'],
          ['Ticket promedio', summary ? money(summary.average_order) : '—'],
          ['Pedidos del período', summary?.total_orders ?? '—'],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-line bg-ink p-4">
          <p className="text-xs text-muted">{label}</p><p className="mt-2 break-words font-display text-2xl">{summaryLoading ? '…' : value}</p>
        </div>)}
      </div>
      {summary && <p className="text-sm text-muted">Totales generales: {summary.users} usuarios · {summary.products} productos · <span className="text-accent">{summary.low_stock} productos con 5 unidades o menos</span></p>}
    </section>

    <section className="overflow-hidden rounded-3xl border border-line bg-card">
      <div className="flex flex-wrap gap-2 border-b border-line p-4" aria-label="Secciones de administración">
        {([['inventory', 'Inventario'], ['users', 'Usuarios'], ['orders', 'Ventas y pedidos']] as const).map(([key, label]) =>
          <button key={key} aria-pressed={tab === key} className={`rounded-xl px-4 py-2 text-sm ${tab === key ? 'bg-accent text-ink font-semibold' : 'text-muted hover:text-cream'}`}
            onClick={() => { setTab(key); setPage(1); setSearch(''); setSearchInput(''); }}>{label}</button>)}
      </div>
      <div className="p-4 sm:p-6">
        <form className="mb-5 flex max-w-xl gap-2" onSubmit={e => { e.preventDefault(); setSearch(searchInput.trim()); setPage(1); }}>
          <label className="flex-1"><span className="sr-only">Buscar en {tab === 'inventory' ? 'inventario' : tab === 'users' ? 'usuarios' : 'pedidos'}</span>
            <input className={inputStyle} value={searchInput} maxLength={150} onChange={e => setSearchInput(e.target.value)}
              placeholder={tab === 'inventory' ? 'Producto o artista' : tab === 'users' ? 'Nombre o correo' : 'Cliente, correo o número de pedido'} /></label>
          <button className={buttonStyle}>Buscar</button>
        </form>
        {loading ? <p role="status" className="py-8 text-muted">Cargando datos…</p> : error ?
          <div role="alert" className="rounded-xl border border-red-400/40 p-4 text-red-300">{error}<button className="ml-4 underline" onClick={() => setReload(n => n + 1)}>Reintentar</button></div> : <>
          {total === 0 ? <p className="py-10 text-center text-muted">No hay resultados para esta consulta.</p> : <>
            {tab === 'inventory' && <div className="overflow-x-auto"><table className="w-full text-left text-sm">
              <caption className="sr-only">Inventario y entrada de stock</caption>
              <thead className="text-xs text-muted"><tr>{['Producto', 'Precio USD', 'Disponible', 'Reservado', 'Entrada de stock'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead>
              <tbody>{products.map(p => <tr key={p.product_id} className="border-t border-line">
                <td className="p-3"><p className="font-semibold">{p.name}</p><p className="text-xs text-muted">{p.artist} · {p.format} · #{p.product_id}</p></td>
                <td className="whitespace-nowrap p-3">{money(p.price)}</td>
                <td className={`p-3 font-semibold ${(p.inventory?.quantity_available ?? 0) <= 5 ? 'text-accent' : 'text-ok'}`}>{p.inventory?.quantity_available ?? 0}</td>
                <td className="p-3 text-muted">{p.inventory?.quantity_reserved ?? 0}</td>
                <td className="p-3"><StockForm product={p} onUpdated={() => setReload(n => n + 1)} /></td>
              </tr>)}</tbody>
            </table></div>}
            {tab === 'users' && <div className="overflow-x-auto"><table className="w-full text-left text-sm">
              <caption className="sr-only">Usuarios registrados y compras</caption>
              <thead className="text-xs text-muted"><tr>{['Usuario', 'Contacto', 'Rol', 'Registro', 'Pedidos', 'Compras pagadas USD'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead>
              <tbody>{users.map(u => <tr key={u.user_id} className="border-t border-line">
                <td className="p-3"><p className="font-semibold">{u.name}</p><p className="text-xs text-muted">#{u.user_id}</p></td>
                <td className="p-3"><p>{u.email}</p><p className="text-xs text-muted">{u.phone || 'Sin teléfono'}</p></td>
                <td className="p-3">{labels[u.role] || u.role}</td><td className="whitespace-nowrap p-3 text-muted">{date(u.created_at)}</td>
                <td className="p-3">{u.order_count}</td><td className="whitespace-nowrap p-3">{money(u.total_spent)}</td>
              </tr>)}</tbody>
            </table></div>}
            {tab === 'orders' && <div className="space-y-3">{orders.map(o => <details key={o.order_id} className="rounded-2xl border border-line bg-ink p-4">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                <div><span className="font-semibold">Pedido #{o.order_id}</span><p className="mt-1 text-xs text-muted">{o.user?.name || 'Usuario no disponible'} · {date(o.created_at)}</p></div>
                <div className="flex flex-wrap items-center gap-3 text-sm"><span className="rounded-full border border-line px-3 py-1">{labels[o.order_status] || o.order_status}</span>
                  <span className={o.payment_status === 'paid' ? 'text-ok' : 'text-accent'}>{labels[o.payment_status] || o.payment_status}</span>
                  <strong>{money(o.total_amount)} USD</strong><span aria-hidden="true">⌄</span></div>
              </summary>
              <div className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
                <p className="break-all text-muted">{o.user?.email}</p>
                <ul className="space-y-2">{o.order_items.map(i => <li key={i.order_item_id} className="flex justify-between gap-3">
                  <span>{i.quantity} × {i.product?.name || i.custom_product?.title || 'Producto eliminado'}</span><span className="whitespace-nowrap">{money(i.quantity * i.unit_price)}</span>
                </li>)}</ul>
                <p className="break-all text-xs text-muted">Pago: {o.payment?.payment_method || 'Sin registro'}{o.payment?.transaction_id ? ` · ${o.payment.transaction_id}` : ''}</p>
                <p className="text-xs text-muted">Envío: {o.shipping?.shipping_method || 'Sin registro'} · Guía: {o.shipping?.tracking_number || 'Sin asignar'}</p>
              </div>
            </details>)}</div>}
          </>}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm">
            <p className="text-muted">{total} resultados · Página {page} de {maxPages}</p>
            <div className="flex gap-2"><button className="rounded-xl border border-line px-3 py-2 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
              <button className="rounded-xl border border-line px-3 py-2 disabled:opacity-40" disabled={page >= maxPages} onClick={() => setPage(p => p + 1)}>Siguiente</button></div>
          </div>
        </>}
      </div>
    </section>
  </div>;
}
