import { useState, type FormEvent } from "react";
import { useToast } from "../../../context/ToastContext";
import { userService } from "../../../shared/api/services/userService";
import { Button } from "../../../shared/ui/Button";

export function SecurityTab() {
  const { push } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cálculo de fortaleza de contraseña
  const hasMinLength = newPassword.length >= 6;
  const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const hasMixedCase = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);

  let strengthScore = 0;
  if (hasMinLength) strengthScore += 1;
  if (hasNumberOrSymbol) strengthScore += 1;
  if (hasMixedCase) strengthScore += 1;
  if (newPassword.length >= 10) strengthScore += 1;

  const strengthLabels = ["Muy débil", "Débil", "Aceptable", "Fuerte", "Excelente"];
  const strengthColors = [
    "bg-vinyl",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-accent",
    "bg-ok",
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      push("Debes ingresar tu contraseña actual");
      return;
    }

    if (newPassword.length < 6) {
      push("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      push("Las nuevas contraseñas no coinciden");
      return;
    }

    setIsSubmitting(true);
    try {
      await userService.updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      push("¡Contraseña actualizada con éxito!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      push(err?.message || "Error al actualizar la contraseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div className="rounded-2xl border border-line bg-card p-6 space-y-5">
        <div>
          <h2 className="font-display text-xl">Seguridad de la Cuenta</h2>
          <p className="text-sm text-muted">
            Actualiza tu contraseña periódicamente para mantener tu cuenta protegida.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted block mb-1">
            Contraseña Actual *
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-accent focus:outline-none"
            placeholder="••••••••"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted block mb-1">
            Nueva Contraseña *
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-accent focus:outline-none"
            placeholder="Al menos 6 caracteres"
            required
          />

          {newPassword ? (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Fortaleza:</span>
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
        </div>

        <div>
          <label className="text-xs font-semibold text-muted block mb-1">
            Confirmar Nueva Contraseña *
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-accent focus:outline-none"
            placeholder="Repite la nueva contraseña"
            required
          />
          {confirmPassword && newPassword !== confirmPassword ? (
            <p className="mt-1 text-xs text-vinyl">Las contraseñas no coinciden.</p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Actualizando..." : "Actualizar Contraseña"}
        </Button>
      </div>
    </form>
  );
}
