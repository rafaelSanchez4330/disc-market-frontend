import { useState, type FormEvent } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { userService } from "../../../shared/api/services/userService";
import type { BackendUserPreference } from "../../../shared/api/types";
import { Button } from "../../../shared/ui/Button";

const PRESET_AVATARS = [
  { id: "vinyl", label: "Vinilo Clásico", emoji: "💿" },
  { id: "turntable", label: "Tornamesa", emoji: "📻" },
  { id: "headphones", label: "Audífonos", emoji: "🎧" },
  { id: "cassette", label: "Cassette Retro", emoji: "📼" },
  { id: "star", label: "Estrella de Rock", emoji: "🎸" },
  { id: "speaker", label: "Bocina Hi-Fi", emoji: "🔊" },
];

interface Props {
  initialPreferences: BackendUserPreference | null;
  onPreferencesUpdated: (prefs: BackendUserPreference) => void;
}

export function PersonalInfoTab({ initialPreferences, onPreferencesUpdated }: Props) {
  const { user, updateUser } = useAuth();
  const { push } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(initialPreferences?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(initialPreferences?.avatar_url || "");
  const [selectedEmoji, setSelectedEmoji] = useState<string>(() => {
    const found = PRESET_AVATARS.find((a) => a.emoji === initialPreferences?.avatar_url);
    return found ? found.emoji : "";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      push("El nombre no puede estar vacío");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalAvatar = selectedEmoji || avatarUrl.trim() || null;
      const res = await userService.updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        avatar_url: finalAvatar || undefined,
      });

      updateUser({
        name: res.user.name,
        avatar_url: res.preferences.avatar_url,
      });

      onPreferencesUpdated(res.preferences);
      push("¡Perfil actualizado con éxito!");
    } catch (err: any) {
      push(err?.message || "Error al actualizar los datos personales");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-line bg-card p-6 space-y-6">
        <div>
          <h2 className="font-display text-xl">Información Básica</h2>
          <p className="text-sm text-muted">
            Gestiona tu nombre público, datos de contacto y avatar representativo.
          </p>
        </div>

        {/* Selector de Avatar */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-muted block">
            Avatar o Icono de Perfil
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {PRESET_AVATARS.map((avatar) => {
              const isSelected = selectedEmoji === avatar.emoji;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => {
                    setSelectedEmoji(avatar.emoji);
                    setAvatarUrl("");
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all cursor-pointer ${
                    isSelected
                      ? "border-accent bg-accent/15 text-accent shadow-sm"
                      : "border-line bg-ink hover:border-line/80 text-cream"
                  }`}
                >
                  <span className="text-xl">{avatar.emoji}</span>
                  <span className="text-xs">{avatar.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <label className="text-xs text-muted block mb-1">
              O ingresa la URL de una foto/imagen personalizada:
            </label>
            <input
              type="url"
              placeholder="https://ejemplo.com/tu-foto.jpg"
              value={avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                setSelectedEmoji("");
              }}
              className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Nombre */}
          <div>
            <label className="text-xs font-semibold text-muted block mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-accent focus:outline-none"
              required
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="text-xs font-semibold text-muted block mb-1">
              Teléfono de Contacto
            </label>
            <input
              type="tel"
              placeholder="+52 55 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Correo Electrónico (Solo Lectura) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-muted">
              Correo Electrónico
            </label>
            <span className="inline-flex items-center gap-1 rounded-full bg-ok/15 px-2 py-0.5 text-[10px] font-semibold text-ok">
              ✓ Cuenta Verificada
            </span>
          </div>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full rounded-xl border border-line/60 bg-ink/50 px-3 py-2 text-sm text-muted cursor-not-allowed"
          />
          <p className="mt-1 text-[11px] text-muted">
            El correo electrónico no puede ser modificado directamente por políticas de seguridad.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando cambios..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
