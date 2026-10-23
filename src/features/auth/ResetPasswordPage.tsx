import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authRecoveryService } from "../../shared/api/services/authRecoveryService";
import { Button } from "../../shared/ui/Button";
import { AuthShell } from "./LoginPage";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Cálculo de fortaleza de contraseña
  const hasMinLength = password.length >= 6;
  const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

  let strengthScore = 0;
  if (hasMinLength) strengthScore += 1;
  if (hasNumberOrSymbol) strengthScore += 1;
  if (hasMixedCase) strengthScore += 1;
  if (password.length >= 10) strengthScore += 1;

  const strengthLabels = ["Muy débil", "Débil", "Aceptable", "Fuerte", "Excelente"];
  const strengthColors = [
    "bg-vinyl",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-accent",
    "bg-ok",
  ];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (!token) {
      setError("El enlace de recuperación es incompleto o no contiene un token válido.");
      return;
    }

    if (password.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas ingresadas no coinciden.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await authRecoveryService.resetPassword({
        token,
        new_password: password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.message || "El enlace ha expirado o ya fue utilizado.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell
        title="Enlace no válido"
        subtitle="No se encontró un token de recuperación válido en la dirección web."
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted">
            Por favor solicita un nuevo enlace de recuperación desde la página de ayuda.
          </p>
          <Link to="/olvide-contrasena" className="block">
            <Button className="w-full">Solicitar nuevo enlace</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (isSuccess) {
    return (
      <AuthShell
        title="¡Contraseña restablecida!"
        subtitle="Tu clave de acceso ha sido actualizada de manera segura."
      >
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-ok/30 bg-ok/10 text-3xl text-ok">
            ✓
          </div>

          <p className="text-sm text-muted">
            Ya puedes iniciar sesión en Disc Market utilizando tu nueva contraseña.
          </p>

          <Link to="/iniciar-sesion" className="block">
            <Button className="w-full">Ir a Iniciar Sesión</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Restablecer contraseña"
      subtitle="Crea una nueva contraseña segura para tu cuenta de Disc Market."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-2 text-sm">
          <span className="text-muted">Nueva Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-accent focus:outline-none"
            placeholder="Al menos 6 caracteres"
            disabled={loading}
            required
            autoFocus
          />
        </label>

        {password ? (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted">Seguridad:</span>
              <span className="font-semibold text-cream">
                {strengthLabels[strengthScore]}
              </span>
            </div>
            <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-ink">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-full flex-1 rounded-full transition-all duration-300 ${
                    step <= strengthScore
                      ? strengthColors[strengthScore]
                      : "bg-line/40"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : null}

        <label className="block space-y-2 text-sm">
          <span className="text-muted">Confirmar Nueva Contraseña</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-accent focus:outline-none"
            placeholder="Repite la contraseña"
            disabled={loading}
            required
          />
        </label>

        {error ? <p className="text-sm text-vinyl">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Actualizando contraseña..." : "Guardar Nueva Contraseña"}
        </Button>
      </form>
    </AuthShell>
  );
}
