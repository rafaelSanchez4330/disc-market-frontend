import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "../../data/products";
import { userService } from "../../shared/api/services/userService";
import type { BackendUserPreference, BackendUserProfileResponse } from "../../shared/api/types";
import { PersonalInfoTab } from "./components/PersonalInfoTab";
import { ShippingAddressTab } from "./components/ShippingAddressTab";
import { SecurityTab } from "./components/SecurityTab";
import { PreferencesTab } from "./components/PreferencesTab";
import { OrderHistoryTab } from "./components/OrderHistoryTab";

type TabKey = "personal" | "address" | "security" | "preferences" | "orders";

export function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>("personal");
  const [profileData, setProfileData] = useState<BackendUserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/iniciar-sesion");
      return;
    }

    if (user) {
      userService
        .getProfile()
        .then((data) => setProfileData(data))
        .catch((err) => console.error("Error al cargar perfil:", err))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, navigate]);

  const handlePreferencesUpdated = (newPrefs: BackendUserPreference) => {
    setProfileData((prev) => (prev ? { ...prev, preferences: newPrefs } : null));
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 w-full animate-pulse rounded-3xl border border-line bg-card/50" />
        <div className="h-96 w-full animate-pulse rounded-3xl border border-line bg-card/50" />
      </div>
    );
  }

  const preferences = profileData?.preferences || null;
  const stats = profileData?.stats || { total_orders: 0, total_spent: 0, last_order_date: null };
  const avatarDisplay = preferences?.avatar_url || user?.avatar_url || "🎧";

  const memberSince = profileData?.user?.created_at
    ? new Date(profileData.user.created_at).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
      })
    : "Coleccionista Activo";

  const tabs: { key: TabKey; label: string; icon: string; count?: number }[] = [
    { key: "personal", label: "Datos Personales", icon: "👤" },
    { key: "address", label: "Dirección de Entrega", icon: "📍" },
    { key: "preferences", label: "Preferencias & Formato", icon: "⚙️" },
    { key: "security", label: "Seguridad", icon: "🔒" },
    { key: "orders", label: "Mis Pedidos", icon: "📦", count: stats.total_orders },
  ];

  return (
    <div className="space-y-8">
      {/* Encabezado del Perfil y Estadísticas */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-card via-ink to-ink-soft p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Avatar e Identidad */}
          <div className="flex items-center gap-5">
            <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-accent/40 bg-ink text-4xl shadow-inner">
              {avatarDisplay.startsWith("http") ? (
                <img
                  src={avatarDisplay}
                  alt={user?.name || "Avatar"}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                <span>{avatarDisplay}</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-cream">
                  {user?.name}
                </h1>
                <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[11px] font-semibold text-accent uppercase tracking-wider">
                  {user?.role === "admin" ? "Administrador" : "Cliente Disc"}
                </span>
              </div>
              <p className="text-sm text-muted">{user?.email}</p>
              <p className="text-xs text-muted/70">
                Miembro desde {memberSince}
              </p>
            </div>
          </div>

          {/* Estadísticas de Compras */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:flex md:gap-4">
            <div className="rounded-2xl border border-line/70 bg-ink/70 px-4 py-3 text-center min-w-[130px]">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                Órdenes
              </span>
              <span className="font-display text-2xl font-bold text-accent">
                {stats.total_orders}
              </span>
            </div>

            <div className="rounded-2xl border border-line/70 bg-ink/70 px-4 py-3 text-center min-w-[140px]">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                Total Invertido
              </span>
              <span className="font-display text-2xl font-bold text-cream">
                {formatPrice(stats.total_spent)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Barra de Navegación por Pestañas */}
      <nav className="flex gap-2 overflow-x-auto border-b border-line pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-accent text-ink font-semibold shadow-md"
                  : "bg-card/60 text-cream/80 hover:bg-card hover:text-cream border border-line/50"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 ? (
                <span
                  className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold ${
                    isActive ? "bg-ink text-accent" : "bg-accent/20 text-accent"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Contenido de la Pestaña Activa */}
      <div className="transition-all">
        {activeTab === "personal" && (
          <PersonalInfoTab
            initialPreferences={preferences}
            onPreferencesUpdated={handlePreferencesUpdated}
          />
        )}
        {activeTab === "address" && (
          <ShippingAddressTab
            initialPreferences={preferences}
            onPreferencesUpdated={handlePreferencesUpdated}
          />
        )}
        {activeTab === "preferences" && (
          <PreferencesTab
            initialPreferences={preferences}
            onPreferencesUpdated={handlePreferencesUpdated}
          />
        )}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "orders" && <OrderHistoryTab />}
      </div>
    </div>
  );
}
