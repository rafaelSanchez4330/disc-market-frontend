import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Disc Market · CDs y vinilos con tu sello.</p>
        <div className="flex gap-4">
          <Link to="/catalogo" className="hover:text-cream">
            Catálogo
          </Link>
          <Link to="/crear" className="hover:text-cream">
            Crea el tuyo
          </Link>
        </div>
      </div>
    </footer>
  );
}
