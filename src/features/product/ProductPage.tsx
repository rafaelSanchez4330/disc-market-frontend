import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { customTemplates, formatDuration, formatLabel } from "../../data/products";
import type { Product } from "../../data/types";
import { productService } from "../../shared/api/services/productService";
import { AlbumCover } from "../../shared/ui/AlbumCover";
import { Badge } from "../../shared/ui/Badge";
import { Button } from "../../shared/ui/Button";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Price } from "../../shared/ui/Price";

export function ProductPage() {
  const { id } = useParams();
  const productIdNum = Number(id);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { push } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);

    // Buscar primero en la API de productos
    productService
      .getProductById(productIdNum)
      .then((data) => {
        setProduct(data);
      })
      .catch(() => {
        // Fallback: verificar si es una plantilla personalizada local
        const customTemplate = customTemplates.find((t) => t.productId === productIdNum);
        setProduct(customTemplate || null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productIdNum]);

  if (loading) {
    return (
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-3xl border border-line bg-card/60" />
        <div className="space-y-5">
          <div className="h-6 w-32 animate-pulse rounded-full bg-card" />
          <div className="h-12 w-3/4 animate-pulse rounded-xl bg-card" />
          <div className="h-8 w-24 animate-pulse rounded-lg bg-card" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-card" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState title="Este disco no está en el catálogo">
        <Link to="/catalogo" className="text-accent">
          Volver al catálogo
        </Link>
      </EmptyState>
    );
  }

  const selected = product;
  const soldOut = selected.availabilityStatus === "OUT_OF_STOCK";

  function addToCart() {
    addItem({
      productId: selected.productId,
      name: selected.name,
      artist: selected.artist,
      format: selected.format,
      unitPrice: selected.price,
      cover: selected.cover,
      imageUrl: selected.imageUrl,
      quantity,
    });
    push("Agregado al carrito");
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <AlbumCover
        cover={selected.cover}
        imageUrl={selected.imageUrl}
        title={selected.name}
        artist={selected.artist}
        className="max-w-xl rounded-3xl"
      />
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-line px-3 py-1 text-xs tracking-wider uppercase">
            {formatLabel[selected.format]}
          </span>
          <Badge status={selected.availabilityStatus} />
        </div>
        <div>
          <h1 className="font-display text-4xl md:text-5xl">{selected.name}</h1>
          <p className="mt-2 text-xl text-muted">{selected.artist ?? "Disc Market · personalizado"}</p>
        </div>
        <Price value={selected.price} className="text-3xl" />
        <p className="max-w-xl text-muted">{selected.description}</p>

        {selected.isCustomizable ? (
          <Button onClick={() => navigate(`/crear?formato=${selected.format}`)}>
            Personalizar este producto
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm">
              Cantidad
              <input
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-14 bg-transparent text-center outline-none"
              />
            </label>
            <Button onClick={addToCart} disabled={soldOut}>
              Agregar al carrito
            </Button>
          </div>
        )}

        {selected.tracks.length ? (
          <div className="rounded-2xl border border-line bg-card p-4">
            <h2 className="font-display text-xl">Lista de pistas</h2>
            <ol className="mt-3 divide-y divide-line">
              {selected.tracks.map((track) => (
                <li key={track.trackOrder} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <span className="mr-3 text-muted">{track.trackOrder}</span>
                    {track.trackName}
                  </span>
                  <span className="text-muted">{formatDuration(track.durationSeconds)}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </div>
  );
}
