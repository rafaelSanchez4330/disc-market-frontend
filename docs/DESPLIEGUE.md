# Frontend publicado

Configuración del 16 de octubre de 2026.

- Sitio: https://vinylhrz.tech (también https://www.vinylhrz.tech).
- API: https://vinylhrz.tech/api.
- Rama local: `yazmin`, independiente de la rama del repositorio backend.
- React + TypeScript + Vite; Node.js 22 para compilar.
- Hostinger VPS KVM 1, Ubuntu 24.04, Nginx y PostgreSQL 16 para el backend.

La guía completa de infraestructura, DNS, HTTPS, operación, base de datos,
backups y pendientes está en el repositorio backend:
[docs/DESPLIEGUE.md](https://github.com/rafaelSanchez4330/disc-market-backend/blob/yazmin/docs/DESPLIEGUE.md).
Ese enlace estará disponible después de publicar la documentación en GitHub.
En el workspace local: `../../disc-market-backend/docs/DESPLIEGUE.md`.

## Compilación en el VPS

Desde `/opt/disc-market/frontend`, con el usuario `discmarket`:

```bash
npm ci --no-audit --no-fund
VITE_API_URL=/api VITE_UPLOADS_URL=https://vinylhrz.tech npm run build
```

Nginx publica `/var/www/disc-market`, que recibe el contenido de `dist/`.
Las rutas React usan fallback a `index.html`; `/api/` se envía al backend y
`/uploads/` sirve los archivos persistentes. Las variables `VITE_*` se incorporan
al build y requieren recompilar si cambia el dominio.

## Desarrollo local

```powershell
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev
```

Copiar el ejemplo solo si `.env` no existe. Desarrollo: http://localhost:5173,
API local: http://localhost:5000/api. No reemplazar las URLs locales por las de
producción salvo que se quiera conectar explícitamente al servidor.

## Cómo se publicó

Se transfirió el código local de `yazmin` mediante SSH/SCP, se instalaron
dependencias en Linux y se compiló allí. No se transfirieron `.env`, `.git`,
dependencias de Windows ni uploads locales. No hay CI/CD: un push no despliega.
La base del VPS es distinta de la base local.

Actualización Stripe desplegada en modo test: release `20261016T073316Z`.
El código nuevo está en `/opt/disc-market/releases/20261016T073316Z/frontend`;
`/var/www/disc-market` enlaza a su `dist`. El formulario usa la clave publicable
del entorno de prueba. No hay claves secretas en el frontend.
Frontend, API, catálogo de 8 productos y HTTPS fueron verificados.
El sitio sigue como demo hasta corregir los permisos del backend documentados
en la guía completa; no se probó una compra real.
