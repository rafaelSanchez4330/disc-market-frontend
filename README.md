# Disc Market - Frontend

Cliente web de **Disc Market**, plataforma de comercio electrónico para la venta y personalización de música en formatos físicos (**CDs** y **Vinilos**).

---

## 🛠️ Tecnologías y Librerías

- **Core:** React 19 + TypeScript
- **Empaquetador:** Vite 7
- **Estilos:** TailwindCSS v4 (Diseño atómico con temática oscura, estética de vinilos y tipografías *Syne* y *Manrope*)
- **Pasarela de Pagos:** `@stripe/react-stripe-js` (Stripe Elements integrado)
- **Enrutamiento:** React Router DOM v7

---

## 🚀 Puesta en Marcha

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
   *Asegúrate de que `VITE_API_BASE_URL` apunte a `http://localhost:5000/api`.*

3. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 🧪 Cuentas de Prueba para Pruebas Manuales (E2E)

Una vez ejecutado el seeder en el backend (`npm run seed`), puedes iniciar sesión con las siguientes credenciales:

| Rol | Correo Electrónico | Contraseña | Funcionalidad a Probar |
| :--- | :--- | :--- | :--- |
| **Cliente Demo** | `demo@discmarket.com` | `Demo123!` | • Perfil (`/perfil`) con avatar `🎧` y estadísticas reales.<br>• Dirección en CDMX prellenada en checkout (`/carrito`).<br>• Historial de pedidos con números de guía `TRK-...` y badges dinámicos. |
| **Administrador** | `admin@discmarket.com` | `Admin123!` | Rol administrativo para gestión y catalogación. |
