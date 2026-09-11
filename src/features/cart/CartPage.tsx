import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { formatLabel, formatPrice } from "../../data/products";
import { AlbumCover } from "../../shared/ui/AlbumCover";
import { Button } from "../../shared/ui/Button";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Price } from "../../shared/ui/Price";

export function CartPage() {
  const { items, total, updateQuantity, removeItem, clear } = useCart();
  const { push } = useToast();
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <EmptyState title="Tu carrito está vacío">
        <Link to="/catalogo" className="text-accent">
          Ir al catálogo
        </Link>
      </EmptyState>
    );
  }

  function checkout() {
    clear();
    push("Pedido confirmado (pago simulado)");
    navigate("/pedido/ok");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-4">
        <h1 className="font-display text-4xl">Carrito</h1>
        {items.map((item) => (
          <article key={item.id} className="flex gap-4 rounded-2xl border border-line bg-card p-3">
            <AlbumCover
              cover={item.cover}
              title={item.name}
              artist={item.artist}
              className="w-24 shrink-0 rounded-xl"
            />
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <h2 className="font-display text-lg">{item.name}</h2>
                <p className="text-sm text-muted">
                  {item.artist ?? "Personalizado"} · {formatLabel[item.format]}
                </p>
                {item.customSummary ? <p className="mt-1 text-xs text-muted">{item.customSummary}</p> : null}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                {item.customId ? (
                  <span className="text-sm text-muted">1 pieza</span>
                ) : (
                  <label className="text-sm text-muted">
                    Cantidad{" "}
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                      className="ml-2 w-16 rounded-lg border border-line bg-ink px-2 py-1"
                    />
                  </label>
                )}
                <Price value={item.unitPrice * item.quantity} />
              </div>
            </div>
            <button type="button" onClick={() => removeItem(item.id)} className="self-start text-sm text-muted hover:text-vinyl">
              Quitar
            </button>
          </article>
        ))}
      </section>

      <aside className="h-fit rounded-2xl border border-line bg-ink-soft p-5">
        <h2 className="font-display text-2xl">Resumen</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Envío</dt>
            <dd>Se calcula al pagar</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base">
            <dt>Total</dt>
            <dd>
              <Price value={total} />
            </dd>
          </div>
        </dl>
        <Button className="mt-5 w-full" onClick={checkout}>
          Ir a pagar
        </Button>
        <p className="mt-3 text-center text-xs text-muted">Pago simulado para el prototipo.</p>
      </aside>
    </div>
  );
}

export function OrderOkPage() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-line bg-card p-8 text-center">
      <p className="text-sm tracking-widest text-accent uppercase">Pedido</p>
      <h1 className="font-display mt-2 text-4xl">Listo. Ya estamos armando tu disco.</h1>
      <p className="mt-3 text-muted">
        Confirmamos tu compra de prueba. En la versión final aquí verás el número de pedido y el envío.
      </p>
      <Link to="/catalogo" className="mt-6 inline-block">
        <Button>Seguir explorando</Button>
      </Link>
    </div>
  );
}
