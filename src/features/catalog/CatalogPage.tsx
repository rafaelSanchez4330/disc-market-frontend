import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { formatLabel, products } from "../../data/products";
import type { Format } from "../../data/types";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ProductCard } from "../../shared/ui/ProductCard";

type Props = {
  presetFormat?: Format;
};

export function CatalogPage({ presetFormat }: Props) {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const format = presetFormat ?? (params.get("formato") as Format | null);
  const category = params.get("categoria") ?? "";
  const artist = params.get("artista") ?? "";
  const maxPrice = Number(params.get("precio") ?? 0);

  const artists = useMemo(
    () => [...new Set(products.map((p) => p.artist).filter((a): a is string => Boolean(a)))].sort(),
    [],
  );
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), []);

  const visible = products.filter((product) => {
    if (format && product.format !== format) return false;
    if (category && product.category !== category) return false;
    if (artist && product.artist !== artist) return false;
    if (maxPrice && product.price > maxPrice) return false;
    return true;
  });

  const title = presetFormat ? formatLabel[presetFormat] : category === "Custom" ? "Productos personalizados" : "Catálogo";

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  const filters = (
    <div className="space-y-5">
      {!presetFormat ? (
        <FilterGroup label="Formato">
          <select
            value={format ?? ""}
            onChange={(e) => setFilter("formato", e.target.value)}
            className="w-full rounded-xl border border-line bg-ink px-3 py-2"
          >
            <option value="">Todos</option>
            <option value="CD">CD</option>
            <option value="VINYL">Vinilo</option>
          </select>
        </FilterGroup>
      ) : null}
      <FilterGroup label="Categoría">
        <select
          value={category}
          onChange={(e) => setFilter("categoria", e.target.value)}
          className="w-full rounded-xl border border-line bg-ink px-3 py-2"
        >
          <option value="">Todas</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </FilterGroup>
      <FilterGroup label="Artista">
        <select
          value={artist}
          onChange={(e) => setFilter("artista", e.target.value)}
          className="w-full rounded-xl border border-line bg-ink px-3 py-2"
        >
          <option value="">Todos</option>
          {artists.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </FilterGroup>
      <FilterGroup label="Precio máximo">
        <select
          value={maxPrice || ""}
          onChange={(e) => setFilter("precio", e.target.value)}
          className="w-full rounded-xl border border-line bg-ink px-3 py-2"
        >
          <option value="">Sin límite</option>
          <option value="250">Hasta $250</option>
          <option value="700">Hasta $700</option>
          <option value="850">Hasta $850</option>
        </select>
      </FilterGroup>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm tracking-widest text-accent uppercase">Tienda</p>
          <h1 className="font-display text-4xl">{title}</h1>
          <p className="mt-2 text-muted">{visible.length} productos</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-line px-4 py-2 text-sm lg:hidden"
          onClick={() => setFiltersOpen(true)}
        >
          Filtros
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>
        <div>
          {visible.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState title="No hay discos con esos filtros">
              Prueba otra combinación de formato, artista o precio.
            </EmptyState>
          )}
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setFiltersOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-ink p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl">Filtros</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} className="text-muted">
                Cerrar
              </button>
            </div>
            {filters}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}
