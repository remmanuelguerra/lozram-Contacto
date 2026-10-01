# Progreso: Lozram Inmobiliaria (tarjeta de contacto + catálogo interno)

Última actualización: 2026-09-30

## Objetivo
Página de contacto de Lozram Inmobiliaria con una sección oculta: al tocar un texto del pie se pide usuario y contraseña, y quien entra puede hojear el catálogo de propiedades (PDF) como un libro. Se publica en Netlify.

## Hecho
- [x] Revisada la página original (`Lozram.html`): tarjeta de contacto con servicios, WhatsApp, llamada, vCard y redes.
- [x] Catálogo PDF convertido a 6 imágenes JPG en `private/pages/` (`node scripts/render-pdf.mjs`).
- [x] Acceso oculto en `public/index.html`: tocar el texto "Lozram Inmobiliaria · Nuevo León" abre el login.
- [x] Visor tipo libro en `public/catalogo.html` (StPageFlip): doble página en escritorio, página simple en móvil, flechas, teclado y botón Salir.
- [x] Función de Netlify `netlify/functions/api.mjs`: login, logout y entrega de páginas solo con sesión válida (cookie firmada, 8 horas).
- [x] Credenciales fijas en el código: usuario `lozram`, contraseña `ramloz123` (líneas 8 y 9 de `api.mjs`). Las variables de entorno `CATALOG_USER`, `CATALOG_PASS` y `AUTH_SECRET`, si se definen, tienen prioridad.
- [x] Probado en local: sin sesión responde 401; con las credenciales correctas entrega `meta` y las páginas.
- [x] Servidor local de pruebas (`npm run dev`, http://localhost:8888).
- [x] Repositorio creado en GitHub Desktop, publicado como privado y con el push hecho.
- [x] Rediseño de `public/index.html` según `lozram-branding.pdf`: paleta (#162757, #766759, #ab8f63, #e8e3dd, #1e1f2a, #b19e88), tipografías Abril Fatface + Open Sans y logo blanco horizontal (`public/logo-blanco.png`).

## Pendiente
- [ ] Crear el sitio nuevo en Netlify desde el repositorio (el sitio anterior es de subida manual y no se puede ligar a GitHub).
  - Branch: `main`
  - Build command: vacío
  - Publish directory: `public`
  - Functions directory: `netlify/functions`
- [ ] Comprobar que el deploy termina en **Published**.
- [ ] Probar en la URL real: login, libro, y que `/api/page/1` sin sesión diga "No autorizado".
- [ ] Probar el libro en un celular real (todavía no se ha visto en un navegador).
- [ ] Borrar el sitio viejo de Netlify y ponerle su nombre al nuevo (o mover el dominio propio, si lo tenía).
- [ ] Regenerar los códigos QR si la URL del sitio cambia.

## Estructura del proyecto
| Ruta | Para qué sirve |
|---|---|
| `public/index.html` | Tarjeta de contacto con el login oculto |
| `public/catalogo.html` | Visor del catálogo tipo libro |
| `public/vendor/page-flip.browser.js` | Librería del efecto de hojear |
| `netlify/functions/api.mjs` | Login y entrega protegida de páginas |
| `private/pages/` | Páginas del catálogo en JPG (no son públicas) |
| `netlify.toml` | Configuración de Netlify |
| `scripts/render-pdf.mjs` | Convierte el PDF en imágenes (`npm run render`) |
| `scripts/dev-server.mjs` | Servidor local de pruebas (`npm run dev`) |
| `Lozram.html` | Página original, sin login (respaldo) |

## Cómo actualizar
- **Catálogo nuevo:** reemplazar el PDF, ejecutar `npm run render`, hacer commit y push en GitHub Desktop. Netlify redespliega solo.
- **Cambiar usuario o contraseña:** editar las líneas 8 y 9 de `netlify/functions/api.mjs`, hacer commit y push.

## Notas de seguridad
- El repositorio debe seguir **privado**: contiene la contraseña y las imágenes del catálogo.
- El PDF no se sirve de forma pública; solo la función entrega las imágenes, y únicamente con sesión.
- Quien tenga acceso puede hacer capturas de pantalla; no se puede impedir del todo.
- Node local es 20.13: Netlify CLI actual puede dar errores, por eso se usa `npm run dev`.
