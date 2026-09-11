import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../shared/ui/Button";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || password.length < 4) {
      setError("Usa un correo válido y una contraseña de al menos 4 caracteres.");
      return;
    }
    login(email);
    navigate("/");
  }

  return (
    <AuthShell title="Iniciar sesión" subtitle="Entra para guardar tu carrito y tus pedidos.">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-2 text-sm">
          <span className="text-muted">Correo</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink px-3 py-2"
            required
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="text-muted">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink px-3 py-2"
            required
          />
        </label>
        {error ? <p className="text-sm text-vinyl">{error}</p> : null}
        <Button type="submit" className="w-full">
          Entrar
        </Button>
        <p className="text-center text-sm text-muted">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="text-accent">
            Regístrate
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-line bg-card p-8">
      <h1 className="font-display text-3xl">{title}</h1>
      <p className="mt-2 mb-6 text-muted">{subtitle}</p>
      {children}
    </div>
  );
}
