import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

const ToastContext = createContext<{ push: (message: string) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      push: (next: string) => {
        setMessage(next);
        window.setTimeout(() => setMessage(null), 2200);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <div className="fixed right-4 bottom-4 z-50 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-ink shadow-lg">
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
