import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const links = [
  { to: "/", label: "Inicio" },
  { to: "/cds", label: "CDs" },
  { to: "/vinilos", label: "Vinilos" },
  { to: "/catalogo?categoria=Custom", label: "Productos personalizados" },
  { to: "/crear", label: "Crea el tuyo" },
];

export function Navbar() {
  const { count } = useCart();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="font-display text-xl tracking-tight">
          Disc<span className="text-accent">Market</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `transition hover:text-accent ${isActive ? "text-accent" : "text-cream/80"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/carrito"
            className="relative rounded-full border border-line px-3 py-1.5 text-sm hover:border-accent"
          >
            Carrito
            {count > 0 ? (
              <span className="absolute -top-2 -right-2 grid h-5 min-w-5 place-items-center rounded-full bg-vinyl px-1 text-[11px] font-bold">
                {count}
              </span>
            ) : null}
          </Link>
          {user ? (
            <button type="button" onClick={logout} className="hidden text-sm text-muted hover:text-cream sm:inline">
              {user.name} · salir
            </button>
          ) : (
            <Link to="/iniciar-sesion" className="hidden text-sm text-muted hover:text-cream sm:inline">
              Iniciar sesión
            </Link>
          )}
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-line lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            ☰
          </button>
        </div>
      </div>

      {open ? (
        <nav className="flex flex-col gap-3 border-t border-line px-4 py-4 lg:hidden">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)} className="text-cream/90">
              {link.label}
            </NavLink>
          ))}
          {user ? (
            <button type="button" onClick={logout} className="text-left text-muted">
              Cerrar sesión
            </button>
          ) : (
            <Link to="/iniciar-sesion" onClick={() => setOpen(false)}>
              Iniciar sesión
            </Link>
          )}
        </nav>
      ) : null}
    </header>
  );
}
