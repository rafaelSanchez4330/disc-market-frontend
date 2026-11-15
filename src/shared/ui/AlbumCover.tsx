import { useState } from "react";
import type { CoverTheme } from "../../data/types";

type Props = {
  cover?: CoverTheme;
  imageUrl?: string | null;
  title: string;
  artist?: string | null;
  className?: string;
  discFormat?: "CD" | "VINYL";
  showDiscBadge?: boolean;
};

  export function DiscIllustration({
    format,
    className = "h-28 w-28",
  }: {
    format: "CD" | "VINYL";
    className?: string;
  }) {
    if (format === "CD") {
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          className={`drop-shadow-xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-12 ${className}`}
          aria-hidden="true"
        >
          {/* Disco exterior con reflejos ópticos */}
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="rgba(255,255,255,0.08)"
            stroke="rgba(243,238,228,0.88)"
            strokeWidth="2.5"
          />
          {/* Destellos diagonales tipo CD */}
          <path
            d="M28 28 L48 48 M72 72 L92 92"
            stroke="rgba(232,162,58,0.75)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M90 30 L72 48 M48 72 L30 90"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Pistas ópticas concéntricas */}
          <circle
            cx="60"
            cy="60"
            r="35"
            stroke="rgba(243,238,228,0.35)"
            strokeWidth="1.2"
            strokeDasharray="6 4"
          />
          {/* Anillo interior acrílico */}
          <circle
            cx="60"
            cy="60"
            r="17"
            fill="rgba(18,17,15,0.45)"
            stroke="rgba(243,238,228,0.8)"
            strokeWidth="2"
          />
          {/* Centro perforado */}
          <circle
            cx="60"
            cy="60"
            r="7"
            fill="rgba(18,17,15,0.9)"
            stroke="rgba(232,162,58,0.95)"
            strokeWidth="2"
          />
        </svg>
      );
    }

      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          className={`drop-shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-12 ${className}`}
          aria-hidden="true"
        >
          {/* Cuerpo del vinilo LP */}
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="rgba(18,17,15,0.55)"
            stroke="rgba(243,238,228,0.88)"
            strokeWidth="2.5"
          />
          {/* Surcos del vinilo */}
          <circle cx="60" cy="60" r="40" stroke="rgba(243,238,228,0.28)" strokeWidth="1.2" />
          <circle cx="60" cy="60" r="33" stroke="rgba(243,238,228,0.22)" strokeWidth="1.2" />
          <circle cx="60" cy="60" r="26" stroke="rgba(243,238,228,0.3)" strokeWidth="1.2" />
          {/* Brillo curvo del surco */}
          <path
            d="M32 45 A32 32 0 0 1 75 28"
            stroke="rgba(232,162,58,0.75)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M88 75 A32 32 0 0 1 45 92"
            stroke="rgba(232,162,58,0.55)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Galleta central (label) */}
          <circle
            cx="60"
            cy="60"
            r="16"
            fill="rgba(232,162,58,0.25)"
            stroke="#e8a23a"
            strokeWidth="2.5"
          />
          {/* Agujero central del LP */}
          <circle cx="60" cy="60" r="4.5" fill="#f3eee4" />
        </svg>
      );
    }

    export function AlbumCover({
      cover,
      imageUrl,
      title,
      artist,
      className = "",
      discFormat,
      showDiscBadge = false,
    }: Props) {
      const [imageError, setImageError] = useState(false);

      const inferredFormat: "CD" | "VINYL" =
        discFormat ??
        (title.toLowerCase().includes("vinyl") || title.toLowerCase().includes("vinil")
          ? "VINYL"
          : "CD");

      const fallbackCover: CoverTheme = cover ?? {
        from: "#1e293b",
        to: "#0f172a",
        motif: "burst",
      };

        const motif =
          fallbackCover.motif === "rings"
            ? "radial-gradient(circle at 50% 50%, transparent 18%, rgba(255,255,255,0.08) 19%, transparent 20%, transparent 38%, rgba(255,255,255,0.08) 39%, transparent 40%)"
            : fallbackCover.motif === "bars"
              ? "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 8px, transparent 8px 18px)"
              : fallbackCover.motif === "grid"
                ? "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)"
                : fallbackCover.motif === "wave"
                  ? "radial-gradient(120% 60% at 20% 110%, rgba(255,255,255,0.16), transparent 50%)"
                  : "conic-gradient(from 210deg, transparent, rgba(255,255,255,0.18), transparent 40%)";

        if (imageUrl && !imageError && !showDiscBadge) {
          return (
            <div className={`relative aspect-square overflow-hidden rounded-sm bg-neutral-900 ${className}`}>
              <img
                src={imageUrl}
                alt={title}
                onError={() => setImageError(true)}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
              <div className="absolute inset-x-4 bottom-4 text-left">
                <p className="font-display text-lg leading-tight font-bold text-white drop-shadow">{title}</p>
                {artist ? <p className="mt-1 text-xs tracking-wide text-white/75">{artist}</p> : null}
              </div>
            </div>
          );
        }

        return (
          <div
            className={`relative aspect-square overflow-hidden rounded-sm ${className}`}
            style={{ background: `linear-gradient(145deg, ${fallbackCover.from}, ${fallbackCover.to})` }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: motif,
                backgroundSize: fallbackCover.motif === "grid" ? "22px 22px, 22px 22px" : undefined,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center pb-6">
              <DiscIllustration format={inferredFormat} className="h-36 w-36 opacity-95" />
            </div>
            {showDiscBadge && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-3 py-1 backdrop-blur-md">
                <span className="text-[11px] font-semibold tracking-wider text-amber-300 uppercase">
                  {inferredFormat === "CD" ? "CD Personalizable" : "Vinilo 12\" Personalizable"}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10 pointer-events-none" />
            <div className="absolute inset-x-4 bottom-4 text-left">
              <p className="font-display text-lg leading-tight font-bold text-white drop-shadow">{title}</p>
              {artist ? <p className="mt-1 text-xs tracking-wide text-white/75">{artist}</p> : null}
            </div>
          </div>
        );
      }
