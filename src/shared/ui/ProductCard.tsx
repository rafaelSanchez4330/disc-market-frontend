import { Link } from "react-router-dom";
import { formatLabel } from "../../data/products";
import type { Product } from "../../data/types";
import { AlbumCover } from "./AlbumCover";
import { Badge } from "./Badge";
import { Price } from "./Price";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-line bg-card transition duration-200 hover:-translate-y-1 hover:border-accent/70">
      <Link to={`/productos/${product.productId}`} className="block">
        <AlbumCover cover={product.cover} title={product.name} artist={product.artist} />
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg leading-tight">{product.name}</h3>
              <p className="text-sm text-muted">{product.artist ?? "Disc Market"}</p>
            </div>
            <span className="rounded-full border border-line px-2 py-0.5 text-[11px] tracking-wider uppercase">
              {formatLabel[product.format]}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Price value={product.price} />
            <Badge status={product.availabilityStatus} />
          </div>
          <span className="inline-flex text-sm font-semibold text-cream/80 group-hover:text-accent">
            Ver más →
          </span>
        </div>
      </Link>
    </article>
  );
}
