# Galería de la comunidad — guía de configuración

La galería funciona con dos servicios gratuitos:

- **Firebase** (de Google): guarda los datos de cada foto (nombre, mensaje, si está aprobada) y controla quién puede entrar al panel de administración.
- **Cloudinary**: guarda las imágenes y las entrega ya optimizadas.

Hay que hacer esta configuración **una sola vez**. Tarda unos 20 minutos.

## Cómo funciona

1. Una persona llena el formulario en la sección **Comunidad** del sitio.
2. La foto se sube a Cloudinary y queda registrada como **pendiente**. Todavía no se ve en la página.
3. El administrador entra a `admin.html`, ve las pendientes y pulsa **Aprobar** o **Eliminar**.
4. Las aprobadas aparecen solas en la galería, sin tocar código ni hacer `git push`.

## Archivos nuevos

| Archivo | Para qué sirve |
|---|---|
| `galeria.css` / `galeria.js` | Formulario y galería de la página principal |
| `admin.html` / `admin.css` / `admin.js` | Panel privado para aprobar fotos |
| `firebase-config.js` | Tus datos de Firebase y Cloudinary (**aquí se llena todo**) |
| `firestore.rules` | Reglas de seguridad para pegar en Firebase |

`index.html` también cambió (nueva sección "Comunidad" y enlace en el menú).

---

## Parte 1 — Firebase

### 1.1 Crear el proyecto
1. Entra a <https://console.firebase.google.com> con la cuenta de Google que será la dueña del proyecto.
2. **Crear un proyecto** → ponle nombre (por ejemplo `don-suarez`) → puedes desactivar Google Analytics → **Crear**.

### 1.2 Registrar la app web
1. En la pantalla principal del proyecto pulsa el ícono **`</>`** (Web).
2. Ponle un apodo (por ejemplo `sitio-web`) → **Registrar app**. No marques Firebase Hosting.
3. Te mostrará un bloque `firebaseConfig`. Copia estos cuatro valores a **`firebase-config.js`**:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `appId`

> Estos datos **no son contraseñas**. Es normal que queden en un repositorio público. La protección real son las reglas del paso 1.4.

### 1.3 Crear la base de datos
1. Menú izquierdo → **Compilación → Firestore Database → Crear base de datos**.
2. Ubicación: cualquiera de Estados Unidos funciona bien.
3. Elige **Modo de producción** → **Habilitar**.

### 1.4 Pegar las reglas de seguridad
1. En Firestore, pestaña **Reglas**.
2. Abre `firestore.rules`, copia todo su contenido y pégalo (reemplazando lo que haya).
3. Cambia estas dos cosas dentro del texto:
   - `TU_CORREO_ADMIN@gmail.com` → el correo de Google de quien aprobará fotos. Para varias cuentas sepáralas con coma: `['a@gmail.com', 'b@gmail.com']`.
   - `TU_CLOUD_NAME` → tu *cloud name* de Cloudinary (lo obtienes en la Parte 2).
4. **Publicar**.

Estas reglas hacen que cualquiera pueda *enviar* una foto (siempre como pendiente) y *ver* las aprobadas, pero solo el administrador pueda ver las pendientes, aprobar o borrar.

### 1.5 Activar el inicio de sesión con Google
1. **Compilación → Authentication → Comenzar**.
2. Pestaña **Sign-in method** → **Google** → **Habilitar** → elige un correo de asistencia → **Guardar**.
3. Pestaña **Settings → Dominios autorizados → Agregar dominio**. Agrega el dominio donde estará el sitio, por ejemplo:
   - `tu-usuario.github.io` (si lo publican con GitHub Pages)
   - el dominio propio cuando lo tengan (por ejemplo `vinosdonsuarez.com`)

   `localhost` ya viene incluido para pruebas.

---

## Parte 2 — Cloudinary

