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
          className={`drop-shadow-xl transition-transform duration-500 group-hover:rotate-45 ${className}`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="cdSurface" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="35%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.65" />
              <stop offset="85%" stopColor="#f59e0b" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="54" fill="url(#cdSurface)" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
          <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.75" />
          <circle cx="60" cy="60" r="30" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75" />
          <circle cx="60" cy="60" r="18" fill="rgba(18,17,15,0.45)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
          <circle cx="60" cy="60" r="8" fill="#12110f" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        </svg>
      );
    }

    return (
      <svg
        viewBox="0 0 120 120"
        className={`drop-shadow-2xl transition-transform duration-500 group-hover:rotate-45 ${className}`}
        aria-hidden="true"
      >
        <circle cx="60" cy="60" r="54" fill="#141416" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
        <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <circle cx="60" cy="60" r="39" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        <circle cx="60" cy="60" r="32" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
        <circle cx="60" cy="60" r="20" fill="#e8a23a" stroke="#c43c3c" strokeWidth="3" />
        <circle cx="60" cy="60" r="5" fill="#12110f" />
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

    if (imageUrl && !imageError) {
      return (
        <div className={`relative aspect-square overflow-hidden rounded-sm bg-neutral-900 ${className}`}>
          <img
            src={imageUrl}
            alt={title}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/15" />
            {showDiscBadge && (
              <div className="absolute top-3 right-3 flex items-center gap-2 rounded-full border border-white/20 bg-black/65 px-3 py-1.5 backdrop-blur-md">
                <DiscIllustration format={inferredFormat} className="h-6 w-6" />
                <span className="text-[11px] font-semibold tracking-wider text-amber-300 uppercase">
                  {inferredFormat === "CD" ? "CD Custom" : "Vinilo 12\""}
                </span>
              </div>
            )}
            <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-left">
              <div>
                <p className="font-display text-lg leading-tight font-bold text-white drop-shadow">{title}</p>
                {artist ? <p className="mt-1 text-xs tracking-wide text-white/75">{artist}</p> : null}
              </div>
              {showDiscBadge && (
                <DiscIllustration format={inferredFormat} className="h-14 w-14 shrink-0" />
              )}
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
              <DiscIllustration format={inferredFormat} className="h-32 w-32 opacity-90" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
            <div className="absolute inset-x-4 bottom-4 text-left">
              <p className="font-display text-lg leading-tight font-bold text-white drop-shadow">{title}</p>
              {artist ? <p className="mt-1 text-xs tracking-wide text-white/75">{artist}</p> : null}
            </div>
          </div>
          );
}
