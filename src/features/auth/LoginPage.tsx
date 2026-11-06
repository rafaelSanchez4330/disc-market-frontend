import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../shared/ui/Button";
import { OtpInput } from "./components/OtpInput";
import { authRecoveryService } from "../../shared/api/services/authRecoveryService";

type LoginMode = "password" | "otp";
type OtpStep = "request" | "verify";

export function LoginPage() {
  const { login, loginWithOtp } = useAuth();
  const navigate = useNavigate();

  // Mode & step
  const [mode, setMode] = useState<LoginMode>("password");
  const [otpStep, setOtpStep] = useState<OtpStep>("request");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Feedback states
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Clean error when switching modes
  const handleModeChange = (newMode: LoginMode) => {
    setMode(newMode);
    setError("");
    setSuccessMsg("");
    setOtpCode("");
    setOtpStep("request");
  };

  // Submit password login
  async function onPasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || password.length < 4) {
      setError("Usa un correo válido y una contraseña de al menos 4 caracteres.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  }

  // Request OTP code
  async function onRequestOtp(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await authRecoveryService.requestOtp({ email });
      setSuccessMsg(res.message || "Hemos enviado el código a tu correo.");
      setOtpStep("verify");
      setCountdown(60); // 60s cooldown
    } catch (err: any) {
      setError(err?.message || "No pudimos enviar el código. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // Verify OTP code
  async function onVerifyOtp(e: FormEvent) {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError("El código debe tener exactamente 6 dígitos.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await loginWithOtp(email, otpCode);
      navigate("/");
    } catch (err: any) {
      setError(err?.message || "Código incorrecto o expirado.");
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP
  async function onResendOtp() {
    if (countdown > 0 || loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await authRecoveryService.requestOtp({ email });
      setSuccessMsg(res.message || "Nuevo código enviado.");
      setCountdown(60);
      setOtpCode("");
    } catch (err: any) {
      setError(err?.message || "Error al reenviar el código.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle={
        mode === "password"
          ? "Entra para gestionar tu colección, pedidos y preferencias."
          : "Inicia sesión rápidamente con un código temporal sin contraseña."
      }
    >
      {/* Selector de modo */}
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-line bg-ink/70 p-1">
        <button
          type="button"
          onClick={() => handleModeChange("password")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition ${
            mode === "password"
              ? "bg-card text-accent shadow-sm border border-line/60"
              : "text-muted hover:text-white"
          }`}
        >
          <span>🔑</span> Contraseña
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("otp")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition ${
            mode === "otp"
              ? "bg-card text-accent shadow-sm border border-line/60"
              : "text-muted hover:text-white"
          }`}
        >
          <span>⚡</span> Código OTP
        </button>
      </div>

      {mode === "password" ? (
        /* Formulario clásico con contraseña */
        <form onSubmit={onPasswordSubmit} className="space-y-4">
          <label className="block space-y-2 text-sm">
            <span className="text-muted">Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-white focus:border-accent focus:outline-none transition"
              disabled={loading}
              required
            />
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Contraseña</span>
              <Link
                to="/olvide-contrasena"
                className="text-xs text-accent hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-white focus:border-accent focus:outline-none transition"
              disabled={loading}
              required
            />
          </div>

          {error ? <p className="text-sm text-vinyl">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar con contraseña"}
          </Button>
        </form>
      ) : (
        /* Formulario con OTP de un solo uso */
        <div>
          {otpStep === "request" ? (
            <form onSubmit={onRequestOtp} className="space-y-4">
              <p className="text-xs text-muted leading-relaxed">
                Ingresa tu correo registrado y te enviaremos un código de seguridad de 6 dígitos para entrar de inmediato.
              </p>

              <label className="block space-y-2 text-sm">
                <span className="text-muted">Correo electrónico</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-white focus:border-accent focus:outline-none transition"
                  disabled={loading}
                  required
                />
              </label>

              {error ? <p className="text-sm text-vinyl">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando código..." : "Enviar código de acceso"}
              </Button>
            </form>
          ) : (
            <form onSubmit={onVerifyOtp} className="space-y-5">
              <div className="rounded-xl border border-line/60 bg-ink/40 p-3 text-center">
                <p className="text-xs text-muted">
                  Código enviado a <span className="font-semibold text-white">{email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep("request");
                    setError("");
                  }}
                  className="mt-1 text-xs text-accent hover:underline"
                >
                  Cambiar correo
                </button>
              </div>

              {successMsg ? (
                <p className="text-center text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 p-2 rounded-lg">
                  {successMsg}
                </p>
              ) : null}

              <div className="space-y-2">
                <label className="block text-center text-xs font-medium uppercase tracking-wider text-muted">
                  Ingresa los 6 dígitos
                </label>
                <OtpInput
                  value={otpCode}
                  onChange={setOtpCode}
                  disabled={loading}
                />
              </div>

              {error ? <p className="text-center text-sm text-vinyl">{error}</p> : null}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? "Verificando..." : "Ingresar con código"}
              </Button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-muted">
                    Podrás solicitar otro código en{" "}
                    <span className="font-semibold text-white">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={onResendOtp}
                    disabled={loading}
                    className="text-xs text-accent hover:underline"
                  >
                    ¿No recibiste el código? Reenviar
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link to="/registro" className="text-accent hover:underline font-medium">
          Regístrate
        </Link>
      </p>
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