1. Crea una cuenta gratuita en <https://cloudinary.com>.
2. En el **Dashboard** aparece tu **Cloud name**. Cópialo a `firebase-config.js` (`cloudName`) y a `firestore.rules`.
3. Entra a **Settings (engrane) → Upload → Upload presets → Add upload preset** y configura:
   - **Signing mode:** `Unsigned` (obligatorio, para que el sitio pueda subir fotos).
   - **Asset folder / Folder:** `don-suarez-comunidad`.
   - **Allowed formats:** `jpg, png, webp, heic`.
   - **Incoming transformation** (opcional, recomendado): `c_limit,w_2000,h_2000` para que nunca se guarde algo enorme.
4. Guarda y copia el **nombre del preset** a `firebase-config.js` (`uploadPreset`).

*Los menús de Cloudinary cambian de vez en cuando; si algún nombre no coincide, busca el equivalente.*

---

## Parte 3 — Completar y publicar

1. Abre `firebase-config.js` y reemplaza todos los valores `TU_...` (incluido `adminEmails`, en minúsculas).
2. Sube los archivos nuevos y el `index.html` actualizado a GitHub:

   ```bash
   git add .
   git commit -m "Agregar galería de la comunidad y panel de administración"
   git push
   ```

3. Espera un par de minutos a que GitHub Pages se actualice.

## Prueba rápida

1. Abre el sitio, ve a **Comunidad** y sube una foto de prueba. Debe aparecer el mensaje de agradecimiento.
2. Abre `tu-sitio/admin.html` → **Entrar con Google** con la cuenta administradora.
3. En **Pendientes** aparece la foto → **Aprobar**.
4. Recarga el sitio: la foto ya aparece en la galería.

> Para probar en tu computadora **no abras `index.html` con doble clic**: el inicio de sesión de Google no funciona desde `file://`. Usa la extensión *Live Server* de VS Code o ejecuta `python -m http.server` dentro de la carpeta y abre `http://localhost:8000`.

---

## Cosas que conviene saber

- **El panel no está enlazado en la página.** Solo quien conozca la dirección `/admin.html` lo encuentra, y aun así necesita una cuenta autorizada. Aun así, la seguridad real está en `firestore.rules`.
- **Fotos eliminadas:** se quitan del panel y de la galería, pero el archivo sigue en Cloudinary. Puedes borrarlo en su *Media Library*.
- **Antispam incluido:** campo trampa invisible, un envío por minuto desde el mismo navegador, límite de tamaño y reglas que obligan a que todo entre como pendiente. Nadie puede publicar sin aprobación.
- **Límites gratuitos:** Firestore y Cloudinary tienen un plan gratuito generoso para un sitio de este tamaño. Revisa el consumo de vez en cuando en sus paneles.
- **Privacidad y alcohol:** el formulario pide confirmar que la persona tiene 18 años o más y autoriza publicar su foto y nombre. Conviene confirmar con el cliente si necesitan además un aviso de privacidad en el sitio.
- **Galería grande:** la página carga hasta 200 fotos aprobadas. Si algún día se superan, hay que agregar paginación.

## Si algo falla

| Síntoma | Qué revisar |
|---|---|
| La sección dice "estará disponible muy pronto" | `firebase-config.js` todavía tiene valores `TU_...` |
| "No pudimos enviar tu foto" | Preset de Cloudinary no está en modo *Unsigned*, o el `cloudName` de las reglas no coincide |
| El panel dice "Revisa las reglas de Firestore" | Las reglas no están publicadas o el correo admin no coincide con la cuenta usada |
| "Sin acceso" en el panel | El correo no está en `adminEmails` ni en `firestore.rules` |
| Error `auth/unauthorized-domain` | Falta agregar el dominio en Authentication → Settings → Dominios autorizados |
| No abre la ventana de Google | El navegador bloqueó la ventana emergente; permítela o recarga e intenta de nuevo |

Para ver el error exacto: abre el sitio, pulsa **F12** y revisa la pestaña **Console**.
