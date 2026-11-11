import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { customTemplates, formatLabel, formatPrice } from "../../data/products";
import type { CustomDraft, CustomTrackDraft, Format } from "../../data/types";
import { resolveAssetUrl } from "../../shared/api/mappers";
import {
  customProductService,
  type CustomPricingResponse,
} from "../../shared/api/services/customProductService";
import { AlbumCover } from "../../shared/ui/AlbumCover";
import { Button } from "../../shared/ui/Button";

const steps = ["Formato", "Pistas", "Portada", "Detalles", "Resumen"] as const;

export const FORMAT_LIMITS = {
  CD: {
    maxDuration: 4800, // 80 minutos
    maxTracks: 20,
    maxFileSizeMB: 50,
    label: "CD (80 min / 20 pistas máx)",
  },
  VINYL: {
    maxDuration: 2640, // 44 minutos (22 min por lado)
    maxTracks: 12,
    maxFileSizeMB: 75,
    label: "Vinilo (44 min / 12 pistas máx - 22 min/lado)",
  },
} as const;

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

const emptyDraft = (format: Format): CustomDraft => ({
  format,
  title: "",
  message: "",
  packaging: "standard",
  coverName: null,
  tracks: [],
  disclaimerAccepted: false,
});

export function CreatePage() {
  const [params] = useSearchParams();
  const initialFormat = (params.get("formato") as Format | null) === "VINYL" ? "VINYL" : "CD";
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CustomDraft>(() => emptyDraft(initialFormat));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pricing, setPricing] = useState<CustomPricingResponse | null>(null);

  const { addItem } = useCart();
  const { user } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    customProductService
      .getPricing()
      .then((data) => setPricing(data))
      .catch((err) => {
        console.warn("No se pudo obtener tarifas remotas de personalización, usando valores por defecto:", err);
      });
  }, []);

  const template = useMemo(
    () => customTemplates.find((item) => item.format === draft.format) ?? customTemplates[0],
    [draft.format],
  );

  const currentPrice = useMemo(() => {
    if (pricing && pricing[draft.format]) {
      return pricing[draft.format].base_price;
    }
    return template.price;
  }, [pricing, draft.format, template.price]);

  const formatLimit = FORMAT_LIMITS[draft.format];

  const totalDuration = useMemo(() => {
    return draft.tracks.reduce((acc, t) => acc + (t.durationSeconds || 0), 0);
  }, [draft.tracks]);

  const isOverDuration = totalDuration > formatLimit.maxDuration;
  const isOverTracks = draft.tracks.length > formatLimit.maxTracks;
  const isOverCapacity = isOverDuration || isOverTracks;

  const hasFlaggedTracks = useMemo(() => {
    return draft.tracks.some((t) => t.copyrightStatus === "FLAGGED");
  }, [draft.tracks]);

  const isAnalyzingTracks = useMemo(() => {
    return draft.tracks.some((t) => t.copyrightStatus === "PENDING");
  }, [draft.tracks]);

  // Valida la información obligatoria de cada paso para no permitir discos personalizados vacíos.
  function stepError(index: number): string | null {
    if (index === 1) {
      if (draft.tracks.length === 0) return "Debes incluir al menos una pista en tu proyecto.";
      if (draft.tracks.some((t) => !t.file)) return "Cada pista debe tener un archivo de audio.";
      if (isOverCapacity) return "La duración o cantidad de pistas excede la capacidad física del formato.";
      if (hasFlaggedTracks) return "Debes retirar las pistas con conflicto de derechos de autor antes de continuar.";
      if (isAnalyzingTracks) return "Espera a que concluya el análisis de derechos de autor antes de continuar.";
      if (draft.tracks.some((t) => t.copyrightStatus !== "VERIFIED")) return "Todas las pistas deben ser verificadas exitosamente antes de continuar.";
    }
    if (index === 2 && !coverFile) return "Sube una imagen para la portada de tu disco.";
    if (index === 3) {
      const title = draft.title.trim();
      if (title.length < 2) return "Escribe un título para tu disco (mínimo 2 caracteres).";
      if (title.length > 100) return "El título no puede superar los 100 caracteres.";
    }
    return null;
  }

  const currentStepError = stepError(step);

  function next() {
    if (currentStepError) {
      push(currentStepError);
      return;
    }
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

  // Subida y procesamiento de audios con escaneo de derechos y cálculo de duración
  const handleAddAudioFiles = useCallback(
    async (files: File[]) => {
      const allowedExts = [".mp3", ".wav", ".flac", ".m4a", ".aac"];
      const validFiles = files.filter((f) =>
        allowedExts.some((ext) => f.name.toLowerCase().endsWith(ext)) || f.type.startsWith("audio/")
      );

      if (validFiles.length === 0) {
        push("Por favor selecciona archivos de audio válidos (MP3, WAV, FLAC, M4A, AAC).");
        return;
      }

      // Preparar nuevos borradores de pistas en estado PENDING
      const newDraftTracks: CustomTrackDraft[] = validFiles.map((file, idx) => {
        const previewAudioUrl = URL.createObjectURL(file);
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        return {
          name: cleanName,
          order: draft.tracks.length + idx + 1,
          file,
          fileSizeBytes: file.size,
          durationSeconds: 0,
          copyrightStatus: "PENDING",
          previewAudioUrl,
        };
      });

      // Añadir inmediatamente a la lista para feedback visual
      setDraft((prev) => ({
        ...prev,
        tracks: [...prev.tracks, ...newDraftTracks].map((t, i) => ({ ...t, order: i + 1 })),
      }));

      // Procesar cada archivo: calcular duración real y escanear derechos
      for (const trackDraft of newDraftTracks) {
        if (!trackDraft.file) continue;

        // 1. Obtener duración del audio en el cliente vía objeto Audio
        let clientDuration = 0;
        try {
          const audio = new Audio(trackDraft.previewAudioUrl!);
          clientDuration = await new Promise<number>((resolve) => {
            audio.onloadedmetadata = () => {
              resolve(Math.round(audio.duration || 0));
            };
            audio.onerror = () => {
              resolve(180); // Fallback razonable si el formato no decodifica directo
            };
          });
        } catch {
          clientDuration = 180;
        }

        // 2. Escanear contra la base de datos de derechos de autor del backend
        try {
          const scanResult = await customProductService.scanTrack(
            trackDraft.file,
            clientDuration
          );

          setDraft((prev) => ({
            ...prev,
            tracks: prev.tracks.map((t) => {
              if (t.file === trackDraft.file) {
                return {
                  ...t,
                  durationSeconds: scanResult.durationSeconds || clientDuration,
                  copyrightStatus: scanResult.status,
                  copyrightMatchTitle: scanResult.matchedTitle,
                  copyrightMatchArtist: scanResult.matchedArtist,
                  copyrightReason: scanResult.reason,
                };
              }
              return t;
            }),
          }));

          if (scanResult.status === "FLAGGED") {
            push(`Conflicto de Copyright: "${scanResult.matchedTitle}" (${scanResult.matchedArtist}). No se puede procesar.`);
          }
        } catch (err: any) {
          console.warn("Fallo el escaneo en vivo de la pista:", err);
          // NUNCA marcar como VERIFIED ante un fallo del servidor: marcar como FLAGGED para requerir verificación
          setDraft((prev) => ({
            ...prev,
            tracks: prev.tracks.map((t) => {
              if (t.file === trackDraft.file) {
                return {
                  ...t,
                  durationSeconds: clientDuration,
                  copyrightStatus: "FLAGGED",
                  copyrightMatchTitle: trackDraft.name,
                  copyrightReason: "No se pudo validar el copyright con el servidor. Revisa tu conexión a internet o el formato del archivo.",
                };
              }
              return t;
            }),
          }));
          push("Error al escanear los derechos de autor de la pista. Se requiere verificación exitosa para continuar.");
        }
      }
    },
    [draft.tracks.length, push]
  );

  function handleMoveTrack(index: number, dir: -1 | 1) {
    setDraft((d) => {
      const nextTracks = [...d.tracks];
      const target = index + dir;
      if (target < 0 || target >= nextTracks.length) return d;
      [nextTracks[index], nextTracks[target]] = [nextTracks[target], nextTracks[index]];
      return {
        ...d,
        tracks: nextTracks.map((track, i) => ({ ...track, order: i + 1 })),
      };
    });
  }

  function handleRemoveTrack(index: number) {
    setDraft((d) => {
      const removed = d.tracks[index];
      if (removed?.previewAudioUrl) {
        URL.revokeObjectURL(removed.previewAudioUrl);
      }
      return {
        ...d,
        tracks: d.tracks
          .filter((_, i) => i !== index)
          .map((track, i) => ({ ...track, order: i + 1 })),
      };
    });
  }

  async function addToCart() {
    if (!user) {
      push("Inicia sesión para guardar y comprar tu disco personalizado.");
      navigate("/iniciar-sesion");
      return;
    }

    for (const index of [1, 2, 3]) {
      const error = stepError(index);
      if (error) {
        push(error);
        setStep(index);
        return;
      }
    }

    if (draft.tracks.length === 0) {
      push("Debes incluir al menos una pista en tu proyecto.");
      return;
    }

    if (isOverCapacity) {
      push("Tu proyecto supera el límite de capacidad física para este formato.");
      return;
    }

    if (hasFlaggedTracks || draft.tracks.some((t) => t.copyrightStatus !== "VERIFIED")) {
      push("No se pueden ordenar discos con pistas con infracción de copyright o sin verificación exitosa.");
      return;
    }

    if (!draft.disclaimerAccepted) {
      push("Debes aceptar la declaración jurada de derechos de autor.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Preparar archivos para subida física
      const filesToUpload = draft.tracks
        .filter((t): t is CustomTrackDraft & { file: File } => Boolean(t.file))
        .map((t) => t.file);

      const tracksMeta = draft.tracks
        .filter((t) => Boolean(t.file))
        .map((t) => ({
          name: t.name,
          order: t.order,
          duration: t.durationSeconds || 0,
        }));

      // 2. Guardar producto personalizado en PostgreSQL con su portada y aceptación legal
      const created = await customProductService.create({
        format: draft.format,
        title: draft.title.trim(),
        message: draft.message,
        packaging: draft.packaging,
        price: currentPrice,
        coverFile: coverFile,
        tracks: filesToUpload.length === 0 ? draft.tracks.map((t) => ({ name: t.name, order: t.order })) : undefined,
        copyrightDisclaimerAccepted: draft.disclaimerAccepted,
      });

      // 3. Subir los audios binarios asociados para prensado físico si se proporcionaron
      if (filesToUpload.length > 0) {
        await customProductService.uploadTracks(
          created.custom_product_id,
          filesToUpload,
          tracksMeta
        );
      }

      const serverImageUrl = resolveAssetUrl(created.cover_image);

      // 4. Agregar ítem al carrito de la aplicación con la URL real del archivo
      await addItem({
        customId: `custom-${created.custom_product_id}`,
        customProductId: created.custom_product_id,
        productId: template.productId,
        name: created.title,
        artist: "Tu edición",
        format: draft.format,
        unitPrice: currentPrice,
        cover: template.cover,
        imageUrl: serverImageUrl || previewUrl,
        customSummary: `${draft.tracks.length} pistas (${formatDuration(totalDuration)}) · ${
          packagingLabel[draft.packaging]
        }${draft.coverName ? ` · ${draft.coverName}` : ""}`,
      });

      push("¡Disco personalizado creado, audios validados y guardado en la orden!");
      navigate("/carrito");
    } catch (err: any) {
      console.error("Error al procesar el disco personalizado:", err);
      push(
        err.message ||
          "No se pudo agregar el disco personalizado. Revisa tu sesión, audios o existencias y vuelve a intentar."
      );
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
            className={`rounded-full border px-3 py-2 text-center ${index === step ? "border-accent text-accent" : "border-line text-muted"
              }`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      <section className="rounded-3xl border border-line bg-card p-6">
        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {customTemplates.map((item) => {
              const displayPrice = pricing && pricing[item.format] ? pricing[item.format].base_price : item.price;
              const displayDesc = pricing && pricing[item.format] ? pricing[item.format].description : item.description;

              return (
                <button
                  key={item.productId}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, format: item.format }))}
                  className={`rounded-2xl border p-5 text-left transition ${draft.format === item.format ? "border-accent" : "border-line hover:border-accent/50"
                    }`}
                >
                  <p className="font-display text-2xl">{formatLabel[item.format]}</p>
                  <p className="mt-2 text-muted">{displayDesc}</p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted">
                      {item.format === "CD" ? "Límite: 80 min / 20 pistas" : "Límite: 44 min (22/lado) / 12 pistas"}
                    </span>
                    <span className="text-accent font-semibold text-base">{formatPrice(displayPrice)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        {step === 1 ? (
          <TrackStep
            format={draft.format}
            tracks={draft.tracks}
            totalDuration={totalDuration}
            formatLimit={formatLimit}
            isOverCapacity={isOverCapacity}
            hasFlaggedTracks={hasFlaggedTracks}
            isAnalyzingTracks={isAnalyzingTracks}
            onAddFiles={handleAddAudioFiles}
            onMove={handleMoveTrack}
            onRemove={handleRemoveTrack}
          />
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <label className="block space-y-3">
              <span className="text-muted">Sube una imagen para la portada o la etiqueta (JPEG, PNG o WebP) *</span>
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
            <Field label="Título del proyecto *">
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                className="w-full rounded-xl border border-line bg-ink px-3 py-2"
                maxLength={100}
                required
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
          <div className="grid gap-6 md:grid-cols-[200px_1fr]">
            <AlbumCover
              cover={template.cover}
              imageUrl={previewUrl}
              title={draft.title || template.name}
              artist="Tu edición"
              className="rounded-2xl"
            />
            <div className="space-y-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <p>
                  <span className="text-muted">Formato: </span>
                  {formatLabel[draft.format]} · {formatPrice(currentPrice)}
                </p>
                <p>
                  <span className="text-muted">Título: </span>
                  {draft.title || "Sin título"}
                </p>
                <p>
                  <span className="text-muted">Portada: </span>
                  {draft.coverName || "Sin portada"}
                </p>
                <p>
                  <span className="text-muted">Empaque: </span>
                  {packagingLabel[draft.packaging]}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-muted">Capacidad Total: </span>
                  <span className={isOverCapacity ? "text-vinyl font-semibold" : "text-ok font-semibold"}>
                    {formatDuration(totalDuration)} / {formatDuration(formatLimit.maxDuration)} min
                  </span>{" "}
                  ({draft.tracks.length} / {formatLimit.maxTracks} pistas)
                </p>
              </div>

              <div className="border-t border-line/60 pt-3">
                <p className="font-semibold text-cream mb-2">Pistas cargadas ({draft.tracks.length}):</p>
                <ol className="list-decimal space-y-1.5 pl-5 max-h-48 overflow-y-auto pr-2">
                  {draft.tracks.length ? (
                    draft.tracks.map((track) => (
                      <li key={track.order} className="text-xs">
                        <div className="inline-flex items-center gap-2">
                          <span className="font-medium text-cream">{track.name}</span>
                          <span className="text-muted">({formatDuration(track.durationSeconds || 0)})</span>
                          {track.copyrightStatus === "VERIFIED" && (
                            <span className="text-[10px] text-ok font-semibold uppercase">✓ Verificado</span>
                          )}
                          {track.copyrightStatus === "FLAGGED" && (
                            <span className="text-[10px] text-vinyl font-bold uppercase">
                              ⚠ Infracción: {track.copyrightMatchTitle}
                            </span>
                          )}
                          {track.copyrightStatus === "PENDING" && (
                            <span className="text-[10px] text-accent animate-pulse">Analizando...</span>
                          )}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted">Ninguna especificada</li>
                  )}
                </ol>
              </div>

              {/* Declaración Jurada de Propiedad Intelectual */}
              <div className="rounded-2xl border border-accent/40 bg-accent/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    id="legal-disclaimer"
                    type="checkbox"
                    checked={Boolean(draft.disclaimerAccepted)}
                    onChange={(e) => setDraft((d) => ({ ...d, disclaimerAccepted: e.target.checked }))}
                    className="mt-1 h-5 w-5 rounded border-line bg-ink text-accent accent-accent focus:ring-accent cursor-pointer"
                  />
                  <label htmlFor="legal-disclaimer" className="text-xs leading-relaxed text-cream select-none cursor-pointer">
                    <strong className="text-accent">Declaración Jurada de Derechos de Autor:</strong> Declaro bajo protesta de decir verdad que soy titular legítimo de los derechos patrimoniales y morales o cuento con las licencias correspondientes de los fonogramas y archivos aportados para este pedido, deslindando expresamente de responsabilidad a Disc Market.
                  </label>
                </div>
                <p className="text-[11px] text-muted pl-8 leading-normal">
                  🔒 <strong>Trazabilidad y Sello Digital:</strong> Conforme al proceso de maquila física, se generará una firma criptográfica (SHA-256) vinculando tu cuenta de usuario, dirección IP y el contenido exacto de los audios para garantizar el cumplimiento normativo.
                </p>
              </div>
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
            <div className="flex flex-col items-end gap-1">
              <Button onClick={next} disabled={Boolean(currentStepError)}>
                Continuar
              </Button>
              {currentStepError ? <p className="text-xs text-vinyl">{currentStepError}</p> : null}
            </div>
          ) : (
            <Button
              onClick={addToCart}
              disabled={
                submitting ||
                [1, 2, 3].some((index) => stepError(index) !== null) ||
                draft.tracks.length === 0 ||
                isOverCapacity ||
                hasFlaggedTracks ||
                isAnalyzingTracks ||
                draft.tracks.some((t) => t.copyrightStatus !== "VERIFIED") ||
                !draft.disclaimerAccepted
              }
            >
              {submitting
                ? "Procesando audios y orden..."
                : isOverCapacity
                ? "Capacidad física excedida"
                : hasFlaggedTracks
                ? "Conflicto de copyright"
                : isAnalyzingTracks
                ? "Analizando pistas..."
                : draft.tracks.some((t) => t.copyrightStatus !== "VERIFIED")
                ? "Pistas pendientes de verificar"
                : !draft.disclaimerAccepted
                ? "Acepta la declaración jurada"
                : "Agregar al carrito"}
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

interface TrackStepProps {
  format: Format;
  tracks: CustomTrackDraft[];
  totalDuration: number;
  formatLimit: (typeof FORMAT_LIMITS)[Format];
  isOverCapacity: boolean;
  hasFlaggedTracks: boolean;
  isAnalyzingTracks: boolean;
  onAddFiles: (files: File[]) => Promise<void>;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (index: number) => void;
}

function TrackStep({
  format,
  tracks,
  totalDuration,
  formatLimit,
  isOverCapacity,
  hasFlaggedTracks,
  isAnalyzingTracks,
  onAddFiles,
  onMove,
  onRemove,
}: TrackStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [playingOrder, setPlayingOrder] = useState<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Manejo de reproducción / pausa de audio preview
  const togglePlayAudio = (track: CustomTrackDraft) => {
    if (!track.previewAudioUrl) return;

    if (playingOrder === track.order) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingOrder(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(track.previewAudioUrl);
    audioPlayerRef.current = audio;
    setPlayingOrder(track.order);

    audio.play().catch((err) => {
      console.warn("No se pudo reproducir audio:", err);
      setPlayingOrder(null);
    });

    audio.onended = () => {
      setPlayingOrder(null);
    };
  };

  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      await onAddFiles(filesArray);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      await onAddFiles(filesArray);
      e.target.value = "";
    }
  };

  const durationPercent = Math.min(100, Math.round((totalDuration / formatLimit.maxDuration) * 100));

  return (
    <div className="space-y-6">
      {/* Medidor visual de capacidad física */}
      <div className="rounded-2xl border border-line bg-ink p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between text-sm gap-2">
          <div>
            <span className="font-semibold text-cream">Capacidad física del formato: </span>
            <span className="text-muted">{formatLimit.label}</span>
          </div>
          <div className="text-xs">
            <span className={totalDuration > formatLimit.maxDuration ? "text-vinyl font-bold" : "text-cream"}>
              {formatDuration(totalDuration)}
            </span>
            <span className="text-muted"> / {formatDuration(formatLimit.maxDuration)} min</span>
            <span className="mx-2 text-line">•</span>
            <span className={tracks.length > formatLimit.maxTracks ? "text-vinyl font-bold" : "text-cream"}>
              {tracks.length}
            </span>
            <span className="text-muted"> / {formatLimit.maxTracks} pistas</span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-card">
          <div
            className={`h-full transition-all duration-300 ${totalDuration > formatLimit.maxDuration
              ? "bg-vinyl"
              : durationPercent > 80
                ? "bg-accent"
                : "bg-ok"
              }`}
            style={{ width: `${Math.min(100, (totalDuration / formatLimit.maxDuration) * 100)}%` }}
          />
        </div>

        {/* Alertas de capacidad o derechos */}
        {isOverCapacity && (
          <div className="rounded-xl border border-vinyl/40 bg-vinyl/10 p-3 text-xs text-vinyl flex items-start gap-2">
            <span>⚠</span>
            <span>
              <strong>Capacidad física superada:</strong> El límite para {format === "CD" ? "CD es de 80 minutos o 20 pistas" : "Vinilo es de 44 minutos (22 min por lado) o 12 pistas"}. Por favor elimina pistas o reduce su duración para poder maquilar el disco.
            </span>
          </div>
        )}

        {hasFlaggedTracks && (
          <div className="rounded-xl border border-vinyl/40 bg-vinyl/10 p-3 text-xs text-vinyl flex items-start gap-2">
            <span>⛔</span>
            <span>
              <strong>Conflicto con Repertorio Comercial Detectado:</strong> Uno o más archivos han sido identificados como fonogramas protegidos por sellos discográficos internacionales (Universal, Sony, Warner). No es posible continuar con la maquila hasta que dichas pistas sean retiradas.
            </span>
          </div>
        )}

        {isAnalyzingTracks && (
          <div className="rounded-xl border border-accent/40 bg-accent/10 p-2.5 text-xs text-accent flex items-center gap-2 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
            <span>Escaneando huella acústica y titularidad de derechos en tiempo real...</span>
          </div>
        )}
      </div>

      {/* Zona Drag & Drop para archivos de audio */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${isDragging
          ? "border-accent bg-accent/10"
          : "border-line bg-ink/50 hover:border-accent/60 hover:bg-ink"
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,.mp3,.wav,.flac,.m4a,.aac"
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-accent text-xl">
          🎵
        </div>
        <p className="mt-3 font-medium text-cream">
          Arrastra y suelta tus archivos de audio aquí, o <span className="text-accent underline">explora tus archivos</span>
        </p>
        <p className="mt-1 text-xs text-muted">
          Formatos admitidos: MP3, WAV, FLAC, M4A, AAC (hasta {formatLimit.maxFileSizeMB} MB por pista)
        </p>
      </div>

      {/* Lista de Pistas */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">
          Pistas en el orden de prensado ({tracks.length})
        </p>

        {tracks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            Aún no has agregado ninguna pista. Sube tus canciones para comenzar el análisis.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {tracks.map((track, index) => {
              const isPlaying = playingOrder === track.order;

              return (
                <li
                  key={`${track.order}-${track.name}`}
                  className={`flex flex-col gap-3 rounded-2xl border p-4 transition ${track.copyrightStatus === "FLAGGED"
                    ? "border-vinyl/60 bg-vinyl/5"
                    : "border-line bg-ink"
                    }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-card text-xs font-semibold text-accent">
                        {track.order}
                      </span>
                      <div>
                        <p className="font-medium text-cream">{track.name}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                          <span>{formatDuration(track.durationSeconds || 0)} min</span>
                          {track.fileSizeBytes && (
                            <>
                              <span>•</span>
                              <span>{formatBytes(track.fileSizeBytes)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Estado de Copyright y Controles */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Badge de Copyright */}
                      {track.copyrightStatus === "VERIFIED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ok/15 px-2.5 py-0.5 text-[11px] font-semibold text-ok">
                          ✓ Original / Verificado
                        </span>
                      )}
                      {track.copyrightStatus === "PENDING" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-medium text-accent animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          Analizando...
                        </span>
                      )}
                      {track.copyrightStatus === "FLAGGED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-vinyl/20 px-2.5 py-0.5 text-[11px] font-bold text-vinyl">
                          ⛔ Infracción Detectada
                        </span>
                      )}

                      {/* Botón de reproducción de prueba si tiene audio */}
                      {track.previewAudioUrl && (
                        <button
                          type="button"
                          onClick={() => togglePlayAudio(track)}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${isPlaying
                            ? "bg-accent text-ink font-semibold"
                            : "bg-card text-cream hover:bg-line"
                            }`}
                          title={isPlaying ? "Pausar vista previa" : "Escuchar vista previa"}
                        >
                          {isPlaying ? "⏸ Pausar" : "▶ Escuchar"}
                        </button>
                      )}

                      {/* Botones de orden y eliminación */}
                      <div className="flex items-center gap-1 text-xs">
                        <button
                          type="button"
                          onClick={() => onMove(index, -1)}
                          disabled={index === 0}
                          className="rounded-lg p-1.5 text-muted hover:bg-card hover:text-cream disabled:opacity-30"
                          title="Subir"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => onMove(index, 1)}
                          disabled={index === tracks.length - 1}
                          className="rounded-lg p-1.5 text-muted hover:bg-card hover:text-cream disabled:opacity-30"
                          title="Bajar"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(index)}
                          className="rounded-lg p-1.5 text-vinyl hover:bg-vinyl/10"
                          title="Eliminar pista"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Detalle ampliado si tiene infracción de derechos */}
                  {track.copyrightStatus === "FLAGGED" && (
                    <div className="rounded-xl border border-vinyl/30 bg-vinyl/10 p-2.5 text-xs text-vinyl">
                      <p className="font-semibold">
                        Coincidencia con repertorio protegido: "{track.copyrightMatchTitle}" de{" "}
                        {track.copyrightMatchArtist || "Artista Comercial"}
                      </p>
                      <p className="mt-0.5 text-muted text-[11px]">
                        {track.copyrightReason || "No se permite la manufactura de copias físicas sin licencias mecánicas de los sellos discográficos."}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
