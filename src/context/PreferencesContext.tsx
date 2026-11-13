import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { userService } from "../shared/api/services/userService";
import type { BackendUserPreference } from "../shared/api/types";

export type Theme = "dark" | "light" | "high-contrast";
const THEMES: Theme[] = ["dark", "light", "high-contrast"];
const THEME_KEY = "disc-market-theme";

/** Aplica el tema al documento y lo recuerda para la siguiente carga (evita parpadeos). */
export function applyTheme(theme: string | null | undefined) {
  const value: Theme = THEMES.includes(theme as Theme) ? (theme as Theme) : "dark";
  document.documentElement.dataset.theme = value;
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {
    // Sin acceso a localStorage
  }
}

/** Tema guardado en este navegador; se aplica antes de que React monte la app. */
export function applyStoredTheme() {
  try {
    applyTheme(localStorage.getItem(THEME_KEY));
  } catch {
    applyTheme("dark");
  }
}

type PreferencesContextValue = {
  preferences: BackendUserPreference | null;
  /** Formato favorito del usuario ("CD" | "VINYL") o null si prefiere todos. */
  preferredFormat: "CD" | "VINYL" | null;
  /** Guarda en memoria y aplica de inmediato las preferencias devueltas por el backend. */
  setPreferences: (prefs: BackendUserPreference) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth();
  const userId = user?.user_id || user?.userId;
  const [preferences, setPrefsState] = useState<BackendUserPreference | null>(null);
  // Referencias estables: updateUser cambia en cada render del AuthProvider.
  const authRef = useRef({ user, updateUser });
  authRef.current = { user, updateUser };

  const setPreferences = useCallback((prefs: BackendUserPreference) => {
    setPrefsState(prefs);
    applyTheme(prefs.theme);
    const { user: current, updateUser: update } = authRef.current;
    const avatar = prefs.avatar_url ?? null;
    if (current && (current.avatar_url ?? null) !== avatar) update({ avatar_url: avatar });
  }, []);

  // Al iniciar sesión (o recargar con sesión activa) se cargan y aplican sus preferencias.
  const previousUserId = useRef(userId);
  useEffect(() => {
    const hadUser = previousUserId.current;
    previousUserId.current = userId;
    if (!userId) {
      setPrefsState(null);
      // Al cerrar sesión se vuelve al tema predeterminado de la tienda.
      if (hadUser) applyTheme("dark");
      return;
    }
    let cancelled = false;
    userService
      .getProfile()
      .then((profile) => {
        if (!cancelled && profile.preferences) setPreferences(profile.preferences);
      })
      .catch(() => {
        // Si falla se conserva el tema guardado en el navegador
      });
    return () => {
      cancelled = true;
    };
  }, [userId, setPreferences]);

  const format = preferences?.preferred_format;
  const preferredFormat = format === "CD" || format === "VINYL" ? format : null;

  return (
    <PreferencesContext.Provider value={{ preferences, preferredFormat, setPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences debe usarse dentro de PreferencesProvider");
  return ctx;
}
