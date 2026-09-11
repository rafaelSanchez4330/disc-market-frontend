import type { CoverTheme } from "../../data/types";

type Props = {
  cover: CoverTheme;
  title: string;
  artist?: string | null;
  className?: string;
};

export function AlbumCover({ cover, title, artist, className = "" }: Props) {
  const motif =
    cover.motif === "rings"
      ? "radial-gradient(circle at 50% 50%, transparent 18%, rgba(255,255,255,0.08) 19%, transparent 20%, transparent 38%, rgba(255,255,255,0.08) 39%, transparent 40%)"
      : cover.motif === "bars"
        ? "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 8px, transparent 8px 18px)"
        : cover.motif === "grid"
          ? "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)"
          : cover.motif === "wave"
            ? "radial-gradient(120% 60% at 20% 110%, rgba(255,255,255,0.16), transparent 50%)"
            : "conic-gradient(from 210deg, transparent, rgba(255,255,255,0.18), transparent 40%)";

  return (
    <div
      className={`relative aspect-square overflow-hidden rounded-sm ${className}`}
      style={{ background: `linear-gradient(145deg, ${cover.from}, ${cover.to})` }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: motif,
          backgroundSize: cover.motif === "grid" ? "22px 22px, 22px 22px" : undefined,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
      <div className="absolute inset-x-4 bottom-4 text-left">
        <p className="font-display text-lg leading-tight font-bold text-white drop-shadow">{title}</p>
        {artist ? <p className="mt-1 text-xs tracking-wide text-white/75">{artist}</p> : null}
      </div>
    </div>
  );
}
