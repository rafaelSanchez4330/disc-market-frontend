# 📋 Especificación de Funcionalidades Pendientes y Hoja de Ruta (Roadmap)
## Proyecto: Disc Market (Backend & Frontend)

Este documento detalla la arquitectura, modelo de datos, endpoints de API, diseño de interfaces y plan técnico para la implementación de las funcionalidades pendientes y correcciones del sistema **Disc Market**.

---

## 📑 Tabla de Contenidos
1. [Módulo 1: Control de Acceso y Usuario Administrador (RBAC)](#-módulo-1-control-de-acceso-y-usuario-administrador-rbac)
2. [Módulo 2: Configuraciones de Usuario y Preferencias](#-módulo-2-configuraciones-de-usuario-y-preferencias)
3. [Módulo 3: Subida de Audios y Validación de Copyright](#-módulo-3-subida-de-audios-y-validación-de-copyright)
4. [Módulo 4: Gestión Integral de Inventarios](#-módulo-4-gestión-integral-de-inventarios)
5. [Módulo 5: Corrección de Errores y Bugs de la Aplicación](#-módulo-5-corrección-de-errores-y-bugs-de-la-aplicación)
6. [Matriz de Priorización y Fases de Entrega](#-matriz-de-priorización-y-fases-de-entrega)

---

## 🛡️ Módulo 1: Control de Acceso y Usuario Administrador (RBAC)

### 1.1. Contexto y Necesidad
Actualmente, el sistema registra usuarios con un rol por defecto (`customer`) en la tabla `users`, pero los endpoints para crear productos (`POST /api/products`) carecen de validación de identidad y permisos. Se requiere un esquema formal de **Role-Based Access Control (RBAC)** que distinga entre clientes (`customer`), administradores de plataforma (`admin`) y operadores de catálogo (`inventory_manager`).

### 1.2. Matriz de Permisos
| Acción / Endpoint | `customer` | `inventory_manager` | `admin` |
| :--- | :---: | :---: | :---: |
| Explorar catálogo y reproducir previews | ✅ | ✅ | ✅ |
| Crear y comprar discos personalizados | ✅ | ✅ | ✅ |
| Consultar perfil y compras propias | ✅ | ✅ | ✅ |
| Crear nuevos productos en catálogo | ❌ | ✅ | ✅ |
| Modificar precios, nombres y descripciones | ❌ | ✅ | ✅ |
| Ajustar existencias y niveles de stock | ❌ | ✅ | ✅ |
| Eliminar o archivar productos del catálogo | ❌ | ❌ | ✅ |
| Promover usuarios o reasignar roles | ❌ | ❌ | ✅ |
| Consultar métricas financieras y órdenes globales | ❌ | ❌ | ✅ |

### 1.3. Arquitectura Técnica en Backend
1. **Middlewares de Seguridad:**
   * `auth.middleware.ts`: Extrae el header `Authorization: Bearer <token>`, valida la firma criptográfica con `JWT_SECRET` y vincula `req.user = decodedToken`.
   * `roles.middleware.ts`: Función generadora de orden superior (`requireRole(['admin', 'inventory_manager'])`) que verifica si el usuario autenticado tiene el privilegio requerido; responde `403 Forbidden` si no lo tiene.
2. **Nuevos Endpoints de Administración de Catálogo:**
   * `PUT /api/products/:id`: Edición completa de datos del producto (título, artista, formato, precio, descripción, categoría, carátula).
   * `PATCH /api/products/:id/quick-edit`: Edición parcial rápida (únicamente precio y descripción).
   * `DELETE /api/products/:id`: Eliminación lógica o física (borrado seguro verificando si existen órdenes asociadas).
   * `PATCH /api/users/:id/role`: Asignación de rol a un usuario (exclusivo para `admin`).

### 1.4. Interfaz de Usuario en Frontend
* **Ruta protegida `/admin`:**
  * Componente `AdminGuard` que valida si `user?.role === 'admin'`. Redirige a `/` con toast de advertencia si no tiene privilegios.
* **Panel de Gestión de Catálogo (`/admin/productos`):**
  * Tabla con buscador en tiempo real, filtros por formato, stock y estado.
  * Botón para dar de alta nuevo producto con modal o vista dedicada (`ProductFormModal`).
  * Edición inline de precio y descripción.
  * Botón de borrado con modal de confirmación irreversible.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 👤 Usuario Administrador
    participant Front as 💻 Frontend (/admin)
    participant AuthMW as 🔒 Auth & Roles Middleware
    participant Controller as ⚙️ ProductController
    participant DB as 🗄️ PostgreSQL

    Admin->>Front: Modifica precio de Vinilo a $849.00
    Front->>AuthMW: PATCH /api/products/12/quick-edit + Bearer JWT
    AuthMW->>AuthMW: Valida JWT y verifica req.user.role in ['admin']
    alt Rol no autorizado
        AuthMW-->>Front: 403 Forbidden ("Acceso no autorizado")
        Front-->>Admin: Muestra toast de error
    else Permiso concedido
        AuthMW->>Controller: updateProduct(req, res)
        Controller->>DB: UPDATE products SET price = 849.00 WHERE product_id = 12
        DB-->>Controller: Producto actualizado
        Controller-->>Front: 200 OK { updatedProduct }
        Front-->>Admin: Actualiza UI con confirmación
    end
```

---

## ⚙️ Módulo 2: Configuraciones de Usuario y Preferencias ✅ (Completado / Implementado)

> **Estado:** ✅ **COMPLETADO (Octubre 2026)**
>
> **Artefactos implementados:**
> * **Backend:**
>   * Entidad TypeORM: [`UserPreference.ts`](../disc-market-backend/src/entities/UserPreference.ts) (relación 1:1 con `User`).
>   * Controlador: [`user.controller.ts`](../disc-market-backend/src/controllers/user.controller.ts) con métodos `getProfile`, `updateProfile`, `updatePassword`, `updatePreferences` y `getUserOrders`.
>   * Rutas: [`user.routes.ts`](../disc-market-backend/src/routes/user.routes.ts) protegidas con `authenticateToken` bajo `/api/users`.
> * **Frontend:**
>   * Servicios API: [`userService.ts`](./src/shared/api/services/userService.ts) y contratos en [`types.ts`](./src/shared/api/types.ts).
>   * Vista Principal: [`ProfilePage.tsx`](./src/features/profile/ProfilePage.tsx) con soporte para 5 pestañas de configuración.
>   * Pestañas Modulares: [`PersonalInfoTab.tsx`](./src/features/profile/components/PersonalInfoTab.tsx), [`ShippingAddressTab.tsx`](./src/features/profile/components/ShippingAddressTab.tsx), [`PreferencesTab.tsx`](./src/features/profile/components/PreferencesTab.tsx), [`SecurityTab.tsx`](./src/features/profile/components/SecurityTab.tsx), y [`OrderHistoryTab.tsx`](./src/features/profile/components/OrderHistoryTab.tsx).
>   * Integración en Checkout: [`CartPage.tsx`](./src/features/cart/CartPage.tsx) con autocompletado de la dirección por defecto guardada.

### 2.1. Contexto y Necesidad
La experiencia de usuario previa no permitía actualizar datos personales, gestionar direcciones de entrega guardadas, modificar la contraseña ni configurar preferencias de la plataforma.

### 2.2. Modelo de Datos Implementado
Se persistió mediante la tabla relacional `user_preferences` conectada en relación 1:1 con `users`:

```sql
CREATE TABLE user_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    phone VARCHAR(20),
    preferred_format VARCHAR(10) DEFAULT 'ALL', -- 'VINYL', 'CD', 'ALL'
    theme VARCHAR(20) DEFAULT 'dark',            -- 'dark', 'light', 'high-contrast'
    notify_order_status BOOLEAN DEFAULT TRUE,
    notify_newsletter BOOLEAN DEFAULT FALSE,
    default_address_line1 VARCHAR(255),
    default_address_line2 VARCHAR(255),
    default_city VARCHAR(100),
    default_state VARCHAR(100),
    default_postal_code VARCHAR(20),
    default_country VARCHAR(100) DEFAULT 'México',
    avatar_url VARCHAR(500),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3. Endpoints Implementados
* [x] `GET /api/users/profile`: Devuelve el perfil del usuario autenticado, sus preferencias y estadísticas de compras (total gastado, conteo de pedidos y última orden).
* [x] `PUT /api/users/profile`: Actualización de nombre, teléfono y avatar de perfil.
* [x] `PUT /api/users/password`: Cambio seguro de contraseña (valida `current_password` con `bcrypt.compare`, longitud mínima y cifra nuevo hash).
* [x] `PUT /api/users/preferences`: Actualización de dirección de entrega por defecto, tema, formato musical y suscripción a notificaciones.
* [x] `GET /api/users/orders`: Historial completo de órdenes con número de rastreo (`tracking_number`), desglose de ítems estándar y personalizados, y estados de entrega.

### 2.4. Vistas y Componentes Frontend Implementados
* [x] **Ruta `/perfil` (Mi Cuenta):**
  * [x] **Cabecera y Métricas:** Tarjeta con avatar dinámico, rol, fecha de alta y contadores de pedidos e inversión total.
  * [x] **Pestaña 1 - Datos Personales:** Nombre, correo verificado (solo lectura), teléfono y selector de avatares temáticos.
  * [x] **Pestaña 2 - Dirección de Entrega:** Formulario estructurado y vista previa interactiva estilo etiqueta física de paquetería.
  * [x] **Pestaña 3 - Preferencias & Formato:** Selección de formato predilecto (Vinilo/CD/Ambos), tema visual y toggles de alertas.
  * [x] **Pestaña 4 - Seguridad:** Cambio de contraseña con medidor interactivo de fortaleza en tiempo real.
  * [x] **Pestaña 5 - Historial de Pedidos:** Listado de órdenes con badges de estatus, desglose de productos y botón para copiar la guía de rastreo.
  * [x] **Autocompletado en Checkout:** Precarga automática de la dirección guardada en `CartPage.tsx`.

---

## 🎵 Módulo 3: Subida de Audios y Validación de Copyright ✅ (Completado / Implementado)

> **Estado:** ✅ **COMPLETADO (Noviembre 2026)**
>
> **Artefactos implementados:**
> * **Backend:**
>   * Entidades TypeORM: [`CustomTrack.ts`](../disc-market-backend/src/entities/CustomTrack.ts) (campos de estatus de copyright, matches, tamaño binario y huella acústica) y [`CustomProduct.ts`](../disc-market-backend/src/entities/CustomProduct.ts) (duración física total y campos de acta/declaración jurada con timestamp, IP y hash SHA-256).
>   * Motor de Copyright: [`copyright.service.ts`](../disc-market-backend/src/services/copyright.service.ts) con escaneo acústico, cotejo de catálogo comercial protegido (Sony, Universal, Warner), cálculo de hash SHA-256 de fonogramas y validación de capacidades físicas (CD 80 min / 20 tracks, Vinilo 44 min / 12 tracks).
>   * Controlador & Rutas: [`customProduct.controller.ts`](../disc-market-backend/src/controllers/customProduct.controller.ts) con endpoints `POST /api/custom-products/scan-track` (escaneo rápido con eliminación de temporales) y `POST /api/custom-products/:id/tracks` (procesamiento binario, validación de integridad, rollback en caso de rechazo y firma digital) y [`customProduct.routes.ts`](../disc-market-backend/src/routes/customProduct.routes.ts).
>   * Middleware Multer & Magic Bytes: [`upload.middleware.ts`](../disc-market-backend/src/middlewares/upload.middleware.ts) con soporte para carga única y múltiple de archivos de audio, límites de 50MB (CD) y 75MB (Vinilo) y validación binaria de cabeceras.
> * **Frontend:**
>   * Servicios API: [`customProductService.ts`](./src/shared/api/services/customProductService.ts) con métodos `scanTrack` y `uploadTracks`, y contratos extendidos en [`types.ts`](./src/shared/api/types.ts).
>   * Creador Físico Interactivo: [`CreatePage.tsx`](./src/features/custom/CreatePage.tsx) con zona Drag & Drop para archivos de audio (`.mp3, .wav, .flac, .m4a, .aac`), extracción de duración en tiempo real (`loadedmetadata`), previsualización y reproductor HTML5 integrado, medidor visual de capacidad física con semáforo de colores (verde/ámbar/rojo), badges dinámicos de verificación de copyright y cláusula legal obligatoria de declaración jurada con bloqueo de compra.

### 3.1. Contexto y Necesidad
En el creador de discos personalizados (`/crear`), el paso 2 solicitaba únicamente texto simple para los nombres de las canciones sin persistencia binaria ni validación de soporte. La funcionalidad completa implementada resuelve:
1. Subida real y almacenamiento seguro de archivos de audio por parte del usuario (`uploads/tracks/`).
2. Validación de duración máxima según la capacidad física del medio (80 min para CD, 44 min para Vinilo).
3. **Mecanismo de validación y control de derechos de autor (Copyright Compliance)** con 3 capas de defensa para evitar la manufactura de fonogramas comerciales protegidos sin licencia.

### 3.2. Límites Físicos por Formato
| Formato | Capacidad Máxima | Formatos Soportados | Límite por Archivo |
| :--- | :---: | :---: | :---: |
| **CD (Disco Compacto)** | 74 a 80 minutos totales (hasta 20 pistas) | MP3, WAV, FLAC, AAC | 50 MB por pista |
| **Vinilo (12" LP - 33 RPM)** | 22 minutos por cara (44 min total) | MP3, WAV, FLAC | 75 MB por pista |

### 3.3. Arquitectura de Verificación de Copyright
El control de derechos de autor se abordará con un enfoque de tres capas de defensa:

```mermaid
flowchart TD
    A[Usuario sube archivo de audio] --> B[Extracción de Metadatos ID3 & Audio Fingerprint]
    B --> C{Escaneo con API de Reconocimiento Acústico}
    C -- Coincidencia con catálogo comercial protegido --> D[Alerta de Copyright: Track Rechazado]
    C -- Sin coincidencias en base de huellas comerciales --> E[Verificación de Límites de Duración]
    E --> F[Firma Digital de Declaración Jurada de Propiedad Intelectual]
    F --> G[Aprobación para Masterización y Producción]
```

1. **Capa 1: Huella Acústica Automatizada (Audio Fingerprinting):**
   * Integración con servicio de reconocimiento acústico (ej. **AcoustID / Chromaprint** o **AudD Music API**).
   * Al cargar cada pista, el backend extrae el fingerprint acústico del audio (`fpcalc`) y consulta si coincide con fonogramas comerciales protegidos por discográficas multinacionales (Sony, Universal, Warner, etc.).
   * Si la canción coincide con un track comercial con derechos restringidos de distribución, se marca como `COPYRIGHT_FLAGGED` y se bloquea su manufactura.
2. **Capa 2: Declaración Jurada Legal y Consentimiento de Propiedad:**
   * Cláusula legal obligatoria antes de ordenar el prensado:
     > *"Declaro bajo protesta de decir verdad que soy titular legítimo de los derechos patrimoniales y morales de los audios cargados, o poseo la licencia correspondiente para su reproducción física. Exonero a Disc Market de cualquier reclamo por infracción a la Ley Federal del Derecho de Autor."*
   * El sistema almacena la aceptación con firma digital (timestamp, IP del cliente, ID de usuario y hash SHA-256 de los audios).
3. **Capa 3: Panel de Revisión Administrativa (Auditoría de Producción):**
   * Antes del prensado físico, un operador revisa el reporte del escaneo acústico de las pistas del pedido.

### 3.4. Implementación en Frontend (`CreatePage.tsx`)
* Zona interactiva de subida con Drag & Drop en el paso de "Pistas".
* Reproductor de audio embebido para que el usuario pueda escuchar una previsualización de su propia pista.
* Barra de progreso de subida y badges de estado:
  * 🟢 `Verificado / Original`
  * 🟡 `Analizando derechos...`
  * 🔴 `Conflicto de copyright detectado`
* Indicador de tiempo total acumulado (ejemplo: `32:15 / 44:00 min utilizados`).

---

## 📦 Módulo 4: Gestión Integral de Inventarios

### 4.1. Contexto y Necesidad
Actualmente existe la tabla `inventory` vinculada a `products`, pero solo cuenta con `quantity_available` y `quantity_reserved`, sin registro histórico de movimientos, sin umbrales de reabastecimiento ni alertas de rotura de stock.

### 4.2. Modelo de Datos Ampliado
```sql
-- Extensión de la tabla de inventario existente
ALTER TABLE inventory ADD COLUMN min_threshold INT DEFAULT 5;
ALTER TABLE inventory ADD COLUMN unit_cost DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE inventory ADD COLUMN aisle_location VARCHAR(50);

-- Tabla histórica de movimientos de inventario (Kardex)
CREATE TABLE inventory_logs (
    log_id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL, -- 'PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'DEFECTIVE'
    quantity_changed INT NOT NULL,       -- Positivo para entradas, negativo para salidas
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reference_order_id INT REFERENCES orders(order_id) ON DELETE SET NULL,
    notes TEXT,
    performed_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3. Endpoints de la API de Inventario
* `GET /api/inventory`: Listado general con cálculo de estado (`in_stock`, `low_stock`, `out_of_stock`).
* `POST /api/inventory/adjustment`: Registro de entrada o salida manual de stock con bitácora de auditoría.
* `GET /api/inventory/low-stock`: Reporte de productos que están por debajo del umbral mínimo (`quantity_available <= min_threshold`).
* `GET /api/inventory/logs/:product_id`: Historial detallado de movimientos de un producto.

### 4.4. Prevención de Sobreventa (Race Conditions)
* Al momento de crear la intención de pago en Stripe (`POST /api/payments/create-intent`):
  * Se bloquea el stock temporalmente moviendo `quantity_available` a `quantity_reserved` dentro de una transacción con `SELECT ... FOR UPDATE`.
  * Si el pago es exitoso vía Webhook, `quantity_reserved` se descuenta definitivamente y se genera el registro en `inventory_logs`.
  * Si la sesión de pago expira o falla tras 30 minutos, un job o cron reactiva las unidades reservadas regresándolas a `quantity_available`.

---

## 🐛 Módulo 5: Corrección de Errores y Bugs de la Aplicación

A continuación se detallan los errores, inconsistencias y vulnerabilidades identificadas en el estado actual del repositorio, junto con su respectiva solución:

### 5.1. Seguridad y Autenticación en Endpoints Críticos ✅ (Completado)
* **Diagnóstico:** Rutas como `POST /api/products`, `POST /api/custom-products` y consultas de órdenes no validaban el token JWT del usuario, permitiendo que clientes anónimos pudieran publicar productos o enviar carritos sin sesión real.
* **Solución Implementada:**
  * Implementado middleware `authenticateToken` en todas las rutas protegidas (`/cart`, `/custom-products`, `/orders`, `/payments`, `/products`).
  * Inyección estricta de `req.user.user_id` desde el token verificado y eliminación total de fallbacks arbitrarios (`userRepo.findOne()`).
  * Validación de propiedad de órdenes y carritos (o permiso de administrador).

### 5.2. Desfase de Precios Hardcodeados en Creación Personalizada ✅ (Completado)
* **Diagnóstico:** En `customProduct.controller.ts` y en `CreatePage.tsx`, el precio base del disco personalizado estaba fijado con valores en código (`Vinyl = $799.00`, `CD = $99.00`). Si el administrador alteraba los precios en la base de datos, el cálculo del checkout quedaba inconsistente.
* **Solución Implementada:**
  * Creado endpoint `GET /api/custom-products/pricing` que consulta los precios base vigentes desde la tabla `products` en PostgreSQL.
  * El controlador `createCustomProduct` resuelve de forma autoritativa el precio oficial en el backend evitando cualquier manipulación desde el cliente.
  * En frontend, [`customProductService.ts`](./src/shared/api/services/customProductService.ts) y [`CreatePage.tsx`](./src/features/custom/CreatePage.tsx) consumen dinámicamente este endpoint al montar la vista y al seleccionar formato.

### 5.3. Limpieza de Archivos Huérfanos en Multer ante Errores de Base de Datos ✅ (Completado)
* **Diagnóstico:** Cuando un usuario sube una portada (`uploadCover`) o pistas (`uploadTracks`) y la inserción subsiguiente en PostgreSQL falla por error de clave foránea o validación, los archivos ya fueron guardados en el disco en `uploads/covers/` o `uploads/tracks/`, generando acumulación de basura y consumo innecesario de almacenamiento.
* **Solución Implementada:**
  * Creado módulo de limpieza [`fileCleanup.ts`](../disc-market-backend/src/utils/fileCleanup.ts) con `safelyDeleteFile` y `safelyDeleteFiles`.
  * Integrado rollback automático en bloques `try/catch` y caminos de error de `createCustomProduct` y `addTracksToCustomProduct`.

### 5.4. Sincronización del Carrito Dual (Local vs. Servidor) ✅ (Completado)
* **Diagnóstico:** En `CartContext.tsx`, si la llamada al backend fallaba por problemas de conexión intermitente, el estado local no reintentaba sincronizarse al volver la conexión, provocando discrepancias entre lo que el usuario ve en pantalla y lo que Stripe cobra (ya que Stripe valida el carrito de la base de datos).
* **Solución Implementada:**
  * Implementada cola de sincronización con reintentos automáticos al dispararse el evento `'online'` y reintento en segundo plano cada 15 segundos si hay ítems pendientes o error de red.
  * Incorporado estado `isPendingSync`, `syncError` y función `retrySync` en [`CartContext.tsx`](./src/context/CartContext.tsx).
  * Añadido banner visual de advertencia interactivo en [`CartPage.tsx`](./src/features/cart/CartPage.tsx) con botón "Sincronizar ahora" y bloqueo de checkout preventivo hasta consolidar el carrito con el backend.

### 5.5. Manejo del Pool de Conexiones de PostgreSQL (TypeORM) ✅ (Completado)
* **Diagnóstico:** La inicialización de `AppDataSource` no contaba con política de reintentos exponenciales en caso de que el contenedor de PostgreSQL tarde en estar disponible tras reiniciar `docker-compose`.
* **Solución Implementada:**
  * Implementada función `connectWithRetry` en [`index.ts`](../disc-market-backend/src/index.ts) con 5 intentos de conexión y retardo progresivo con retroceso exponencial (2s, 4s, 8s, 16s...) antes de abortar el arranque.

### 5.6. Sanitización y Validación de Tipos MIME en Archivos ✅ (Completado)
* **Diagnóstico:** El filtro de Multer en `upload.middleware.ts` validaba la extensión y el `file.mimetype` reportado por el cliente, pero no analizaba los Magic Bytes del archivo real, abriendo riesgo de subida de ejecutables camuflados.
* **Solución Implementada:**
  * Implementados validadores de cabeceras binarias `isValidImageMagicBytes` (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WEBP `RIFF...WEBP`) y `isValidAudioMagicBytes` (MP3 ID3/Sync, WAV `RIFF...WAVE`, OGG `OggS`, FLAC `fLaC`, M4A `ftyp`).
  * Integrados middlewares `validateImageMagicBytes` y `validateAudioMagicBytes` que analizan los primeros bytes en disco y eliminan automáticamente cualquier archivo fraudulento.

---

## 📅 Matriz de Priorización y Fases de Entrega

```mermaid
gantt
    title Cronograma de Implementación de Funcionalidades Pendientes
    dateFormat  YYYY-MM-DD
    section Fase 1: Estabilización y Seguridad
    Auditoría y corrección de bugs críticos :done, 2026-10-17, 4d
    Middleware JWT y Protección de Endpoints :done, 2026-10-21, 3d
    Limpieza de archivos huérfanos Multer :done, 2026-10-24, 2d
    section Fase 2: Gestión de Inventarios y Admin
    Modelo de Inventario y Movimientos (Kardex) : 2026-10-26, 4d
    Panel de Administración en Frontend (/admin) : 2026-10-30, 5d
    CRUD de Productos y Control de Stock : 2026-11-04, 4d
    section Fase 3: Perfil y Preferencias
    Modelo user_preferences y Endpoints :done, 2026-10-20, 2d
    Vista de Perfil y Direcciones de Envío :done, 2026-10-20, 2d
    section Fase 4: Pipeline de Audio y Copyright
    Subida masiva de audio en Frontend : 2026-11-15, 4d
    Validación de Copyright e Integración de Fingerprint : 2026-11-19, 6d
    Firma digital de declaración jurada y auditoría : 2026-11-25, 3d
```

| Prioridad | Módulo / Funcionalidad | Impacto en Negocio | Esfuerzo Técnico | Estado |
| :---: | :--- | :---: | :---: | :---: |
| 🔴 **P0 (Crítico)** | Corrección de bugs de seguridad, middlewares JWT y control RBAC | Alto (Seguridad / Integridad) | Medio | ✅ **Completado (Seguridad y Middlewares)** |
| 🔴 **P0 (Crítico)** | Gestión de Inventarios (Control de existencias y prevención de sobreventa) | Alto (Operación comercial) | Medio-Alto | ⏳ Pendiente |
| 🟡 **P1 (Alto)** | Panel de Usuario Administrador (CRUD de productos y precios) | Alto (Autonomía de negocio) | Medio | ⏳ Pendiente |
| 🟡 **P1 (Alto)** | Subida de pistas de audio y validación de copyright | Alto (Funcionalidad core personalizada) | Alto | ⏳ Pendiente |
| 🟢 **P2 (Medio)** | Configuraciones de usuario, preferencias y direcciones guardadas | Medio (Experiencia de usuario / Fidelización) | Bajo-Medio | ✅ **Completado** |
