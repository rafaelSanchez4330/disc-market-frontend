import { useState, type FormEvent } from "react";
import { useToast } from "../../../context/ToastContext";
import { userService } from "../../../shared/api/services/userService";
import type { BackendUserPreference } from "../../../shared/api/types";
import { Button } from "../../../shared/ui/Button";

interface Props {
  initialPreferences: BackendUserPreference | null;
  onPreferencesUpdated: (prefs: BackendUserPreference) => void;
}

const FORMAT_OPTIONS = [
  {
    id: "ALL",
    label: "Todos los formatos",
    desc: "Explorar catálogo completo de vinilos, CDs y creaciones personalizadas.",
    icon: "🎵",
  },
  {
    id: "VINYL",
    label: "Vinilos LP (12\")",
    desc: "Priorizar lanzamientos analógicos, acetatos y ediciones audiófilas.",
    icon: "💿",
  },
  {
    id: "CD",
    label: "Discos Compactos",
    desc: "Priorizar audio digital sin compresión y estuches jewel case.",
    icon: "💿",
  },
];

const THEME_OPTIONS = [
  { id: "dark", label: "Oscuro Vinilo (Predeterminado)", desc: "Atmósfera nocturna cálida con detalles ámbar", icon: "🌙" },
  { id: "high-contrast", label: "Alto Contraste", desc: "Máxima legibilidad y bordes definidos", icon: "⚡" },
  { id: "light", label: "Claro / Papel", desc: "Fondo claro con tipografía en tinta", icon: "☀️" },
];

export function PreferencesTab({ initialPreferences, onPreferencesUpdated }: Props) {
  const { push } = useToast();

  const [preferredFormat, setPreferredFormat] = useState(
    initialPreferences?.preferred_format || "ALL"
  );
  const [theme, setTheme] = useState(initialPreferences?.theme || "dark");
  const [notifyOrderStatus, setNotifyOrderStatus] = useState(
    initialPreferences?.notify_order_status ?? true
  );
  const [notifyNewsletter, setNotifyNewsletter] = useState(
    initialPreferences?.notify_newsletter ?? false
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await userService.updatePreferences({
        preferred_format: preferredFormat,
        theme,
        notify_order_status: notifyOrderStatus,
        notify_newsletter: notifyNewsletter,
      });

      onPreferencesUpdated(res.preferences);
      push("¡Preferencias generales actualizadas!");
    } catch (err: any) {
      push(err?.message || "Error al actualizar las preferencias");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Formato Favorito */}
      <div className="rounded-2xl border border-line bg-card p-6 space-y-4">
        <div>
          <h2 className="font-display text-xl">Formato Musical Predilecto</h2>
          <p className="text-sm text-muted">
            Personaliza tus filtros rápidos y sugerencias destacadas según tu medio físico favorito.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {FORMAT_OPTIONS.map((opt) => {
            const isSelected = preferredFormat === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPreferredFormat(opt.id)}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-accent bg-accent/10 shadow-sm"
                    : "border-line bg-ink hover:border-line/80"
                }`}
              >
                <span className="text-2xl mb-2">{opt.icon}</span>
                <span className={`font-semibold text-sm ${isSelected ? "text-accent" : "text-cream"}`}>
                  {opt.label}
                </span>
                <span className="text-xs text-muted mt-1 leading-snug">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tema Visual */}
      <div className="rounded-2xl border border-line bg-card p-6 space-y-4">
        <div>
          <h2 className="font-display text-xl">Tema de la Plataforma</h2>
          <p className="text-sm text-muted">
            Selecciona la apariencia visual que mejor se adapte a tu entorno auditivo y de lectura.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {THEME_OPTIONS.map((opt) => {
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-accent bg-accent/10 shadow-sm"
                    : "border-line bg-ink hover:border-line/80"
                }`}
              >
                <span className="text-2xl mb-2">{opt.icon}</span>
                <span className={`font-semibold text-sm ${isSelected ? "text-accent" : "text-cream"}`}>
                  {opt.label}
                </span>
                <span className="text-xs text-muted mt-1 leading-snug">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notificaciones */}
      <div className="rounded-2xl border border-line bg-card p-6 space-y-4">
        <div>
          <h2 className="font-display text-xl">Comunicaciones y Notificaciones</h2>
          <p className="text-sm text-muted">
            Controla qué información deseas recibir en tu correo electrónico.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-line/60 bg-ink hover:border-line cursor-pointer">
            <input
              type="checkbox"
              checked={notifyOrderStatus}
              onChange={(e) => setNotifyOrderStatus(e.target.checked)}
              className="mt-1 h-4 w-4 rounded accent-accent"
            />
            <div className="text-sm">
              <span className="font-medium text-cream block">
                Actualizaciones del Estado de Pedidos
              </span>
              <span className="text-xs text-muted">
                Recibe notificaciones inmediatas cuando tus discos entren en prensado, masterización o sean despachados con número de rastreo.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-line/60 bg-ink hover:border-line cursor-pointer">
            <input
              type="checkbox"
              checked={notifyNewsletter}
              onChange={(e) => setNotifyNewsletter(e.target.checked)}
              className="mt-1 h-4 w-4 rounded accent-accent"
            />
            <div className="text-sm">
              <span className="font-medium text-cream block">
                Novedades y Lanzamientos de Colección
              </span>
              <span className="text-xs text-muted">
                Sé el primero en enterarte de reposiciones de vinilos limitados y nuevos empaques para discos personalizados.
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando preferencias..." : "Guardar Preferencias"}
        </Button>
      </div>
    </form>
  );
}
