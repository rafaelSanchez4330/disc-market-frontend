import { useState, type FormEvent } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { userService } from "../../../shared/api/services/userService";
import type { BackendUserPreference } from "../../../shared/api/types";
import { Button } from "../../../shared/ui/Button";

interface Props {
  initialPreferences: BackendUserPreference | null;
  onPreferencesUpdated: (prefs: BackendUserPreference) => void;
}

export function ShippingAddressTab({ initialPreferences, onPreferencesUpdated }: Props) {
  const { user } = useAuth();
  const { push } = useToast();

  const [line1, setLine1] = useState(initialPreferences?.default_address_line1 || "");
  const [line2, setLine2] = useState(initialPreferences?.default_address_line2 || "");
  const [city, setCity] = useState(initialPreferences?.default_city || "");
  const [state, setState] = useState(initialPreferences?.default_state || "");
  const [postalCode, setPostalCode] = useState(initialPreferences?.default_postal_code || "");
  const [country, setCountry] = useState(initialPreferences?.default_country || "México");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await userService.updatePreferences({
        default_address_line1: line1.trim() || null,
        default_address_line2: line2.trim() || null,
        default_city: city.trim() || null,
        default_state: state.trim() || null,
        default_postal_code: postalCode.trim() || null,
        default_country: country.trim() || "México",
      });

      onPreferencesUpdated(res.preferences);
      push("¡Dirección de entrega predeterminada guardada!");
    } catch (err: any) {
      push(err?.message || "Error al guardar la dirección de entrega");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAddressComplete = Boolean(line1 && city && state && postalCode);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-line bg-card p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl">Dirección de Entrega Predeterminada</h2>
            <p className="text-sm text-muted">
              Esta dirección se usará automáticamente en el checkout para agilizar tus compras de vinilos y CDs.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted block mb-1">
              Calle y Número (Exterior e Interior) *
            </label>
            <input
              type="text"
              placeholder="Ej. Av. Álvaro Obregón 180, Depto 4B"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted block mb-1">
              Colonia o Referencias de Entrega
            </label>
            <input
              type="text"
              placeholder="Ej. Col. Roma Norte, entre Insurgentes y Jalapa"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-accent focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">
                Ciudad o Municipio *
              </label>
              <input
                type="text"
                placeholder="Ej. Cuauhtémoc, CDMX"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-accent focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted block mb-1">
                Estado / Provincia *
              </label>
              <input
                type="text"
                placeholder="Ej. Ciudad de México"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-accent focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">
                Código Postal *
              </label>
              <input
                type="text"
                placeholder="06700"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-accent focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted block mb-1">
                País
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-accent focus:outline-none"
              >
                <option value="México">México</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="Colombia">Colombia</option>
                <option value="Argentina">Argentina</option>
                <option value="España">España</option>
                <option value="Chile">Chile</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Dirección"}
          </Button>
        </div>
      </form>

      {/* Vista Previa de Etiqueta de Envío */}
      <aside className="space-y-4">
        <h3 className="font-display text-lg">Etiqueta de Paquete</h3>
        <div className="rounded-2xl border-2 border-dashed border-line bg-ink-soft p-5 text-xs text-muted shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-line pb-3 mb-3">
            <span className="font-display text-sm tracking-wider text-accent font-bold">
              DISC MARKET · SHIPMENT
            </span>
            <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] font-mono text-accent">
              FRÁGIL 🎵
            </span>
          </div>

          <p className="font-semibold text-cream text-sm mb-1">
            DESTINATARIO:
          </p>
          <p className="text-cream text-sm font-medium">{user?.name || "Nombre del Cliente"}</p>

          <div className="mt-3 space-y-1 font-mono text-[11px] leading-relaxed">
            {isAddressComplete ? (
              <>
                <p className="text-cream">{line1}</p>
                {line2 ? <p className="text-muted">{line2}</p> : null}
                <p className="text-cream">
                  {city}, {state} C.P. {postalCode}
                </p>
                <p className="text-accent font-semibold">{country.toUpperCase()}</p>
              </>
            ) : (
              <p className="italic text-muted/60 py-2">
                Completa tu dirección a la izquierda para previsualizar la etiqueta oficial de tus envíos.
              </p>
            )}
          </div>

          <div className="mt-6 border-t border-line/60 pt-3 flex items-center justify-between text-[10px] text-muted font-mono">
            <span>Rastreo: Asignado al despachar</span>
            <span>Estándar Disc</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
