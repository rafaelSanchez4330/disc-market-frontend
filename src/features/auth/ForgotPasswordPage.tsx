import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { authRecoveryService } from "../../shared/api/services/authRecoveryService";
import { Button } from "../../shared/ui/Button";
import { AuthShell } from "./LoginPage";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await authRecoveryService.forgotPassword({ email: email.trim() });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <AuthShell
        title="Revisa tu correo"
        subtitle="Si tu cuenta está registrada en Disc Market, recibirás un enlace de recuperación."
      >
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-3xl">
            📨
          </div>

          <div className="rounded-2xl border border-line bg-ink/50 p-4 text-xs text-muted leading-relaxed">
            <p>
              Hemos procesado tu solicitud para <span className="font-semibold text-cream">{email}</span>.
            </p>
            <p className="mt-2">
              El enlace es válido por <strong>30 minutos</strong>. Revisa tu bandeja de entrada o la carpeta de correo no deseado (Spam).
            </p>
          </div>

          <div className="space-y-3">
            <Link to="/iniciar-sesion" className="block">
              <Button className="w-full">Volver a Iniciar Sesión</Button>
            </Link>
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="text-xs text-muted hover:text-accent cursor-pointer"
            >
              ¿No recibiste el correo? Intentar con otra dirección
            </button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle="Ingresa tu correo y te enviaremos un enlace seguro para restablecerla."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-2 text-sm">
          <span className="text-muted">Correo Electrónico</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-accent focus:outline-none"
            placeholder="tu_correo@ejemplo.com"
            disabled={loading}
            required
            autoFocus
          />
        </label>

        {error ? <p className="text-sm text-vinyl">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Enviando instrucciones..." : "Enviar Enlace de Recuperación"}
        </Button>

        <p className="text-center text-sm text-muted pt-2">
          ¿Recordaste tu contraseña?{" "}
          <Link to="/iniciar-sesion" className="text-accent font-medium hover:underline">
            Inicia sesión aquí
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
