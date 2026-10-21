import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../../../data/products";
import { userService } from "../../../shared/api/services/userService";
import type { BackendOrder } from "../../../shared/api/types";
import { AlbumCover } from "../../../shared/ui/AlbumCover";
import { Button } from "../../../shared/ui/Button";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { Price } from "../../../shared/ui/Price";

const STATUS_LABELS: Record<string, { label: string; style: string }> = {
  pending: { label: "Pendiente", style: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  processing: { label: "En Preparación", style: "bg-accent/15 text-accent border-accent/30" },
  shipped: { label: "Enviado / En Camino", style: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  delivered: { label: "Entregado", style: "bg-ok/15 text-ok border-ok/30" },
  cancelled: { label: "Cancelado", style: "bg-vinyl/15 text-vinyl border-vinyl/30" },
};

export function OrderHistoryTab() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  useEffect(() => {
    userService
      .getOrders()
      .then((data) => setOrders(data))
      .catch((err) => console.error("Error al cargar pedidos:", err))
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
    setCopiedTracking(trackingNumber);
    setTimeout(() => {
      setCopiedTracking(null);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-44 w-full animate-pulse rounded-2xl border border-line bg-card/60" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState title="Aún no tienes pedidos registrados">
        <p className="text-sm text-muted mb-4">
          Tus compras de vinilos, CDs de catálogo y discos personalizados aparecerán aquí.
        </p>
        <Link to="/catalogo">
          <Button>Explorar Catálogo</Button>
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">
          Historial de Pedidos ({orders.length})
        </h2>
        <span className="text-xs text-muted">
          Rastreo de envíos y comprobantes en tiempo real
        </span>
      </div>

      {orders.map((order) => {
        const statusMeta = STATUS_LABELS[order.order_status] || {
          label: order.order_status,
          style: "bg-muted/15 text-muted border-line",
        };

        const formattedDate = new Date(order.created_at).toLocaleDateString("es-MX", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const trackingNumber = order.shipping?.tracking_number;

        return (
          <article
            key={order.order_id}
            className="overflow-hidden rounded-2xl border border-line bg-card transition-all hover:border-line/80 shadow-md"
          >
            {/* Header del Pedido */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 bg-ink/60 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-accent text-sm">
                  #{order.order_id}
                </span>
                <span className="text-xs text-muted">{formattedDate}</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${statusMeta.style}`}
                >
                  {statusMeta.label}
                </span>
                <span className="inline-flex rounded-full bg-cream/10 px-2 py-0.5 text-[11px] text-cream">
                  {order.payment_status === "paid" ? "💳 Pagado" : "Pendiente de pago"}
                </span>
              </div>
            </div>

            {/* Número de Guía y Envío */}
            {trackingNumber ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/40 bg-accent/5 px-5 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted">Guía de rastreo:</span>
                  <span className="font-mono font-bold text-accent">{trackingNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(trackingNumber)}
                  className="rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/20 cursor-pointer"
                >
                  {copiedTracking === trackingNumber ? "✓ ¡Copiado!" : "Copiar número de guía"}
                </button>
              </div>
            ) : null}

            {/* Desglose de Artículos */}
            <div className="divide-y divide-line/40 px-5">
              {order.order_items && order.order_items.length > 0 ? (
                order.order_items.map((item) => {
                  const isCustom = Boolean(item.custom_product);
                  const name =
                    item.product?.name ||
                    item.custom_product?.title ||
                    "Disco Musical";
                  const artist =
                    item.product?.artist ||
                    (isCustom ? "Edición Personalizada" : "Varios");
                  const format =
                    item.product?.format ||
                    item.custom_product?.format ||
                    "VINYL";

                  return (
                    <div
                      key={item.order_item_id}
                      className="flex items-center gap-4 py-3.5"
                    >
                      <AlbumCover
                        imageUrl={item.product?.image_url || item.custom_product?.cover_image}
                        title={name}
                        artist={artist}
                        className="h-16 w-16 shrink-0 rounded-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-display font-medium text-cream text-sm truncate">
                          {name}
                        </h4>
                        <p className="text-xs text-muted">
                          {artist} ·{" "}
                          <span className="font-semibold text-accent">{format}</span>
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          Cantidad: <span className="font-semibold text-cream">{item.quantity}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <Price value={Number(item.unit_price) * item.quantity} />
                        {item.quantity > 1 ? (
                          <span className="block text-[10px] text-muted">
                            ({formatPrice(Number(item.unit_price))} c/u)
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-4 text-xs text-muted italic">
                  Detalles de productos no disponibles para este pedido.
                </p>
              )}
            </div>

            {/* Footer con Total */}
            <div className="flex items-center justify-between border-t border-line/70 bg-ink/40 px-5 py-3">
              <span className="text-xs text-muted">Total de la orden:</span>
              <div className="text-base font-bold text-cream">
                <Price value={Number(order.total_amount)} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
