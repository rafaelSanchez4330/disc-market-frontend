import { Link } from "react-router-dom";
import { customTemplates, products } from "../../data/products";
import { Button } from "../../shared/ui/Button";
import { ProductCard } from "../../shared/ui/ProductCard";

export function HomePage() {
  const featured = products.filter((p) => p.productType === "REGULAR").slice(0, 4);
  const cds = products.filter((p) => p.format === "CD" && p.productType === "REGULAR").slice(0, 3);
  const vinyls = products.filter((p) => p.format === "VINYL" && p.productType === "REGULAR").slice(0, 3);

  return (
    <div className="space-y-16">
      <section className="overflow-hidden rounded-3xl border border-line bg-[radial-gradient(circle_at_top_right,rgba(232,162,58,0.18),transparent_40%),linear-gradient(160deg,#1b1915,#12110f)] px-6 py-14 md:px-12">
        <p className="text-sm tracking-[0.25em] text-accent uppercase">Tienda de discos físicos</p>
        <h1 className="font-display mt-3 max-w-3xl text-4xl leading-tight md:text-6xl">
          Discos físicos, a tu manera.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          CDs, vinilos y ediciones para coleccionar. O crea un disco con tu portada, tus pistas y un mensaje.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/catalogo">
            <Button>Ver catálogo</Button>
          </Link>
          <Link to="/crear">
            <Button variant="ghost">Crea el tuyo</Button>
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl">Destacados</h2>
          <Link to="/catalogo" className="text-sm text-accent hover:underline">
            Ver todo
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <FormatBlock title="CDs" to="/cds" items={cds} />
        <FormatBlock title="Vinilos" to="/vinilos" items={vinyls} />
      </section>

      <section className="rounded-3xl border border-line bg-card p-6 md:p-10">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-3xl">Productos personalizados</h2>
            <p className="mt-2 text-muted">Un disco que no existe en ninguna otra tienda: el tuyo.</p>
          </div>
          <Link to="/crear">
            <Button variant="ghost">Empezar a crear</Button>
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {customTemplates.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

function FormatBlock({
  title,
  to,
  items,
}: {
  title: string;
  to: string;
  items: typeof products;
}) {
  return (
    <div className="rounded-3xl border border-line bg-ink-soft p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl">{title}</h2>
        <Link to={to} className="text-sm text-accent">
          Explorar
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
        {items.map((product) => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>
    </div>
  );
}
