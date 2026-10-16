import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../shared/ui/Button";
import { AuthShell } from "./LoginPage";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || !email.includes("@") || password.length < 4) {
      setError("Completa nombre, un correo válido y una contraseña de al menos 4 caracteres.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await register(name.trim(), email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.message || "Error al crear la cuenta. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Crear cuenta" subtitle="Crea tu cuenta para gestionar tu carrito y pedidos.">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-2 text-sm">
          <span className="text-muted">Nombre</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink px-3 py-2"
            disabled={loading}
            required
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="text-muted">Correo</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink px-3 py-2"
            disabled={loading}
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
            disabled={loading}
            required
          />
        </label>
        {error ? <p className="text-sm text-vinyl">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Registrando..." : "Registrarme"}
        </Button>
        <p className="text-center text-sm text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link to="/iniciar-sesion" className="text-accent">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
