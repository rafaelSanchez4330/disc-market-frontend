import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { customTemplates, formatLabel, formatPrice } from "../../data/products";
import type { CustomDraft, Format } from "../../data/types";
import { resolveAssetUrl } from "../../shared/api/mappers";
import { customProductService } from "../../shared/api/services/customProductService";
import { AlbumCover } from "../../shared/ui/AlbumCover";
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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setCoverFile(file);
    if (file) {
      setDraft((d) => ({ ...d, coverName: file.name }));
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setDraft((d) => ({ ...d, coverName: null }));
      setPreviewUrl(null);
    }
  }

  async function addToCart() {
    setSubmitting(true);

    try {
      // 1. Guardar producto personalizado en PostgreSQL con su portada en Multer
      const created = await customProductService.create({
        format: draft.format,
        title: draft.title || template.name,
        message: draft.message,
        packaging: draft.packaging,
        price: template.price,
        coverFile: coverFile,
        tracks: draft.tracks,
      });

      const serverImageUrl = resolveAssetUrl(created.cover_image);

      // 2. Agregar ítem al carrito de la aplicación con la URL real del archivo
      addItem({
        customId: `custom-${created.custom_product_id}`,
        customProductId: created.custom_product_id,
        productId: template.productId,
        name: created.title,
        artist: "Tu edición",
        format: draft.format,
        unitPrice: template.price,
        cover: template.cover,
        imageUrl: serverImageUrl || previewUrl,
        customSummary: `${draft.tracks.length} pistas · ${packagingLabel[draft.packaging]}${
          draft.coverName ? ` · ${draft.coverName}` : ""
        }`,
      });

      push("¡Disco personalizado creado y guardado en la base de datos!");
      navigate("/carrito");
    } catch (err: any) {
      console.warn("Error al guardar en backend, usando fallback local:", err);
      // Fallback local en caso de error de red
      addItem({
        customId: `custom-${Date.now()}`,
        productId: template.productId,
        name: draft.title || template.name,
        artist: "Tu edición",
        format: draft.format,
        unitPrice: template.price,
        cover: template.cover,
        imageUrl: previewUrl,
        customSummary: `${draft.tracks.length} pistas · ${packagingLabel[draft.packaging]}${
          draft.coverName ? ` · ${draft.coverName}` : ""
        }`,
      });
      push("Agregado al carrito localmente");
      navigate("/carrito");
    } finally {
      setSubmitting(false);
    }
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
                const nextTracks = [...d.tracks];
                const target = index + dir;
                if (target < 0 || target >= nextTracks.length) return d;
                [nextTracks[index], nextTracks[target]] = [nextTracks[target], nextTracks[index]];
                return { ...d, tracks: nextTracks.map((track, i) => ({ ...track, order: i + 1 })) };
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
          <div className="space-y-4">
            <label className="block space-y-3">
              <span className="text-muted">Sube una imagen para la portada o la etiqueta (JPEG, PNG o WebP)</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="block w-full text-sm text-cream file:mr-4 file:rounded-xl file:border-0 file:bg-line file:px-4 file:py-2 file:text-sm file:text-cream hover:file:bg-line/80"
              />
              <p className="text-sm text-cream">{draft.coverName ?? "Aún no eliges una imagen."}</p>
            </label>

            {previewUrl ? (
              <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-line bg-ink p-4">
                <p className="text-xs text-muted">Vista previa de la carátula:</p>
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="h-48 w-48 rounded-xl object-cover shadow-lg"
                />
              </div>
            ) : null}
          </div>
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
          <div className="grid gap-6 md:grid-cols-[180px_1fr]">
            <AlbumCover
              cover={template.cover}
              imageUrl={previewUrl}
              title={draft.title || template.name}
              artist="Tu edición"
              className="rounded-2xl"
            />
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
                {draft.coverName || "Diseño predeterminado"}
              </p>
              <p>
                <span className="text-muted">Empaque: </span>
                {packagingLabel[draft.packaging]}
              </p>
              <p>
                <span className="text-muted">Mensaje: </span>
                {draft.message || "—"}
              </p>
              <p className="text-muted">Pistas ({draft.tracks.length}):</p>
              <ol className="list-decimal space-y-1 pl-5">
                {draft.tracks.length ? (
                  draft.tracks.map((track) => <li key={track.order}>{track.name}</li>)
                ) : (
                  <li>Ninguna especificada</li>
                )}
              </ol>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || submitting}
          >
            Atrás
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={next}>Continuar</Button>
          ) : (
            <Button onClick={addToCart} disabled={submitting}>
              {submitting ? "Guardando en servidor..." : "Agregar al carrito"}
            </Button>
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
      <p className="text-muted">Agrega los títulos de las pistas y ordénalas según como quieras que suenen.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-xl border border-line bg-ink px-3 py-2"
          placeholder="Nombre de la canción o pista"
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
          <li
            key={`${track.order}-${track.name}`}
            className="flex items-center justify-between rounded-xl border border-line px-3 py-2"
          >
            <span>
              {track.order}. {track.name}
            </span>
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => onMove(index, -1)}
                className="text-muted hover:text-cream"
              >
                Subir
              </button>
              <button
                type="button"
                onClick={() => onMove(index, 1)}
                className="text-muted hover:text-cream"
              >
                Bajar
              </button>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-vinyl"
              >
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
