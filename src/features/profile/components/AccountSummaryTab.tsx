import type { ReactNode } from "react";
import { formatPrice } from "../../../data/products";
import type { BackendUserProfileResponse } from "../../../shared/api/types";

type TabKey = "personal" | "address" | "security" | "preferences" | "orders";

interface Props {
  profile: BackendUserProfileResponse | null;
  fallbackUser: { name?: string; email?: string; role?: string } | null;
  onEdit: (tab: TabKey) => void;
}

const formatNames: Record<string, string> = { CD: "CD", VINYL: "Vinilo", ALL: "Todos los formatos" };

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Módulo de solo lectura con la información de la cuenta del usuario.
 */
export function AccountSummaryTab({ profile, fallbackUser, onEdit }: Props) {
  const user = profile?.user;
  const prefs = profile?.preferences;
  const stats = profile?.stats;

  const address = [
    prefs?.default_address_line1,
    prefs?.default_address_line2,
    prefs?.default_city,
    prefs?.default_state,
    prefs?.default_postal_code,
    prefs?.default_country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Datos personales" onEdit={() => onEdit("personal")}>
        <Row label="Nombre" value={user?.name || fallbackUser?.name} />
        <Row label="Correo electrónico" value={user?.email || fallbackUser?.email} />
        <Row label="Teléfono" value={prefs?.phone} />
        <Row
          label="Tipo de cuenta"
          value={(user?.role || fallbackUser?.role) === "admin" ? "Administrador" : "Cliente"}
        />
        <Row label="Miembro desde" value={formatDate(user?.created_at)} />
      </Card>

      <Card title="Dirección de entrega" onEdit={() => onEdit("address")}>
        <Row label="Dirección predeterminada" value={address || null} />
      </Card>

      <Card title="Preferencias" onEdit={() => onEdit("preferences")}>
        <Row
          label="Formato preferido"
          value={prefs?.preferred_format ? formatNames[prefs.preferred_format] ?? prefs.preferred_format : null}
        />
        <Row
          label="Notificaciones de pedidos"
          value={prefs ? (prefs.notify_order_status ? "Activadas" : "Desactivadas") : null}
        />
        <Row
          label="Boletín de novedades"
          value={prefs ? (prefs.notify_newsletter ? "Suscrito" : "No suscrito") : null}
        />
      </Card>

      <Card title="Actividad de compras" onEdit={() => onEdit("orders")} editLabel="Ver pedidos">
        <Row label="Pedidos realizados" value={String(stats?.total_orders ?? 0)} />
        <Row label="Total invertido" value={formatPrice(stats?.total_spent ?? 0)} />
        <Row label="Último pedido" value={formatDate(stats?.last_order_date) ?? "Aún no tienes pedidos"} />
      </Card>
    </div>
  );
}

function Card({
  title,
  onEdit,
  editLabel = "Editar",
  children,
}: {
  title: string;
  onEdit: () => void;
  editLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-card p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl">{title}</h2>
        <button type="button" onClick={onEdit} className="text-sm text-accent hover:underline cursor-pointer">
          {editLabel}
        </button>
      </div>
      <dl className="space-y-3">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className={`text-sm sm:text-right ${value ? "text-cream" : "text-muted italic"}`}>
        {value || "Sin registrar"}
      </dd>
    </div>
  );
}
