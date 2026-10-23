import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { formatLabel, formatPrice } from "../../data/products";
import { orderService } from "../../shared/api/services/orderService";
import { paymentService } from "../../shared/api/services/paymentService";
import { userService } from "../../shared/api/services/userService";
import { StripeCheckoutModal } from "./components/StripeCheckoutModal";
import { AlbumCover } from "../../shared/ui/AlbumCover";
import { Button } from "../../shared/ui/Button";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Price } from "../../shared/ui/Price";

export function CartPage() {
  const { items, total, updateQuantity, removeItem, clear } = useCart();
  const { user } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState(
    "Av. Insurgentes Sur 1450, Col. Actipan, CDMX"
  );

  useEffect(() => {
    if (user) {
      userService
        .getProfile()
        .then((profile) => {
          const pref = profile.preferences;
          if (pref && pref.default_address_line1) {
            const formatted = [
              pref.default_address_line1,
              pref.default_address_line2,
              pref.default_city,
              pref.default_state,
              pref.default_postal_code,
              pref.default_country,
            ]
              .filter(Boolean)
              .join(", ");
            if (formatted) {
              setShippingAddress(formatted);
            }
          }
        })
        .catch(() => {
          // Si falla, se conserva la dirección por defecto
        });
    }
  }, [user]);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripeAmount, setStripeAmount] = useState<number>(0);
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);

  if (!items.length) {
    return (
      <EmptyState title="Tu carrito está vacío">
        <Link to="/catalogo" className="text-accent">
          Ir al catálogo
        </Link>
      </EmptyState>
    );
  }

  async function handleCheckout() {
    if (!user) {
      push("Por favor inicia sesión para procesar y rastrear tu pedido");
      navigate("/iniciar-sesion");
      return;
    }

    const userId = user.user_id || user.userId;
    if (!userId) {
      push("No se pudo identificar tu cuenta de usuario");
      return;
    }

    setIsSubmitting(true);
    try {
      if (paymentMethod === "credit_card" || paymentMethod === "stripe") {
        // Flujo oficial con Stripe: Creamos la intención de pago
        const intent = await paymentService.createIntent({
          userId,
          shippingAddress,
          shippingMethod: "Envío Estándar Disc Market",
        });

        setStripeClientSecret(intent.clientSecret);
        setStripeAmount(intent.amount);
        setIsStripeModalOpen(true);
      } else {
        // Flujo alternativo para otros métodos
        const response = await orderService.checkout({
          userId,
          paymentMethod,
          shippingAddress,
          shippingMethod: "Envío Estándar Disc Market",
        });

        await clear();
        push("¡Compra realizada con éxito!");
        navigate("/pedido/ok", {
          state: {
            orderId: response.order_id,
            trackingNumber: response.tracking_number,
            totalAmount: response.total_amount,
          },
        });
      }
    } catch (err: any) {
      console.error("Error al procesar checkout:", err);
      push(err.message || "Ocurrió un error al procesar tu compra");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleStripeSuccess = async (orderData: {
    orderId: number;
    trackingNumber: string;
    totalAmount: number;
  }) => {
    setIsStripeModalOpen(false);
    await clear();
    push("¡Pago procesado exitosamente con Stripe!");
    navigate("/pedido/ok", {
      state: {
        orderId: orderData.orderId,
        trackingNumber: orderData.trackingNumber,
        totalAmount: orderData.totalAmount,
      },
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="space-y-4">
        <h1 className="font-display text-4xl">Carrito</h1>
        {items.map((item) => (
          <article
            key={item.id}
            className="flex gap-4 rounded-2xl border border-line bg-card p-4 transition-all"
          >
            <AlbumCover
              cover={item.cover}
              imageUrl={item.imageUrl}
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
                {item.customSummary ? (
                  <p className="mt-1 text-xs text-muted">{item.customSummary}</p>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                {item.customId ? (
                  <span className="text-sm text-muted">1 pieza exclusiva</span>
                ) : (
                  <label className="text-sm text-muted">
                    Cantidad{" "}
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                      className="ml-2 w-16 rounded-lg border border-line bg-ink px-2 py-1 text-center"
                    />
                  </label>
                )}
                <Price value={item.unitPrice * item.quantity} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="self-start text-sm text-muted hover:text-vinyl transition-colors cursor-pointer"
            >
              Quitar
            </button>
          </article>
        ))}
      </section>

      <aside className="h-fit rounded-2xl border border-line bg-ink-soft p-5 space-y-4">
        <h2 className="font-display text-2xl">Resumen</h2>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Envío</dt>
            <dd className="text-accent font-medium">Gratis (Promoción)</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd>
              <Price value={total} />
            </dd>
          </div>
        </dl>

        {user ? (
          <div className="space-y-3 pt-2 border-t border-line">
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">
                Dirección de entrega
              </label>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">
                Método de pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent"
              >
                <option value="credit_card">💳 Tarjeta (Crédito / Débito) vía Stripe</option>
                <option value="spei">🏦 Transferencia SPEI (Simulación)</option>
                <option value="paypal">🅿️ PayPal (Simulación)</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-line/60 bg-card/60 p-3 text-xs text-muted">
            <p>💡 Inicia sesión para guardar tu orden y obtener tu número de rastreo oficial.</p>
            <Link
              to="/iniciar-sesion"
              className="mt-1 inline-block font-medium text-accent hover:underline"
            >
              Iniciar sesión aquí →
            </Link>
          </div>
        )}

        <Button
          className="w-full mt-2"
          onClick={handleCheckout}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Conectando con pasarela..."
            : paymentMethod === "credit_card"
            ? "Pagar con Stripe"
            : "Confirmar pedido"}
        </Button>
        <p className="text-center text-xs text-muted">
          {paymentMethod === "credit_card"
            ? "🔒 Pago encriptado procesado directamente por Stripe."
            : "Transacción simulada conectada a la base de datos PostgreSQL."}
        </p>
      </aside>

      <StripeCheckoutModal
        isOpen={isStripeModalOpen}
        onClose={() => setIsStripeModalOpen(false)}
        clientSecret={stripeClientSecret || ""}
        amount={stripeAmount || total}
        onSuccess={handleStripeSuccess}
      />
    </div>
  );
}

export function OrderOkPage() {
  const location = useLocation();
  const state = location.state as
    | { orderId?: number; trackingNumber?: string; totalAmount?: number }
    | undefined;

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-line bg-card p-8 text-center shadow-2xl">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <p className="text-sm tracking-widest text-accent uppercase font-semibold">
        {state?.orderId ? `Pedido #${state.orderId} confirmado` : "Pedido Confirmado"}
      </p>
      <h1 className="font-display mt-2 text-4xl">¡Listo! Tu orden está en marcha.</h1>

      {state?.trackingNumber ? (
        <div className="my-6 space-y-3 rounded-2xl border border-line bg-ink/50 p-5 text-left">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Número de pedido:</span>
            <span className="font-mono font-medium text-foreground">#{state.orderId}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Número de rastreo:</span>
            <span className="font-mono text-accent font-semibold">{state.trackingNumber}</span>
          </div>
          {state.totalAmount !== undefined ? (
            <div className="flex justify-between items-center text-sm border-t border-line/60 pt-2">
              <span className="text-muted">Total pagado:</span>
              <span className="font-bold text-foreground">{formatPrice(state.totalAmount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between items-center text-xs text-muted pt-1">
            <span>Estado del envío:</span>
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-accent text-xs">
              En preparación (3 a 5 días hábiles)
            </span>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-muted">
          Confirmamos tu compra. Pronto recibirás actualizaciones sobre el envío de tus discos.
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/catalogo">
          <Button>Seguir explorando catálogo</Button>
        </Link>
      </div>
    </div>
  );
}
