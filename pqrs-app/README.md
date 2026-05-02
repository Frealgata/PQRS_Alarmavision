# 📋 PQRS Alarmavision — Buzón de Sugerencias PWA

Sistema de Peticiones, Quejas, Reclamos y Sugerencias para **Alarmavision Services S.A.S.**

---

## 📁 Estructura de archivos

```
pqrs-app/
├── index.html                  ← App principal (formulario + consulta)
├── style.css                   ← Estilos responsivos
├── app.js                      ← Lógica de la aplicación
├── sw.js                       ← Service Worker (PWA / offline)
├── manifest.json               ← Configuración PWA
├── icons/
│   ├── icon-192.png            ← Icono app (móvil)
│   └── icon-512.png            ← Icono app (escritorio)
├── imagenes/                   ← ⚠ COLOCA AQUÍ TUS LOGOS
│   ├── logo-png.png
│   ├── expresate.png
│   └── logo-SG-SST.png
└── google-apps-script/
    └── Codigo.gs               ← Backend Google Sheets
```

---

## 🚀 Guía de instalación paso a paso

### PASO 1 — Configurar Google Sheets + Apps Script

1. Abre [Google Drive](https://drive.google.com) e inicia sesión con la cuenta de la empresa.
2. Crea un **nuevo Google Sheets** (puede llamarse `PQRS Alarmavision`).
3. Dentro del sheet, ve a **Extensiones → Apps Script**.
4. Borra el código de ejemplo que aparece.
5. Copia todo el contenido del archivo `google-apps-script/Codigo.gs` y pégalo.
6. Guarda con **Ctrl + S** (o ⌘ + S en Mac).
7. Haz clic en **"Implementar"** (esquina superior derecha) → **"Nueva implementación"**.
8. En "Tipo", selecciona **Aplicación web**.
9. Configura:
   - **Ejecutar como:** Yo (`tu-email@gmail.com`)
   - **Quién tiene acceso:** Cualquier persona
10. Haz clic en **"Implementar"**.
11. Autoriza los permisos cuando se soliciten.
12. **Copia la URL** que aparece (tiene el formato `https://script.google.com/macros/s/XXXXX/exec`).

---

### PASO 2 — Configurar la app web

1. Abre el archivo `app.js` con cualquier editor de texto.
2. Busca la línea:
   ```javascript
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec';
   ```
3. Reemplaza la URL completa con la que copiaste en el paso anterior.
4. Guarda el archivo.

---

### PASO 3 — Agregar los logos

Coloca tus imágenes en la carpeta `imagenes/` con estos nombres exactos:
- `logo-png.png` → Logo principal de Alarmavision
- `expresate.png` → Imagen "Exprésate"
- `logo-SG-SST.png` → Logo SG-SST

> Si los archivos no están, la app mostrará texto alternativo automáticamente.

---

### PASO 4 — Publicar la app

**Opción A — GitHub Pages (gratis, recomendado):**
1. Crea una cuenta en [github.com](https://github.com).
2. Crea un repositorio nuevo (ej: `pqrs-alarmavision`).
3. Sube todos los archivos de la carpeta `pqrs-app/`.
4. Ve a **Settings → Pages → Source: main branch**.
5. Tu app estará disponible en `https://TU-USUARIO.github.io/pqrs-alarmavision/`

**Opción B — Netlify (gratis, muy fácil):**
1. Ve a [netlify.com](https://netlify.com) y crea cuenta.
2. Arrastra la carpeta `pqrs-app/` al panel de Netlify.
3. Listo — tendrás una URL pública al instante.

**Opción C — Servidor propio:**
Copia los archivos a la carpeta pública de tu servidor web (`/var/www/html/` o `public_html/`).

---

## 📱 Instalar como app (PWA)

**En Android (Chrome):**
1. Abre la URL de la app en Chrome.
2. Aparecerá un banner automático "Instalar".
3. O toca el menú ⋮ → "Agregar a pantalla de inicio".

**En iPhone/iPad (Safari):**
1. Abre la URL en Safari.
2. Toca el botón compartir (□↑).
3. Selecciona "Agregar a pantalla de inicio".

**En escritorio (Chrome/Edge):**
1. Abre la URL.
2. Aparece un icono de instalación en la barra de direcciones (⊕).
3. Haz clic e instala.

---

## 🏢 Cómo usa la empresa el sistema

### Recibir y gestionar solicitudes

1. Abre el Google Sheets `PQRS Alarmavision`.
2. Verás cada PQRS en una fila con todos los campos del formulario.
3. Para responder una solicitud, edita directamente las columnas:
   - **H (Estado):** cambia a `En Seguimiento` o `Cerrada` (hay menú desplegable)
   - **I (Responsable Asignado):** nombre del encargado
   - **J (Acciones Realizadas):** descripción de lo hecho
   - **K (Fecha de Asignación):** DD/MM/AAAA
   - **L (Fecha de Respuesta):** DD/MM/AAAA
   - **M (Observaciones Finales):** comentario final

4. Al guardar, el usuario podrá consultar el estado actualizado con su ID.

### Estados disponibles
| Estado | Color en Excel | Significado |
|--------|---------------|-------------|
| Pendiente | 🟡 Amarillo | Recibida, sin asignar |
| En Seguimiento | 🔵 Azul | En proceso de atención |
| Cerrada | 🟢 Verde | Atendida y cerrada |

---

## 🔍 Consulta de estado (usuario)

El usuario recibe un **ID único** al enviar (ej: `PQRS-20240501-ABC123`).

Con ese ID puede:
1. Ir a la pestaña "🔍 Consultar Estado"
2. Escribir el ID
3. Ver en tiempo real el estado actualizado por la empresa

---

## ⚙️ Modo demo (sin Google Sheets)

Si la URL de Apps Script **no está configurada**, la app funciona en **modo demo local**:
- Los registros se guardan en el almacenamiento del navegador (localStorage).
- Puedes probar el formulario y la consulta sin conexión a Google Sheets.
- Los datos NO se comparten entre dispositivos en modo demo.

---

## 🆘 Solución de problemas frecuentes

**Error CORS al enviar formulario:**
- Verifica que en Apps Script, "Quién tiene acceso" sea "Cualquier persona" (no "Solo usuarios autenticados").
- Vuelve a implementar una nueva versión del Apps Script.

**El formulario dice "modo demo" aunque configuré la URL:**
- Verifica que copiaste la URL completa (incluye `/exec` al final).
- Asegúrate de no dejar espacios antes/después de la URL.

**Los logos no aparecen:**
- Verifica que los archivos estén en la carpeta `imagenes/` con los nombres exactos.
- Los nombres distinguen mayúsculas/minúsculas en servidores Linux.

**La app no se instala como PWA:**
- Debe servirse desde HTTPS (GitHub Pages y Netlify lo hacen automáticamente).
- No funciona desde `file://` (abrir directamente el archivo).

---

## 📞 Soporte

Para soporte técnico, contacta al desarrollador o revisa la documentación de:
- [Google Apps Script](https://developers.google.com/apps-script)
- [Progressive Web Apps](https://web.dev/progressive-web-apps/)

---

*PQRS Alarmavision v1.0 — Noviembre 2019 FT-ADM-014 V1*
