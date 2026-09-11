import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { customTemplates, formatLabel, formatPrice } from "../../data/products";
import type { CustomDraft, Format } from "../../data/types";
import { Button } from "../../shared/ui/Button";

const steps = ["Formato", "Pistas", "Portada", "Detalles", "Resumen"] as const;

const emptyDraft = (format: Format): CustomDraft => ({
  format,
  title: "",
  message: "",
  packaging: "standard",
  coverName: null,
  tracks: [],
});

export function CreatePage() {
  const [params] = useSearchParams();
  const initialFormat = (params.get("formato") as Format | null) === "VINYL" ? "VINYL" : "CD";
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CustomDraft>(() => emptyDraft(initialFormat));
  const { addItem } = useCart();
  const { push } = useToast();
  const navigate = useNavigate();

  const template = useMemo(
    () => customTemplates.find((item) => item.format === draft.format) ?? customTemplates[0],
    [draft.format],
  );

  function next() {
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function addToCart() {
    addItem({
      customId: `custom-${Date.now()}`,
      productId: template.productId,
      name: draft.title || template.name,
      artist: "Tu edición",
      format: draft.format,
      unitPrice: template.price,
      cover: template.cover,
      customSummary: `${draft.tracks.length} pistas · ${packagingLabel[draft.packaging]}${draft.coverName ? ` · ${draft.coverName}` : ""}`,
    });
    push("Producto personalizado en el carrito");
    navigate("/carrito");
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm tracking-widest text-accent uppercase">Crea el tuyo</p>
        <h1 className="font-display text-4xl">Arma un CD o un vinilo</h1>
      </div>

      <ol className="grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
        {steps.map((label, index) => (
          <li
            key={label}
            className={`rounded-full border px-3 py-2 text-center ${
              index === step ? "border-accent text-accent" : "border-line text-muted"
            }`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      <section className="rounded-3xl border border-line bg-card p-6">
        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {customTemplates.map((item) => (
              <button
                key={item.productId}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, format: item.format }))}
                className={`rounded-2xl border p-5 text-left transition ${
                  draft.format === item.format ? "border-accent" : "border-line hover:border-accent/50"
                }`}
              >
                <p className="font-display text-2xl">{formatLabel[item.format]}</p>
                <p className="mt-2 text-muted">{item.description}</p>
                <p className="mt-3 text-accent">{formatPrice(item.price)}</p>
              </button>
            ))}
          </div>
        ) : null}

        {step === 1 ? (
          <TrackStep
            tracks={draft.tracks}
            onAdd={(name) =>
              setDraft((d) => ({
                ...d,
                tracks: [...d.tracks, { name, order: d.tracks.length + 1 }],
              }))
            }
            onMove={(index, dir) =>
              setDraft((d) => {
                const next = [...d.tracks];
                const target = index + dir;
                if (target < 0 || target >= next.length) return d;
                [next[index], next[target]] = [next[target], next[index]];
                return { ...d, tracks: next.map((track, i) => ({ ...track, order: i + 1 })) };
              })
            }
            onRemove={(index) =>
              setDraft((d) => ({
                ...d,
                tracks: d.tracks.filter((_, i) => i !== index).map((track, i) => ({ ...track, order: i + 1 })),
              }))
            }
          />
        ) : null}

        {step === 2 ? (
          <label className="block space-y-3">
            <span className="text-muted">Sube una imagen para la portada o la etiqueta</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setDraft((d) => ({ ...d, coverName: e.target.files?.[0]?.name ?? null }))}
              className="block w-full text-sm"
            />
            <p className="text-sm text-cream">{draft.coverName ?? "Aún no eliges una imagen."}</p>
          </label>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Título del proyecto">
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                className="w-full rounded-xl border border-line bg-ink px-3 py-2"
                placeholder="Mi mixtape"
              />
            </Field>
            <Field label="Empaque">
              <select
                value={draft.packaging}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, packaging: e.target.value as CustomDraft["packaging"] }))
                }
                className="w-full rounded-xl border border-line bg-ink px-3 py-2"
              >
                <option value="standard">Estándar</option>
                <option value="gift">Regalo</option>
                <option value="collector">Coleccionista</option>
              </select>
            </Field>
            <Field label="Mensaje o dedicatoria">
              <textarea
                value={draft.message}
                onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))}
                className="min-h-28 w-full rounded-xl border border-line bg-ink px-3 py-2 md:col-span-2"
                placeholder="Para alguien especial…"
              />
            </Field>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-muted">Formato: </span>
              {formatLabel[draft.format]} · {formatPrice(template.price)}
            </p>
            <p>
              <span className="text-muted">Título: </span>
              {draft.title || "Sin título"}
            </p>
            <p>
              <span className="text-muted">Portada: </span>
              {draft.coverName || "Sin imagen"}
            </p>
            <p>
              <span className="text-muted">Empaque: </span>
              {packagingLabel[draft.packaging]}
            </p>
            <p>
              <span className="text-muted">Mensaje: </span>
              {draft.message || "—"}
            </p>
            <p className="text-muted">Pistas</p>
            <ol className="list-decimal space-y-1 pl-5">
              {draft.tracks.length ? draft.tracks.map((track) => <li key={track.order}>{track.name}</li>) : <li>Ninguna aún</li>}
            </ol>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Atrás
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={next}>Continuar</Button>
          ) : (
            <Button onClick={addToCart}>Agregar al carrito</Button>
          )}
        </div>
      </section>
    </div>
  );
}

const packagingLabel = {
  standard: "Estándar",
  gift: "Regalo",
  collector: "Coleccionista",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}

function TrackStep({
  tracks,
  onAdd,
  onMove,
  onRemove,
}: {
  tracks: CustomDraft["tracks"];
  onAdd: (name: string) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (index: number) => void;
}) {
  const [name, setName] = useState("");

  return (
    <div className="space-y-4">
      <p className="text-muted">Sube o nombra las pistas y ordénalas como quieras que suenen.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-xl border border-line bg-ink px-3 py-2"
          placeholder="Nombre de la pista o archivo"
        />
        <Button
          type="button"
          onClick={() => {
            if (!name.trim()) return;
            onAdd(name.trim());
            setName("");
          }}
        >
          Agregar pista
        </Button>
      </div>
      <ul className="space-y-2">
        {tracks.map((track, index) => (
          <li key={`${track.order}-${track.name}`} className="flex items-center justify-between rounded-xl border border-line px-3 py-2">
            <span>
              {track.order}. {track.name}
            </span>
            <div className="flex gap-2 text-sm">
              <button type="button" onClick={() => onMove(index, -1)} className="text-muted hover:text-cream">
                Subir
              </button>
              <button type="button" onClick={() => onMove(index, 1)} className="text-muted hover:text-cream">
                Bajar
              </button>
              <button type="button" onClick={() => onRemove(index)} className="text-vinyl">
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
